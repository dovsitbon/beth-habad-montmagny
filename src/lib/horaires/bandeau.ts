/**
 * Ce qu'affichent, selon l'heure de Paris, le bandeau du haut et le bloc principal de l'accueil.
 * Module « pur » (testé avec Node : npm run test:horaires).
 *
 *  - Du vendredi 8 h (ou de la veille d'une fête à 8 h) jusqu'à l'Arvit de la sortie + 30 min :
 *    les horaires de Chabbat / de la fête ;
 *  - le reste du temps : les offices du jour (le samedi soir : ceux de demain dimanche).
 */
import { formatHeure, hhmmToMinutes, homeOccasionKey, lineValue, type Occasion } from "./calcul.ts";

export type HomeWindow = {
  key: string;
  homeFrom: number;
  homeUntil: number;
  /** Résumé pour le bandeau : « Chabbat Lekh Lekha », « Allumage avant 18h28 », « Chaharit 9h15 », « Fin 19h33 ». */
  summary: string[];
};

export type OfficeRow = { office: "chaharit" | "minha" | "arvit"; day_type: string; time: string | null };

export type Bandeau =
  | { kind: "chabbat"; key: string; parts: string[] }
  | { kind: "offices"; day: "Aujourd'hui" | "Demain"; parts: string[] };

const OFFICE_LABEL = { chaharit: "Chaharit", minha: "Minha", arvit: "Arvit" } as const;
const OFFICE_ORDER = ["chaharit", "minha", "arvit"];

/** Jour de la semaine dans le fuseau donné : 0 = dimanche … 6 = samedi. */
export function weekdayIn(now: number, timeZone: string): number {
  const day = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
}

/** Résumé d'une occasion pour le bandeau (lignes retirées par le rabbin exclues). */
export function occasionSummary(o: Occasion): string[] {
  const lines = o.sections.flatMap((s) => s.lines).filter((l) => !l.hidden);
  const allumage = lines.find((l) => l.id === `${o.key}:allumage`);
  const chaharit = lines.find((l) => l.id.endsWith(":chaharit"));
  const fin = lines.find((l) => l.id === `${o.days.at(-1)}:fin`);
  return [
    o.title.replace(/^Horaires\s+/i, ""),
    ...(allumage ? [`Allumage ${lineValue(allumage)}`] : []),
    ...(chaharit ? [`Chaharit ${lineValue(chaharit)}`] : []),
    ...(fin ? [`Fin ${lineValue(fin)}`] : []),
  ];
}

export function toHomeWindow(o: Occasion): HomeWindow {
  return { key: o.key, homeFrom: o.homeFrom, homeUntil: o.homeUntil, summary: occasionSummary(o) };
}

/** Le contenu du bandeau à l'instant `now` ; null s'il n'y a rien à afficher. */
export function bandeauAt(windows: HomeWindow[], offices: OfficeRow[], now: number, timeZone: string): Bandeau | null {
  const key = homeOccasionKey(windows, now);
  const occasion = key ? windows.find((w) => w.key === key) : undefined;
  if (occasion) return { kind: "chabbat", key: occasion.key, parts: occasion.summary };

  const weekday = weekdayIn(now, timeZone);
  // Samedi soir (après Chabbat) : les offices de demain dimanche.
  const dayType = weekday === 0 || weekday === 6 ? "dimanche" : "semaine";
  const rows = offices
    .filter((o) => o.day_type === dayType && o.time)
    .sort((a, b) => OFFICE_ORDER.indexOf(a.office) - OFFICE_ORDER.indexOf(b.office) || a.time!.localeCompare(b.time!));
  if (rows.length === 0) return null;
  return {
    kind: "offices",
    day: weekday === 6 ? "Demain" : "Aujourd'hui",
    parts: rows.map((r) => `${OFFICE_LABEL[r.office]} ${formatHeure(hhmmToMinutes(r.time!))}`),
  };
}
