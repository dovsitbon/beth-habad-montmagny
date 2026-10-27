import "server-only";
import { createSessionClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data/settings";
import { toWeekAdjustments } from "@/lib/data/content";
import { getHebcalItems, occasionsFrom } from "@/lib/hebcal";
import { addDays, todayISO } from "@/lib/format";
import type { Occasion, WeekAdjustments } from "@/lib/horaires/calcul";

/**
 * Occasions (Chabbatot et fêtes) pas encore terminées, pour la page « Ce Chabbat » de l'admin :
 * les ajustements sont relus dans la base à chaque fois (pas de cache), pour voir tout de suite
 * ce qui vient d'être enregistré.
 */
export async function loadAdminOccasions(): Promise<{ occasions: Occasion[]; weeks: WeekAdjustments[] } | null> {
  const settings = await getSettings();
  const items = await getHebcalItems(settings);
  if (!items) return null;

  const today = todayISO();
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("schedule_weeks").select("*").gte("date", addDays(today, -10));
  if (error) console.error("Lecture des horaires de la semaine impossible :", error);
  const weeks = (data ?? []).map(toWeekAdjustments);

  const now = Date.now();
  const occasions = occasionsFrom(items, settings, weeks, addDays(today, -7), addDays(today, 120)).filter((o) => o.end > now);
  return { occasions, weeks };
}
