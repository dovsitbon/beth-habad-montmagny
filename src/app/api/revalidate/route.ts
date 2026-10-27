import { revalidateTag } from "next/cache";

/** Étiquettes de cache du site public (voir src/lib/data et src/lib/hebcal.ts). */
const TAGS = ["settings", "pages", "events", "courses", "albums", "announcements", "service_times", "schedule_weeks", "hebcal"];

/**
 * Remet le site public à jour après une modification faite directement dans la base
 * (script, tableau de bord Supabase…). L'admin du site le fait déjà tout seul.
 *
 * Usage : curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/revalidate
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Accès refusé", { status: 401 });
  }
  for (const tag of TAGS) revalidateTag(tag, { expire: 0 });
  return Response.json({ ok: true, tags: TAGS });
}
