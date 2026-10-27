import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Client anonyme sans cookies, pour les lectures des pages publiques.
 * Comme il ne dépend d'aucune requête, ses résultats peuvent être mis en cache
 * (« use cache ») et invalidés à la publication depuis l'admin.
 *
 * `cache: "no-store"` : les réponses ne vont PAS dans le cache de fichiers de Next.js
 * (.next/cache/fetch-cache), qui survit d'un déploiement à l'autre et servait des
 * données périmées. La mise en cache est assurée uniquement par « use cache » + étiquettes.
 */
export function createPublicClient() {
  const { url, publishableKey } = supabaseEnv();
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
