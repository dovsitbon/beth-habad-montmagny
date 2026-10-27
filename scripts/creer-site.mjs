/**
 * Crée un nouveau site client dans le projet Supabase partagé (multi-tenant), sans toucher
 * aux autres sites. Voir docs/multi-tenant.md.
 *
 *   node scripts/creer-site.mjs --nom "Beth Habad de Sarcelles" --court "Beth Habad Sarcelles" \
 *     --domaine beth-habad-sarcelles.fr --lat 48.99 --lng 2.38 --admin rabbin@exemple.fr
 *
 * Options : --notif adresse (e-mail qui reçoit messages et inscriptions ; par défaut celle de --admin),
 *           --ville, --essai (affiche ce qui serait créé, sans rien écrire).
 *
 * Crée : la ligne « sites », les paramètres (publics et privés), les textes de départ
 * (repères [À COMPLÉTER]) et le premier administrateur. Affiche ensuite le NEXT_PUBLIC_SITE_ID
 * à mettre dans .env.local et sur Vercel pour le nouveau dépôt.
 */
import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";

process.loadEnvFile(".env.local");

const { values: opt } = parseArgs({
  options: {
    nom: { type: "string" },
    court: { type: "string" },
    domaine: { type: "string" },
    lat: { type: "string" },
    lng: { type: "string" },
    admin: { type: "string" },
    notif: { type: "string" },
    ville: { type: "string" },
    essai: { type: "boolean", default: false },
  },
});

const domain = opt.domaine?.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
const admin = opt.admin?.trim().toLowerCase();
const lat = Number(opt.lat);
const lng = Number(opt.lng);
const problems = [
  !opt.nom && "--nom",
  !domain && "--domaine",
  !admin && "--admin",
  !(lat >= -90 && lat <= 90 && opt.lat) && "--lat (latitude, ex. 48.97)",
  !(lng >= -180 && lng <= 180 && opt.lng) && "--lng (longitude, ex. 2.34)",
].filter(Boolean);
if (problems.length) {
  console.error(`Il manque ou est invalide : ${problems.join(", ")}\n`);
  console.error('Exemple : node scripts/creer-site.mjs --nom "Beth Habad de Sarcelles" --domaine beth-habad-sarcelles.fr --lat 48.99 --lng 2.38 --admin rabbin@exemple.fr');
  process.exit(1);
}
if (!/^[a-z0-9.-]+$/.test(domain)) {
  console.error(`Nom de domaine invalide : ${domain}`);
  process.exit(1);
}

const name = opt.nom.trim();
const shortName = (opt.court ?? name).trim();
const notification = (opt.notif ?? admin).trim().toLowerCase();

/** Textes de départ : rien d'inventé, des repères à compléter depuis l'admin. */
const PAGES = [
  ["accueil", "Présentation (page d'accueil)", `<p>[À COMPLÉTER] Quelques mots d'accueil pour ${name}.</p>`],
  ["cteen", "CTeen", "<p>[À COMPLÉTER] Présentation du CTeen.</p>"],
  ["cours", "Cours et activités", "<p>[À COMPLÉTER] Introduction à la page des cours.</p>"],
  ["faire-un-don", "Faire un don", "<p>[À COMPLÉTER] Quelques mots pour expliquer à quoi servent les dons.</p>"],
  ["mentions-legales", "Mentions légales", `<h2>Éditeur du site</h2>\n<p>${name} — [À COMPLÉTER] forme juridique, adresse, numéro RNA ou SIREN, directeur de la publication.</p>\n<h2>Hébergement</h2>\n<p>Site hébergé par Vercel Inc. Base de données et photos hébergées par Supabase, en France (région de Paris).</p>`],
  ["confidentialite", "Politique de confidentialité", `<p>[À COMPLÉTER] Politique de confidentialité de ${name}.</p>\n<p>Dernière mise à jour : [À COMPLÉTER]</p>`],
];

console.log(`\nNouveau site : ${name} (${domain})`);
console.log(`  Position : ${lat}, ${lng} · Administrateur : ${admin} · Notifications : ${notification}`);
if (opt.essai) {
  console.log("\n--essai : rien n'a été écrit.");
  process.exit(0);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const { data: existing } = await supabase.from("sites").select("id").eq("domain", domain).maybeSingle();
if (existing) {
  console.error(`\nUn site existe déjà pour ${domain} (NEXT_PUBLIC_SITE_ID=${existing.id}). Rien n'a été modifié.`);
  process.exit(1);
}

const { data: site, error: siteError } = await supabase.from("sites").insert({ name, domain }).select("id").single();
if (siteError) throw siteError;
const siteId = site.id;

/** En cas d'échec après la création du site, on retire tout ce qui vient d'être créé (cascade). */
async function fail(step, error) {
  console.error(`\nÉchec (${step}) :`, error.message ?? error);
  await supabase.from("sites").delete().eq("id", siteId);
  console.error("Le site a été retiré : relancez la commande après correction.");
  process.exit(1);
}

const settings = await supabase.from("settings").insert({
  site_id: siteId,
  name,
  short_name: shortName,
  address_city: opt.ville ?? null,
  latitude: lat,
  longitude: lng,
});
if (settings.error) await fail("paramètres", settings.error);

const priv = await supabase.from("settings_private").insert({ site_id: siteId, notification_email: notification });
if (priv.error) await fail("paramètres privés", priv.error);

const pages = await supabase.from("pages").insert(PAGES.map(([slug, title, body]) => ({ site_id: siteId, slug, title, body })));
if (pages.error) await fail("textes", pages.error);

let { data: profile } = await supabase.from("profiles").select("id").eq("email", admin).maybeSingle();
if (!profile) {
  const { data, error } = await supabase.auth.admin.createUser({ email: admin, email_confirm: true });
  if (error) await fail("compte administrateur", error);
  profile = { id: data.user.id };
}
const member = await supabase.from("user_sites").insert({ user_id: profile.id, site_id: siteId, role: "admin" });
if (member.error) await fail("administrateur", member.error);

console.log(`
Site créé.

À mettre dans .env.local du nouveau dépôt, et sur Vercel (Production) :
  NEXT_PUBLIC_SITE_ID=${siteId}
  NEXT_PUBLIC_SITE_URL=https://${domain}

Les autres variables (NEXT_PUBLIC_SUPABASE_URL, clés Supabase) sont les mêmes pour tous les sites.
L'administrateur ${admin} se connecte sur https://${domain}/admin avec son adresse e-mail.
`);
