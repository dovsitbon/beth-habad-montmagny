"use server";

import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { siteId } from "@/lib/supabase/env";
import { notifyTeam } from "@/lib/push";

const subscriptionSchema = z.object({
  endpoint: z.url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
  device: z.string().max(60).optional(),
});

/** Enregistre ce téléphone pour recevoir les notifications de la personne connectée. */
export async function savePushSubscription(input: unknown): Promise<{ ok: boolean }> {
  const member = await requireMember();
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { endpoint, keys, device } = parsed.data;

  const supabase = await createSessionClient();
  // Un même appareil peut avoir servi à une autre personne : on repart d'une ligne propre.
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  const { error } = await supabase
    .from("push_subscriptions")
    .insert({ site_id: siteId(), user_id: member.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, device: device ?? null });
  if (error) console.error("Abonnement aux notifications impossible :", error);
  return { ok: !error };
}

/** Désactive les notifications sur ce téléphone. */
export async function deletePushSubscription(endpoint: string): Promise<{ ok: boolean }> {
  await requireMember();
  const supabase = await createSessionClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return { ok: !error };
}

/** Envoie une notification d'essai à tous les appareils de la personne connectée. */
export async function sendTestNotification(): Promise<{ sent: number }> {
  const member = await requireMember();
  const sent = await notifyTeam(
    { title: "Notifications activées", body: "Vous serez prévenu ici à chaque nouveau message ou inscription.", url: "/admin", tag: "essai" },
    { userId: member.id },
  );
  return { sent };
}
