import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { siteHeaders } from "./env";

/** Client navigateur (admin uniquement : envoi direct des photos vers le stockage). */
export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: siteHeaders() } },
  );
}
