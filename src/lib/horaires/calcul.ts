/**
 * Horaires de Chabbat et des fêtes au format du rabbin (le message WhatsApp qu'il envoyait
 * chaque semaine) : calcul des heures, application des ajustements de la semaine, texte final.
 *
 * Module « pur » (aucun import Next.js ni alias « @/ ») : il est testé directement avec Node
 * (npm run test:horaires).
 *
 * Une « occasion » = la veille + les jours saints qui se suivent : un Chabbat (vendredi soir →
 * samedi soir), une fête (« Roch Hachana » : veille + 2 jours), ou une fête qui touche un Chabbat.
 */
import { closingFor, feteFr, parashaFr } from "./noms.ts";
import { candleLighting, endOfDay, type Place } from "./zmanim.ts";

export type HebcalItem = {
  title: string;
  date: string;
  category: string;
  subcat?: string;
  hebrew?: string;
  yomtov?: boolean;
};

/** Règles de calcul (table settings), modifiables dans l'admin. Heures au format « HH:MM ». */
export type ScheduleRules = {
  candleMinutes: number;
  /** null = Fin à la tombée de la nuit (8,5°) ; sinon N minutes après le coucher du soleil. */
  havdalahMinutes: number | null;
  /** Minutes ajoutées à la Fin (déjà arrondie à la minute supérieure). */
  endMarginMinutes: number;
  fridayMinhaOffset: number;
  fridayMinhaRounding: number;
  taniaTime: string;
  chaharitTime: string;
  coursTime: string;
  /** null = heure fixe ; sinon N minutes avant la Fin. */
  coursBeforeEnd: number | null;
  minhaTime: string;
  minhaBeforeEnd: number | null;
  arvitAfterEnd: number;
};

/** Ajustements d'une semaine (table schedule_weeks), faits depuis la page « Ce Chabbat ». */
export type WeekAdjustments = {
  date: string;
  title: string | null;
  kidouch: string | null;
  note: string | null;
  closing: string | null;
  /** { "AAAA-MM-JJ:ligne": "HH:MM" } */
  times: Record<string, string>;
  hidden: string[];
  extra_lines: ExtraLine[];
};

export type ExtraLine = { section: string; label: string; time: string | null };

export type LineKind = "allumage" | "minha-arvit" | "tania" | "chaharit" | "cours" | "minha" | "fin" | "arvit";

export type ScheduleLine = {
  /** « 2026-10-23:allumage » ; lignes ajoutées : « ajout:0 ». */
  id: string;
  label: string;
  /** Heure locale en minutes depuis minuit ; null pour une ligne sans heure. */
  minutes: number | null;
  /** Allumage : « avant 18h28 » (veille) ou « après 20h58 » (deuxième soir de fête). */
  prefix: "avant" | "après" | null;
  /** Heure calculée (null pour une ligne ajoutée) : sert à signaler « ajusté » dans l'admin. */
  computed: number | null;
  adjusted: boolean;
  hidden: boolean;
  added: boolean;
  /** Alerte pour l'admin (ex. une Minha placée après la Fin). */
  warning: string | null;
};

export type ScheduleSection = {
  /** « 2026-10-23:soir », « 2026-10-24:matin », « 2026-10-24:apres-midi ». */
  id: string;
  /** Titre dans le message (null : simple ligne vide, comme l'après-midi du Chabbat). */
  heading: string | null;
  /** Titre affiché sur le site. */
  label: string;
  lines: ScheduleLine[];
  /** La ligne Kidouch se place à la fin de cette section. */
  kidouch: boolean;
};

export type Occasion = {
  /** Veille du premier jour (AAAA-MM-JJ) : clé de la table schedule_weeks. */
  key: string;
  kind: "chabbat" | "fete";
  /** Jours saints : le samedi et/ou les jours de fête. */
  days: string[];
  title: string;
  computedTitle: string;
  parasha: string | null;
  parashaHebrew: string | null;
  /** Chabbat particulier (Chabbat Chouva, Zakhor…), affiché sur le site seulement. */
  special: string | null;
  sections: ScheduleSection[];
  kidouch: string | null;
  note: string | null;
  closing: string;
  computedClosing: string;
  /** Allumage de la veille et Fin du dernier jour (ms UTC, ajustements compris). */
  start: number;
  end: number;
  /**
   * Période où l'accueil affiche ces horaires en grand (ms UTC) : de la veille à 0 h
   * jusqu'à l'Arvit de la sortie (Chabbat ou fête) + 30 min.
   */
  homeFrom: number;
  homeUntil: number;
};

