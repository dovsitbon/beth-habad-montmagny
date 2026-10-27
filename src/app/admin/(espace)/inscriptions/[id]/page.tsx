import { redirect } from "next/navigation";
import { DownloadSimpleIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { formatDateTimeLong } from "@/lib/format";
import { AdminPage, EmptyState, Flash, btn } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/fields";
import { deleteRegistration } from "./actions";

export const instant = false;
export const metadata = { title: "Inscriptions à un événement" };

export default async function EventRegistrationsPage({ params, searchParams }: PageProps<"/admin/inscriptions/[id]">) {
  await requireMember();
  const [{ id }, { message }] = await Promise.all([params, searchParams]);
  const supabase = await createSessionClient();
  const [{ data: event }, { data: regs }] = await Promise.all([
    supabase.from("events").select("id, title, starts_at, capacity").eq("id", id).maybeSingle(),
    supabase.from("registrations").select("*").eq("event_id", id).order("created_at"),
  ]);
  if (!event) redirect("/admin/inscriptions?message=introuvable");

  const list = regs ?? [];
  const total = list.reduce((s, r) => s + r.party_size, 0);

  // Texte prêt à partager sur WhatsApp (liste lisible sur téléphone).
  const shareText = [
    `Inscriptions : ${event.title}`,
    formatDateTimeLong(event.starts_at),
    `Total : ${total} personne${total > 1 ? "s" : ""}${event.capacity ? ` / ${event.capacity} places` : ""}`,
    "",
    ...list.map((r, i) => `${i + 1}. ${r.name} (${r.party_size})${r.phone ? ` – ${r.phone}` : ""}`),
  ].join("\n");

  return (
    <AdminPage title="Inscriptions" backHref="/admin/inscriptions" backLabel="Tous les événements">
      <Flash code={message} />
      <p className="text-lg font-bold text-night">{event.title}</p>
      <p className="text-ink-muted first-letter:uppercase">{formatDateTimeLong(event.starts_at)}</p>

      <div className="my-5 rounded-xl bg-night p-5 text-white">
        <p className="font-serif text-4xl">{total}</p>
        <p className="text-white/80">
          personne{total > 1 ? "s" : ""} inscrite{total > 1 ? "s" : ""}
          {event.capacity ? ` sur ${event.capacity} places` : ""} · {list.length} inscription{list.length > 1 ? "s" : ""}
        </p>
      </div>

      {list.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <a href={`/admin/inscriptions/${event.id}/export`} className={btn.secondary}>
            <DownloadSimpleIcon aria-hidden weight="bold" className="size-5" />
            Télécharger (Excel)
          </a>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener" className={btn.secondary}>
            <WhatsappLogoIcon aria-hidden weight="fill" className="size-5 text-[#1F7A4D]" />
            Partager sur WhatsApp
          </a>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState>Personne ne s&apos;est encore inscrit.</EmptyState>
      ) : (
        <ol className="space-y-3">
          {list.map((r, i) => (
            <li key={r.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-bold">
                  {i + 1}. {r.name}
                </p>
                <p className="shrink-0 font-semibold text-gold-ink">
                  {r.party_size} pers.
                </p>
              </div>
              <p className="mt-1 flex flex-wrap gap-x-4 text-ink-muted">
                {r.phone && (
                  <a href={`tel:${r.phone.replace(/[^+\d]/g, "")}`} className="underline underline-offset-4">
                    {r.phone}
                  </a>
                )}
                {r.email && (
                  <a href={`mailto:${r.email}`} className="break-all underline underline-offset-4">
                    {r.email}
                  </a>
                )}
              </p>
              <p className="mt-1 text-sm text-ink-muted">Inscrit le {formatDateTimeLong(r.created_at)}</p>
              <div className="mt-2">
                <ActionButton
                  action={deleteRegistration}
                  hidden={{ id: r.id, eventId: event.id }}
                  confirm={`Supprimer l'inscription de ${r.name} ? Cette action est définitive.`}
                >
                  Supprimer
                </ActionButton>
              </div>
            </li>
          ))}
        </ol>
      )}
    </AdminPage>
  );
}
