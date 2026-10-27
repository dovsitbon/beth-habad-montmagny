import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { ShabbatCard } from "@/components/shabbat/shabbat-card";
import { TimeValue } from "@/components/shabbat/time-value";
import { getCalendar, type HolidayDay } from "@/lib/hebcal";
import { getSettings } from "@/lib/data/settings";
import { formatDayLong, formatDayShort, formatTime, hebrewDate, timeAttr } from "@/lib/format";

export const metadata: Metadata = {
  alternates: { canonical: "/horaires" },
  title: "Horaires de Chabbat et des fêtes",
  description:
    `Heures d'allumage des bougies, de Havdala et des fêtes juives pour ${siteConfig.address.city} (${siteConfig.address.region}), calculées chaque semaine.`,
};

const KIND_LABEL: Record<HolidayDay["names"][number]["kind"], string | null> = {
  yomtov: "Yom tov",
  major: null,
  minor: null,
  fast: "Jeûne",
  roshchodesh: null,
};

/** Regroupe les jours de fête par mois (« novembre 2026 »). */
function groupByMonth(days: HolidayDay[]) {
  const groups = new Map<string, HolidayDay[]>();
  for (const day of days) {
    const label = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", month: "long", year: "numeric" }).format(
      new Date(`${day.date}T12:00:00Z`),
    );
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(day);
  }
  return [...groups.entries()];
}

export default async function HorairesPage() {
  const [calendar, settings] = await Promise.all([getCalendar(), getSettings()]);
  const today = calendar ? hebrewDate(calendar.today) : null;

  return (
    <>
      <PageHeader eyebrow={settings.address.city ?? undefined} title="Horaires de Chabbat et des fêtes">
        {calendar && today && (
          <p>
            Aujourd&apos;hui, {formatDayLong(calendar.today, true)}
            <br />
            <span className="text-gold-soft">{today.fr}</span>
            <span lang="he" dir="rtl" className="ml-3 font-serif text-gold-soft">
              {today.he}
            </span>
          </p>
        )}
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <ShabbatCard shabbat={calendar?.thisShabbat ?? null} showMoreLink={false} />
          </div>

          <section aria-labelledby="prochains-chabbat" className="rounded-xl border border-line bg-surface p-6 sm:p-8 lg:col-span-3">
            <h2 id="prochains-chabbat" className="text-3xl text-night">
              Les Chabbatot suivants
            </h2>
            {calendar && calendar.upcomingShabbatot.length > 0 ? (
              <table className="mt-5 w-full text-left">
                <thead className="text-sm text-ink-muted">
                  <tr className="border-b border-line">
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      Chabbat
                    </th>
                    <th scope="col" className="py-2 px-3 text-right font-semibold">
                      Allumage
                    </th>
                    <th scope="col" className="py-2 pl-3 text-right font-semibold">
                      Havdala
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {calendar.upcomingShabbatot.map((s) => (
                    <tr key={s.date}>
                      <th scope="row" className="py-3 pr-3 align-top font-normal">
                        <span className="block font-semibold text-night">{formatDayShort(s.date)}</span>
                        <span className="text-sm text-ink-muted">{s.parasha ?? s.special}</span>
                      </th>
                      <td className="py-3 px-3 text-right align-top font-semibold">
                        <TimeValue entry={s.candles} />
                      </td>
                      <td className="py-3 pl-3 text-right align-top font-semibold">
                        <TimeValue entry={s.havdalah} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Unavailable />
            )}
          </section>
        </div>

        <section aria-labelledby="fetes">
          <h2 id="fetes" className="text-3xl text-night">
            Fêtes et jours particuliers
          </h2>
          <p className="mt-2 text-ink-muted">Les douze prochains mois.</p>

          {calendar ? (
            <div className="mt-6 space-y-8">
              {groupByMonth(calendar.holidays).map(([month, days]) => (
                <div key={month}>
                  <h3 className="border-b border-line pb-2 text-xl text-gold-ink first-letter:uppercase">{month}</h3>
                  <ul className="divide-y divide-line">
                    {days.map((day) => (
                      <li key={day.date} className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr_auto] sm:gap-6">
                        <p className="font-semibold text-night first-letter:uppercase">{formatDayLong(day.date)}</p>
                        <div>
                          {day.names.map((n) => (
                            <p key={n.title} className={n.kind === "yomtov" ? "font-semibold" : undefined}>
                              {n.title}
                              {KIND_LABEL[n.kind] && (
                                <span className="ml-2 rounded-full bg-gold-tint px-2 py-0.5 text-xs font-semibold tracking-wide text-gold-ink uppercase">
                                  {KIND_LABEL[n.kind]}
                                </span>
                              )}
                            </p>
                          ))}
                        </div>
                        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm sm:justify-end sm:text-right">
                          {day.candles && <TimeItem label="Allumage">{<TimeValue entry={day.candles} />}</TimeItem>}
                          {day.havdalah && <TimeItem label="Havdala">{<TimeValue entry={day.havdalah} />}</TimeItem>}
                          {day.fastStart && <TimeItem label="Début du jeûne">{<IsoTime iso={day.fastStart} />}</TimeItem>}
                          {day.fastEnd && <TimeItem label="Fin du jeûne">{<IsoTime iso={day.fastEnd} />}</TimeItem>}
                        </dl>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <Unavailable />
          )}
        </section>

        <aside className="rounded-xl bg-night-tint p-6 text-ink-muted">
          <p>
            Horaires calculés pour {settings.address.city} : allumage des bougies{" "}
            <strong className="text-ink">{settings.candleMinutes} minutes avant le coucher du soleil</strong>, Havdala{" "}
            <strong className="text-ink">
              {settings.havdalahMinutes
                ? `${settings.havdalahMinutes} minutes après le coucher du soleil`
                : "à la tombée de la nuit"}
            </strong>
            . Les heures marquées « ajusté » ont été fixées par le Beth Habad. Calculs :{" "}
            <a href="https://www.hebcal.com" className="underline underline-offset-4" rel="noopener">
              Hebcal
            </a>
            .
          </p>
        </aside>
      </div>
    </>
  );
}

function TimeItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-base font-semibold text-night">{children}</dd>
    </div>
  );
}

function IsoTime({ iso }: { iso: string }) {
  return (
    <time dateTime={timeAttr(iso)} className="tabular-nums">
      {formatTime(iso)}
    </time>
  );
}

function Unavailable() {
  return (
    <p className="mt-5 flex gap-3 rounded-lg bg-canvas p-4 text-ink-muted">
      <WarningCircleIcon aria-hidden className="mt-0.5 size-5 shrink-0" />
      Les horaires sont momentanément indisponibles. Merci de réessayer un peu plus tard.
    </p>
  );
}
