"use client";

import Link from "next/link";
import { ArrowRightIcon, BellRingingIcon, FlameIcon } from "@phosphor-icons/react";
import { homeOccasionKey } from "@/lib/horaires/calcul";
import { inDelay, todayView, type TodayInput, type TodayView } from "@/lib/horaires/aujourdhui";
import { useNowSnapshot } from "@/components/shabbat/use-now-snapshot";

type Window = { key: string; homeFrom: number; homeUntil: number };

type Props = {
  /** Périodes des prochains Chabbatot et fêtes (veille 8 h → Arvit de la sortie + 30 min). */
  windows: Window[];
  /** Instant du calcul côté serveur : premier affichage identique au HTML reçu. */
  computedAt: number;
  timeZone: string;
  /** Horaires en grand de chaque occasion, rendus par le serveur (clé = veille). */
  occasionBlocks: Record<string, React.ReactNode>;
  today: TodayInput;
  /** « Chabbat Lekh Lekha », « Allumage avant 18h28 », « Fin 19h33 » : le prochain Chabbat (ou fête). */
  nextOccasion: string[] | null;
};

/**
 * Bloc principal de l'accueil, juste sous la bannière (visible sans défiler sur téléphone) :
 *  - du vendredi 8 h à la fin de Chabbat (Arvit + 30 min), et de même pour les fêtes : les horaires en grand ;
 *  - le reste du temps : la carte « Aujourd'hui » (prochain office, aujourd'hui / demain, ligne Chabbat).
 */
export function HomeSchedule({ windows, computedAt, timeZone, occasionBlocks, today, nextOccasion }: Props) {
  const state = useNowSnapshot(
    (now) => {
      const key = homeOccasionKey(windows, now);
      return JSON.stringify(key && occasionBlocks[key] ? { key } : { view: todayView(today, now, timeZone) });
    },
    computedAt,
  );
  const parsed = JSON.parse(state) as { key: string } | { view: TodayView };
  if ("key" in parsed) return <>{occasionBlocks[parsed.key]}</>;
  return <TodayCard view={parsed.view} nextOccasion={nextOccasion} />;
}

function TodayCard({ view, nextOccasion }: { view: TodayView; nextOccasion: string[] | null }) {
  const { next } = view;
  const [title, ...parts] = nextOccasion ?? [];
  return (
    <section aria-labelledby="aujourdhui" className="card overflow-hidden">
      <h2 id="aujourdhui" className="sr-only">
        Aujourd&apos;hui à la synagogue
      </h2>

      {next && (
        <p className="flex items-center gap-3 bg-night px-5 py-3 text-white sm:px-7 sm:py-4">
          <BellRingingIcon aria-hidden weight="fill" className="size-6 shrink-0 text-gold" />
          <span className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 leading-snug">
            <span>
              <span className="block text-xs font-bold tracking-[0.18em] text-gold-soft uppercase">
                {next.day === "today" ? "Prochain office" : "Demain"}
                <span className="sr-only"> : </span>
              </span>
              <strong className="font-serif text-2xl font-black">
                {next.label} à {next.value}
              </strong>
            </span>
            {next.inMinutes !== null && (
              <span className="rounded-full bg-gold px-3 py-1 text-sm font-bold whitespace-nowrap text-night-deep">
                {inDelay(next.inMinutes)}
              </span>
            )}
          </span>
        </p>
      )}

      <div className="grid grid-cols-2 divide-x divide-line">
        <DayColumn label="Aujourd'hui" rows={view.today.rows} highlight />
        <DayColumn label="Demain" rows={view.tomorrow.rows} />
      </div>

      {title && (
        <Link
          href="/horaires"
          className="group flex items-center gap-3 border-t border-line bg-gold-tint px-5 py-3 sm:px-7"
        >
          <FlameIcon aria-hidden weight="duotone" className="size-6 shrink-0 text-gold-ink" />
          <span className="min-w-0 flex-1 leading-snug">
            <strong className="block font-semibold text-night">{title}</strong>
            <span className="text-[0.95rem] text-ink">
              {parts.map((p, i) => (
                <span key={p}>
                  {i > 0 && (
                    <span aria-hidden className="mx-1.5 text-gold-ink">
                      ·
                    </span>
                  )}{" "}
                  <span className="whitespace-nowrap">{p}</span>
                </span>
              ))}
            </span>
          </span>
          <ArrowRightIcon aria-hidden weight="bold" className="size-4 shrink-0 text-night transition-transform group-hover:translate-x-0.5" />
          <span className="sr-only">: tous les horaires de Chabbat et des fêtes</span>
        </Link>
      )}
    </section>
  );
}

function DayColumn({ label, rows, highlight = false }: { label: string; rows: TodayView["today"]["rows"]; highlight?: boolean }) {
  return (
    <div className="px-4 py-3 sm:px-7 sm:py-5">
      <h3 className={`font-sans text-xs font-bold tracking-[0.2em] uppercase ${highlight ? "text-gold-ink" : "text-ink-muted"}`}>
        {label}
      </h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-ink-muted">Pas d&apos;office indiqué.</p>
      ) : (
        <dl className="mt-2">
          {rows.map((r) => (
            <div key={`${r.label}-${r.minutes}`} className="flex items-baseline justify-between gap-2 border-b border-dashed border-line py-1.5 last:border-b-0 sm:py-2">
              <dt className="min-w-0 text-[0.95rem] leading-tight text-ink">{r.label}</dt>
              <dd className="shrink-0 text-right font-serif text-xl leading-none font-black text-night tabular-nums sm:text-2xl">
                {r.value.startsWith("avant ") || r.value.startsWith("après ") ? (
                  <>
                    <span className="block font-sans text-[0.7rem] font-semibold text-ink-muted">{r.value.split(" ")[0]}</span>
                    {r.value.split(" ")[1]}
                  </>
                ) : (
                  r.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
