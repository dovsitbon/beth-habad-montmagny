import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site.config";
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  CalendarBlankIcon,
  ClockIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import { DonateButton } from "@/components/layout/donate-button";
import { ScheduleBlock } from "@/components/shabbat/schedule-block";
import { HomeSchedule } from "@/components/home/home-schedule";
import { EventListItem } from "@/components/events/event-list-item";
import { RichText } from "@/components/ui/rich-text";
import { CommunityMosaic } from "@/components/home/community-mosaic";
import { ParallaxBand } from "@/components/home/parallax-band";
import { photos } from "@/lib/community-photos";
import { getCalendar } from "@/lib/hebcal";
import { getPage, getServiceTimes, getUpcomingEvents } from "@/lib/data/content";
import { formatDayLong, hebrewDate } from "@/lib/format";
import type { Occasion } from "@/lib/horaires/calcul";
import { getSettings } from "@/lib/data/settings";

const shortcuts = [
  { href: "/offices", label: "Horaires des offices", Icon: ClockIcon },
  { href: "/cours", label: "Cours et activités", Icon: BookOpenTextIcon },
  { href: "/cteen", label: "CTeen, pour les ados", Icon: UsersThreeIcon },
  { href: "/evenements", label: "Tous les événements", Icon: CalendarBlankIcon },
];

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    // Titre complet (sans le suffixe du modèle) : le nom seul est trop vague pour Google.
    title: { absolute: `${s.shortName} : centre communautaire, horaires de Chabbat et événements` },
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const [settings, intro, calendar, events, serviceTimes] = await Promise.all([
    getSettings(),
    getPage("accueil"),
    getCalendar(),
    getUpcomingEvents(4),
    getServiceTimes(),
  ]);
  // Les prochains Chabbatot / fêtes : le bloc affiché est choisi selon l'heure de Paris (HomeSchedule).
  const upcoming = calendar?.occasions.slice(0, 3) ?? [];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-night text-white">
        {/* Photo de fond (LCP, préchargée) avec zoom lent, coupé en « réduire les animations ». */}
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src={photos.foule.src}
            alt=""
            fill
            priority
            fetchPriority="high"
            placeholder="blur"
            sizes="100vw"
            quality={60}
            className="ken-burns object-cover"
          />
          {/* Voile bleu de la charte : 88-90 % sous le texte, 65 % à droite sur grand écran. */}
          <div className="absolute inset-0 bg-night/88 lg:bg-transparent lg:bg-linear-to-r lg:from-night/90 lg:from-50% lg:to-night/65" />
        </div>
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold" />
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
          <p className="text-sm font-semibold tracking-[0.18em] text-gold-soft uppercase">
            Centre communautaire · {siteConfig.address.region}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-white sm:text-6xl">{settings.shortName}</h1>
          {intro?.body && <RichText html={intro.body} className="mt-6 max-w-2xl text-lg text-white" />}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <DonateButton size="lg" />
            <Link
              href="/horaires"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-md border border-white/40 bg-night-deep/40 px-7 text-lg font-semibold text-white transition-colors hover:bg-white/10"
            >
              Horaires de Chabbat
              <ArrowRightIcon aria-hidden weight="bold" className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6 sm:py-16">
        <HomeSchedule
          windows={upcoming.map((o) => ({ key: o.key, homeFrom: o.homeFrom, homeUntil: o.homeUntil }))}
          computedAt={calendar?.computedAt ?? 0}
          timeZone={siteConfig.timeZone}
          occasionBlocks={Object.fromEntries(upcoming.map((o) => [o.key, <OccasionHero key={o.key} occasion={o} />]))}
          offices={serviceTimes
            .filter((t) => t.day_type === "semaine" || t.day_type === "dimanche")
            .map((t) => ({ id: t.id, office: t.office, day_type: t.day_type, time: t.time, note: t.note }))}
        />

        <section aria-labelledby="evenements-titre" className="rounded-xl border border-line bg-surface p-6 sm:p-8">
          <p className="text-sm font-semibold tracking-[0.14em] text-gold-ink uppercase">Agenda</p>
          <h2 id="evenements-titre" className="mt-2 text-3xl text-night">
            Prochains événements
          </h2>
          {events.length > 0 ? (
            <ul className="-mx-3 mt-5 space-y-1 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:space-y-0">
              {events.map((event) => (
                <li key={event.id}>
                  <EventListItem event={event} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-line bg-canvas px-5 py-8 text-center">
              <CalendarBlankIcon aria-hidden className="mx-auto size-8 text-gold-ink" />
              <p className="mt-3 text-ink-muted">Aucun événement à venir pour le moment.</p>
            </div>
          )}
          <Link
            href="/evenements"
            className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-night underline decoration-gold decoration-2 underline-offset-4"
          >
            Voir l&apos;agenda
            <ArrowRightIcon aria-hidden weight="bold" className="size-4" />
          </Link>
        </section>

      </div>

      <CommunityMosaic />

      <ParallaxBand />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Accès rapides">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {shortcuts.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex h-full min-h-24 flex-col justify-between gap-3 rounded-xl border border-line bg-surface p-4 font-semibold text-night transition-colors hover:border-gold hover:bg-gold-tint sm:p-5"
                >
                  <Icon aria-hidden weight="duotone" className="size-7 text-gold-ink" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

/** Horaires de Chabbat (ou de la fête) en grand : le bloc principal de l'accueil pendant Chabbat. */
function OccasionHero({ occasion }: { occasion: Occasion }) {
  const day = occasion.days.find((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 6) ?? occasion.days[0];
  return (
    <section aria-labelledby={`horaires-${occasion.key}`} className="rounded-2xl border-2 border-gold bg-surface p-6 shadow-sm sm:p-10">
      <p className="text-sm font-semibold tracking-[0.14em] text-gold-ink uppercase">
        {occasion.kind === "chabbat" ? "Ce Chabbat" : "Cette fête"} · <span className="normal-case">{formatDayLong(day)}</span> ·{" "}
        <span className="normal-case">{hebrewDate(day).fr}</span>
      </p>
      <h2
        id={`horaires-${occasion.key}`}
        className="mt-3 font-serif text-3xl font-semibold tracking-[0.04em] text-night uppercase sm:text-4xl"
      >
        {occasion.title}
        {occasion.parashaHebrew && (
          <span lang="he" dir="rtl" className="ml-3 align-middle text-xl font-normal tracking-normal text-ink-muted normal-case">
            {occasion.parashaHebrew}
          </span>
        )}
      </h2>
      <ScheduleBlock occasion={occasion} size="large" showTitle={false} />
      <p className="mt-6 text-center">
        <Link href="/horaires" className="inline-flex min-h-11 items-center gap-2 font-semibold text-night underline decoration-gold decoration-2 underline-offset-4">
          Tous les horaires de Chabbat et des fêtes
          <ArrowRightIcon aria-hidden weight="bold" className="size-4" />
        </Link>
      </p>
    </section>
  );
}
