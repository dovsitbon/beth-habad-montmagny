import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { siteId } from "@/lib/supabase/env";
import { AdminPage, Flash, StatusBadge } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/fields";
import { InviteForm } from "@/components/admin/invite-form";
import { changeRole, removeMember } from "./actions";

export const instant = false;
export const metadata = { title: "Équipe" };

export default async function TeamPage({ searchParams }: PageProps<"/admin/equipe">) {
  const me = await requireMember();
  const { message } = await searchParams;
  const supabase = await createSessionClient();
  const { data: rows } = await supabase
    .from("user_sites")
    .select("role, created_at, profiles(id, email, full_name)")
    .eq("site_id", siteId())
    .order("created_at");
  const members = (rows ?? []).flatMap((r) => (r.profiles ? [{ ...r.profiles, role: r.role }] : []));

  return (
    <AdminPage title="Équipe">
      <Flash code={message} />
      <p className="-mt-3 mb-5 text-ink-muted">Les personnes qui peuvent modifier le site. Elles se connectent avec leur adresse e-mail.</p>

      <ul className="space-y-3">
        {(members ?? []).map((m) => {
          const isMe = m.id === me.id;
          const canRemove = !isMe && (me.role === "admin" || m.role === "editor");
          return (
            <li key={m.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{m.full_name ?? m.email}</p>
                {m.role === "admin" ? <StatusBadge tone="gold">Administrateur</StatusBadge> : <StatusBadge tone="gray">Éditeur</StatusBadge>}
                {isMe && <StatusBadge tone="green">Vous</StatusBadge>}
              </div>
              <p className="text-sm break-all text-ink-muted">{m.email}</p>
              {(canRemove || (me.role === "admin" && !isMe)) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {me.role === "admin" && !isMe && (
                    <ActionButton
                      action={changeRole}
                      hidden={{ id: m.id, role: m.role === "admin" ? "editor" : "admin" }}
                      confirm={m.role === "admin" ? "Retirer les droits d'administrateur ?" : "Donner les droits d'administrateur (accès à tout) ?"}
                    >
                      {m.role === "admin" ? "Passer éditeur" : "Passer administrateur"}
                    </ActionButton>
                  )}
                  {canRemove && (
                    <ActionButton action={removeMember} hidden={{ id: m.id }} confirm={`Retirer ${m.full_name ?? m.email} de l'équipe ? Cette personne ne pourra plus se connecter.`}>
                      Retirer de l&apos;équipe
                    </ActionButton>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="inviter" className="mt-8 rounded-xl border-2 border-dashed border-gold bg-surface p-4">
        <h2 id="inviter" className="mb-3 text-2xl text-night">
          Ajouter quelqu&apos;un
        </h2>
        <InviteForm />
      </section>
    </AdminPage>
  );
}
