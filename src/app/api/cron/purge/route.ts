import { createServiceClient } from "@/lib/supabase/service";

/**
 * Purge quotidienne (tâche planifiée Vercel, voir vercel.json) :
 * corbeille de plus de 30 jours, inscriptions anciennes (RGPD), traces anti-spam.
 * Les images devenues orphelines sont retirées du stockage.
 * Ce passage quotidien évite aussi la mise en pause du projet Supabase gratuit.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Accès refusé", { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("purge_expired");
  if (error) {
    console.error("Purge impossible :", error);
    return Response.json({ ok: false }, { status: 500 });
  }

  const paths = (data ?? []).map((r) => r.orphan_path).filter((p): p is string => Boolean(p));
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("media").remove(paths);
    if (storageError) console.error("Suppression des images orphelines impossible :", storageError);
  }

  return Response.json({ ok: true, imagesSupprimees: paths.length });
}
