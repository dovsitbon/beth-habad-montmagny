/**
 * Migrations et isolation multi-tenant, sans toucher à la production : npm run test:db
 *
 * Postgres tourne en mémoire (PGlite). Les morceaux de Supabase dont les migrations ont
 * besoin (rôles anon / authenticated / service_role, auth.users, auth.uid(), storage)
 * sont simulés. Le script :
 *  1. applique les migrations jusqu'à l'état actuel de la production, avec des données
 *     comparables (site Montmagny, équipe, événements, inscriptions, photos…) ;
 *  2. applique les nouvelles migrations (multi-tenant…) et vérifie la reprise des données ;
 *  3. crée un second site et vérifie qu'aucun site ne voit ni ne modifie les données de l'autre ;
 *  4. rejoue tout sur une base vide, puis seed.sql (installation d'un nouveau projet).
 */
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const DIR = new URL("../supabase/migrations/", import.meta.url);
const MIGRATIONS = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
const PRODUCTION_UNTIL = "20261027000003"; // dernière migration appliquée en production

const SITE_A = "dba8f5e4-8708-4700-bbae-11cd22048338"; // Montmagny (identifiant fixé par la migration)
const SITE_B = "00000000-0000-4000-8000-00000000000b";
const ADMIN_A = "00000000-0000-4000-8000-0000000000a1";
const EDITOR_A = "00000000-0000-4000-8000-0000000000a2";
const ADMIN_B = "00000000-0000-4000-8000-0000000000b1";

