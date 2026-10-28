/**
 * Carte « Aujourd'hui » de l'accueil : prochain office, offices d'aujourd'hui et de demain.
 * Module « pur » (testé avec Node : npm run test:horaires).
 *
 *  - Jours ordinaires : les offices de la page Offices (semaine, ou dimanche).
 *  - Veille de Chabbat ou de fête : le Chaharit du matin, puis allumage et office du soir calculés.
 *  - Chabbat et jours de fête : les horaires calculés (Tania, Chaharit, Minha, Fin, Arvit…).
 */
import { formatHeure, hhmmToMinutes, lineValue, type Occasion } from "./calcul.ts";

export type DayRow = {
  label: string;
  /** « 8h15 », « avant 18h28 ». */
  value: string;
  minutes: number;
  /** Un office (Chaharit, Minha, Arvit…), par opposition à l'allumage, la Fin ou un cours. */
  office: boolean;
};

export type TodayInput = {
  offices: { office: "chaharit" | "minha" | "arvit"; day_type: string; time: string | null }[];
  /** Horaires calculés par date (veilles et jours de Chabbat / fête). */
  occasionDays: Record<string, DayRow[]>;
  /** Veilles (vendredis, veilles de fête). */
  eves: string[];
};

export type TodayView = {
  next: { label: string; value: string; day: "today" | "tomorrow"; inMinutes: number | null } | null;
  today: { date: string; rows: DayRow[] };
  tomorrow: { date: string; rows: DayRow[] };
};

const OFFICE_LABEL = { chaharit: "Chaharit", minha: "Minha", arvit: "Arvit" } as const;
const OFFICE_KINDS = new Set(["chaharit", "minha", "minha-arvit", "arvit"]);

/** Date (AAAA-MM-JJ) et minutes depuis minuit dans le fuseau donné. */
export function clockIn(now: number, timeZone: string): { date: string; minutes: number } {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return { date: `${g("year")}-${g("month")}-${g("day")}`, minutes: Number(g("hour")) * 60 + Number(g("minute")) };
}

function nextDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Lignes calculées de chaque date d'une occasion (veille comprise), sans les lignes retirées. */
export function occasionDayRows(occasions: Occasion[]): Pick<TodayInput, "occasionDays" | "eves"> {
  const occasionDays: Record<string, DayRow[]> = {};
  for (const o of occasions) {
    for (const line of o.sections.flatMap((s) => s.lines)) {
      const [date, kind] = line.id.split(":");
      if (line.hidden || line.minutes === null || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      (occasionDays[date] ??= []).push({
        label: line.label.replace(/\s*🕯\s*/u, "").trim(),
        value: lineValue(line),
        minutes: line.minutes,
        office: OFFICE_KINDS.has(kind),
      });
    }
  }
  return { occasionDays, eves: occasions.map((o) => o.key) };
}

function rowsFor(input: TodayInput, date: string): DayRow[] {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const holy = input.occasionDays[date] && !input.eves.includes(date);
  if (holy || weekday === 6) return [...(input.occasionDays[date] ?? [])].sort((a, b) => a.minutes - b.minutes);

  const dayType = weekday === 0 ? "dimanche" : "semaine";
  let base: DayRow[] = input.offices
    .filter((o) => o.day_type === dayType && o.time)
    .map((o) => {
      const minutes = hhmmToMinutes(o.time!);
      return { label: OFFICE_LABEL[o.office], value: formatHeure(minutes), minutes, office: true };
    });
  // Veille : le soir, ce sont l'allumage et l'office calculés qui comptent.
  if (input.eves.includes(date)) base = [...base.filter((r) => r.label === "Chaharit"), ...(input.occasionDays[date] ?? [])];
  return base.sort((a, b) => a.minutes - b.minutes);
}

export function todayView(input: TodayInput, now: number, timeZone: string): TodayView {
  const clock = clockIn(now, timeZone);
  const tomorrowDate = nextDate(clock.date);
  const today = rowsFor(input, clock.date);
  const tomorrow = rowsFor(input, tomorrowDate);

  const upcoming = today.find((r) => r.office && r.minutes > clock.minutes);
  const first = tomorrow.find((r) => r.office);
  const next = upcoming
    ? { label: upcoming.label, value: upcoming.value, day: "today" as const, inMinutes: upcoming.minutes - clock.minutes }
    : first
      ? { label: first.label, value: first.value, day: "tomorrow" as const, inMinutes: null }
      : null;

  return { next, today: { date: clock.date, rows: today }, tomorrow: { date: tomorrowDate, rows: tomorrow } };
}

/** « dans 45 min », « dans 2 h », « dans 2 h 10 ». */
export function inDelay(minutes: number): string {
  if (minutes < 60) return `dans ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `dans ${h} h${m ? ` ${String(m).padStart(2, "0")}` : ""}`;
}
