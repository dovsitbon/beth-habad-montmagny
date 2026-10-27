import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, CalendarPlusIcon, ClockIcon, MapPinIcon, TicketIcon } from "@phosphor-icons/react/ssr";
import { siteConfig } from "@/config/site.config";
import type { EventRow } from "@/lib/data/content";
import type { SiteSettings } from "@/lib/data/settings";
import { formatDateTimeLong, formatTime, mediaUrl, stripHtml } from "@/lib/format";
import { RichText } from "@/components/ui/rich-text";
import { EndedNotice, RegistrationBlock } from "./registration-block";

/** Page détail d'un événement, partagée entre le site public et l'aperçu de l'admin. */
export function EventDetail({ event, settings, preview = false }: { event: EventRow; settings: SiteSettings; preview?: boolean }) {
  const isCteen = event.category === "cteen";
  const back = isCteen ? { href: "/cteen", label: "CTeen" } : { href: "/evenements", label: "Agenda" };
  const address = [settings.address.street, settings.address.postalCode, settings.address.city].filter(Boolean).join(", ");

  // Données structurées schema.org (Event) pour les moteurs de recherche.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary ?? stripHtml(event.description).slice(0, 300),
    startDate: event.starts_at,
    ...(event.ends_at ? { endDate: event.ends_at } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location ?? settings.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: settings.address.street,
        postalCode: settings.address.postalCode,
        addressLocality: settings.address.city,
        addressCountry: "FR",
      },
    },
    organizer: { "@type": "Organization", name: settings.name, url: siteConfig.url },
    ...(event.image_path ? { image: [mediaUrl(event.image_path)] } : {}),
    url: `${siteConfig.url}/evenements/${event.slug}`,
  };

  return (
    <>
      {preview ? (
        <p role="status" className="bg-gold px-4 py-3 text-center font-bold text-night-deep">
          Aperçu : {event.status === "published" ? "cette version est en ligne." : "cet événement n'est pas encore publié."}
        </p>
      ) : (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}

      <div className="relative bg-night text-white">
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold" />
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:px-6 sm:pt-10 sm:pb-14">
          <Link href={back.href} className="inline-flex min-h-11 items-center gap-2 font-semibold text-gold-soft hover:text-white">
            <ArrowLeftIcon aria-hidden weight="bold" className="size-4" />
            {back.label}
          </Link>
          {isCteen && (
            <p className="mt-2 text-sm font-semibold tracking-[0.18em] text-gold-soft uppercase">CTeen</p>
          )}
          <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-white sm:text-5xl">{event.title}</h1>
          {event.summary && <p className="mt-4 max-w-2xl text-lg text-white/85">{event.summary}</p>}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          <EndedNotice startsAt={event.starts_at} endsAt={event.ends_at} />
          {event.image_path && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-night-tint">
              <Image
                src={mediaUrl(event.image_path)}
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 700px, 100vw"
                className="object-cover"
              />
            </div>
          )}
          {event.description && <RichText html={event.description} className="text-lg" />}
        </div>

        <aside className="space-y-6">
          <section aria-label="Informations pratiques" className="rounded-xl border border-line bg-surface p-6">
            <ul className="space-y-4">
              <li className="flex gap-3">
                <ClockIcon aria-hidden weight="bold" className="mt-1 size-5 shrink-0 text-gold-ink" />
                <span>
                  <span className="block font-semibold first-letter:uppercase">{formatDateTimeLong(event.starts_at)}</span>
                  {event.ends_at && <span className="text-ink-muted">jusqu&apos;à {formatTime(event.ends_at)}</span>}
                </span>
              </li>
              <li className="flex gap-3">
                <MapPinIcon aria-hidden weight="bold" className="mt-1 size-5 shrink-0 text-gold-ink" />
                <span>
                  <span className="block font-semibold">{event.location ?? settings.name}</span>
                  {address && <span className="text-ink-muted">{address}</span>}
                </span>
              </li>
              {event.price_text && (
                <li className="flex gap-3">
                  <TicketIcon aria-hidden weight="bold" className="mt-1 size-5 shrink-0 text-gold-ink" />
                  <span className="font-semibold">{event.price_text}</span>
                </li>
              )}
            </ul>
            <a
              href={`/evenements/${event.slug}/agenda.ics`}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-night px-5 font-semibold text-night transition-colors hover:bg-night-tint"
            >
              <CalendarPlusIcon aria-hidden weight="bold" className="size-5" />
              Ajouter à mon agenda
            </a>
          </section>

          {event.registration_enabled &&
            (preview ? (
              <section className="rounded-xl border border-dashed border-line bg-surface p-6 text-ink-muted">
                Le formulaire d&apos;inscription apparaîtra ici une fois l&apos;événement publié.
              </section>
            ) : (
              <RegistrationBlock event={event} />
            ))}
        </aside>
      </div>
    </>
  );
}
