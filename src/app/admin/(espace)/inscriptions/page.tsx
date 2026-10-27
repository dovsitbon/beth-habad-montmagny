import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { formatDateTimeLong } from "@/lib/format";
import { isoDaysFromNow } from "@/lib/admin/helpers";
import { AdminPage, EmptyState, ListCard, StatusBadge } from "@/components/admin/ui";

export const instant = false;
export const metadata = { title: "Inscriptions" };

export default async function InscriptionsPage() {
  await requireMember();
  const supabase = await createSessionClient();
  const since = isoDaysFromNow(-60);
  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at, capacity, category, registrations(party_size)")
    .eq("registration_enabled", true)
    .is("deleted_at", null)
    .gte("starts_at", since)
    .order("starts_at");

  return (
    <AdminPage title="Inscriptions">
      <p className="-mt-3 mb-5 text-ink-muted">Les événements avec inscription en ligne (y compris ceux des deux derniers mois).</p>
      {!events?.length ? (
        <EmptyState>Aucun événement avec inscription. Activez « Inscription en ligne » dans un événement.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => {
            const people = e.registrations.reduce((s, r) => s + r.party_size, 0);
            const full = e.capacity !== null && people >= e.capacity;
            return (
              <li key={e.id}>
                <ListCard href={`/admin/inscriptions/${e.id}`}>
                  <div className="flex flex-wrap gap-2">
                    {e.category === "cteen" && <StatusBadge tone="gold">CTeen</StatusBadge>}
                    {full && <StatusBadge tone="red">Complet</StatusBadge>}
                  </div>
                  <p className="mt-1 text-lg font-bold text-night">{e.title}</p>
                  <p className="text-ink-muted first-letter:uppercase">{formatDateTimeLong(e.starts_at)}</p>
                  <p className="mt-2 text-2xl font-bold text-night">
                    {people} <span className="text-base font-normal text-ink-muted">personne{people > 1 ? "s" : ""}{e.capacity ? ` sur ${e.capacity}` : ""}</span>
                  </p>
                </ListCard>
              </li>
            );
          })}
        </ul>
      )}
    </AdminPage>
  );
}
