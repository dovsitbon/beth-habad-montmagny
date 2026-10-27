import { cacheLife, cacheTag } from "next/cache";
import { siteConfig } from "@/config/site.config";
import { getShabbatOverrides, type ShabbatOverride } from "@/lib/data/content";
import { getSettings } from "@/lib/data/settings";
import { addDays, todayISO } from "@/lib/format";

/**
 * Horaires de Chabbat et des fêtes calculés par Hebcal (https://www.hebcal.com/home/developer-apis)
 * pour les coordonnées GPS du Beth Habad, en français, fuseau Europe/Paris.
 *
 * Deux niveaux de cache :
 *  - fetchHebcal : la réponse brute, conservée 12 h (une requête par jour au plus) ;
 *  - getCalendar : la mise en forme « à partir d'aujourd'hui », recalculée toutes les heures.
 * Les corrections manuelles du rabbin (table shabbat_overrides) remplacent les heures calculées.
 */

type HebcalItem = {
  title: string;
  date: string;
  category: string;
  subcat?: string;
  hebrew?: string;
  memo?: string;
  yomtov?: boolean;
};

export type TimeEntry = {
  /** Horodatage ISO (calculé) ou heure « HH:MM » (corrigée à la main). */
  value: string;
  overridden: boolean;
  note?: string | null;
};

export type ShabbatInfo = {
  /** Date du samedi (AAAA-MM-JJ) */
  date: string;
  candleDate: string | null;
  parasha: string | null;
  parashaHebrew: string | null;
  /** Nom d'un Chabbat particulier (Chabbat Chouvah, Chabbat Zakhor…) */
  special: string | null;
  candles: TimeEntry | null;
  havdalah: TimeEntry | null;
};

export type HolidayDay = {
  date: string;
  names: { title: string; hebrew?: string; kind: "yomtov" | "major" | "minor" | "fast" | "roshchodesh" }[];
  candles: TimeEntry | null;
  havdalah: TimeEntry | null;
  fastStart: string | null;
  fastEnd: string | null;
};

export type HebcalCalendar = {
  today: string;
  thisShabbat: ShabbatInfo | null;
  upcomingShabbatot: ShabbatInfo[];
  holidays: HolidayDay[];
};

type HebcalParams = { latitude: number; longitude: number; candleMinutes: number; havdalahMinutes: number | null };

/** Nettoie les titres Hebcal (« H̲anoukah » → « Hanoukah ») et traduit les restes en anglais. */
function cleanTitle(title: string): string {
  return title
    .replace(/̲/g, "")
    .replace(/^Havdalah\b/, "Havdala")
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
    c: "on",
    s: "on",
    geo: "pos",
    latitude: String(p.latitude),
    longitude: String(p.longitude),
    tzid: siteConfig.timeZone,
    b: String(p.candleMinutes),
    lg: "fr",
    start,
    end,
  });
  if (p.havdalahMinutes) params.set("m", String(p.havdalahMinutes));
  else params.set("M", "on");

  const res = await fetch(`https://www.hebcal.com/hebcal?${params}`, {
    headers: { "User-Agent": `${siteConfig.slug}-beth-habad-site` },
  });
  if (!res.ok) throw new Error(`Hebcal a répondu ${res.status}`);
  const json = (await res.json()) as { items?: HebcalItem[] };
  return json.items ?? [];
}

function dayOf(item: HebcalItem) {
  return item.date.slice(0, 10);
}

function applyOverride(
  computed: string | null,
  date: string | null,
  kind: ShabbatOverride["kind"],
  overrides: ShabbatOverride[],
): TimeEntry | null {
  const o = date ? overrides.find((x) => x.date === date && x.kind === kind) : undefined;
  if (o) return { value: o.time, overridden: true, note: o.note };
  return computed ? { value: computed, overridden: false } : null;
}

/**
 * Calendrier à partir d'aujourd'hui : Chabbat de la semaine, Chabbatot suivants, fêtes des 12 prochains mois.
 * Renvoie null si Hebcal est injoignable (la page affiche alors un message).
 */
export async function getCalendar(): Promise<HebcalCalendar | null> {
  "use cache";
  cacheTag("hebcal");
  cacheLife("hours");

  const [settings, overrides] = await Promise.all([getSettings(), getShabbatOverrides()]);
  const today = todayISO();

  let items: HebcalItem[];
  try {
    items = await fetchHebcal(addDays(today, -1), addDays(today, 370), {
      latitude: settings.geo.latitude,
      longitude: settings.geo.longitude,
      candleMinutes: settings.candleMinutes,
      havdalahMinutes: settings.havdalahMinutes,
    });
  } catch (err) {
    console.error("Hebcal injoignable :", err);
    return null;
  }

  // Regroupement par jour
  const byDay = new Map<string, HebcalItem[]>();
  for (const item of items) {
    const d = dayOf(item);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(item);
  }
  const find = (date: string, pred: (i: HebcalItem) => boolean) => (byDay.get(date) ?? []).find(pred);

  // --- Chabbatot (chaque samedi) ---------------------------------------------
  const saturdays = [...byDay.keys()]
    .filter((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 6)
    .sort();

  const shabbatot: ShabbatInfo[] = saturdays.map((sat) => {
    const fri = addDays(sat, -1);
    const parasha = find(sat, (i) => i.category === "parashat");
    const special = find(sat, (i) => i.category === "holiday" && i.subcat === "shabbat");
    const candles = find(fri, (i) => i.category === "candles");
    const havdalah = find(sat, (i) => i.category === "havdalah");
    return {
      date: sat,
      candleDate: candles ? fri : null,
      parasha: parasha ? cleanTitle(parasha.title) : null,
      parashaHebrew: parasha?.hebrew ?? null,
      special: special ? cleanTitle(special.title) : null,
      candles: applyOverride(candles?.date ?? null, candles ? fri : null, "allumage", overrides),
      havdalah: applyOverride(havdalah?.date ?? null, sat, "havdala", overrides),
    };
  });

  // Le Chabbat « de la semaine » : le prochain, jusqu'à la Havdala du samedi.
  const now = Date.now();
  const upcoming = shabbatot.filter((s) => {
    if (s.date > today) return true;
    if (s.date < today) return false;
    const end = s.havdalah && !s.havdalah.overridden ? Date.parse(s.havdalah.value) : NaN;
    return Number.isNaN(end) || end > now;
  });

  // --- Fêtes ------------------------------------------------------------------
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

    const candles = dayItems.find((i) => i.category === "candles");
    const havdalah = dayItems.find((i) => i.category === "havdalah");
    holidays.push({
      date,
      names,
      candles: applyOverride(candles?.date ?? null, candles ? date : null, "allumage", overrides),
      havdalah: applyOverride(havdalah?.date ?? null, havdalah ? date : null, "havdala", overrides),
      fastStart: dayItems.find((i) => i.category === "zmanim" && i.subcat === "fast" && /Début/.test(i.title))?.date ?? null,
      fastEnd: dayItems.find((i) => i.category === "zmanim" && i.subcat === "fast" && /Fin/.test(i.title))?.date ?? null,
    });
  }

  return {
    today,
    thisShabbat: upcoming[0] ?? null,
    upcomingShabbatot: upcoming.slice(1, 9),
    holidays,
  };
}
