"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { refreshSite } from "@/lib/admin/revalidate";
import { loadAdminOccasions } from "@/lib/admin/occasions";
import { type ActionState, dateField, TECH_ERROR, timeField } from "@/lib/admin/helpers";
import { hhmmToMinutes, type ExtraLine } from "@/lib/horaires/calcul";

const textSchema = z.object({
  title: z.string().trim().max(80, "80 caractères au maximum."),
  kidouch: z.string().trim().max(400, "400 caractères au maximum."),
  note: z.string().trim().max(600, "600 caractères au maximum."),
  closing: z.string().trim().max(80, "80 caractères au maximum."),
});

const MAX_EXTRA_LINES = 12;

/**
 * Enregistre les ajustements d'une semaine (ou d'une fête).
 * Seuls les écarts avec le calcul sont gardés : une heure laissée telle quelle continue de
 * suivre le calcul (et les règles), une heure changée devient fixe pour cette semaine-là.
 */
export async function saveWeek(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireMember();
  const key = String(form.get("key") ?? "");
  if (!dateField.test(key)) return TECH_ERROR;

  const loaded = await loadAdminOccasions();
  const occasion = loaded?.occasions.find((o) => o.key === key);
  if (!loaded || !occasion) {
    return { ok: false, message: "Ces horaires ne sont plus modifiables (la date est passée). Rechargez la page." };
  }
  const previous = loaded.weeks.find((w) => w.date === key);

  const fieldErrors: Record<string, string> = {};
  const times: Record<string, string> = {};
  const hidden: string[] = [];

  for (const line of occasion.sections.flatMap((s) => s.lines).filter((l) => !l.added)) {
    if (form.get(`shown:${line.id}`) !== "on") hidden.push(line.id);
    const value = String(form.get(`time:${line.id}`) ?? "").trim();
    const displayed = String(form.get(`displayed:${line.id}`) ?? "");
    // Vide : retour au calcul.
    if (value === "") continue;
    if (!timeField.test(value)) {
      fieldErrors[`time:${line.id}`] = "Heure non valide.";
      continue;
    }
    if (value === displayed) {
      // Inchangée : on garde l'ajustement déjà fait, sinon elle continue de suivre le calcul.
      if (previous?.times[line.id]) times[line.id] = previous.times[line.id];
    } else if (line.computed === null || hhmmToMinutes(value) !== line.computed) {
      times[line.id] = value;
    }
  }

  const sectionIds = new Set(occasion.sections.map((s) => s.id));
  const sections = form.getAll("extra_section").map(String);
  const labels = form.getAll("extra_label").map((v) => String(v).trim());
  const extraTimes = form.getAll("extra_time").map((v) => String(v).trim());
  const extra_lines: ExtraLine[] = [];
  labels.forEach((label, i) => {
    if (!label) return;
    if (label.length > 80) fieldErrors[`extra_label:${i}`] = "80 caractères au maximum.";
    if (extraTimes[i] && !timeField.test(extraTimes[i])) fieldErrors[`extra_time:${i}`] = "Heure non valide.";
    extra_lines.push({
      section: sectionIds.has(sections[i]) ? sections[i] : occasion.sections.at(-1)!.id,
      label,
      time: extraTimes[i] || null,
    });
  });
  if (extra_lines.length > MAX_EXTRA_LINES) {
    return { ok: false, message: `${MAX_EXTRA_LINES} lignes ajoutées au maximum.` };
  }

  const texts = textSchema.safeParse({
    title: form.get("title") ?? "",
    kidouch: form.get("kidouch") ?? "",
    note: form.get("note") ?? "",
    closing: form.get("closing") ?? "",
  });
  if (!texts.success) {
    for (const issue of texts.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  }
  if (Object.keys(fieldErrors).length > 0 || !texts.success) {
    return { ok: false, fieldErrors, message: "Merci de corriger les champs indiqués en rouge." };
  }

  const { title, kidouch, note, closing } = texts.data;
  const row = {
    date: key,
    title: title && title !== occasion.computedTitle ? title : null,
    kidouch: kidouch || null,
    note: note || null,
    closing: closing && closing !== occasion.computedClosing ? closing : null,
    times,
    hidden,
    extra_lines,
  };
  const empty =
    !row.title && !row.kidouch && !row.note && !row.closing && !Object.keys(times).length && !hidden.length && !extra_lines.length;

  const supabase = await createSessionClient();
  const { error } = empty
    ? await supabase.from("schedule_weeks").delete().eq("date", key)
    : await supabase.from("schedule_weeks").upsert(row, { onConflict: "date" });
  if (error) {
    console.error("Enregistrement des horaires de la semaine impossible :", error);
    return TECH_ERROR;
  }
  refreshSite("schedule_weeks", "hebcal");
  redirect(`/admin/ce-chabbat?semaine=${key}&message=enregistre`);
}

/** Efface tous les ajustements d'une semaine : retour au calcul automatique. */
export async function resetWeek(form: FormData) {
  await requireMember();
  const key = String(form.get("key") ?? "");
  if (!dateField.test(key)) return;
  const supabase = await createSessionClient();
  await supabase.from("schedule_weeks").delete().eq("date", key);
  refreshSite("schedule_weeks", "hebcal");
  redirect(`/admin/ce-chabbat?semaine=${key}&message=enregistre`);
}
