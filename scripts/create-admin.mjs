/**
 * Crée (ou promeut) le compte administrateur.
 * Usage : node scripts/create-admin.mjs prenom.nom@exemple.fr
 *
 * Le compte est créé sans mot de passe : la connexion se fait ensuite par lien magique sur /admin.
 */
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Indiquez l'adresse e-mail : node scripts/create-admin.mjs adresse@exemple.fr");
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

const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", profile.id);
if (error) throw error;
console.log(`${email} est administrateur. Connexion : /admin`);
