"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createSessionClient } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/supabase/env";

export type LoginState = {
  step: "email" | "code";
  email?: string;
  message?: string;
  error?: string;
};

const emailSchema = z.email("Cette adresse e-mail ne semble pas valide.");

/** Étape 1 : envoi du lien magique (et du code, si le modèle d'e-mail personnalisé est actif). */
export async function sendLoginLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = emailSchema.safeParse(String(form.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { step: "email", error: parsed.error.issues[0].message };
  const email = parsed.data;

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;

  // Flux « implicite » : le lien fonctionne même s'il est ouvert dans un autre navigateur
  // que celui de la demande (cas fréquent sur téléphone : application Gmail, PWA…).
  const { url, publishableKey } = supabaseEnv();
  const supabase = createClient(url, publishableKey, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth/confirm?next=/admin` },
  });

  if (error) {
    if (error.status === 429 || /rate limit/i.test(error.message)) {
      return { step: "email", email, error: "Trop de demandes en peu de temps. Merci de patienter quelques minutes." };
    }
    // Adresse inconnue : même message qu'une réussite, pour ne pas révéler qui a accès.
    if (!/signups not allowed|not found/i.test(error.message)) console.error("Envoi du lien impossible :", error);
  }

  return {
    step: "code",
    email,
    message: `Si ${email} fait partie de l'équipe, un e-mail vient de lui être envoyé. Ouvrez-le et appuyez sur le lien.`,
  };
}

/** Étape 2 (facultative) : saisie du code reçu par e-mail. Utile depuis l'application installée sur l'écran d'accueil. */
export async function verifyLoginCode(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "");
  const token = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6,10}$/.test(token)) {
    return { step: "code", email, error: "Le code est composé uniquement de chiffres." };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    return { step: "code", email, error: "Ce code est incorrect ou a expiré. Demandez un nouveau lien." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/connexion?message=deconnecte");
}
