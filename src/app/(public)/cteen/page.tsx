import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { PageHeader } from "@/components/ui/page-header";
import { RichText } from "@/components/ui/rich-text";
import { EventGrid } from "@/components/events/event-grid";
import { getPage, getPastEvents, getUpcomingEvents } from "@/lib/data/content";

export const metadata: Metadata = {
  alternates: { canonical: "/cteen" },
  title: "CTeen, pour les ados",
  description: `CTeen ${siteConfig.address.city} : soirées, sorties et activités pour les adolescents juifs, avec inscription en ligne.`,
};

export default async function CteenPage() {
  const [intro, upcoming, past] = await Promise.all([
    getPage("cteen"),
    getUpcomingEvents(30, "cteen"),
    getPastEvents(6, "cteen"),
  ]);

  return (
    <>
      <PageHeader eyebrow="Jeunesse" title="CTeen">
        <p>Le réseau des ados du Beth Habad : soirées, sorties, projets et bonne humeur.</p>
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-10 sm:px-6 sm:py-14">
        {intro?.body && (
          <section aria-label="Présentation" className="max-w-3xl">
            <RichText html={intro.body} className="text-lg" />
          </section>
        )}

        <section aria-labelledby="cteen-a-venir">
          <h2 id="cteen-a-venir" className="mb-6 text-3xl text-night">
            Prochaines activités
          </h2>
          <EventGrid events={upcoming} empty="Pas d'activité CTeen programmée pour le moment. Revenez bientôt !" />
        </section>

        {past.length > 0 && (
          <section aria-labelledby="cteen-passees">
            <h2 id="cteen-passees" className="mb-6 text-3xl text-night">
              Ce qu&apos;on a fait récemment
            </h2>
            <EventGrid events={past} past empty="" />
          </section>
        )}
      </div>
    </>
  );
}
