import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import {
  ClockIcon,
  EnvelopeSimpleIcon,
  MapPinIcon,
  NavigationArrowIcon,
  PhoneIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/ssr";
import { siteConfig } from "@/config/site.config";
import { DonateButton } from "@/components/layout/donate-button";
import { MoreLink, SectionHeading } from "@/components/ui/section-heading";
import { RichText } from "@/components/ui/rich-text";
import type { Album, Course, EventRow } from "@/lib/data/content";
import type { SiteSettings } from "@/lib/data/settings";
import { photos } from "@/lib/community-photos";
import { directionsUrl, formatTime, mediaUrl, telHref, wazeUrl, whatsappHref } from "@/lib/format";

const fr = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: siteConfig.timeZone, ...opts }).format(new Date(iso));

/* ── Prochains événements ─────────────────────────────────────────────── */

export function UpcomingEvents({ events, whatsapp }: { events: EventRow[]; whatsapp: string | null }) {
  return (
    <section aria-labelledby="evenements" className="space-y-8">
      <SectionHeading id="evenements" eyebrow="Agenda" title="Prochains événements" lead="Les rendez-vous de la communauté" />
      {events.length > 0 ? (
        <>
          <ul className="grid gap-4 md:grid-cols-3">
            {events.slice(0, 3).map((e) => (
              <li key={e.id}>
                <EventCard event={e} />
              </li>
            ))}
          </ul>
          <p className="text-center">
            <MoreLink href="/evenements">Tout l&apos;agenda</MoreLink>
          </p>
        </>
      ) : (
        // Pas de grande boîte vide : une ligne, et le moyen d'être prévenu.
        <p className="card mx-auto flex max-w-xl flex-col items-center gap-3 px-5 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <span className="text-ink-muted">Aucun événement pour le moment, suivez-nous sur WhatsApp.</span>
          {whatsapp && (
            <a
              href={whatsappHref(whatsapp)}
              target="_blank"
              rel="noopener"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-whatsapp px-5 font-semibold text-white"
            >
              <WhatsappLogoIcon aria-hidden weight="fill" className="size-5" />
              WhatsApp
              <span className="sr-only"> (nouvel onglet)</span>
            </a>
          )}
        </p>
      )}
    </section>
  );
}

function EventCard({ event }: { event: EventRow }) {
  const href = `/evenements/${event.slug}`;
  return (
    <article className="card flex h-full flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <p aria-hidden className="flex w-16 shrink-0 flex-col items-center rounded-2xl bg-night py-2.5 text-white">
          <span className="font-serif text-2xl leading-none font-black">{fr(event.starts_at, { day: "numeric" })}</span>
          <span className="mt-1 text-xs font-bold tracking-wide text-gold-soft uppercase">{fr(event.starts_at, { month: "short" })}</span>
        </p>
        <div className="min-w-0">
          {event.category === "cteen" && (
            <span className="mb-1 inline-block rounded-full bg-night-tint px-2.5 py-0.5 text-xs font-bold tracking-wide text-night uppercase">
              CTeen
            </span>
          )}
          <h3 className="font-serif text-xl leading-snug font-black text-ink">
            <Link href={href} className="hover:underline hover:decoration-gold">
              {event.title}
            </Link>
          </h3>
        </div>
      </div>
      <ul className="space-y-1 text-[0.95rem] text-ink-muted">
        <li className="flex items-center gap-2">
          <ClockIcon aria-hidden className="size-4 shrink-0" />
          <time dateTime={event.starts_at} className="first-letter:uppercase">
            {fr(event.starts_at, { weekday: "long", day: "numeric", month: "long" })} à {formatTime(event.starts_at)}
          </time>
        </li>
        {event.location && (
          <li className="flex items-center gap-2">
            <MapPinIcon aria-hidden className="size-4 shrink-0" />
            {event.location}
          </li>
        )}
      </ul>
      <Link
        href={event.registration_enabled ? `${href}#inscription` : href}
        className={`mt-auto inline-flex h-11 items-center justify-center rounded-full px-5 font-bold ${
          event.registration_enabled ? "bg-night text-white hover:bg-night-soft" : "border border-night/25 text-night hover:bg-night-tint"
        }`}
      >
        {event.registration_enabled ? "S'inscrire" : "En savoir plus"}
        <span className="sr-only"> : {event.title}</span>
      </Link>
    </article>
  );
}

