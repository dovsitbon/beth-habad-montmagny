import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data/settings";
import { EventDetail } from "@/components/events/event-detail";

export const metadata: Metadata = { title: "Aperçu", robots: { index: false, follow: false } };
export const instant = false;

/** Aperçu d'un événement (même brouillon), réservé à l'équipe connectée. */
export default function ApercuEvenementPage({ params }: PageProps<"/apercu/evenements/[id]">) {
  return (
    <Suspense fallback={<p className="p-8 text-ink-muted">Chargement de l&apos;aperçu…</p>}>
      <Preview params={params} />
    </Suspense>
  );
}

async function Preview({ params }: { params: PageProps<"/apercu/evenements/[id]">["params"] }) {
  await requireMember();
  const { id } = await params;
  const supabase = await createSessionClient();
  const [{ data: event }, settings] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle(),
    getSettings(),
  ]);
  if (!event) redirect("/admin/evenements?message=introuvable");

  return (
    <>
      <EventDetail event={event} settings={settings} preview />
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <a href={`/admin/evenements/${event.id}`} className="inline-flex min-h-12 items-center rounded-md bg-night px-5 font-bold text-white">
          Revenir à la modification
        </a>
      </div>
    </>
  );
}
