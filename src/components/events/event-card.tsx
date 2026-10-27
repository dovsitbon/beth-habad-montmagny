import Image from "next/image";
import Link from "next/link";
import { ClockIcon, MapPinIcon, TicketIcon } from "@phosphor-icons/react/ssr";
import type { EventRow } from "@/lib/data/content";
import { formatTime, mediaUrl } from "@/lib/format";
import { siteConfig } from "@/config/site.config";

function dateParts(iso: string) {
  const f = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-FR", { timeZone: siteConfig.timeZone, ...opts }).format(new Date(iso));
  return { day: f({ day: "numeric" }), month: f({ month: "short" }), weekday: f({ weekday: "long" }) };
}

/** Carte d'événement pour l'agenda (photo facultative, pavé date, infos pratiques). */
export function EventCard({
  event,
  past = false,
  headingLevel: Heading = "h3",
}: {
  event: EventRow;
  past?: boolean;
  /** h2 quand la grille suit directement le titre de la page, h3 sous une section. */
  headingLevel?: "h2" | "h3";
}) {
  const d = dateParts(event.starts_at);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-gold">
      {event.image_path && (
        <div className="relative aspect-[16/9] bg-night-tint">
          <Image
            src={mediaUrl(event.image_path)}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={`object-cover ${past ? "grayscale-[40%]" : ""}`}
          />
        </div>
      )}
      <div className="flex flex-1 gap-4 p-5">
        <span
          aria-hidden
          className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-md ${past ? "bg-night-tint text-night" : "bg-night text-white"}`}
        >
          <span className="font-serif text-2xl leading-none">{d.day}</span>
          <span className={`mt-1 text-xs font-semibold tracking-wide uppercase ${past ? "text-ink-muted" : "text-gold-soft"}`}>
            {d.month}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          {event.category === "cteen" && (
            <span className="mb-1 inline-block rounded-full bg-night-tint px-2 py-0.5 text-xs font-semibold tracking-wide text-night uppercase">
              CTeen
            </span>
          )}
          <Heading className="text-xl leading-snug text-night">
            {/* Le lien couvre toute la carte (after:absolute) tout en gardant un seul lien lisible. */}
            <Link
              href={`/evenements/${event.slug}`}
              className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-gold group-hover:underline-offset-4"
            >
              {event.title}
            </Link>
          </Heading>
          {event.summary && <p className="mt-1 text-ink-muted">{event.summary}</p>}
          <ul className="mt-3 space-y-1 text-sm text-ink-muted">
            <li className="flex items-center gap-1.5">
              <ClockIcon aria-hidden className="size-4 shrink-0" />
              <span>
                <span className="first-letter:uppercase">{d.weekday}</span> {d.day} {d.month} à {formatTime(event.starts_at)}
              </span>
            </li>
            {event.location && (
              <li className="flex items-center gap-1.5">
                <MapPinIcon aria-hidden className="size-4 shrink-0" />
                {event.location}
              </li>
            )}
            {event.price_text && (
              <li className="flex items-center gap-1.5">
                <TicketIcon aria-hidden className="size-4 shrink-0" />
                {event.price_text}
              </li>
            )}
          </ul>
          {!past && event.registration_enabled && (
            <p className="mt-3 text-sm font-semibold text-gold-ink">Inscription en ligne</p>
          )}
        </div>
      </div>
    </article>
  );
}
