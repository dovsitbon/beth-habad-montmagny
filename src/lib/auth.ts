import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;
  return { id: profile.id, email: profile.email, fullName: profile.full_name, role: profile.role };
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
