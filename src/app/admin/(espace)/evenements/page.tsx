import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { formatDateTimeLong } from "@/lib/format";
import { AdminPage, EmptyState, Flash, StatusBadge, btn } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/fields";
import { duplicateEvent, trashEvent } from "./actions";

export const instant = false;
export const metadata = { title: "Événements" };

export default async function AdminEventsPage({ searchParams }: PageProps<"/admin/evenements">) {
  await requireMember();
  const { message, categorie, vue } = await searchParams;
  const cteen = categorie === "cteen";
  const past = vue === "passes";

  const supabase = await createSessionClient();
  const now = new Date().toISOString();
  let query = supabase
    .from("events")
    .select("id, title, starts_at, status, category, registration_enabled, capacity, registrations(party_size)")
    .is("deleted_at", null)
    .order("starts_at", { ascending: !past })
    .limit(100);
  query = past ? query.lt("starts_at", now) : query.gte("starts_at", now);
  if (cteen) query = query.eq("category", "cteen");
  const { data: events } = await query;

  const base = `/admin/evenements${cteen ? "?categorie=cteen&" : "?"}`;

  return (
    <AdminPage
      title={cteen ? "CTeen" : "Événements"}
      actions={
        <Link href={`/admin/evenements/nouveau${cteen ? "?categorie=cteen" : ""}`} className={btn.gold}>
          <PlusIcon aria-hidden weight="bold" className="size-5" />
          Ajouter
        </Link>
      }
    >
      <Flash code={message} />

      <nav aria-label="Période" className="mb-5 flex gap-2">
        <Link href={`${base}vue=a-venir`} aria-current={!past ? "page" : undefined} className={`${btn.small} aria-[current=page]:border-night aria-[current=page]:bg-night aria-[current=page]:text-white`}>
          À venir
        </Link>
        <Link href={`${base}vue=passes`} aria-current={past ? "page" : undefined} className={`${btn.small} aria-[current=page]:border-night aria-[current=page]:bg-night aria-[current=page]:text-white`}>
          Passés
        </Link>
      </nav>

      {!events?.length ? (
        <EmptyState>{past ? "Aucun événement passé." : "Aucun événement à venir. Appuyez sur « Ajouter » pour en créer un."}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const people = e.registrations.reduce((s, r) => s + r.party_size, 0);
            return (
              <li key={e.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {e.status === "published" ? <StatusBadge tone="green">Publié</StatusBadge> : <StatusBadge tone="gray">Brouillon</StatusBadge>}
                  {e.category === "cteen" && !cteen && <StatusBadge tone="gold">CTeen</StatusBadge>}
                </div>
                <Link href={`/admin/evenements/${e.id}`} className="mt-2 block text-lg font-bold text-night underline-offset-4 hover:underline">
                  {e.title}
                </Link>
                <p className="text-ink-muted first-letter:uppercase">{formatDateTimeLong(e.starts_at)}</p>
                {e.registration_enabled && (
                  <Link href={`/admin/inscriptions/${e.id}`} className="mt-1 inline-block text-sm font-semibold text-gold-ink underline underline-offset-4">
                    {people} inscrit{people > 1 ? "s" : ""}
                    {e.capacity ? ` sur ${e.capacity} places` : ""}
                  </Link>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/admin/evenements/${e.id}`} className={btn.small}>
                    Modifier
                  </Link>
                  <ActionButton action={duplicateEvent} hidden={{ id: e.id }}>
                    Dupliquer
                  </ActionButton>
                  <ActionButton
                    action={trashEvent}
                    hidden={{ id: e.id }}
                    confirm={`Mettre « ${e.title} » à la corbeille ? Vous pourrez le récupérer pendant 30 jours.`}
                  >
                    Supprimer
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminPage>
  );
}
