/**
 * Range les fichiers existants du bucket « media » dans le dossier du site (multi-tenant) :
 *   events/abc.webp  →  {NEXT_PUBLIC_SITE_ID}/events/abc.webp
 * et met à jour les chemins enregistrés en base (événements, cours, textes, logo, photos).
 *
 * À lancer UNE fois, juste après la migration multi_tenant, pour le site historique
 * (tous les fichiers hors dossier de site lui appartiennent). Peut être relancé sans risque :
 * les fichiers déjà rangés sont ignorés.
 *   node scripts/migrer-medias.mjs           (affiche ce qui serait fait)
 *   node scripts/migrer-medias.mjs --go      (le fait)
 */
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const SITE = process.env.NEXT_PUBLIC_SITE_ID;
const GO = process.argv.includes("--go");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!SITE || !UUID.test(SITE)) {
  console.error("NEXT_PUBLIC_SITE_ID manquant ou invalide dans .env.local");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});
const bucket = supabase.storage.from("media");

/** Tous les fichiers du bucket, hors dossiers de site ({uuid}/…). */
async function listLoose(prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await bucket.list(prefix, { limit: 1000, offset });
    if (error) throw error;
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        // Dossier : on ne descend pas dans ceux des sites (déjà rangés).
        if (!(prefix === "" && UUID.test(entry.name))) files.push(...(await listLoose(path)));
      } else if (entry.name !== ".emptyFolderPlaceholder") {
        files.push(path);
      }
    }
    if (data.length < 1000) break;
  }
  return files;
}

/** Colonnes qui contiennent un chemin de fichier. */
const COLUMNS = [
  ["events", "image_path"],
  ["courses", "image_path"],
  ["pages", "image_path"],
  ["settings", "logo_path"],
  ["photos", "storage_path"],
];

const files = await listLoose();
console.log(`${files.length} fichier(s) à ranger dans ${SITE}/${GO ? "" : "  (simulation : ajoutez --go pour le faire)"}`);

let moved = 0;
let updated = 0;
for (const from of files) {
  const to = `${SITE}/${from}`;
  if (!GO) {
    console.log(`  ${from} → ${to}`);
    continue;
  }
  const { error } = await bucket.move(from, to);
  if (error) {
    console.error(`  ✗ ${from} : ${error.message}`);
    continue;
  }
  moved++;
  for (const [table, column] of COLUMNS) {
    const { data, error: updateError } = await supabase
      .from(table)
      .update({ [column]: to })
      .eq("site_id", SITE)
      .eq(column, from)
      .select(column);
    if (updateError) console.error(`  ✗ ${table}.${column} (${from}) : ${updateError.message}`);
    else updated += data.length;
  }
}

// Chemins en base qui ne correspondent à aucun fichier (déjà absents du stockage) : signalés.
const leftovers = [];
for (const [table, column] of COLUMNS) {
  const { data } = await supabase.from(table).select(column).eq("site_id", SITE).not(column, "is", null).not(column, "like", `${SITE}/%`);
  for (const row of data ?? []) leftovers.push(`${table}.${column} = ${row[column]}`);
}

if (GO) console.log(`\n${moved} fichier(s) déplacé(s), ${updated} chemin(s) mis à jour en base.`);
if (leftovers.length) {
  console.log(`\nChemins en base hors du dossier du site${GO ? " (fichier introuvable)" : ""} :`);
  for (const l of leftovers) console.log(`  ${l}`);
}
