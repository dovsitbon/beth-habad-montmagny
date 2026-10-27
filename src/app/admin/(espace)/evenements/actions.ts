"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { refreshSite } from "@/lib/admin/revalidate";
import {
  type ActionState,
  cleanHtml,
  dateField,
  invalid,
  parisToISO,
  shortId,
  slugify,
  TECH_ERROR,
  timeField,
} from "@/lib/admin/helpers";

const schema = z
  .object({
    id: z.string().optional(),
    category: z.enum(["general", "cteen"]),
    title: z.string().trim().min(2, "Indiquez un titre.").max(200, "Titre trop long (200 caractères au maximum)."),
    summary: z.string().trim().max(300, "Résumé trop long (300 caractères au maximum)."),
    description: z.string(),
    date: z.string().regex(dateField, "Indiquez la date."),
    startTime: z.string().regex(timeField, "Indiquez l'heure de début."),
    endTime: z.string().refine((v) => v === "" || timeField.test(v), "Heure de fin invalide."),
    location: z.string().trim().max(200),
    price: z.string().trim().max(120),
    imagePath: z.string().max(300),
    registration: z.boolean(),
    capacity: z.string().refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0), "Indiquez un nombre de places supérieur à 0, ou laissez vide."),
    deadlineDate: z.string().refine((v) => v === "" || dateField.test(v), "Date limite invalide."),
    intent: z.enum(["publish", "draft", "preview"]),
  })
  .refine((v) => v.endTime === "" || v.endTime > v.startTime, {
    message: "L'heure de fin doit être après l'heure de début.",
    path: ["endTime"],
  });

/** Création ou modification d'un événement (bouton Publier, Brouillon ou Aperçu). */
export async function saveEvent(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireMember();
  const parsed = schema.safeParse({
    id: form.get("id") || undefined,
    category: form.get("category"),
    title: form.get("title"),
    summary: form.get("summary") ?? "",
    description: form.get("description") ?? "",
    date: form.get("date"),
    startTime: form.get("startTime"),
    endTime: form.get("endTime") ?? "",
    location: form.get("location") ?? "",
    price: form.get("price") ?? "",
    imagePath: form.get("imagePath") ?? "",
    registration: form.get("registration") === "on",
    capacity: form.get("capacity") ?? "",
    deadlineDate: form.get("deadlineDate") ?? "",
    intent: form.get("intent") ?? "publish",
  });
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const supabase = await createSessionClient();
  const existing = v.id
    ? (await supabase.from("events").select("slug, status, image_path").eq("id", v.id).maybeSingle()).data
    : null;
  if (v.id && !existing) return { ok: false, message: "Cet événement n'existe plus." };

  // « Aperçu » ne publie pas : un événement déjà publié reste publié, un nouveau reste en brouillon.
  const status = v.intent === "publish" ? "published" : v.intent === "draft" ? "draft" : (existing?.status ?? "draft");

  const row = {
    category: v.category,
    title: v.title,
    summary: v.summary || null,
    description: cleanHtml(v.description),
    starts_at: parisToISO(v.date, v.startTime),
    ends_at: v.endTime ? parisToISO(v.date, v.endTime) : null,
    location: v.location || null,
    price_text: v.price || null,
    image_path: v.imagePath || null,
    registration_enabled: v.registration,
    capacity: v.registration && v.capacity ? Number(v.capacity) : null,
    registration_deadline: v.registration && v.deadlineDate ? parisToISO(v.deadlineDate, "23:59") : null,
    status,
  } as const;

  let id = v.id;
  let slug = existing?.slug;
  if (id) {
    const { error } = await supabase.from("events").update(row).eq("id", id);
    if (error) return logError(error);
  } else {
    slug = `${slugify(v.title)}-${v.date}`;
    const taken = await supabase.from("events").select("id").eq("slug", slug).maybeSingle();
    if (taken.data) slug = `${slug}-${shortId()}`;
    const { data, error } = await supabase.from("events").insert({ ...row, slug }).select("id").single();
    if (error) return logError(error);
    id = data.id;
  }

  // Photo remplacée : l'ancienne est retirée du stockage.
  if (existing?.image_path && existing.image_path !== row.image_path) {
    await supabase.storage.from("media").remove([existing.image_path]);
  }

  refreshSite("events", `event:${slug}`, `seats:${id}`);

  if (v.intent === "preview") redirect(`/apercu/evenements/${id}`);
  const category = v.category === "cteen" ? "&categorie=cteen" : "";
  redirect(`/admin/evenements?message=${status === "published" ? "publie" : "brouillon"}${category}`);
}

export async function duplicateEvent(form: FormData) {
  await requireMember();
  const id = String(form.get("id"));
  const supabase = await createSessionClient();
  const { data: e } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!e) redirect("/admin/evenements?message=introuvable");

  const { data, error } = await supabase
    .from("events")
    .insert({
      category: e.category,
      title: `${e.title} (copie)`,
      summary: e.summary,
      description: e.description,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      location: e.location,
      price_text: e.price_text,
      // La photo n'est pas copiée : un même fichier ne doit pas être partagé entre deux événements.
      image_path: null,
      registration_enabled: e.registration_enabled,
      capacity: e.capacity,
      status: "draft",
      slug: `${e.slug}-copie-${shortId()}`,
    })
    .select("id")
    .single();
  if (error) {
    console.error("Duplication impossible :", error);
    redirect("/admin/evenements");
  }
  redirect(`/admin/evenements/${data.id}?message=duplique`);
}

export async function trashEvent(form: FormData) {
  await requireMember();
  const id = String(form.get("id"));
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select("slug, category")
    .maybeSingle();
  refreshSite("events", data && `event:${data.slug}`);
  redirect(`/admin/evenements?message=corbeille${data?.category === "cteen" ? "&categorie=cteen" : ""}`);
}

function logError(error: unknown): ActionState {
  console.error("Enregistrement de l'événement impossible :", error);
  return TECH_ERROR;
}
