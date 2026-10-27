import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import Link from "next/link";
import { ArrowRightIcon, InfoIcon } from "@phosphor-icons/react/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { photos } from "@/lib/community-photos";
import { getServiceTimes, type ServiceTime } from "@/lib/data/content";
import { getSettings } from "@/lib/data/settings";
import { ScheduleBlock } from "@/components/shabbat/schedule-block";
import { getCalendar } from "@/lib/hebcal";
import { formatHeure, hhmmToMinutes } from "@/lib/horaires/calcul";

export const metadata: Metadata = {
  alternates: { canonical: "/offices" },
  title: "Horaires des offices",
  description: `Horaires de Chaharit, Minha et Arvit au ${siteConfig.name}, en semaine, le Chabbat et les jours de fête.`,
};

// Le vendredi soir et le Chabbat viennent du calcul de la semaine (bloc « Ce Chabbat »).
const DAYS: { key: ServiceTime["day_type"]; label: string }[] = [
  { key: "semaine", label: "Du lundi au vendredi" },
  { key: "dimanche", label: "Dimanche" },
  { key: "fete", label: "Jours de fête" },
];

const OFFICES: Record<ServiceTime["office"], string> = {
  chaharit: "Chaharit",
  minha: "Minha",
  arvit: "Arvit",
};
const OFFICE_ORDER: ServiceTime["office"][] = ["chaharit", "minha", "arvit"];

export default async function OfficesPage() {
  const [times, settings, calendar] = await Promise.all([getServiceTimes(), getSettings(), getCalendar()]);

  const groups = DAYS.map((day) => ({
    ...day,
    rows: times
      .filter((t) => t.day_type === day.key)
      .sort(
        (a, b) =>
          OFFICE_ORDER.indexOf(a.office) - OFFICE_ORDER.indexOf(b.office) ||
          a.sort_order - b.sort_order ||
          (a.time ?? "").localeCompare(b.time ?? ""),
      ),
  })).filter((g) => g.rows.length > 0);

  return (
    <>
      <PageHeader image={photos.tefillin.src} eyebrow="Synagogue" title="Horaires des offices">
        <p>Chaharit, Minha et Arvit au {settings.shortName}.</p>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {settings.servicesNote && (
          <p className="mb-8 flex gap-3 rounded-xl border border-gold/50 bg-gold-tint p-5 font-semibold text-ink">
            <InfoIcon aria-hidden weight="fill" className="mt-0.5 size-6 shrink-0 text-gold-ink" />
            {settings.servicesNote}
          </p>
        )}

        {calendar?.current && (
          <section aria-labelledby="offices-chabbat" className="mb-8 rounded-xl border border-line bg-surface p-6 sm:p-8">
            <p className="text-sm font-semibold tracking-[0.14em] text-gold-ink uppercase">Vendredi soir et Chabbat</p>
            <h2 id="offices-chabbat" className="mt-2 text-3xl text-night">
              Ce Chabbat
            </h2>
            <div className="mt-5 max-w-xl">
              <ScheduleBlock occasion={calendar.current} />
            </div>
          </section>
        )}

        {groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-ink-muted">
            Les horaires des offices seront bientôt publiés.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <section
                key={group.key}
                aria-labelledby={`jour-${group.key}`}
                className="rounded-xl border border-line bg-surface p-6"
              >
                <h2 id={`jour-${group.key}`} className="text-2xl text-night">
                  {group.label}
                </h2>
                <dl className="mt-4 divide-y divide-line">
                  {group.rows.map((row) => (
                    <div key={row.id} className="flex items-baseline justify-between gap-4 py-3">
                      <dt className="font-semibold">{OFFICES[row.office]}</dt>
                      <dd className="text-right">
                        {row.time && (
                          <time dateTime={row.time.slice(0, 5)} className="block text-xl font-semibold text-night tabular-nums">
                            {formatHeure(hhmmToMinutes(row.time))}
                          </time>
                        )}
                        {row.note && <span className="block text-sm text-ink-muted">{row.note}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}

        <Link
          href="/horaires"
          className="mt-10 inline-flex min-h-11 items-center gap-2 font-semibold text-night underline decoration-gold decoration-2 underline-offset-4"
        >
          Heures d&apos;allumage et de fin de Chabbat et des fêtes
          <ArrowRightIcon aria-hidden weight="bold" className="size-4" />
        </Link>
      </div>
    </>
  );
}
