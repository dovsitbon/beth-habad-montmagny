import "server-only";

/**
 * Envoi des e-mails de notification (nouvelle inscription, nouveau message) via l'API Resend.
 * Sans RESEND_API_KEY, rien n'est envoyé : le contenu est simplement écrit dans les journaux
 * (pratique en développement). Un échec d'envoi ne bloque jamais l'action du visiteur.
 */
export async function sendNotification({
  to,
  subject,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string | null;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.info(`[e-mail non envoyé : RESEND_API_KEY ou EMAIL_FROM absent]\nÀ : ${to}\nObjet : ${subject}\n\n${text}`);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) {
      console.error("Échec de l'envoi de l'e-mail :", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Échec de l'envoi de l'e-mail :", err);
    return false;
  }
}
