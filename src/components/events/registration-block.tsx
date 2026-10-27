import { cacheLife, cacheTag } from "next/cache";
import type { EventRow } from "@/lib/data/content";
import { getSeatsTaken } from "@/lib/data/content";
import { formatDateTimeLong } from "@/lib/format";
import { RegistrationForm } from "./registration-form";

/**
 * Bloc d'inscription : état (ouvert, complet, clos) et places restantes.
 * Mis en cache quelques minutes, et invalidé à chaque nouvelle inscription (tag seats:<id>).
 */
export async function RegistrationBlock({ event }: { event: EventRow }) {
  "use cache";
  cacheTag(`seats:${event.id}`, `event:${event.slug}`);
  cacheLife("minutes");

  const { ended, deadlinePassed } = await eventTiming(event.starts_at, event.ends_at, event.registration_deadline);
  const taken = await getSeatsTaken(event.id);
  const remaining = event.capacity ? Math.max(event.capacity - taken, 0) : null;

  let content: React.ReactNode;
  if (ended || deadlinePassed) {
    content = <p className="text-ink-muted">Les inscriptions sont closes.</p>;
  } else if (remaining === 0) {
    content = (
      <p className="rounded-lg bg-gold-tint p-4 font-semibold">
        C&apos;est complet ! Pour être prévenu en cas de désistement, contactez le Beth Habad.
      </p>
    );
  } else {
    content = (
      <>
        {remaining !== null && (
          <p className="mb-4 font-semibold text-gold-ink">
            {remaining === 1 ? "Plus qu'une place disponible" : `${remaining} places disponibles`}
          </p>
        )}
        {event.registration_deadline && (
          <p className="mb-4 text-sm text-ink-muted">
            Inscription jusqu&apos;au {formatDateTimeLong(event.registration_deadline)}.
          </p>
        )}
        <RegistrationForm eventId={event.id} slug={event.slug} maxParty={Math.min(remaining ?? 20, 20)} />
      </>
    );
  }

  return (
    <section aria-labelledby="inscription" className="rounded-xl border border-line bg-surface p-6 sm:p-8">
      <h2 id="inscription" className="text-2xl text-night">
        Inscription
      </h2>
      <div className="mt-4">{content}</div>
    </section>
  );
}

/** Indique si l'événement est terminé (calcul mis en cache, recalculé régulièrement). */
export async function EndedNotice({ startsAt, endsAt }: { startsAt: string; endsAt: string | null }) {
  const { ended } = await eventTiming(startsAt, endsAt, null);
  if (!ended) return null;
  return (
    <p className="rounded-lg bg-night-tint p-4 font-semibold text-night">Cet événement est terminé.</p>
  );
}

/** Calcule si l'événement est terminé et si la date limite est passée (mis en cache quelques minutes). */
async function eventTiming(startsAt: string, endsAt: string | null, deadline: string | null) {
  "use cache";
  cacheLife("minutes");
  const now = Date.now();
  return {
    ended: Date.parse(endsAt ?? startsAt) < now,
    deadlinePassed: deadline ? Date.parse(deadline) < now : false,
  };
}
