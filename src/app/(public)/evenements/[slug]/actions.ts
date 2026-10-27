"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { checkSpam } from "@/lib/anti-spam";
import { sendNotification } from "@/lib/email";
import { notifyTeam } from "@/lib/push";
import { createServiceClient } from "@/lib/supabase/service";
import { formatDateTimeLong } from "@/lib/format";
import { siteConfig } from "@/config/site.config";
import { siteId } from "@/lib/supabase/env";

export type RegistrationState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "phone" | "email" | "partySize", string>>;
  /** Valeurs saisies, renvoyées pour ne pas vider le formulaire en cas d'erreur. */
  values?: Record<string, string>;
};

const schema = z
  .object({
    eventId: z.uuid(),
    name: z.string().trim().min(2, "Indiquez votre nom et prénom.").max(120, "Ce nom est trop long."),
    phone: z
      .string()
      .trim()
      .max(30)
      .refine((v) => v === "" || /^[+0-9 ().-]{6,30}$/.test(v), "Ce numéro de téléphone ne semble pas valide."),
    email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === "" || z.email().safeParse(v).success, "Cette adresse e-mail ne semble pas valide."),
    partySize: z.coerce
      .number({ message: "Indiquez le nombre de personnes." })
      .int("Indiquez un nombre entier.")
      .min(1, "Au moins 1 personne.")
      .max(20, "20 personnes au maximum par inscription."),
  })
  .refine((v) => v.phone !== "" || v.email !== "", {
    message: "Indiquez au moins un téléphone ou une adresse e-mail pour qu'on puisse vous joindre.",
    path: ["phone"],
  });

const DB_ERRORS: Record<string, string> = {
  EVENT_FULL: "Désolé, il ne reste plus assez de places pour cet événement.",
  REGISTRATION_CLOSED: "Les inscriptions pour cet événement sont closes.",
  EVENT_NOT_FOUND: "Cet événement n'est plus disponible.",
};

export async function registerForEvent(_prev: RegistrationState, form: FormData): Promise<RegistrationState> {
  const values = {
    name: String(form.get("name") ?? ""),
    phone: String(form.get("phone") ?? ""),
    email: String(form.get("email") ?? ""),
    partySize: String(form.get("partySize") ?? "1"),
  };

  // Validation d'abord : une personne pressée qui oublie un champ voit l'erreur sur le champ,
  // pas un message anti-spam (et la tentative ne compte pas dans la limite d'envois).
  const parsed = schema.safeParse({ eventId: form.get("eventId"), ...values });
  if (!parsed.success) {
    const fieldErrors: RegistrationState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<RegistrationState["fieldErrors"]>;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", values, fieldErrors, message: "Merci de corriger les champs indiqués." };
  }

  const spam = await checkSpam(form, "inscription", 10);
  if (!spam.ok) {
    return {
      status: "error",
      values,
      message:
        spam.reason === "rate_limited"
          ? "Vous avez déjà envoyé plusieurs inscriptions. Merci de réessayer dans une heure, ou de contacter le Beth Habad."
          : "Votre inscription n'a pas pu être envoyée. Merci de patienter quelques secondes puis de réessayer.",
    };
  }

  const { eventId, name, phone, email, partySize } = parsed.data;
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("register_for_event", {
    p_event_id: eventId,
    p_name: name,
    // Les paramètres acceptent NULL en SQL, mais les types générés ne le disent pas.
    p_phone: (phone || null) as string,
    p_email: (email || null) as string,
    p_party_size: partySize,
  });

  if (error) {
    const known = Object.keys(DB_ERRORS).find((code) => error.message.includes(code));
    if (!known) console.error("Inscription impossible :", error);
    return {
      status: "error",
      values,
      message: known ? DB_ERRORS[known] : "Un problème technique a empêché l'inscription. Merci de réessayer plus tard.",
    };
  }

  // Met à jour tout de suite le nombre de places affiché.
  updateTag(`seats:${eventId}`);

  // Notification au Beth Habad (sans bloquer le visiteur si l'envoi échoue).
  const [{ data: event }, { data: priv }] = await Promise.all([
    supabase.from("events").select("title, slug, starts_at").eq("id", eventId).eq("site_id", siteId()).single(),
    supabase.from("settings_private").select("notification_email").eq("site_id", siteId()).single(),
  ]);
  if (event) {
    await Promise.all([
      notifyTeam({
        title: `Nouvelle inscription : ${event.title}`,
        body: `${name} (${partySize > 1 ? `${partySize} personnes` : "1 personne"})`,
        url: `/admin/inscriptions/${eventId}`,
        tag: `inscriptions-${eventId}`,
      }),
      priv?.notification_email &&
        sendNotification({
          to: priv.notification_email,
          replyTo: email || null,
          subject: `Nouvelle inscription : ${event.title}`,
          text: [
            `Nouvelle inscription pour « ${event.title} » (${formatDateTimeLong(event.starts_at)}).`,
            "",
            `Nom : ${name}`,
            `Nombre de personnes : ${partySize}`,
            phone ? `Téléphone : ${phone}` : null,
            email ? `E-mail : ${email}` : null,
            "",
            `Toutes les inscriptions : ${siteConfig.url}/admin/inscriptions`,
          ]
            .filter((l) => l !== null)
            .join("\n"),
        }),
    ]);
  }

  return {
    status: "success",
    message:
      partySize > 1
        ? `Merci ${name} ! Votre inscription pour ${partySize} personnes est bien enregistrée.`
        : `Merci ${name} ! Votre inscription est bien enregistrée.`,
  };
}
