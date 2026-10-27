"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { refreshSite } from "@/lib/admin/revalidate";
import { type ActionState, invalid, TECH_ERROR, timeField } from "@/lib/admin/helpers";
import { siteId } from "@/lib/supabase/env";

const schema = z
  .object({
    id: z.string().optional(),
    office: z.enum(["chaharit", "minha", "arvit"]),
    dayType: z.enum(["semaine", "dimanche", "fete"]),
    time: z.string().refine((v) => v === "" || timeField.test(v), "Heure invalide."),
    note: z.string().trim().max(160),
    sortOrder: z.coerce.number().int().min(0).max(99),
  })
  .refine((v) => v.time !== "" || v.note !== "", {
    message: "Indiquez une heure, ou une précision (ex. : « 15 min avant l'allumage »).",
    path: ["time"],
  });

export async function saveServiceTime(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireMember();
  const parsed = schema.safeParse({
    id: form.get("id") || undefined,
    office: form.get("office"),
    dayType: form.get("dayType"),
    time: form.get("time") ?? "",
    note: form.get("note") ?? "",
    sortOrder: form.get("sortOrder") || 0,
  });
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const row = { office: v.office, day_type: v.dayType, time: v.time || null, note: v.note || null, sort_order: v.sortOrder };

  const supabase = await createSessionClient();
  const { error } = v.id
    ? await supabase.from("service_times").update(row).eq("id", v.id)
    : await supabase.from("service_times").insert(row);
  if (error) {
    console.error("Enregistrement de l'horaire impossible :", error);
    return TECH_ERROR;
  }
  refreshSite("service_times");
  redirect("/admin/offices?message=enregistre");
}

export async function trashServiceTime(form: FormData) {
  await requireMember();
  const supabase = await createSessionClient();
  await supabase.from("service_times").update({ deleted_at: new Date().toISOString() }).eq("id", String(form.get("id")));
  refreshSite("service_times");
  redirect("/admin/offices?message=corbeille");
}

export async function saveServicesNote(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireMember();
  const note = String(form.get("note") ?? "").trim().slice(0, 200);
  const supabase = await createSessionClient();
  const { error } = await supabase.from("settings").update({ services_note: note || null }).eq("site_id", siteId());
  if (error) return TECH_ERROR;
  refreshSite("settings");
  return { ok: true, message: note ? "La note est affichée sur la page des offices." : "La note a été retirée." };
}
