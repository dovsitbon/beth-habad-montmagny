import { cacheLife, cacheTag } from "next/cache";
import { siteConfig } from "@/config/site.config";
import { getScheduleWeeks } from "@/lib/data/content";
import { getSettings } from "@/lib/data/settings";
import { addDays, todayISO } from "@/lib/format";
import {
  buildOccasions,
  formatHeure,
  formatIsoHeure,
  type HebcalItem,
  type Occasion,
  type WeekAdjustments,
} from "@/lib/horaires/calcul";
import type { SiteSettings } from "@/lib/data/settings";

/**
 * Calendrier juif du Beth Habad.
 *  - Hebcal (https://www.hebcal.com/home/developer-apis) fournit les noms : parachiot, fêtes,
 *    jours de Yom tov, heures de jeûne. Réponse brute conservée 12 h.
 *  - Les heures de Chabbat et des fêtes (allumage, offices, Fin) sont calculées sur place
 *    (src/lib/horaires), au format du rabbin, avec les ajustements de la semaine faits dans l'admin.
 */

type HebcalParams = { latitude: number; longitude: number; candleMinutes: number };

export type HolidayDay = {
  date: string;
  names: { title: string; hebrew?: string; kind: "yomtov" | "major" | "minor" | "fast" | "roshchodesh" }[];
  /** « avant 18h28 » / « après 20h58 » */
  allumage: string | null;
  /** « 19h33 » */
  fin: string | null;
  fastStart: string | null;
  fastEnd: string | null;
};

export type HebcalCalendar = {
  today: string;
  /** Le Chabbat de la semaine (ou la fête qui l'englobe), jusqu'à sa Fin. */
  current: Occasion | null;
  /** La prochaine fête dans les 60 jours, si ce n'est pas déjà `current`. */
  nextHoliday: Occasion | null;
  /** Les occasions pas encore terminées, dans l'ordre (la première peut être `current`). */
  occasions: Occasion[];
  holidays: HolidayDay[];
};

/** Nettoie les titres Hebcal (« H̲anoukah » → « Hanoukah ») pour la liste des fêtes. */
function cleanTitle(title: string): string {
  return title
    .replace(/̲/g, "")
    .replace(/^Parachah /, "")
    // Typographie française : espace avant les deux-points, « 1 Bougie » → « 1 bougie »
    .replace(/\s?:\s/, " : ")
    .replace(/(\d+) Bougies?/, (m) => m.toLowerCase());
}

async function fetchHebcal(start: string, end: string, p: HebcalParams): Promise<HebcalItem[]> {
  "use cache";
  cacheTag("hebcal");
  cacheLife("hebcal");

  const params = new URLSearchParams({
    v: "1",
    cfg: "json",
    maj: "on",
    min: "on",
    nx: "on",
    mf: "on",
    ss: "on",
    // Les bougies ne servent plus à l'affichage, mais l'option active les heures de jeûne.
    c: "on",
    s: "on",
    geo: "pos",
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    tzid: siteConfig.timeZone,
    b: String(p.candleMinutes),
    M: "on",
    lg: "fr",
    start,
    end,
  });

  const res = await fetch(`https://www.hebcal.com/hebcal?${params}`, {
    headers: { "User-Agent": `${siteConfig.slug}-beth-habad-site` },
  });
  if (!res.ok) throw new Error(`Hebcal a répondu ${res.status}`);
  const json = (await res.json()) as { items?: HebcalItem[] };
  return json.items ?? [];
}

/** Occasions (Chabbatot et fêtes) d'une période, ajustements de la semaine compris. */
export function occasionsFrom(
  items: HebcalItem[],
  settings: SiteSettings,
  weeks: WeekAdjustments[],
  from: string,
  to: string,
): Occasion[] {
  return buildOccasions({
    items,
    rules: settings.schedule,
    weeks,
    place: settings.geo,
    timeZone: siteConfig.timeZone,
    from,
    to,
  });
}

/** Réponse brute d'Hebcal de la veille à dans un an (pour l'admin et le calendrier). */
export async function getHebcalItems(settings: SiteSettings): Promise<HebcalItem[] | null> {
  const today = todayISO();
  try {
    return await fetchHebcal(addDays(today, -8), addDays(today, 370), {
      latitude: settings.geo.latitude,
      longitude: settings.geo.longitude,
      candleMinutes: settings.candleMinutes,
    });
  } catch (err) {
    console.error("Hebcal injoignable :", err);
    return null;
  }
}

/**
 * Calendrier à partir d'aujourd'hui : Chabbat de la semaine, prochaine fête, occasions à venir,
 * fêtes des 12 prochains mois. Renvoie null si Hebcal est injoignable (la page affiche un message).
 */
export async function getCalendar(): Promise<HebcalCalendar | null> {
  "use cache";
  cacheTag("hebcal");
  cacheLife("hours");

  const [settings, weeks] = await Promise.all([getSettings(), getScheduleWeeks()]);
  const items = await getHebcalItems(settings);
  if (!items) return null;

  const today = todayISO();
  const now = Date.now();
  const occasions = occasionsFrom(items, settings, weeks, addDays(today, -7), addDays(today, 365)).filter(
    (o) => o.end > now,
  );
  const current = occasions.find((o) => o.days.some((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 6)) ?? null;
  const nextHoliday =
    occasions.find((o) => o.kind === "fete" && o.key !== current?.key && o.start < now + 60 * 86400000) ?? null;

  // Heures affichées dans la liste des fêtes : celles des occasions (lignes visibles).
  const lines = new Map(
    occasions.flatMap((o) => o.sections.flatMap((s) => s.lines.filter((l) => !l.hidden).map((l) => [l.id, l] as const))),
  );
  const timeOf = (id: string) => {
    const l = lines.get(id);
    return l?.minutes != null ? `${l.prefix ? `${l.prefix} ` : ""}${formatHeure(l.minutes)}` : null;
  };

  // Regroupement par jour
  const byDay = new Map<string, HebcalItem[]>();
  for (const item of items) {
    const d = item.date.slice(0, 10);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(item);
  }

  const holidays: HolidayDay[] = [];
  for (const [date, dayItems] of [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (date < today) continue;
    const names: HolidayDay["names"] = [];
    for (const i of dayItems) {
      if (i.category === "roshchodesh") {
        names.push({ title: cleanTitle(i.title), hebrew: i.hebrew, kind: "roshchodesh" });
      } else if (i.category === "holiday" && i.subcat !== "shabbat" && !/LaBehemot/i.test(i.title)) {
        const kind = i.yomtov ? "yomtov" : i.subcat === "fast" ? "fast" : i.subcat === "major" ? "major" : "minor";
        names.push({ title: cleanTitle(i.title), hebrew: i.hebrew, kind });
      }
    }
    if (names.length === 0) continue;

    const fast = (pattern: RegExp) => {
      const item = dayItems.find((i) => i.category === "zmanim" && i.subcat === "fast" && pattern.test(i.title));
      return item ? formatIsoHeure(item.date, siteConfig.timeZone) : null;
    };
    holidays.push({
      date,
      names,
      allumage: timeOf(`${date}:allumage`),
      fin: timeOf(`${date}:fin`),
      fastStart: fast(/Début/),
      fastEnd: fast(/Fin/),
    });
  }

  return { today, current, nextHoliday, occasions, holidays };
}
