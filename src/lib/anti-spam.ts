import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Protection des formulaires publics, en trois couches :
 *  1. un champ « pot de miel » invisible que seuls les robots remplissent ;
 *  2. un délai minimal entre l'affichage du formulaire et l'envoi (horodatage posé par le navigateur) ;
 *  3. une limitation du nombre d'envois par adresse IP (l'IP est hachée, jamais stockée en clair).
 */

export const HONEYPOT_FIELD = "site_web";
export const STARTED_AT_FIELD = "debut";

const MIN_FILL_MS = 3000;
const MAX_FILL_MS = 24 * 3600 * 1000;

export type SpamCheck = { ok: true } | { ok: false; reason: "bot" | "too_fast" | "rate_limited" };

export async function checkSpam(form: FormData, action: string, maxPerHour: number): Promise<SpamCheck> {
  if (String(form.get(HONEYPOT_FIELD) ?? "").trim() !== "") return { ok: false, reason: "bot" };

  const startedAt = Number(form.get(STARTED_AT_FIELD));
  const elapsed = Date.now() - startedAt;
  if (!startedAt || elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) return { ok: false, reason: "too_fast" };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "inconnue";
  const salt = process.env.RATE_LIMIT_SALT ?? "";
  const key = `${action}:${createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32)}`;

  const { data: allowed, error } = await createServiceClient().rpc("check_rate_limit", {
    p_key: key,
    p_max: maxPerHour,
    p_window: "1 hour",
  });
  if (error) {
    // En cas de panne de la limitation, on laisse passer plutôt que de bloquer un vrai visiteur.
    console.error("Limitation de débit indisponible :", error);
    return { ok: true };
  }
  return allowed ? { ok: true } : { ok: false, reason: "rate_limited" };
}
