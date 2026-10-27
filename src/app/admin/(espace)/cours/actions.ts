"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { refreshSite } from "@/lib/admin/revalidate";
import { type ActionState, cleanHtml, invalid, TECH_ERROR, timeField } from "@/lib/admin/helpers";

const optionalTime = z.string().refine((v) => v === "" || timeField.test(v), "Heure invalide.");

const schema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(2, "Indiquez un titre.").max(200),
    audience: z.enum(["tous", "hommes", "femmes", "enfants", "jeunes"]),
    dayOfWeek: z.string().refine((v) => v === "" || /^[0-6]$/.test(v)),
    startTime: optionalTime,
    endTime: optionalTime,
    scheduleText: z.string().trim().max(200),
    speaker: z.string().trim().max(200),
    location: z.string().trim().max(200),
    description: z.string(),
    sortOrder: z.coerce.number().int().min(0).max(999),
    intent: z.enum(["publish", "draft"]),
  })
  .refine((v) => v.dayOfWeek !== "" || v.scheduleText !== "", {
    message: "Choisissez un jour, ou décrivez la fréquence (ex. : « Un jeudi sur deux »).",
    path: ["dayOfWeek"],
  })
  .refine((v) => !v.endTime || !v.startTime || v.endTime > v.startTime, {
    message: "L'heure de fin doit être après l'heure de début.",
    path: ["endTime"],
  });

export async function saveCourse(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireMember();
  const parsed = schema.safeParse({
    id: form.get("id") || undefined,
    title: form.get("title"),
    audience: form.get("audience"),
    dayOfWeek: form.get("dayOfWeek") ?? "",
    startTime: form.get("startTime") ?? "",
    endTime: form.get("endTime") ?? "",
    scheduleText: form.get("scheduleText") ?? "",
    speaker: form.get("speaker") ?? "",
    location: form.get("location") ?? "",
    description: form.get("description") ?? "",
    sortOrder: form.get("sortOrder") || 0,
    intent: form.get("intent") ?? "publish",
  });
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const row = {
    title: v.title,
    audience: v.audience,
    day_of_week: v.dayOfWeek === "" ? null : Number(v.dayOfWeek),
    start_time: v.startTime || null,
    end_time: v.endTime || null,
    schedule_text: v.scheduleText || null,
    speaker: v.speaker || null,
    location: v.location || null,
    description: cleanHtml(v.description),
    sort_order: v.sortOrder,
    status: v.intent === "publish" ? ("published" as const) : ("draft" as const),
  };

  const supabase = await createSessionClient();
  const { error } = v.id
    ? await supabase.from("courses").update(row).eq("id", v.id)
    : await supabase.from("courses").insert(row);
  if (error) {
    console.error("Enregistrement du cours impossible :", error);
    return TECH_ERROR;
  }
  refreshSite("courses");
  redirect(`/admin/cours?message=${row.status === "published" ? "publie" : "brouillon"}`);
}

export async function duplicateCourse(form: FormData) {
  await requireMember();
  const supabase = await createSessionClient();
  const { data: c } = await supabase.from("courses").select("*").eq("id", String(form.get("id"))).maybeSingle();
  if (!c) redirect("/admin/cours?message=introuvable");
  const { data } = await supabase
    .from("courses")
    .insert({
      title: `${c.title} (copie)`,
      audience: c.audience,
      day_of_week: c.day_of_week,
      start_time: c.start_time,
      end_time: c.end_time,
      schedule_text: c.schedule_text,
      speaker: c.speaker,
      location: c.location,
      description: c.description,
      sort_order: c.sort_order,
      status: "draft",
    })
    .select("id")
    .single();
  redirect(data ? `/admin/cours/${data.id}?message=duplique` : "/admin/cours");
}

export async function trashCourse(form: FormData) {
  await requireMember();
  const supabase = await createSessionClient();
  await supabase.from("courses").update({ deleted_at: new Date().toISOString() }).eq("id", String(form.get("id")));
  refreshSite("courses");
  redirect("/admin/cours?message=corbeille");
}
