import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { ScheduleBlock } from "@/components/shabbat/schedule-block";
import { HomeSchedule } from "@/components/home/home-schedule";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { Shortcuts } from "@/components/home/shortcuts";
import { ContactCard, DonateBand, GalleryTeaser, UpcomingEvents, WeeklyCourses } from "@/components/home/home-sections";
import { MoreLink } from "@/components/ui/section-heading";
import { photos } from "@/lib/community-photos";
import { getCalendar } from "@/lib/hebcal";
import { getAlbums, getCourses, getPage, getServiceTimes, getUpcomingEvents } from "@/lib/data/content";
import { formatDayLong, hebrewDate } from "@/lib/format";
import { occasionDayRows } from "@/lib/horaires/aujourdhui";
import { occasionSummary } from "@/lib/horaires/bandeau";
import type { Occasion } from "@/lib/horaires/calcul";
import { getSettings } from "@/lib/data/settings";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    // Titre complet (sans le suffixe du modèle) : le nom seul est trop vague pour Google.
    title: { absolute: `${s.shortName} : centre communautaire, horaires de Chabbat et événements` },
    alternates: { canonical: "/" },
  };
}

/** Bannière : photos 01, 05 et 13 de la communauté. */
const SLIDES = [photos.foule, photos.allumage, photos.repas].map((p) => ({ src: p.src, alt: p.alt }));

export default async function HomePage() {
  const [settings, intro, calendar, events, serviceTimes, albums, courses] = await Promise.all([
    getSettings(),
    getPage("accueil"),
    getCalendar(),
    getUpcomingEvents(3),
    getServiceTimes(),
    getAlbums(),
    getCourses(),
  ]);
  // Les prochains Chabbatot / fêtes : le bloc affiché est choisi selon l'heure de Paris (HomeSchedule).
  const upcoming = calendar?.occasions.slice(0, 3) ?? [];
  const next = upcoming[0];

  return (
    <div data-home className="px-3 pt-3 sm:px-4 sm:pt-4">
      {/* Espaces insécables : « Montmagny · Groslay » ne se coupe pas. */}
      <HeroCarousel
        slides={SLIDES}
        title={settings.shortName.replace(/ · /g, "\u00a0·\u00a0")}
        tagline={`Centre communautaire · ${siteConfig.address.region}`}
      />

      {/* Infos pratiques : visibles sans défiler sur téléphone. */}
      <div className="mx-auto mt-3 max-w-6xl space-y-5 sm:mt-6 sm:space-y-8">
        <HomeSchedule
          windows={upcoming.map((o) => ({ key: o.key, homeFrom: o.homeFrom, homeUntil: o.homeUntil }))}
          computedAt={calendar?.computedAt ?? 0}
          timeZone={siteConfig.timeZone}
          occasionBlocks={Object.fromEntries(upcoming.map((o) => [o.key, <OccasionHero key={o.key} occasion={o} />]))}
          today={{
            offices: serviceTimes
              .filter((t) => t.day_type === "semaine" || t.day_type === "dimanche")
              .map((t) => ({ office: t.office, day_type: t.day_type, time: t.time })),
            ...occasionDayRows(upcoming),
          }}
          nextOccasion={next ? occasionSummary(next).filter((p) => !p.startsWith("Chaharit")) : null}
        />
        <Shortcuts />
      </div>

      <div className="mx-auto mt-16 max-w-6xl space-y-16 sm:mt-24 sm:space-y-24">
        <UpcomingEvents events={events} whatsapp={settings.whatsapp} />
        <GalleryTeaser albums={albums} />
        <WeeklyCourses courses={courses.filter((c) => c.status === "published" && !c.deleted_at)} />
        <DonateBand />
        <ContactCard settings={settings} intro={intro?.body || `<p>${siteConfig.intro}</p>`} />
      </div>
    </div>
  );
}

/** Horaires de Chabbat (ou de la fête) en grand : le bloc principal de l'accueil pendant Chabbat. */
function OccasionHero({ occasion }: { occasion: Occasion }) {
  const day = occasion.days.find((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 6) ?? occasion.days[0];
  return (
    <section aria-labelledby={`horaires-${occasion.key}`} className="card p-6 ring-2 ring-gold sm:p-10">
      <p className="text-xs font-bold tracking-[0.2em] text-gold-ink uppercase">
        {occasion.kind === "chabbat" ? "Ce Chabbat" : "Cette fête"} · <span className="normal-case">{formatDayLong(day)}</span> ·{" "}
        <span className="normal-case">{hebrewDate(day).fr}</span>
      </p>
      <h2
        id={`horaires-${occasion.key}`}
        className="mt-3 font-serif text-3xl font-black tracking-[0.03em] text-night uppercase sm:text-4xl"
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
        <MoreLink href="/horaires">Tous les horaires de Chabbat et des fêtes</MoreLink>
      </p>
    </section>
  );
}