/** Minutes après l'Arvit de la sortie pendant lesquelles l'accueil garde les horaires de Chabbat. */
export const HOME_MINUTES_AFTER_ARVIT = 30;

// ---------------------------------------------------------------------------
// Dates et heures locales
// ---------------------------------------------------------------------------

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const weekday = (isoDate: string) => new Date(`${isoDate}T12:00:00Z`).getUTCDay();
export const isSaturday = (isoDate: string) => weekday(isoDate) === 6;

/** « 08:30 » ou « 08:30:00 » → 510 */
export function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

/** 510 → « 08:30 » (champs <input type="time">). */
export function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  return `${String(h).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Heure à la manière du rabbin : 1108 → « 18h28 », 1020 → « 17h », 510 → « 8h30 ». */
export function formatHeure(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** « 2026-10-23 » → « Vendredi 23/10/26 » */
export function dateCourte(isoDate: string): string {
  const day = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "long" }).format(
    new Date(`${isoDate}T12:00:00Z`),
  );
  const [y, m, d] = isoDate.split("-");
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${d}/${m}/${y.slice(2)}`;
}

/** Heure d'un horodatage ISO à la manière du rabbin (« 18h28 »), dans le fuseau donné. */
export function formatIsoHeure(iso: string, timeZone: string): string {
  return formatHeure(localMinutes(Date.parse(iso), timeZone));
}

/** Heure locale (minutes depuis minuit) d'un instant, dans le fuseau donné. */
function localMinutes(ms: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ms);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return get("hour") * 60 + get("minute");
}

/** Instant (ms UTC) d'une heure locale à une date donnée. */
function localToMs(isoDate: string, minutes: number, timeZone: string): number {
  const naive = Date.parse(`${isoDate}T00:00:00Z`) + minutes * 60000;
  // Décalage du fuseau à cet instant (deux passes pour les changements d'heure).
  const offset = (ms: number) =>
    ((localMinutes(ms, timeZone) - Math.floor((ms % 86400000) / 60000) + 720 + 2880) % 1440) - 720;
  let utc = naive - offset(naive) * 60000;
  utc = naive - offset(utc) * 60000;
  return utc;
}

const ceilTo = (minutes: number, step: number) => Math.ceil(minutes / step) * step;
const floorTo = (minutes: number, step: number) => Math.floor(minutes / step) * step;

// ---------------------------------------------------------------------------
// Construction des occasions
// ---------------------------------------------------------------------------

export type BuildInput = {
  /** Réponse brute d'Hebcal (parachiot, fêtes, Yom tov). */
  items: HebcalItem[];
  rules: ScheduleRules;
  weeks: WeekAdjustments[];
  place: Place;
  timeZone: string;
  /** Période couverte (AAAA-MM-JJ) : les occasions dont la veille tombe dedans. */
  from: string;
  to: string;
};

/** Toutes les occasions (Chabbatot et fêtes) de la période, dans l'ordre. */
export function buildOccasions(input: BuildInput): Occasion[] {
  const { items, from, to } = input;
  const yomtov = new Set(items.filter((i) => i.yomtov).map((i) => i.date.slice(0, 10)));
  const holy = (d: string) => isSaturday(d) || yomtov.has(d);

  // Suites de jours saints consécutifs.
  const runs: string[][] = [];
  for (let d = addDays(from, 1); d <= addDays(to, 1); d = addDays(d, 1)) {
    if (!holy(d)) continue;
    const last = runs.at(-1);
    if (last && last.at(-1) === addDays(d, -1)) last.push(d);
    else runs.push([d]);
  }
  return runs.map((days) => buildOccasion(days, yomtov, input));
}

