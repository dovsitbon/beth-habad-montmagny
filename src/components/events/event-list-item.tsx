import Link from "next/link";
import { ClockIcon, MapPinIcon } from "@phosphor-icons/react/ssr";
import type { EventRow } from "@/lib/data/content";
import { formatTime } from "@/lib/format";
import { siteConfig } from "@/config/site.config";

function parts(iso: string) {
  const f = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("fr-FR", { timeZone: siteConfig.timeZone, ...opts }).format(new Date(iso));
  return { day: f({ day: "numeric" }), month: f({ month: "short" }), weekday: f({ weekday: "long" }) };
}

/** Ligne d'événement compacte : pavé date + titre + heure + lieu. */
export function EventListItem({ event }: { event: EventRow }) {
  const d = parts(event.starts_at);
  return (
    <Link
      href={`/evenements/${event.slug}`}
      className="group flex gap-4 rounded-lg p-3 transition-colors hover:bg-gold-tint sm:gap-5"
    >
      <span
        aria-hidden
        className="flex w-16 shrink-0 flex-col items-center justify-center rounded-md bg-night py-2 text-white"
      >
        <span className="font-serif text-2xl leading-none">{d.day}</span>
        <span className="mt-1 text-xs font-semibold tracking-wide text-gold-soft uppercase">{d.month}</span>
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-night group-hover:underline group-hover:decoration-gold group-hover:underline-offset-4">
            {event.title}
          </span>
          {event.category === "cteen" && (
            <span className="rounded-full bg-night-tint px-2 py-0.5 text-xs font-semibold tracking-wide text-night uppercase">
              CTeen
            </span>
          )}
        </span>
        <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon aria-hidden className="size-4" />
            <span className="first-letter:uppercase">{d.weekday}</span>
            <time dateTime={event.starts_at}>
              {d.day} {d.month} à {formatTime(event.starts_at)}
            </time>
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon aria-hidden className="size-4" />
              {event.location}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
