"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { refreshSite } from "@/lib/admin/revalidate";
import { type ActionState, dateField, invalid, parisToISO, TECH_ERROR, timeField } from "@/lib/admin/helpers";

const schema = z
  .object({
    id: z.string().optional(),
    message: z.string().trim().min(3, "Écrivez le texte de l'annonce.").max(280, "280 caractères au maximum."),
    linkUrl: z
      .string()
      .trim()
      .refine((v) => v === "" || /^(https?:\/\/|\/)/.test(v), "Le lien doit commencer par https:// (ou / pour une page du site)."),
    linkLabel: z.string().trim().max(60),
    level: z.enum(["info", "important"]),
    active: z.boolean(),
    expiresDate: z.string().refine((v) => v === "" || dateField.test(v), "Date invalide."),
    expiresTime: z.string().refine((v) => v === "" || timeField.test(v), "Heure invalide."),
  })
  .refine((v) => !v.expiresTime || v.expiresDate, { message: "Indiquez aussi la date.", path: ["expiresDate"] });

export async function saveAnnouncement(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireMember();
  const parsed = schema.safeParse({
    id: form.get("id") || undefined,
    message: form.get("message"),
    linkUrl: form.get("linkUrl") ?? "",
    linkLabel: form.get("linkLabel") ?? "",
    level: form.get("level"),
    active: form.get("active") === "on",
    expiresDate: form.get("expiresDate") ?? "",
    expiresTime: form.get("expiresTime") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const expiresAt = v.expiresDate ? parisToISO(v.expiresDate, v.expiresTime || "23:59") : null;
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
    return { ok: false, fieldErrors: { expiresDate: "Cette date est déjà passée." }, message: "Merci de corriger la date d'expiration." };
  }

  const row = {
    message: v.message,
    link_url: v.linkUrl || null,
    link_label: v.linkUrl ? v.linkLabel || null : null,
    level: v.level,
    is_active: v.active,
    expires_at: expiresAt,
    // Réactiver une annonce la rend visible tout de suite.
    ...(v.active ? { starts_at: new Date().toISOString() } : {}),
  };

  const supabase = await createSessionClient();
  const { error } = v.id
    ? await supabase.from("announcements").update(row).eq("id", v.id)
    : await supabase.from("announcements").insert(row);
  if (error) {
    console.error("Enregistrement de l'annonce impossible :", error);
    return TECH_ERROR;
  }
  refreshSite("announcements");
  redirect(`/admin/annonces?message=${v.active ? "publie" : "enregistre"}`);
}

export async function toggleAnnouncement(form: FormData) {
  await requireMember();
  const active = form.get("active") === "1";
  const supabase = await createSessionClient();
  await supabase
    .from("announcements")
    .update(active ? { is_active: true, starts_at: new Date().toISOString() } : { is_active: false })
    .eq("id", String(form.get("id")));
  refreshSite("announcements");
  redirect(`/admin/annonces?message=${active ? "publie" : "enregistre"}`);
}

export async function duplicateAnnouncement(form: FormData) {
  await requireMember();
  const supabase = await createSessionClient();
  const { data: a } = await supabase.from("announcements").select("*").eq("id", String(form.get("id"))).maybeSingle();
  if (!a) redirect("/admin/annonces?message=introuvable");
  const { data } = await supabase
    .from("announcements")
    .insert({ message: a.message, link_url: a.link_url, link_label: a.link_label, level: a.level, is_active: false })
    .select("id")
    .single();
  redirect(data ? `/admin/annonces/${data.id}?message=duplique` : "/admin/annonces");
}

export async function trashAnnouncement(form: FormData) {
  await requireMember();
  const supabase = await createSessionClient();
  await supabase.from("announcements").update({ deleted_at: new Date().toISOString() }).eq("id", String(form.get("id")));
  refreshSite("announcements");
  redirect("/admin/annonces?message=corbeille");
}
