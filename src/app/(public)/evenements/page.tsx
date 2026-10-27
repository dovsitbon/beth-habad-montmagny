import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { PageHeader } from "@/components/ui/page-header";
import { photos } from "@/lib/community-photos";
import { AgendaTabs } from "@/components/events/agenda-tabs";
import { EventGrid } from "@/components/events/event-grid";
import { getUpcomingEvents } from "@/lib/data/content";

export const metadata: Metadata = {
  alternates: { canonical: "/evenements" },
  title: "Événements",
  description: `Agenda des événements du ${siteConfig.name} : fêtes, repas, conférences, activités pour toute la famille.`,
};

export default async function EvenementsPage() {
  const events = await getUpcomingEvents(60);

  return (
    <>
      <PageHeader image={photos.concert.src} eyebrow="Agenda" title="Événements">
        <p>Fêtes, repas, conférences et activités du Beth Habad.</p>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <AgendaTabs current="upcoming" />
        <EventGrid headingLevel="h2" events={events} empty="Aucun événement à venir pour le moment. Revenez bientôt !" />
      </div>
    </>
  );
}
