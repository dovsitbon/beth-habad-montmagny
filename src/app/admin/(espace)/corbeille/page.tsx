import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { formatDateTimeLong } from "@/lib/format";
import { AdminPage, EmptyState, Flash, StatusBadge } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/fields";
import { restoreItem } from "./actions";

export const instant = false;
export const metadata = { title: "Corbeille" };

type Item = { table: string; id: string; kind: string; label: string; deletedAt: string };

const OFFICES: Record<string, string> = { chaharit: "Chaharit", minha: "Minha", arvit: "Arvit" };

export default async function TrashPage({ searchParams }: PageProps<"/admin/corbeille">) {
  await requireMember();
  const { message } = await searchParams;
  const supabase = await createSessionClient();
  const deleted = <T,>(q: PromiseLike<{ data: T[] | null }>) => q.then((r) => r.data ?? []);

  const [events, courses, announcements, albums, services, messages] = await Promise.all([
    deleted(supabase.from("events").select("id, title, deleted_at").not("deleted_at", "is", null)),
    deleted(supabase.from("courses").select("id, title, deleted_at").not("deleted_at", "is", null)),
    deleted(supabase.from("announcements").select("id, message, deleted_at").not("deleted_at", "is", null)),
    deleted(supabase.from("albums").select("id, title, deleted_at").not("deleted_at", "is", null)),
    deleted(supabase.from("service_times").select("id, office, day_type, deleted_at").not("deleted_at", "is", null)),
    deleted(supabase.from("contact_messages").select("id, name, deleted_at").not("deleted_at", "is", null)),
  ]);

  const items: Item[] = [
    ...events.map((e) => ({ table: "events", id: e.id, kind: "Événement", label: e.title, deletedAt: e.deleted_at! })),
    ...courses.map((c) => ({ table: "courses", id: c.id, kind: "Cours", label: c.title, deletedAt: c.deleted_at! })),
    ...announcements.map((a) => ({ table: "announcements", id: a.id, kind: "Annonce", label: a.message, deletedAt: a.deleted_at! })),
    ...albums.map((a) => ({ table: "albums", id: a.id, kind: "Album photo", label: a.title, deletedAt: a.deleted_at! })),
    ...services.map((s) => ({ table: "service_times", id: s.id, kind: "Horaire d'office", label: `${OFFICES[s.office]} (${s.day_type})`, deletedAt: s.deleted_at! })),
    ...messages.map((m) => ({ table: "contact_messages", id: m.id, kind: "Message", label: `Message de ${m.name}`, deletedAt: m.deleted_at! })),
  ].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));

  return (
    <AdminPage title="Corbeille">
      <Flash code={message} />
      <p className="-mt-3 mb-5 text-ink-muted">
        Les éléments supprimés restent ici 30 jours, puis sont effacés définitivement. Vous pouvez les restaurer d&apos;un geste.
      </p>
      {items.length === 0 ? (
        <EmptyState>La corbeille est vide.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => {
            const purge = new Date(Date.parse(it.deletedAt) + 30 * 86400000).toISOString();
            return (
              <li key={`${it.table}-${it.id}`} className="rounded-xl border border-line bg-surface p-4">
                <StatusBadge tone="gray">{it.kind}</StatusBadge>
                <p className="mt-2 font-bold">{it.label}</p>
                <p className="text-sm text-ink-muted">
                  Supprimé le {formatDateTimeLong(it.deletedAt)}
                  <br />
                  Effacé définitivement le {formatDateTimeLong(purge)}
                </p>
                <div className="mt-3">
                  <ActionButton action={restoreItem} hidden={{ table: it.table, id: it.id }} variant="secondary">
                    Restaurer
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
