import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";
import { siteId } from "@/lib/supabase/env";

export type Member = {
  id: string;
  email: string;
  fullName: string | null;
  role: "admin" | "editor";
};

/**
 * Personne connectée à l'espace de gestion, ou null.
 * getClaims() vérifie la signature du jeton : on ne fait jamais confiance au cookie seul.
 */
export async function getMember(): Promise<Member | null> {
  // L'admin est toujours rendu à la demande (jamais pré-généré) : données personnelles et heure courante.
  await connection();
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  // Le rôle est celui tenu sur CE site : sans ligne dans user_sites, pas d'accès à cet admin
  // (même avec un compte membre d'un autre site du même projet Supabase).
  const { data: membership } = await supabase
    .from("user_sites")
    .select("role, profiles(id, email, full_name)")
    .eq("user_id", userId)
    .eq("site_id", siteId())
    .maybeSingle();
  const profile = membership?.profiles;
  if (!membership || !profile) return null;
  return { id: profile.id, email: profile.email, fullName: profile.full_name, role: membership.role };
}

/** À appeler en tête de chaque page et action de l'admin : renvoie vers la connexion si besoin. */
export async function requireMember(): Promise<Member> {
  const member = await getMember();
  if (!member) redirect("/admin/connexion");
  return member;
}

/** Réservé à l'administrateur (paramètres techniques, rôles). */
export async function requireAdmin(): Promise<Member> {
  const member = await requireMember();
  if (member.role !== "admin") redirect("/admin?message=reserve-admin");
  return member;
}
