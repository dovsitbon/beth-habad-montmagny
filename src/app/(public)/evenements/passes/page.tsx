import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { PageHeader } from "@/components/ui/page-header";
import { photos } from "@/lib/community-photos";
import { AgendaTabs } from "@/components/events/agenda-tabs";
import { EventGrid } from "@/components/events/event-grid";
import { getPastEvents } from "@/lib/data/content";

export const metadata: Metadata = {
  alternates: { canonical: "/evenements/passes" },
  title: "Événements passés",
  description: `Les événements passés du ${siteConfig.name}.`,
};

export default async function EvenementsPassesPage() {
  const events = await getPastEvents(60);

  return (
    <>
      <PageHeader image={photos.concert.src} eyebrow="Agenda" title="Événements passés" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <AgendaTabs current="past" />
        <EventGrid headingLevel="h2" events={events} past empty="Aucun événement passé pour le moment." />
      </div>
    </>
  );
}