function buildOccasion(days: string[], yomtov: Set<string>, input: BuildInput): Occasion {
  const { items, rules, place, timeZone } = input;
  const eve = addDays(days[0], -1);
  const week = input.weeks.find((w) => w.date === eve);
  const isFete = days.some((d) => yomtov.has(d));
  const itemsOf = (d: string) => items.filter((i) => i.date.slice(0, 10) === d);

  // Noms : parachah du samedi, fêtes des jours de Yom tov.
  const saturday = days.find(isSaturday) ?? null;
  const parashaItem = saturday ? itemsOf(saturday).find((i) => i.category === "parashat") : undefined;
  const specialItem = saturday ? itemsOf(saturday).find((i) => i.category === "holiday" && i.subcat === "shabbat") : undefined;
  const parasha = parashaItem ? (parashaFr(parashaItem.hebrew) ?? parashaItem.title.replace(/^Parachah /, "").replace(/̲/g, "")) : null;
  const special = specialItem ? specialItem.title.replace(/̲/g, "") : null;
  const fetes = [
    ...new Set(
      days.flatMap((d) => itemsOf(d).filter((i) => i.yomtov && i.category === "holiday").map((i) => feteFr(i.title))),
    ),
  ];

  let computedTitle: string;
  if (isFete) {
    computedTitle = `Horaires ${fetes.join(" et ")}`;
  } else {
    const holidayOfDay = saturday
      ? itemsOf(saturday).find((i) => i.category === "holiday" && i.subcat !== "shabbat")
      : undefined;
    const name = parasha ?? special ?? (holidayOfDay ? feteFr(holidayOfDay.title) : null);
    computedTitle = name ? `Horaires Chabbat ${name}` : "Horaires Chabbat";
  }
  const computedClosing = closingFor(fetes, saturday !== null);

  // --- Lignes --------------------------------------------------------------------
  const times = week?.times ?? {};
  const hidden = new Set(week?.hidden ?? []);
  const line = (date: string, kind: LineKind, label: string, computed: number, prefix: ScheduleLine["prefix"] = null): ScheduleLine => {
    const id = `${date}:${kind}`;
    const override = times[id];
    const minutes = override ? hhmmToMinutes(override) : computed;
    return { id, label, minutes, prefix, computed, adjusted: minutes !== computed, hidden: hidden.has(id), added: false, warning: null };
  };
  const toLocal = (ms: number) => localMinutes(ms, timeZone);
  const endOf = (d: string) => toLocal(endOfDay(d, place, rules.havdalahMinutes)) + rules.endMarginMinutes;
  const beforeEnd = (fixed: string, before: number | null, fin: number) =>
    before === null ? hhmmToMinutes(fixed) : floorTo(fin - before, 5);

  const sections: ScheduleSection[] = [];

  // Veille : allumage et premier office.
  const allumage = line(eve, "allumage", "Allumage 🕯", toLocal(candleLighting(eve, place, rules.candleMinutes)), "avant");
  const minhaArvit = line(
    eve,
    "minha-arvit",
    fetes.includes("Kippour") ? "Kol Nidré" : "Minha suivi d'Arvit",
    ceilTo((allumage.minutes ?? 0) + rules.fridayMinhaOffset, rules.fridayMinhaRounding),
  );
  sections.push({ id: `${eve}:soir`, heading: dateCourte(eve), label: dateCourte(eve), lines: [allumage, minhaArvit], kidouch: false });

  let finLine: ScheduleLine | null = null;
  for (const [index, day] of days.entries()) {
    const last = index === days.length - 1;
    const sat = isSaturday(day);

    const morning: ScheduleLine[] = [];
    if (sat) morning.push(line(day, "tania", "Tania", hhmmToMinutes(rules.taniaTime)));
    morning.push(line(day, "chaharit", "Chaharit", hhmmToMinutes(rules.chaharitTime)));
    sections.push({
      id: `${day}:matin`,
      heading: isFete ? dateCourte(day) : "Chabbat matin",
      label: isFete ? dateCourte(day) : "Chabbat matin",
      lines: morning,
      kidouch: index === 0,
    });

    // Fin du jour : « Fin » le dernier jour, « Allumage après … » les soirs de fête intermédiaires.
    const nightfall = last
      ? line(day, "fin", "Fin", endOf(day))
      : line(day, "allumage", "Allumage 🕯", endOf(day), "après");
    const night = nightfall.minutes ?? endOf(day);
    if (last) finLine = nightfall;

    const afternoon: ScheduleLine[] = [];
    if (!isFete) afternoon.push(line(day, "cours", "Cours", beforeEnd(rules.coursTime, rules.coursBeforeEnd, night)));
    afternoon.push(line(day, "minha", "Minha", beforeEnd(rules.minhaTime, rules.minhaBeforeEnd, night)));
    afternoon.push(nightfall);
    afternoon.push(line(day, "arvit", "Arvit", night + rules.arvitAfterEnd));
    for (const l of afternoon) {
      if ((l.id.endsWith(":cours") || l.id.endsWith(":minha")) && l.minutes !== null && l.minutes >= night) {
        l.warning = last ? "après la Fin" : "après la tombée de la nuit";
      }
    }
    sections.push({
      id: `${day}:apres-midi`,
      heading: null,
      label: isFete ? "Après-midi" : "Chabbat après-midi",
      lines: afternoon,
      kidouch: false,
    });
  }

  // Lignes ajoutées par le rabbin.
  (week?.extra_lines ?? []).forEach((extra, i) => {
    const section = sections.find((s) => s.id === extra.section) ?? sections.at(-1)!;
    const minutes = extra.time ? hhmmToMinutes(extra.time) : null;
    section.lines.push({
      id: `ajout:${i}`,
      label: extra.label,
      minutes,
      prefix: null,
      computed: null,
      adjusted: false,
      hidden: false,
      added: true,
      warning: null,
    });
  });

  // Ordre chronologique dans chaque section (les lignes sans heure à la fin).
  for (const s of sections) {
    s.lines = s.lines
      .map((l, i) => ({ l, i }))
      .sort((a, b) => (a.l.minutes ?? 1e9) - (b.l.minutes ?? 1e9) || a.i - b.i)
      .map(({ l }) => l);
  }

  const lastDay = days.at(-1)!;
  const finalArvit = sections.flatMap((s) => s.lines).find((l) => l.id === `${lastDay}:arvit`);
  const arvitMinutes = finalArvit?.minutes ?? (finLine?.minutes ?? endOf(lastDay)) + rules.arvitAfterEnd;
  return {
    key: eve,
    kind: isFete ? "fete" : "chabbat",
    days,
    title: week?.title?.trim() || computedTitle,
    computedTitle,
    parasha,
    parashaHebrew: parashaItem?.hebrew?.replace(/^פרשת\s+/, "") ?? null,
    special,
    sections,
    kidouch: week?.kidouch?.trim() || null,
    note: week?.note?.trim() || null,
    closing: week?.closing?.trim() || computedClosing,
    computedClosing,
    start: localToMs(eve, allumage.minutes ?? 0, timeZone),
    end: localToMs(lastDay, finLine?.minutes ?? endOf(lastDay), timeZone),
    homeFrom: localToMs(eve, 0, timeZone),
    homeUntil: localToMs(lastDay, arvitMinutes + HOME_MINUTES_AFTER_ARVIT, timeZone),
  };
}

