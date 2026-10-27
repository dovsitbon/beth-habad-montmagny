/**
 * Crée (ou promeut) un administrateur du site de ce dépôt (NEXT_PUBLIC_SITE_ID).
 * Usage : node scripts/create-admin.mjs prenom.nom@exemple.fr
 *
 * Le compte est créé sans mot de passe : la connexion se fait ensuite par lien magique sur /admin.
 * Un compte qui gère déjà un autre site (même projet Supabase) est simplement ajouté à celui-ci.
 */
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const email = process.argv[2]?.trim().toLowerCase();
const siteId = process.env.NEXT_PUBLIC_SITE_ID;
if (!email || !siteId) {
  console.error("Usage : node scripts/create-admin.mjs adresse@exemple.fr (avec NEXT_PUBLIC_SITE_ID dans .env.local)");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

let { data: profile } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
if (!profile) {
  const { data, error } = await supabase.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  profile = { id: data.user.id };
  console.log(`Compte créé pour ${email}.`);
}

const { error } = await supabase
  .from("user_sites")
  .upsert({ user_id: profile.id, site_id: siteId, role: "admin" }, { onConflict: "user_id,site_id" });
if (error) throw error;
console.log(`${email} est administrateur de ce site. Connexion : /admin`);
