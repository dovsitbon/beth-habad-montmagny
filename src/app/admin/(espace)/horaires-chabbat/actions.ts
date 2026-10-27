"use server";

import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { refreshSite } from "@/lib/admin/revalidate";
import { type ActionState, invalid, TECH_ERROR, timeField } from "@/lib/admin/helpers";
import { siteId } from "@/lib/supabase/env";

const minutes = (min: number, max: number) =>
  z.coerce
    .number({ message: "Indiquez un nombre de minutes." })
    .int("Nombre entier uniquement.")
    .min(min, `Entre ${min} et ${max} minutes.`)
    .max(max, `Entre ${min} et ${max} minutes.`);
const time = z.string().regex(timeField, "Indiquez l'heure.");

const rulesSchema = z.object({
  candleMinutes: minutes(0, 60),
  havdalah: z.enum(["nuit", "42", "50", "72"]),
  endMargin: minutes(0, 15),
  fridayMinhaOffset: minutes(0, 60),
  fridayMinhaRounding: z.enum(["1", "5", "10", "15"]),
  taniaTime: time,
  chaharitTime: time,
  coursMode: z.enum(["fixe", "avant_fin"]),
  coursTime: time,
  coursBeforeEnd: minutes(5, 240),
  minhaMode: z.enum(["fixe", "avant_fin"]),
  minhaTime: time,
  minhaBeforeEnd: minutes(5, 240),
  arvitAfterEnd: minutes(0, 60),
});

const FIELDS = Object.keys(rulesSchema.shape) as (keyof typeof rulesSchema.shape)[];

/** Règles de calcul des horaires de Chabbat et des fêtes (heures par défaut de chaque semaine). */
export async function saveShabbatRules(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireMember();
  const parsed = rulesSchema.safeParse(Object.fromEntries(FIELDS.map((f) => [f, form.get(f) ?? ""])));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("settings")
    .update({
      candle_minutes: v.candleMinutes,
      havdalah_minutes: v.havdalah === "nuit" ? null : Number(v.havdalah),
      end_margin_minutes: v.endMargin,
      friday_minha_offset: v.fridayMinhaOffset,
      friday_minha_rounding: Number(v.fridayMinhaRounding),
      tania_time: v.taniaTime,
      chaharit_time: v.chaharitTime,
      cours_time: v.coursTime,
      cours_before_end: v.coursMode === "avant_fin" ? v.coursBeforeEnd : null,
      minha_time: v.minhaTime,
      minha_before_end: v.minhaMode === "avant_fin" ? v.minhaBeforeEnd : null,
      arvit_after_end: v.arvitAfterEnd,
    })
    .eq("site_id", siteId());
  if (error) {
    console.error("Enregistrement des règles de calcul impossible :", error);
    return TECH_ERROR;
  }
  // Les horaires sont recalculés immédiatement avec les nouvelles règles.
  refreshSite("settings", "hebcal");
  return { ok: true, message: "C'est enregistré : les horaires du site sont recalculés." };
}
