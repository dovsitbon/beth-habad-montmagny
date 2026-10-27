"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { refreshSite } from "@/lib/admin/revalidate";
import { type ActionState, dateField, invalid, TECH_ERROR, timeField } from "@/lib/admin/helpers";

const calcSchema = z.object({
  candleMinutes: z.coerce
    .number({ message: "Indiquez un nombre de minutes." })
    .int("Nombre entier uniquement.")
    .min(0, "Entre 0 et 60 minutes.")
    .max(60, "Entre 0 et 60 minutes."),
  havdalah: z.enum(["nuit", "42", "50", "72"]),
});

/** Règles de calcul : minutes avant le coucher du soleil, mode de calcul de la Havdala. */
export async function saveShabbatRules(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireMember();
  const parsed = calcSchema.safeParse({ candleMinutes: form.get("candleMinutes"), havdalah: form.get("havdalah") });
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("settings")
    .update({
      candle_minutes: parsed.data.candleMinutes,
      havdalah_minutes: parsed.data.havdalah === "nuit" ? null : Number(parsed.data.havdalah),
    })
    .eq("id", 1);
  if (error) return TECH_ERROR;
  // Les horaires sont recalculés immédiatement avec les nouvelles règles.
  refreshSite("settings", "hebcal");
  return { ok: true, message: "C'est enregistré : les horaires du site sont recalculés." };
}

const overrideSchema = z.object({
  date: z.string().regex(dateField, "Indiquez la date."),
  kind: z.enum(["allumage", "havdala"]),
  time: z.string().regex(timeField, "Indiquez l'heure."),
  note: z.string().trim().max(160),
});

/** Remplace à la main l'heure calculée pour une date précise. */
export async function saveOverride(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireMember();
  const parsed = overrideSchema.safeParse({
    date: form.get("date"),
    kind: form.get("kind"),
    time: form.get("time"),
    note: form.get("note") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const supabase = await createSessionClient();
  // Une seule correction par date et par type : la nouvelle remplace l'ancienne.
  const { error } = await supabase
    .from("shabbat_overrides")
    .upsert({ date: v.date, kind: v.kind, time: v.time, note: v.note || null }, { onConflict: "date,kind" });
  if (error) {
    console.error("Enregistrement de la correction impossible :", error);
    return TECH_ERROR;
  }
  refreshSite("shabbat_overrides", "hebcal");
  redirect("/admin/horaires-chabbat?message=enregistre");
}

export async function deleteOverride(form: FormData) {
  await requireMember();
  const supabase = await createSessionClient();
  await supabase.from("shabbat_overrides").delete().eq("id", String(form.get("id")));
  refreshSite("shabbat_overrides", "hebcal");
  redirect("/admin/horaires-chabbat?message=supprime");
}
