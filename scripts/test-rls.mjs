/**
 * Vérifie les règles de sécurité (RLS) sur le projet Supabase configuré dans .env.local.
 *
 * Usage : npm run test:rls
 *
 * Crée temporairement un compte « éditeur » de test et des événements de test,
 * puis supprime tout à la fin (même en cas d'échec).
 *
 * Multi-tenant : toutes les requêtes portent l'en-tête « x-site-id » du site de ce dépôt
 * (NEXT_PUBLIC_SITE_ID), comme l'application. Un faux site (« intrus ») vérifie l'isolation.
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
const SITE = process.env.NEXT_PUBLIC_SITE_ID;
const OTHER_SITE = randomUUID();
const forSite = (site) => ({ auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { "x-site-id": site } } });
const noSession = forSite(SITE);

const anon = createClient(url, publishable, noSession);
const anonOther = createClient(url, publishable, forSite(OTHER_SITE));
const service = createClient(url, secret, noSession);

let passed = 0;
let failed = 0;
function check(label, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const tag = `rls-test-${randomUUID().slice(0, 8)}`;
const email = `${tag}@example.com`;
const password = `${randomUUID()}Aa1!`;
let editorId;

async function main() {
  // --- Préparation -----------------------------------------------------------
  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) throw createErr;
  editorId = created.user.id;
  const { error: memberErr } = await service.from("user_sites").insert({ user_id: editorId, site_id: SITE, role: "editor" });
  if (memberErr) throw memberErr;

  const { data: events, error: evErr } = await service
    .from("events")
    .insert([
      { slug: `${tag}-pub`, title: `${tag} publié`, starts_at: future(3), status: "published" },
      { slug: `${tag}-draft`, title: `${tag} brouillon`, starts_at: future(3), status: "draft" },
      {
        slug: `${tag}-full`,
        title: `${tag} complet`,
        starts_at: future(3),
        status: "published",
        registration_enabled: true,
        capacity: 2,
      },
    ], { defaultToNull: false })
    .select("id, slug");
  if (evErr) throw evErr;
  const id = Object.fromEntries(events.map((e) => [e.slug.replace(`${tag}-`, ""), e.id]));

  // --- Visiteur anonyme ------------------------------------------------------
  console.log("\nVisiteur anonyme");
  {
    const { data } = await anon.from("events").select("slug").like("slug", `${tag}%`);
    const slugs = (data ?? []).map((e) => e.slug);
    check("voit les événements publiés", slugs.includes(`${tag}-pub`));
    check("ne voit pas les brouillons", !slugs.includes(`${tag}-draft`));

    const ins = await anon.from("events").insert({ slug: `${tag}-x`, title: "x", starts_at: future(1) });
    check("ne peut pas créer d'événement", !!ins.error);

    const upd = await anon.from("events").update({ title: "piraté" }).eq("id", id.pub).select();
    check("ne peut pas modifier un événement", !!upd.error || upd.data.length === 0);

    const reg = await anon.from("registrations").select("id").limit(1);
    check("ne peut pas lire les inscriptions", !!reg.error || reg.data.length === 0);

    const regIns = await anon.from("registrations").insert({ event_id: id.pub, name: "x", email: "x@x.fr" });
    check("ne peut pas s'inscrire directement (passe par le serveur)", !!regIns.error);

    const rpc = await anon.rpc("register_for_event", {
      p_event_id: id.full, p_name: "x", p_phone: null, p_email: "x@x.fr", p_party_size: 1,
    });
    check("ne peut pas appeler register_for_event", !!rpc.error);

    const msg = await anon.from("contact_messages").select("id").limit(1);
    check("ne peut pas lire les messages", !!msg.error || msg.data.length === 0);

    const priv = await anon.from("settings_private").select("*");
    check("ne peut pas lire les paramètres privés", !!priv.error || priv.data.length === 0);

    const prof = await anon.from("profiles").select("*");
    check("ne peut pas lire les profils", !!prof.error || prof.data.length === 0);

    const rl = await anon.rpc("check_rate_limit", { p_key: "x", p_max: 1, p_window: "1 minute" });
    check("ne peut pas appeler check_rate_limit", !!rl.error);

    const purge = await anon.rpc("purge_expired");
    check("ne peut pas lancer la purge", !!purge.error);

    const seats = await anon.rpc("event_seats_taken", { p_event_id: id.full });
    check("peut connaître le nombre de places prises", !seats.error && seats.data === 0);

    const settings = await anon.from("settings").select("name").single();
    check("peut lire les paramètres publics", !settings.error && !!settings.data?.name);

    const weeks = await anon.from("schedule_weeks").select("date").limit(1);
    check("peut lire les horaires de la semaine", !weeks.error);
    const weekIns = await anon.from("schedule_weeks").insert({ date: "2098-12-30", kidouch: tag });
    check("ne peut pas modifier les horaires de la semaine", !!weekIns.error);

    const pushSub = { endpoint: `https://example.com/${tag}`, p256dh: "x", auth: "x" };
    const pushRead = await anon.from("push_subscriptions").select("id");
    check("ne voit aucun abonnement aux notifications", !!pushRead.error || pushRead.data.length === 0);
    const pushIns = await anon.from("push_subscriptions").insert({ ...pushSub, user_id: "00000000-0000-0000-0000-000000000000" });
    check("ne peut pas abonner un appareil aux notifications", !!pushIns.error);

    const upload = await anon.storage.from("media").upload(`${tag}.txt`, new Blob(["x"]), { contentType: "image/png" });
    check("ne peut pas envoyer de fichier", !!upload.error);

    const otherSite = await anonOther.from("events").select("id").like("slug", `${tag}%`);
    check("un autre site ne voit pas les événements de celui-ci", (otherSite.data ?? []).length === 0);
    const otherSettings = await anonOther.from("settings").select("name");
    check("un autre site ne lit pas les paramètres de celui-ci", (otherSettings.data ?? []).length === 0);

    const signup = await anon.auth.signUp({ email: `${tag}-intrus@example.com`, password });
    check("ne peut pas se créer de compte (invitation uniquement)", !!signup.error);
  }

  // --- Éditeur ---------------------------------------------------------------
  console.log("\nÉditeur (rabbin)");
  const editor = createClient(url, publishable, noSession);
  const { error: signErr } = await editor.auth.signInWithPassword({ email, password });
  if (signErr) throw signErr;
  {
    const { data: membership } = await editor.from("user_sites").select("role").eq("user_id", editorId).eq("site_id", SITE).single();
    check("est éditeur de ce site", membership?.role === "editor");

    const { data } = await editor.from("events").select("slug").like("slug", `${tag}%`);
    check("voit aussi les brouillons", (data ?? []).some((e) => e.slug === `${tag}-draft`));

    const role = await editor.from("user_sites").update({ role: "admin" }).eq("user_id", editorId).select();
    check("ne peut pas se promouvoir admin", !!role.error || role.data.length === 0);

    const name = await editor.from("profiles").update({ full_name: "Test" }).eq("id", editorId);
    check("peut modifier son propre nom", !name.error);

    const { data: before } = await service.from("settings").select("phone, color_primary").eq("site_id", SITE).single();
    const phone = await editor.from("settings").update({ phone: before.phone }).eq("site_id", SITE);
    check("peut modifier le téléphone", !phone.error);
    const color = await editor.from("settings").update({ color_primary: "#FF0000" }).eq("site_id", SITE);
    check("ne peut pas modifier les couleurs (réservé à l'admin)", !!color.error);

    const ev = await editor
      .from("events")
      .insert({ slug: `${tag}-ed`, title: `${tag} éditeur`, starts_at: future(2), status: "published" })
      .select("id")
      .single();
    check("peut créer un événement", !ev.error);

    if (ev.data) {
      const trash = await editor.from("events").update({ deleted_at: new Date().toISOString() }).eq("id", ev.data.id);
      check("peut mettre un événement à la corbeille", !trash.error);
      const { data: seen } = await anon.from("events").select("id").eq("id", ev.data.id);
      check("l'événement à la corbeille disparaît du site public", (seen ?? []).length === 0);
      const restore = await editor.from("events").update({ deleted_at: null }).eq("id", ev.data.id);
      check("peut le restaurer depuis la corbeille", !restore.error);
      const hard = await editor.from("events").delete().eq("id", ev.data.id).select();
      check("ne peut pas supprimer définitivement", !!hard.error || hard.data.length === 0);
    }

    const regs = await editor.from("registrations").select("id").limit(1);
    check("peut lire les inscriptions", !regs.error);

    const priv = await editor.from("settings_private").select("notification_email");
    check("peut lire les paramètres privés", !priv.error && priv.data.length === 1);

    const week = await editor.from("schedule_weeks").upsert({ date: "2098-12-31", kidouch: tag, times: { "2099-01-01:fin": "19:40" } });
    check("peut ajuster les horaires d'une semaine (page « Ce Chabbat »)", !week.error);
    const weekDel = await editor.from("schedule_weeks").delete().eq("date", "2098-12-31").select();
    check("peut effacer ces ajustements", !weekDel.error && weekDel.data.length === 1);

    const others = await service.from("push_subscriptions").insert({ user_id: (await service.from("profiles").select("id").neq("id", editorId).limit(1).single()).data.id, endpoint: `https://example.com/${tag}-autre`, p256dh: "x", auth: "x" });
    const mine = await editor.from("push_subscriptions").insert({ user_id: editorId, endpoint: `https://example.com/${tag}`, p256dh: "x", auth: "x" });
    check("peut abonner son téléphone aux notifications", !mine.error, mine.error?.message);
    const seen = await editor.from("push_subscriptions").select("endpoint");
    check("ne voit que ses propres appareils", !others.error && !seen.error && seen.data.every((r) => r.endpoint === `https://example.com/${tag}`));
    const steal = await editor.from("push_subscriptions").insert({ user_id: (await service.from("profiles").select("id").neq("id", editorId).limit(1).single()).data.id, endpoint: `https://example.com/${tag}-vol`, p256dh: "x", auth: "x" });
    check("ne peut pas abonner l'appareil de quelqu'un d'autre", !!steal.error);
    const delOther = await editor.from("push_subscriptions").delete().eq("endpoint", `https://example.com/${tag}-autre`).select();
    check("ne peut pas désabonner l'appareil de quelqu'un d'autre", (delOther.data ?? []).length === 0);

    // Isolation : le même compte, en demandant un autre site, n'a plus aucun droit d'équipe.
    const intruder = createClient(url, publishable, forSite(OTHER_SITE));
    await intruder.auth.signInWithPassword({ email, password });
    const msgOther = await intruder.from("contact_messages").select("id");
    check("sur un autre site : ne lit aucun message", (msgOther.data ?? []).length === 0);
    const evOther = await intruder.from("events").select("id").like("slug", `${tag}%`);
    check("sur un autre site : ne voit pas les événements de celui-ci", (evOther.data ?? []).length === 0);
    const insOther = await intruder.from("events").insert({ slug: `${tag}-intrus`, title: "Intrus", starts_at: future(2) });
    check("sur un autre site : ne peut rien créer", !!insOther.error);
  }

  // --- Serveur (service_role) ------------------------------------------------
  console.log("\nServeur");
  {
    const reg = (n) =>
      service.rpc("register_for_event", {
        p_event_id: id.full, p_name: "Test", p_phone: null, p_email: "test@example.com", p_party_size: n,
      });
    const r1 = await reg(2);
    check("inscription acceptée dans la limite des places", !r1.error);
    const r2 = await reg(1);
    check("inscription refusée quand c'est complet", r2.error?.message?.includes("EVENT_FULL"));
    const r3 = await service.rpc("register_for_event", {
      p_event_id: id.draft, p_name: "Test", p_phone: null, p_email: "t@example.com", p_party_size: 1,
    });
    check("inscription refusée sur un brouillon", r3.error?.message?.includes("EVENT_NOT_FOUND"));

    const key = `${tag}:rate`;
    const a = await service.rpc("check_rate_limit", { p_key: key, p_max: 2, p_window: "1 minute" });
    const b = await service.rpc("check_rate_limit", { p_key: key, p_max: 2, p_window: "1 minute" });
    const c = await service.rpc("check_rate_limit", { p_key: key, p_max: 2, p_window: "1 minute" });
    check("limitation de débit : 2 envois acceptés puis refus", a.data === true && b.data === true && c.data === false);
    await service.from("rate_limits").delete().eq("key", key);
  }
}

function future(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

async function cleanup() {
  await service.from("events").delete().like("slug", `${tag}%`);
  await service.from("schedule_weeks").delete().in("date", ["2098-12-30", "2098-12-31"]);
  await service.from("push_subscriptions").delete().like("endpoint", `https://example.com/${tag}%`);
  if (editorId) await service.auth.admin.deleteUser(editorId);
}

try {
  await main();
} catch (err) {
  failed++;
  console.error("\nErreur inattendue :", err);
} finally {
  await cleanup();
  console.log(`\n${passed} vérification(s) réussie(s), ${failed} échec(s).`);
  process.exitCode = failed ? 1 : 0;
}
