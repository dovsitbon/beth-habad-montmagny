"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireMember } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotification } from "@/lib/email";
import { siteConfig } from "@/config/site.config";
import { type ActionState, invalid, TECH_ERROR } from "@/lib/admin/helpers";

const inviteSchema = z.object({
  email: z.email("Adresse e-mail invalide."),
  fullName: z.string().trim().min(2, "Indiquez le prénom et le nom.").max(120),
});

/**
 * Ajoute une personne à l'équipe (rôle « éditeur »). Le rabbin peut inviter ;
 * seul l'administrateur peut ensuite changer les rôles.
 */
export async function inviteMember(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await requireMember();
  const parsed = inviteSchema.safeParse({
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    fullName: form.get("fullName"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const { email, fullName } = parsed.data;

  // Création du compte : nécessite la clé serveur (les inscriptions publiques sont fermées).
  const service = createServiceClient();
  const { data: existing } = await service.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing) return { ok: false, fieldErrors: { email: "Cette personne fait déjà partie de l'équipe." } };

  const { error } = await service.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: fullName } });
  if (error) {
    console.error("Invitation impossible :", error);
    return TECH_ERROR;
  }

  await sendNotification({
    to: email,
    subject: "Vous avez accès à l'espace de gestion du site",
    text: [
      `Bonjour ${fullName},`,
      "",
      `${me.fullName ?? "Le Beth Habad"} vous a ajouté(e) à l'équipe qui gère le site ${siteConfig.name}.`,
      "",
      `Pour vous connecter : ${siteConfig.url}/admin`,
      "Indiquez simplement votre adresse e-mail, vous recevrez un lien de connexion (pas de mot de passe).",
    ].join("\n"),
  });

  redirect("/admin/equipe?message=invite");
}

/** Retirer quelqu'un de l'équipe : l'admin peut retirer tout le monde (sauf lui-même), un éditeur seulement des éditeurs. */
export async function removeMember(form: FormData) {
  const me = await requireMember();
  const id = String(form.get("id"));
  if (id === me.id) redirect("/admin/equipe");

  const service = createServiceClient();
  const { data: target } = await service.from("profiles").select("role").eq("id", id).maybeSingle();
  if (!target || (target.role === "admin" && me.role !== "admin")) redirect("/admin/equipe?message=reserve-admin");

  await service.auth.admin.deleteUser(id);
  redirect("/admin/equipe?message=supprime");
}

export async function changeRole(form: FormData) {
  const me = await requireAdmin();
  const id = String(form.get("id"));
  const role = form.get("role") === "admin" ? "admin" : "editor";
  if (id === me.id) redirect("/admin/equipe");
  const service = createServiceClient();
  await service.from("profiles").update({ role }).eq("id", id);
  redirect("/admin/equipe?message=enregistre");
}