/**
 * Ce que l'accueil affiche à l'instant `now` : la clé de l'occasion (Chabbat ou fête) dont
 * c'est la période, ou null pour « Offices de la semaine ».
 */
export function homeOccasionKey(windows: { key: string; homeFrom: number; homeUntil: number }[], now: number): string | null {
  return windows.find((w) => now >= w.homeFrom && now < w.homeUntil)?.key ?? null;
}

// ---------------------------------------------------------------------------
// Affichage
// ---------------------------------------------------------------------------

/** Lignes visibles d'une section (sans les lignes retirées). */
export function visibleLines(section: ScheduleSection): ScheduleLine[] {
  return section.lines.filter((l) => !l.hidden);
}

/** « Allumage 🕯: avant 18h28 », « Tania: 8h30 », « Cours spécial » (ligne sans heure). */
export function lineText(l: ScheduleLine): string {
  if (l.minutes === null) return l.label;
  return `${l.label}: ${l.prefix ? `${l.prefix} ` : ""}${formatHeure(l.minutes)}`;
}

/** Valeur seule, pour l'affichage en deux colonnes du site : « avant 18h28 ». */
export function lineValue(l: ScheduleLine): string {
  if (l.minutes === null) return "";
  return `${l.prefix ? `${l.prefix} ` : ""}${formatHeure(l.minutes)}`;
}

/**
 * Le message WhatsApp, exactement au format du rabbin :
 * titre en majuscules, blocs séparés par une ligne vide, Kidouch après le Chaharit, formule finale.
 */
export function toWhatsApp(o: Occasion): string {
  const out: string[] = [o.title.toLocaleUpperCase("fr-FR"), ""];
  for (const s of o.sections) {
    const lines = visibleLines(s).map(lineText);
    if (s.kidouch && o.kidouch) lines.push(o.kidouch);
    if (lines.length === 0) continue;
    if (s.heading) out.push(s.heading, "");
    out.push(...lines, "");
  }
  if (o.note) out.push(o.note, "");
  out.push(o.closing);
  return out.join("\n");
}
