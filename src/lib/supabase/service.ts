import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { siteHeaders, supabaseEnv } from "./env";

/**
 * Client « service » : contourne la RLS. À n'utiliser QUE côté serveur, pour :
 *  - les formulaires publics (inscriptions, contact) après validation et anti-spam ;
 *  - les invitations d'utilisateurs ;
 *  - la purge planifiée.
 * Ne jamais l'importer dans un composant client (protégé par « server-only »).
 *
 * La RLS ne s'applique pas : chaque requête doit filtrer elle-même sur site_id
 * (`.eq("site_id", siteId())`). L'en-tête x-site-id sert aux valeurs par défaut
 * (site_id des insertions) et aux fonctions SQL (inscriptions, anti-spam).
 */
export function createServiceClient() {
  const { url } = supabaseEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Configuration Supabase manquante : renseignez SUPABASE_SECRET_KEY dans .env.local");
  }
  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: siteHeaders() },
  });
}
