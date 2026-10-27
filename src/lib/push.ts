import "server-only";
import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/service";
import { siteId } from "@/lib/supabase/env";

/**
 * Notifications sur le téléphone de l'équipe (Web Push), en plus des e-mails.
 * Sans clés VAPID (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY), rien n'est envoyé.
 * Un échec d'envoi ne bloque jamais l'action du visiteur.
 */

export type PushMessage = {
  title: string;
  body: string;
  /** Page de l'admin ouverte quand on touche la notification. */
  url: string;
  /** Les notifications de même « tag » se remplacent au lieu de s'empiler. */
  tag?: string;
};

function configure(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:contact@example.com", publicKey, privateKey);
  return true;
}

/** Envoie la notification à tous les appareils abonnés (ou à ceux d'une personne). */
export async function notifyTeam(message: PushMessage, { userId }: { userId?: string } = {}): Promise<number> {
  if (!configure()) {
    console.info(`[notification non envoyée : clés VAPID absentes] ${message.title} — ${message.body}`);
    return 0;
  }

  const supabase = createServiceClient();
  const site = siteId();
  // Seulement les appareils des membres actuels de l'équipe de CE site.
  const { data: team } = await supabase.from("user_sites").select("user_id").eq("site_id", site);
  const members = (team ?? []).map((m) => m.user_id).filter((id) => !userId || id === userId);
  if (members.length === 0) return 0;
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("site_id", site)
    .in("user_id", members);
  if (error) {
    console.error("Lecture des abonnements impossible :", error);
    return 0;
  }

  const payload = JSON.stringify(message);
  const expired: string[] = [];
  let sent = 0;
  await Promise.all(
    (subscriptions ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: 60 * 60 * 24,
          urgency: "high",
        });
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404 / 410 : l'appareil s'est désabonné (application supprimée, autorisation retirée…).
        if (status === 404 || status === 410) expired.push(s.id);
        else console.error("Échec de l'envoi de la notification :", status ?? err);
      }
    }),
  );
  if (expired.length) await supabase.from("push_subscriptions").delete().in("id", expired);
  return sent;
}

/** Début d'un texte, pour l'aperçu dans la notification. */
export function excerpt(text: string, max = 120): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}