/* ── Galerie ──────────────────────────────────────────────────────────── */

type PhotoCard = { href: string; title: string; date: string | null; image: StaticImageData | string; alt: string };

/** Photos de la communauté utilisées tant que la galerie de l'admin compte moins de 4 albums illustrés. */
const FALLBACK = [photos.menorahEnfants, photos.pourim, photos.cteen, photos.conference];

export function GalleryTeaser({ albums }: { albums: Album[] }) {
  const cards: PhotoCard[] = albums
    .filter((a) => a.cover)
    .slice(0, 4)
    .map((a) => ({
      href: `/galerie/${a.slug}`,
      title: a.title,
      date: a.album_date ? fr(`${a.album_date}T12:00:00Z`, { month: "long", year: "numeric" }) : null,
      image: mediaUrl(a.cover!.storage_path),
      alt: "",
    }));
  for (const p of FALLBACK) {
    if (cards.length >= 4) break;
    cards.push({ href: "/galerie", title: p.caption, date: null, image: p.src, alt: p.alt });
  }

  return (
    <section aria-labelledby="galerie" className="space-y-8">
      <SectionHeading id="galerie" eyebrow="Galerie" title="Souvenirs en images" lead="Revivez les moments forts de notre communauté" />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c, i) => (
          <li key={`${c.href}-${i}`}>
            <Link href={c.href} className="photo-card relative block aspect-[4/5] overflow-hidden rounded-3xl bg-night shadow-[var(--shadow-soft)]">
              <Image
                src={c.image}
                alt={c.alt}
                fill
                sizes="(min-width: 1024px) 280px, 50vw"
                quality={60}
                {...(typeof c.image === "string" ? {} : { placeholder: "blur" as const })}
                className="object-cover"
              />
              <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4 text-white">
                <span className="block font-serif text-lg leading-tight font-black sm:text-xl">{c.title}</span>
                {c.date && <span className="mt-1 block text-sm text-white/85 first-letter:uppercase">{c.date}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-center">
        <MoreLink href="/galerie">Toute la galerie</MoreLink>
      </p>
    </section>
  );
}

/* ── Cours ────────────────────────────────────────────────────────────── */

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const AUDIENCE: Record<Course["audience"], string> = {
  tous: "Pour tous",
  hommes: "Hommes",
  femmes: "Femmes",
  enfants: "Enfants",
  jeunes: "Jeunes",
};

export function WeeklyCourses({ courses }: { courses: Course[] }) {
  if (courses.length === 0) return null;
  return (
    <section aria-labelledby="cours" className="space-y-8">
      <SectionHeading id="cours" eyebrow="Étude" title="Cours de la semaine" lead="Torah, activités et rendez-vous réguliers" />
      <ul className="grid gap-3 sm:grid-cols-2">
        {courses.slice(0, 4).map((c) => (
          <li key={c.id} className="card flex items-center gap-4 p-4 sm:p-5">
            <p className="flex w-20 shrink-0 flex-col items-center rounded-2xl bg-gold-tint py-2 text-center">
              <span className="text-xs font-bold tracking-wide text-gold-ink uppercase">
                {c.day_of_week !== null ? DAYS[c.day_of_week].slice(0, 3) : "Cours"}
              </span>
              {c.start_time && (
                <span className="font-serif text-xl leading-tight font-black text-night">{formatTime(c.start_time)}</span>
              )}
            </p>
            <div className="min-w-0">
              <h3 className="font-serif text-lg leading-snug font-black text-ink">{c.title}</h3>
              <p className="mt-0.5 text-sm text-ink-muted">
                {[c.day_of_week !== null ? DAYS[c.day_of_week] : c.schedule_text, AUDIENCE[c.audience], c.speaker]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-center">
        <MoreLink href="/cours">Tous les cours</MoreLink>
      </p>
    </section>
  );
}

/* ── Bandeau don ──────────────────────────────────────────────────────── */

export function DonateBand() {
  return (
    <section
      aria-labelledby="don"
      className="relative overflow-hidden rounded-3xl bg-linear-to-br from-night via-night to-night-deep px-6 py-10 text-white shadow-[var(--shadow-lift)] sm:px-12 sm:py-14"
    >
      <div aria-hidden className="absolute -top-24 -right-16 size-72 rounded-full bg-gold/15 blur-2xl" />
      <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-bold tracking-[0.22em] text-gold-soft uppercase">Faire un don</p>
          <h2 id="don" className="mt-3 font-serif text-[2rem] leading-tight font-black text-white sm:text-[2.6rem]">
            Soutenez votre Beth Habad
          </h2>
          <p className="mt-3 text-lg text-white/85">
            Chaque don, même modeste, fait vivre les offices, les fêtes et les activités pour les enfants.
          </p>
        </div>
        <DonateButton size="lg" tone="white" className="self-start md:self-center" />
      </div>
    </section>
  );
}

/* ── Contact ──────────────────────────────────────────────────────────── */

export function ContactCard({ settings, intro }: { settings: SiteSettings; intro: string }) {
  const { address, geo } = settings;
  const full = [address.street, address.postalCode, address.city].filter(Boolean).join(", ");
  const pill = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 font-semibold";
  return (
    <section aria-labelledby="contact" className="card grid gap-8 p-6 sm:p-10 md:grid-cols-[1.2fr_1fr] md:items-center">
      <div>
        <SectionHeading id="contact" eyebrow="Bienvenue" title="Venez nous rendre visite" align="left" />
        <RichText html={intro} className="mt-4 text-lg text-ink-muted" />
      </div>
      <div className="space-y-4">
        <address className="space-y-3 not-italic">
          <p className="flex gap-3">
            <MapPinIcon aria-hidden weight="fill" className="mt-1 size-5 shrink-0 text-gold-ink" />
            <a href={directionsUrl(full)} target="_blank" rel="noopener" className="underline-offset-4 hover:underline">
              {address.street}
              <br />
              {address.postalCode} {address.city}
              <span className="sr-only"> (itinéraire, nouvel onglet)</span>
            </a>
          </p>
          {settings.phone && (
            <p className="flex gap-3">
              <PhoneIcon aria-hidden weight="fill" className="mt-1 size-5 shrink-0 text-gold-ink" />
              <a href={telHref(settings.phone)} className="font-semibold underline-offset-4 hover:underline">
                {settings.phone}
              </a>
            </p>
          )}
          {settings.email && (
            <p className="flex gap-3">
              <EnvelopeSimpleIcon aria-hidden weight="fill" className="mt-1 size-5 shrink-0 text-gold-ink" />
              <a href={`mailto:${settings.email}`} className="break-all underline-offset-4 hover:underline">
                {settings.email}
              </a>
            </p>
          )}
        </address>
        <div className="flex flex-wrap gap-2">
          <a href={directionsUrl(full)} target="_blank" rel="noopener" className={`${pill} bg-night text-white hover:bg-night-soft`}>
            <NavigationArrowIcon aria-hidden weight="fill" className="size-5" />
            Google Maps
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
          <a href={wazeUrl(geo.latitude, geo.longitude)} target="_blank" rel="noopener" className={`${pill} border border-night/25 text-night hover:bg-night-tint`}>
            Waze
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
          <Link href="/contact" className={`${pill} border border-night/25 text-night hover:bg-night-tint`}>
            Nous écrire
          </Link>
        </div>
      </div>
    </section>
  );
}
