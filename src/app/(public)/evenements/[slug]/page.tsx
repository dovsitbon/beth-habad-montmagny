import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getEventBySlug, getEventSlugs } from "@/lib/data/content";
import { getSettings } from "@/lib/data/settings";
import { mediaUrl, stripHtml } from "@/lib/format";
import { EventDetail } from "@/components/events/event-detail";

export async function generateStaticParams() {
  const slugs = await getEventSlugs();
  // Cache Components exige au moins un paramètre ; un slug inconnu renvoie une 404.
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: "aucun-evenement" }];
}

export async function generateMetadata({ params }: PageProps<"/evenements/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Événement introuvable" };
  const description = event.summary ?? stripHtml(event.description).slice(0, 160);
  return {
    title: event.title,
    description,
    alternates: { canonical: `/evenements/${event.slug}` },
    openGraph: {
      title: event.title,
      description,
      type: "article",
      images: event.image_path ? [mediaUrl(event.image_path)] : undefined,
    },
  };
}

export default function EvenementPage({ params }: PageProps<"/evenements/[slug]">) {
  // Suspense : la page s'affiche instantanément à la navigation, le contenu arrive ensuite.
  return (
    <Suspense fallback={<EventSkeleton />}>
      <EventContent params={params} />
    </Suspense>
  );
}

function EventSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement de l'événement" className="bg-night">
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-6">
        <div className="h-5 w-24 rounded bg-white/15" />
        <div className="mt-5 h-10 w-3/4 max-w-xl rounded bg-white/15" />
      </div>
    </div>
  );
}

async function EventContent({ params }: { params: PageProps<"/evenements/[slug]">["params"] }) {
  const { slug } = await params;
  const [event, settings] = await Promise.all([getEventBySlug(slug), getSettings()]);
  if (!event) notFound();

  return <EventDetail event={event} settings={settings} />;
}
