import { CalendarBlankIcon } from "@phosphor-icons/react/ssr";
import type { EventRow } from "@/lib/data/content";
import { EventCard } from "./event-card";

export function EventGrid({
  events,
  past = false,
  empty,
  headingLevel = "h3",
}: {
  events: EventRow[];
  past?: boolean;
  empty: string;
  headingLevel?: "h2" | "h3";
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface px-5 py-12 text-center">
        <CalendarBlankIcon aria-hidden className="mx-auto size-8 text-gold-ink" />
        <p className="mt-3 text-ink-muted">{empty}</p>
      </div>
    );
  }
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <li key={event.id}>
          <EventCard event={event} past={past} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
