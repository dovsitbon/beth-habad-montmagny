import type { Metadata } from "next";
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
import { ShabbatCard } from "@/components/shabbat/shabbat-card";
import { EventListItem } from "@/components/events/event-list-item";
import { RichText } from "@/components/ui/rich-text";
import { getCalendar } from "@/lib/hebcal";
import { getPage, getUpcomingEvents } from "@/lib/data/content";
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
    title: { absolute: `${s.name} : synagogue, horaires de Chabbat et événements à ${s.address.city ?? ""}`.trim() },
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const [settings, intro, calendar, events] = await Promise.all([
    getSettings(),
    getPage("accueil"),
    getCalendar(),
    getUpcomingEvents(4),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-night text-white">
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold" />
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
          <p className="text-sm font-semibold tracking-[0.18em] text-gold-soft uppercase">
            {settings.address.city} · {siteConfig.address.region}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-white sm:text-6xl">{settings.name}</h1>
          {intro?.body && <RichText html={intro.body} className="mt-6 max-w-2xl text-lg text-white/85" />}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <DonateButton size="lg" />
            <Link
              href="/horaires"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-md border border-white/30 px-7 text-lg font-semibold text-white transition-colors hover:bg-white/10"
            >
              Horaires de Chabbat
              <ArrowRightIcon aria-hidden weight="bold" className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ShabbatCard shabbat={calendar?.thisShabbat ?? null} />
        </div>

        <section aria-labelledby="evenements-titre" className="rounded-xl border border-line bg-surface p-6 sm:p-8 lg:col-span-3">
          <p className="text-sm font-semibold tracking-[0.14em] text-gold-ink uppercase">Agenda</p>
          <h2 id="evenements-titre" className="mt-2 text-3xl text-night">
            Prochains événements
          </h2>
          {events.length > 0 ? (
            <ul className="-mx-3 mt-5 space-y-1">
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

        <nav aria-label="Accès rapides" className="lg:col-span-5">
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
