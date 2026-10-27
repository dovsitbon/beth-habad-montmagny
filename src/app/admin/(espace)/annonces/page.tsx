import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { formatDateTimeLong } from "@/lib/format";
import { AdminPage, EmptyState, Flash, StatusBadge, btn } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/fields";
import { duplicateAnnouncement, toggleAnnouncement, trashAnnouncement } from "./actions";

export const instant = false;
export const metadata = { title: "Annonces" };

export default async function AdminAnnouncementsPage({ searchParams }: PageProps<"/admin/annonces">) {
  await requireMember();
  const { message } = await searchParams;
  const supabase = await createSessionClient();
  const { data: list } = await supabase
    .from("announcements")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const now = new Date().toISOString();

  return (
    <AdminPage
      title="Annonces"
      actions={
        <Link href="/admin/annonces/nouvelle" className={btn.gold}>
          <PlusIcon aria-hidden weight="bold" className="size-5" />
          Nouvelle
        </Link>
      }
    >
      <Flash code={message} />
      <p className="-mt-3 mb-5 text-ink-muted">Les annonces actives s&apos;affichent en bandeau en haut de toutes les pages du site.</p>
      {!list?.length ? (
        <EmptyState>Aucune annonce.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {list.map((a) => {
            const expired = a.expires_at !== null && a.expires_at <= now;
            const visible = a.is_active && !expired;
            return (
              <li key={a.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-wrap gap-2">
                  {visible ? (
                    <StatusBadge tone="green">Visible sur le site</StatusBadge>
                  ) : expired ? (
                    <StatusBadge tone="gray">Expirée</StatusBadge>
                  ) : (
                    <StatusBadge tone="gray">Masquée</StatusBadge>
                  )}
                  {a.level === "important" && <StatusBadge tone="gold">Importante</StatusBadge>}
                </div>
                <p className="mt-2 font-semibold">{a.message}</p>
                {a.expires_at && (
                  <p className="text-sm text-ink-muted">
                    {expired ? "Expirée le" : "Disparaît le"} {formatDateTimeLong(a.expires_at)}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/admin/annonces/${a.id}`} className={btn.small}>
                    Modifier
                  </Link>
                  {!expired && (
                    <ActionButton action={toggleAnnouncement} hidden={{ id: a.id, active: a.is_active ? "0" : "1" }}>
                      {a.is_active ? "Masquer" : "Afficher"}
                    </ActionButton>
                  )}
                  <ActionButton action={duplicateAnnouncement} hidden={{ id: a.id }}>
                    Dupliquer
                  </ActionButton>
                  <ActionButton action={trashAnnouncement} hidden={{ id: a.id }} confirm="Mettre cette annonce à la corbeille ?">
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
