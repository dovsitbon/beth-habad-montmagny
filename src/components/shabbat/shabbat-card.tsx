import Link from "next/link";
import { ArrowRightIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import type { ShabbatInfo } from "@/lib/hebcal";
import { formatDayLong, hebrewDate } from "@/lib/format";
import { TimeValue } from "./time-value";

type Props = {
  shabbat: ShabbatInfo | null;
  /** Lien vers la page complète (masqué sur la page des horaires elle-même). */
  showMoreLink?: boolean;
  headingLevel?: "h2" | "h3";
};

/** Encart « Ce Chabbat » : paracha, allumage, Havdala, date hébraïque. */
export function ShabbatCard({ shabbat, showMoreLink = true, headingLevel: Heading = "h2" }: Props) {
  return (
    <section aria-labelledby="ce-chabbat" className="rounded-xl border border-line bg-surface p-6 sm:p-8">
      <p className="text-sm font-semibold tracking-[0.14em] text-gold-ink uppercase">Cette semaine</p>
      <Heading id="ce-chabbat" className="mt-2 text-3xl text-night">
        Ce Chabbat
      </Heading>

      {shabbat ? (
        <>
          <p className="mt-2 text-ink-muted">
            {formatDayLong(shabbat.date)} · <span>{hebrewDate(shabbat.date).fr}</span>
          </p>
          {(shabbat.parasha || shabbat.special) && (
            <p className="mt-5 font-serif text-2xl text-night">
              {shabbat.parasha && <>Paracha {shabbat.parasha}</>}
              {shabbat.parashaHebrew && (
                <span lang="he" dir="rtl" className="ml-3 text-xl text-ink-muted">
                  {shabbat.parashaHebrew}
                </span>
              )}
              {shabbat.special && <span className="mt-1 block text-base font-sans text-gold-ink">{shabbat.special}</span>}
            </p>
          )}
          <dl className="mt-5 divide-y divide-line">
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-ink-muted">
                Allumage des bougies
                {shabbat.candleDate && <span className="block text-sm">{formatDayLong(shabbat.candleDate)}</span>}
              </dt>
              <dd className="text-2xl font-semibold text-night">
                <TimeValue entry={shabbat.candles} />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-ink-muted">
                Havdala
                <span className="block text-sm">{formatDayLong(shabbat.date)}</span>
              </dt>
              <dd className="text-2xl font-semibold text-night">
                <TimeValue entry={shabbat.havdalah} />
              </dd>
            </div>
          </dl>
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
