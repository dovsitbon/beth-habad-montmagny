import { EnvelopeSimpleIcon, PhoneIcon, WhatsappLogoIcon } from "@phosphor-icons/react/ssr";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { formatDateTimeLong } from "@/lib/format";
import { AdminPage, EmptyState, Flash, StatusBadge, btn } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/fields";
import { toggleRead, trashMessage } from "./actions";

export const instant = false;
export const metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireMember();
  const { message } = await searchParams;
  const supabase = await createSessionClient();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .is("deleted_at", null)
    .order("read_at", { nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <AdminPage title="Messages">
      <Flash code={message} />
      {!messages?.length ? (
        <EmptyState>Aucun message pour le moment. Les messages envoyés depuis la page Contact du site arrivent ici.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => {
            const unread = !m.read_at;
            const phone = m.phone?.replace(/[^+\d]/g, "");
            return (
              <li key={m.id} className={`rounded-xl border bg-surface p-4 ${unread ? "border-gold" : "border-line"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {unread && <StatusBadge tone="gold">Nouveau</StatusBadge>}
                  <p className="text-sm text-ink-muted first-letter:uppercase">{formatDateTimeLong(m.created_at)}</p>
                </div>
                <p className="mt-1 text-lg font-bold text-night">{m.name}</p>
                <p className="mt-2 whitespace-pre-line">{m.message}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {m.email && (
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent("Réponse du Beth Habad")}`} className={btn.small}>
                      <EnvelopeSimpleIcon aria-hidden weight="bold" className="size-4" />
                      Répondre par e-mail
                    </a>
                  )}
                  {phone && (
                    <>
                      <a href={`tel:${phone}`} className={btn.small}>
                        <PhoneIcon aria-hidden weight="bold" className="size-4" />
                        Appeler
                      </a>
                      <a href={`https://wa.me/${phone.replace(/^0/, "33").replace(/^\+/, "")}`} target="_blank" rel="noopener" className={btn.small}>
                        <WhatsappLogoIcon aria-hidden weight="fill" className="size-4" />
                        WhatsApp
                      </a>
                    </>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 border-t border-line pt-3">
                  <ActionButton action={toggleRead} hidden={{ id: m.id, read: unread ? "1" : "0" }}>
                    {unread ? "Marquer comme lu" : "Marquer comme non lu"}
                  </ActionButton>
                  <ActionButton action={trashMessage} hidden={{ id: m.id }} confirm="Mettre ce message à la corbeille ?">
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
