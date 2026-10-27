import Link from "next/link";
import { ArrowRightIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import type { Occasion } from "@/lib/horaires/calcul";
import { formatDayLong, hebrewDate } from "@/lib/format";
import { ScheduleBlock } from "./schedule-block";

type Props = {
  occasion: Occasion | null;
  /** Lien vers la page complète (masqué sur la page des horaires elle-même). */
  showMoreLink?: boolean;
  headingLevel?: "h2" | "h3";
};

/** Encart « Ce Chabbat » : les horaires de la semaine au format du rabbin. */
export function ShabbatCard({ occasion, showMoreLink = true, headingLevel: Heading = "h2" }: Props) {
  const saturday = occasion?.days.find((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 6) ?? occasion?.days[0];
  return (
    <section aria-labelledby="ce-chabbat" className="rounded-xl border border-line bg-surface p-6 sm:p-8">
      <p className="text-sm font-semibold tracking-[0.14em] text-gold-ink uppercase">Cette semaine</p>
      <Heading id="ce-chabbat" className="mt-2 text-3xl text-night">
        Ce Chabbat
      </Heading>

      {occasion && saturday ? (
        <>
          <p className="mt-2 text-ink-muted first-letter:uppercase">
            {formatDayLong(saturday)} · <span>{hebrewDate(saturday).fr}</span>
          </p>
          <div className="mt-5">
            <ScheduleBlock occasion={occasion} headingLevel={Heading === "h2" ? "h3" : "h4"} />
          </div>
        </>
      ) : (
        <p className="mt-5 flex gap-3 rounded-lg bg-canvas p-4 text-ink-muted">
          <WarningCircleIcon aria-hidden className="mt-0.5 size-5 shrink-0" />
          Les horaires sont momentanément indisponibles. Merci de réessayer un peu plus tard.
        </p>
      )}

      {showMoreLink && (
        <Link
          href="/horaires"
          className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-night underline decoration-gold decoration-2 underline-offset-4"
        >
          Tous les horaires de Chabbat et des fêtes
          <ArrowRightIcon aria-hidden weight="bold" className="size-4" />
        </Link>
      )}
    </section>
  );
}
