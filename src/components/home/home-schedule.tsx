"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { formatHeure, hhmmToMinutes, homeOccasionKey } from "@/lib/horaires/calcul";

type Window = { key: string; homeFrom: number; homeUntil: number };
type Office = { id: string; office: "chaharit" | "minha" | "arvit"; day_type: string; time: string | null; note: string | null };

type Props = {
  /** Périodes des prochains Chabbatot et fêtes (veille 0 h → Arvit de la sortie + 30 min). */
  windows: Window[];
  /** Instant du calcul côté serveur : premier affichage identique au HTML reçu. */
  computedAt: number;
  timeZone: string;
  /** Horaires en grand de chaque occasion, rendus par le serveur (clé = veille). */
  occasionBlocks: Record<string, React.ReactNode>;
  offices: Office[];
};

const OFFICE_LABEL = { chaharit: "Chaharit", minha: "Minha", arvit: "Arvit" } as const;
const OFFICE_ORDER = ["chaharit", "minha", "arvit"];

// L'heure est revérifiée toutes les 30 s et au retour sur l'onglet : la bascule
// Chabbat / semaine se fait à l'heure dite, quel que soit l'âge de la page en cache.
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 30000);
  document.addEventListener("visibilitychange", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
    window.removeEventListener("focus", onChange);
  };
}

/** Jour de la semaine à Paris : 0 = dimanche … 6 = samedi. */
function parisWeekday(now: number, timeZone: string): number {
  const day = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(now);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
}

/** « clé d'occasion|jour » : ne change qu'aux moments de bascule, donc peu de rendus. */
function snapshot(windows: Window[], now: number, timeZone: string) {
  return `${homeOccasionKey(windows, now) ?? ""}|${parisWeekday(now, timeZone)}`;
}

/**
 * Bloc principal de l'accueil, juste sous la bannière :
 *  - du vendredi 0 h à la fin de Chabbat (Arvit + 30 min), et de même pour les fêtes : les horaires en grand ;
 *  - le reste de la semaine : « Offices de la semaine », ceux du jour mis en évidence.
 */
export function HomeSchedule({ windows, computedAt, timeZone, occasionBlocks, offices }: Props) {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot(windows, Date.now(), timeZone),
    () => snapshot(windows, computedAt, timeZone),
  );
  const [key, weekday] = state.split("|");
  const block = key ? occasionBlocks[key] : null;
  if (block) return <>{block}</>;
  return <WeekOffices offices={offices} weekday={Number(weekday)} />;
}

function WeekOffices({ offices, weekday }: { offices: Office[]; weekday: number }) {
  // Samedi soir : on met en avant les offices de demain (dimanche).
  const highlighted = weekday === 0 || weekday === 6 ? "dimanche" : "semaine";
  const badge = weekday === 6 ? "Demain" : "Aujourd'hui";
  const groups = [
    { type: "semaine", label: "Du lundi au vendredi" },
    { type: "dimanche", label: "Dimanche" },
  ]
    .map((g) => ({
      ...g,
      rows: offices
        .filter((o) => o.day_type === g.type)
        .sort((a, b) => OFFICE_ORDER.indexOf(a.office) - OFFICE_ORDER.indexOf(b.office) || (a.time ?? "").localeCompare(b.time ?? "")),
    }))
    .filter((g) => g.rows.length > 0)
    .sort((a, b) => Number(b.type === highlighted) - Number(a.type === highlighted));

  return (
    <section aria-labelledby="offices-semaine" className="rounded-2xl border border-line bg-surface p-6 sm:p-10">
      <p className="text-sm font-semibold tracking-[0.14em] text-gold-ink uppercase">Synagogue</p>
      <h2 id="offices-semaine" className="mt-2 text-3xl text-night sm:text-4xl">
        Offices de la semaine
      </h2>

      {groups.length === 0 ? (
        <p className="mt-5 text-ink-muted">Les horaires des offices seront bientôt publiés.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {groups.map((g) => {
            const isToday = g.type === highlighted;
            return (
              <div
                key={g.type}
                className={isToday ? "rounded-xl border-2 border-gold bg-gold-tint p-5 sm:p-6" : "rounded-xl border border-line p-5 sm:p-6"}
              >
                <h3 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl text-night">
                  {g.label}
                  {isToday && (
                    <span className="rounded-full bg-night px-2.5 py-0.5 font-sans text-xs font-semibold tracking-wide text-white uppercase">
                      {badge}
                    </span>
                  )}
                </h3>
                <dl className="mt-3">
                  {g.rows.map((row) => (
                    <div key={row.id} className="flex items-baseline justify-between gap-4 border-b border-line/70 py-2 last:border-b-0">
                      <dt className="text-lg text-ink">
                        {OFFICE_LABEL[row.office]}
                        {row.note && <span className="block text-sm text-ink-muted">{row.note}</span>}
                      </dt>
                      {row.time && (
                        <dd>
                          <time dateTime={row.time.slice(0, 5)} className="text-2xl font-semibold text-night tabular-nums">
                            {formatHeure(hhmmToMinutes(row.time))}
                          </time>
                        </dd>
                      )}
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Link
          href="/offices"
          className="inline-flex min-h-11 items-center gap-2 font-semibold text-night underline decoration-gold decoration-2 underline-offset-4"
        >
          Tous les offices
          <ArrowRightIcon aria-hidden weight="bold" className="size-4" />
        </Link>
        <Link href="/horaires" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-ink-muted underline-offset-4 hover:underline">
          Horaires de Chabbat
          <ArrowRightIcon aria-hidden className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