let passed = 0;
let failed = 0;
function check(label, ok, detail = "") {
  if (ok) passed++;
  else failed++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${!ok && detail ? ` — ${detail}` : ""}`);
}

/** Simulation minimale de Supabase autour de Postgres. */
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$
    select (nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub')::uuid
  $$;
  -- Comme dans Supabase : service_role a tous les droits sur ce qui sera créé dans public.
  alter default privileges in schema public grant all on tables to service_role;
  alter default privileges in schema public grant all on sequences to service_role;
  alter default privileges in schema public grant execute on functions to service_role;
  grant usage on schema public to service_role;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
  alter table storage.objects enable row level security;
  grant usage on schema auth, storage to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant select, insert, update, delete on storage.objects to authenticated;
  grant all on all tables in schema storage to service_role;
`;

async function newDb() {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  return db;
}

async function migrate(db, files) {
  for (const f of files) {
    try {
      await db.exec(readFileSync(new URL(f, DIR), "utf8"));
    } catch (err) {
      throw new Error(`Migration ${f} : ${err.message}`);
    }
  }
}

/** Exécute une requête « comme » un visiteur ou un membre, sur un site donné. */
async function as(db, { role, user = null, site = null }, sql, params = []) {
  await db.exec("reset role");
  await db.query("select set_config('request.headers', $1, false)", [site ? JSON.stringify({ "x-site-id": site }) : ""]);
  await db.query("select set_config('request.jwt.claims', $1, false)", [user ? JSON.stringify({ sub: user, role }) : ""]);
  await db.exec(`set role ${role}`);
  try {
    return { rows: (await db.query(sql, params)).rows, error: null };
  } catch (err) {
    return { rows: [], error: err.message };
  } finally {
    await db.exec("reset role");
  }
}
const anon = (site) => ({ role: "anon", site });
const member = (user, site) => ({ role: "authenticated", user, site });
const server = (site) => ({ role: "service_role", site });

// -----------------------------------------------------------------------------
console.log("\n1. Base dans l'état de la production");
const db = await newDb();
await migrate(db, MIGRATIONS.filter((f) => f.slice(0, 14) <= PRODUCTION_UNTIL));
await db.exec(`
  insert into auth.users (id, email) values ('${ADMIN_A}', 'admin@a.test'), ('${EDITOR_A}', 'editeur@a.test');
  update public.profiles set role = 'admin' where id = '${ADMIN_A}';
  insert into public.settings (id, name, short_name, latitude, longitude) values (1, 'Beth Habad Montmagny', 'Montmagny', 48.97, 2.34);
  insert into public.settings_private (id, notification_email) values (1, 'notif@a.test');
  insert into public.pages (slug, title, body) values ('accueil', 'Accueil', '<p>A</p>');
  insert into public.events (id, slug, title, starts_at, status, registration_enabled, capacity)
    values ('10000000-0000-4000-8000-000000000001', 'soiree', 'Soirée A', now() + interval '7 days', 'published', true, 10),
           ('10000000-0000-4000-8000-000000000002', 'brouillon', 'Brouillon A', now() + interval '7 days', 'draft', false, null);
  insert into public.registrations (event_id, name, phone) values ('10000000-0000-4000-8000-000000000001', 'Cohen', '0600000000');
  insert into public.albums (id, slug, title, status, event_id) values ('20000000-0000-4000-8000-000000000001', 'album', 'Album A', 'published', '10000000-0000-4000-8000-000000000001');
  insert into public.photos (id, album_id, storage_path) values ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'albums/x.webp');
  update public.albums set cover_photo_id = '30000000-0000-4000-8000-000000000001';
  insert into public.contact_messages (name, email, message) values ('David', 'd@a.test', 'Bonjour');
  insert into public.schedule_weeks (date, kidouch) values ('2026-10-30', 'Kidouch A');
  insert into public.rate_limits (key) values ('contact:x');
`);
check("migrations de la production appliquées, données en place", true);

console.log("\n2. Passage au multi-tenant");
await migrate(db, MIGRATIONS.filter((f) => f.slice(0, 14) > PRODUCTION_UNTIL));
check("nouvelles migrations appliquées sans erreur", true);

const tables = ["settings", "settings_private", "pages", "events", "registrations", "courses", "announcements",
  "service_times", "schedule_weeks", "albums", "photos", "contact_messages", "rate_limits"];
const orphans = [];
for (const t of tables) {
  const { rows } = await db.query(`select count(*)::int as n from public.${t} where site_id is distinct from '${SITE_A}'`);
  if (rows[0].n) orphans.push(t);
}
check("toutes les données existantes rattachées au site Montmagny", orphans.length === 0, orphans.join(", "));

const roles = (await db.query(`select user_id, role from public.user_sites where site_id = '${SITE_A}' order by role`)).rows;
check("les rôles sont repris dans user_sites", roles.length === 2 && roles.find((r) => r.user_id === ADMIN_A)?.role === "admin");

const noSite = (await db.query(`
  select c.table_name from information_schema.columns c
  join information_schema.tables t on t.table_name = c.table_name and t.table_schema = c.table_schema
  where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
  group by c.table_name
  having not bool_or(c.column_name = 'site_id') and c.table_name not in ('sites', 'profiles')`)).rows.map((r) => r.table_name);
check("chaque table métier a une colonne site_id", noSite.length === 0, noSite.join(", "));

const noRls = (await db.query(`select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`)).rows.map((r) => r.relname);
check("RLS activée sur 100 % des tables", noRls.length === 0, noRls.join(", "));

// Second site, créé comme le ferait scripts/creer-site.mjs.
await db.exec(`
  insert into public.sites (id, name, domain) values ('${SITE_B}', 'Site B', 'site-b.test');
  insert into auth.users (id, email) values ('${ADMIN_B}', 'admin@b.test');
  insert into public.user_sites (user_id, site_id, role) values ('${ADMIN_B}', '${SITE_B}', 'admin');
  insert into public.settings (site_id, name, short_name, latitude, longitude) values ('${SITE_B}', 'Site B', 'B', 45, 5);
  insert into public.settings_private (site_id, notification_email) values ('${SITE_B}', 'notif@b.test');
  insert into public.pages (site_id, slug, title, body) values ('${SITE_B}', 'accueil', 'Accueil', '<p>B</p>');
  insert into public.events (id, site_id, slug, title, starts_at, status, registration_enabled)
    values ('10000000-0000-4000-8000-00000000000b', '${SITE_B}', 'soiree', 'Soirée B', now() + interval '7 days', 'published', true);
  insert into public.contact_messages (site_id, name, email, message) values ('${SITE_B}', 'Sarah', 's@b.test', 'Message B');
`);
check("un second site peut réutiliser les mêmes adresses (slug « soiree », page « accueil »)", true);

console.log("\n3. Visiteurs (anon)");
{
  const a = await as(db, anon(SITE_A), "select title from public.events order by title");
  check("le site A ne voit que ses événements publiés", a.rows.map((r) => r.title).join() === "Soirée A", JSON.stringify(a));
  const b = await as(db, anon(SITE_B), "select title from public.events");
  check("le site B ne voit que les siens", b.rows.map((r) => r.title).join() === "Soirée B");
  const none = await as(db, anon(null), "select count(*)::int as n from public.events");
  check("sans site demandé : aucun contenu", none.rows[0]?.n === 0);
  const settings = await as(db, anon(SITE_B), "select name from public.settings");
  check("paramètres : seulement ceux du site demandé", settings.rows.length === 1 && settings.rows[0].name === "Site B");
  const pages = await as(db, anon(SITE_A), "select body from public.pages where slug = 'accueil'");
  check("textes : seulement ceux du site demandé", pages.rows.length === 1 && pages.rows[0].body === "<p>A</p>");
  const priv = await as(db, anon(SITE_A), "select * from public.settings_private");
  check("paramètres privés illisibles", !!priv.error || priv.rows.length === 0);
  const msg = await as(db, anon(SITE_A), "select * from public.contact_messages");
  check("messages illisibles", !!msg.error || msg.rows.length === 0);
  const sites = await as(db, anon(SITE_A), "select id from public.sites");
  check("table sites : seulement le site demandé", sites.rows.length === 1 && sites.rows[0].id === SITE_A);
  const ins = await as(db, anon(SITE_A), "insert into public.events (slug, title, starts_at) values ('x', 'x', now())");
  check("ne peut rien écrire", !!ins.error);
  const seats = await as(db, anon(SITE_B), "select public.event_seats_taken('10000000-0000-4000-8000-000000000001') as n");
  check("places prises d'un événement d'un autre site : 0", seats.rows[0]?.n === 0);
}

console.log("\n4. Équipe du site A");
{
  const mine = await as(db, member(EDITOR_A, SITE_A), "select title from public.events order by title");
  check("voit ses événements, brouillons compris", mine.rows.map((r) => r.title).join() === "Brouillon A,Soirée A");
  const other = await as(db, member(EDITOR_A, SITE_B), "select title from public.events");
  check("en demandant le site B : ne voit que le public de B", other.rows.map((r) => r.title).join() === "Soirée B");
  const msgB = await as(db, member(EDITOR_A, SITE_B), "select * from public.contact_messages");
  check("ne lit pas les messages du site B", msgB.rows.length === 0);
  const msgA = await as(db, member(EDITOR_A, SITE_A), "select name from public.contact_messages");
  check("lit les messages de son site", msgA.rows.length === 1 && msgA.rows[0].name === "David");
  const editB = await as(db, member(EDITOR_A, SITE_B), "update public.events set title = 'piraté' returning id");
  check("ne modifie pas les événements du site B", editB.rows.length === 0);
  const editA = await as(db, member(EDITOR_A, SITE_A), "update public.events set summary = 'ok' where slug = 'soiree' returning site_id");
  check("modifie ceux de son site", editA.rows.length === 1 && editA.rows[0].site_id === SITE_A);
  const insA = await as(db, member(EDITOR_A, SITE_A), "insert into public.events (slug, title, starts_at) values ('nouveau', 'Nouveau', now()) returning site_id");
  check("un nouvel événement est rattaché tout seul à son site", insA.rows[0]?.site_id === SITE_A, insA.error ?? "");
  const insB = await as(db, member(EDITOR_A, SITE_A), `insert into public.events (site_id, slug, title, starts_at) values ('${SITE_B}', 'intrus', 'Intrus', now())`);
  check("ne peut pas insérer dans le site B", !!insB.error);
  const move = await as(db, member(EDITOR_A, SITE_A), `update public.events set site_id = '${SITE_B}' where slug = 'nouveau'`);
  check("ne peut pas déplacer une donnée vers un autre site", !!move.error);
  const privA = await as(db, member(EDITOR_A, SITE_A), "select notification_email from public.settings_private");
  check("lit les paramètres privés de son site uniquement", privA.rows.length === 1 && privA.rows[0].notification_email === "notif@a.test");
  const gps = await as(db, member(EDITOR_A, SITE_A), "update public.settings set latitude = 1");
  check("un éditeur ne change pas la position GPS (réservé à l'admin)", !!gps.error);
  const gpsAdmin = await as(db, member(ADMIN_A, SITE_A), "update public.settings set short_name = 'Montmagny' returning site_id");
  check("l'admin modifie les paramètres de son site", gpsAdmin.rows.length === 1);
  const regs = await as(db, member(EDITOR_A, SITE_A), "select name from public.registrations");
  check("lit les inscriptions de son site", regs.rows.length === 1);
  const team = await as(db, member(EDITOR_A, SITE_A), "select id from public.profiles order by id");
  check("voit l'équipe de son site, pas celle du site B", team.rows.length === 2 && !team.rows.some((r) => r.id === ADMIN_B));
  const promote = await as(db, member(EDITOR_A, SITE_A), `update public.user_sites set role = 'admin' where user_id = '${EDITOR_A}' returning role`);
  check("un éditeur ne peut pas se nommer admin", promote.rows.length === 0);
  const join = await as(db, member(EDITOR_A, SITE_A), `insert into public.user_sites (user_id, site_id) values ('${EDITOR_A}', '${SITE_B}')`);
  check("ne peut pas s'ajouter à l'équipe du site B", !!join.error);
  const adminB = await as(db, member(ADMIN_A, SITE_A), `insert into public.user_sites (user_id, site_id) values ('${EDITOR_A}', '${SITE_B}')`);
  check("l'admin du site A ne gère pas l'équipe du site B", !!adminB.error);
}

console.log("\n5. Stockage des photos");
{
  const put = (user, site, name) => as(db, member(user, site), "insert into storage.objects (bucket_id, name) values ('media', $1)", [name]);
  check("envoi dans le dossier de son site", !(await put(EDITOR_A, SITE_A, `${SITE_A}/events/a.webp`)).error);
  check("refusé dans le dossier d'un autre site", !!(await put(EDITOR_A, SITE_A, `${SITE_B}/events/a.webp`)).error);
  check("refusé hors de tout dossier de site", !!(await put(EDITOR_A, SITE_A, "events/a.webp")).error);
  await db.exec(`insert into storage.objects (bucket_id, name) values ('media', '${SITE_B}/events/b.webp')`);
  const del = await as(db, member(EDITOR_A, SITE_A), `delete from storage.objects where name = '${SITE_B}/events/b.webp' returning name`);
  check("ne supprime pas les fichiers d'un autre site", del.rows.length === 0);
}

console.log("\n6. Serveur (clé secrète) et fonctions");
{
  const reg = await as(db, server(SITE_B), "select public.register_for_event('10000000-0000-4000-8000-000000000001', 'X', '06', null, 1)");
  check("inscription refusée pour un événement d'un autre site", /EVENT_NOT_FOUND/.test(reg.error ?? ""));
  const ok = await as(db, server(SITE_A), "select public.register_for_event('10000000-0000-4000-8000-000000000001', 'Levy', '06', null, 2) as id");
  const site = ok.rows[0] && (await db.query(`select site_id from public.registrations where id = '${ok.rows[0].id}'`)).rows[0]?.site_id;
  check("inscription sur son site, rattachée au bon site", site === SITE_A, ok.error ?? "");
  const cross = await as(db, server(SITE_B), `insert into public.registrations (site_id, event_id, name, phone) values ('${SITE_B}', '10000000-0000-4000-8000-000000000001', 'X', '06')`);
  check("une inscription ne peut pas pointer vers l'événement d'un autre site", !!cross.error);
  const msg = await as(db, server(SITE_B), "insert into public.contact_messages (name, phone, message) values ('Y', '06', 'Bonjour') returning site_id");
  check("formulaire de contact : message rattaché au site demandé", msg.rows[0]?.site_id === SITE_B, msg.error ?? "");
  for (let i = 0; i < 2; i++) await as(db, server(SITE_A), "select public.check_rate_limit('contact:ip', 2, '1 hour')");
  const limitedA = await as(db, server(SITE_A), "select public.check_rate_limit('contact:ip', 2, '1 hour') as ok");
  const freeB = await as(db, server(SITE_B), "select public.check_rate_limit('contact:ip', 2, '1 hour') as ok");
  check("limitation anti-spam comptée séparément par site", limitedA.rows[0]?.ok === false && freeB.rows[0]?.ok === true);
  const noSite = await as(db, server(null), "select public.check_rate_limit('contact:ip', 2, '1 hour')");
  check("limitation sans site : refusée", /SITE_REQUIRED/.test(noSite.error ?? ""));
  const purge = await as(db, server(null), "select count(*)::int as n from public.purge_expired()");
  check("la purge quotidienne fonctionne toujours (tous sites)", !purge.error, purge.error ?? "");
}

console.log("\n7. Notifications sur le téléphone");
{
  const sub = (user, site, endpoint, extra = "") =>
    as(db, member(user, site), `insert into public.push_subscriptions (user_id, endpoint, p256dh, auth${extra ? ", site_id" : ""}) values ($1, $2, 'k', 'a'${extra ? `, '${extra}'` : ""}) returning site_id`, [user, endpoint]);
  const mine = await sub(EDITOR_A, SITE_A, "https://push.test/a");
  check("abonnement de son téléphone, rattaché à son site", mine.rows[0]?.site_id === SITE_A, mine.error ?? "");
  check("pas d'abonnement sur un site dont on n'est pas membre", !!(await sub(EDITOR_A, SITE_B, "https://push.test/b")).error);
  check("pas d'abonnement au nom de quelqu'un d'autre", !!(await sub(ADMIN_A, SITE_A, "https://push.test/c").then(() => as(db, member(EDITOR_A, SITE_A), `insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ('${ADMIN_A}', 'https://push.test/d', 'k', 'a')`))).error);
  const seen = await as(db, member(ADMIN_A, SITE_A), "select endpoint from public.push_subscriptions");
  check("chacun ne voit que ses appareils", seen.rows.length === 1 && seen.rows[0].endpoint === "https://push.test/c");
}

console.log("\n8. Nouvelle installation (base vide + seed.sql)");
{
  const fresh = await newDb();
  await migrate(fresh, MIGRATIONS);
  await fresh.exec(readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8"));
  const counts = (await fresh.query(`select
    (select count(*)::int from public.settings where site_id = '${SITE_A}') as settings,
    (select count(*)::int from public.pages where site_id = '${SITE_A}') as pages,
    (select count(*)::int from public.events where site_id = '${SITE_A}') as events`)).rows[0];
  check("toutes les migrations + seed.sql sur une base vide", counts.settings === 1 && counts.pages > 5 && counts.events > 0, JSON.stringify(counts));
}

console.log(`\n${passed} vérification(s) réussie(s), ${failed} échec(s).`);
process.exit(failed === 0 ? 0 : 1);
