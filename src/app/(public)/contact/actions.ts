"use server";

import { z } from "zod";
import { checkSpam } from "@/lib/anti-spam";
import { sendNotification } from "@/lib/email";
import { createServiceClient } from "@/lib/supabase/service";
import { siteConfig } from "@/config/site.config";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "phone" | "message", string>>;
  values?: Record<string, string>;
};

const schema = z
  .object({
    name: z.string().trim().min(2, "Indiquez votre nom.").max(120, "Ce nom est trop long."),
    email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === "" || z.email().safeParse(v).success, "Cette adresse e-mail ne semble pas valide."),
    phone: z
      .string()
      .trim()
      .max(30)
      .refine((v) => v === "" || /^[+0-9 ().-]{6,30}$/.test(v), "Ce numéro de téléphone ne semble pas valide."),
    message: z
      .string()
      .trim()
      .min(5, "Votre message est un peu court.")
      .max(5000, "Votre message est trop long (5 000 caractères au maximum)."),
  })
  .refine((v) => v.email !== "" || v.phone !== "", {
    message: "Indiquez un e-mail ou un téléphone pour qu'on puisse vous répondre.",
    path: ["email"],
  });

export async function sendContactMessage(_prev: ContactState, form: FormData): Promise<ContactState> {
  const values = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    message: String(form.get("message") ?? ""),
  };

  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: ContactState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ContactState["fieldErrors"]>;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", values, fieldErrors, message: "Merci de corriger les champs indiqués." };
  }

  const spam = await checkSpam(form, "contact", 5);
  if (!spam.ok) {
    return {
      status: "error",
      values,
      message:
        spam.reason === "rate_limited"
          ? "Vous avez déjà envoyé plusieurs messages. Merci de réessayer dans une heure, ou d'appeler le Beth Habad."
          : "Votre message n'a pas pu être envoyé. Merci de patienter quelques secondes puis de réessayer.",
    };
  }

  const { name, email, phone, message } = parsed.data;
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email: email || null, phone: phone || null, message });

  if (error) {
    console.error("Enregistrement du message impossible :", error);
    return {
      status: "error",
      values,
      message: "Un problème technique a empêché l'envoi. Merci de réessayer plus tard ou d'appeler le Beth Habad.",
    };
  }

  const { data: priv } = await supabase.from("settings_private").select("notification_email").eq("id", 1).single();
  if (priv?.notification_email) {
    await sendNotification({
      to: priv.notification_email,
      replyTo: email || null,
      subject: `Nouveau message de ${name}`,
      text: [
        `Nouveau message reçu depuis le formulaire de contact du site.`,
        "",
        `De : ${name}`,
        email ? `E-mail : ${email}` : null,
        phone ? `Téléphone : ${phone}` : null,
        "",
        message,
        "",
        `Tous les messages : ${siteConfig.url}/admin/messages`,
      ]
        .filter((l) => l !== null)
        .join("\n"),
    });
  }

  return { status: "success", message: `Merci ${name}, votre message a bien été envoyé. Nous vous répondrons rapidement.` };
}
