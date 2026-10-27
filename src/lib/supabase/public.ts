import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Client anonyme sans cookies, pour les lectures des pages publiques.
 * Comme il ne dépend d'aucune requête, ses résultats peuvent être mis en cache
 * (« use cache ») et invalidés à la publication depuis l'admin.
 */
export function createPublicClient() {
  const { url, publishableKey } = supabaseEnv();
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
