import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { isoToParis } from "@/lib/admin/helpers";
import { AdminPage, Flash } from "@/components/admin/ui";
import { AnnouncementForm } from "@/components/admin/announcement-form";

export const instant = false;
export const metadata = { title: "Modifier l'annonce" };

export default async function EditAnnouncementPage({ params, searchParams }: PageProps<"/admin/annonces/[id]">) {
  await requireMember();
  const [{ id }, { message }] = await Promise.all([params, searchParams]);
  const supabase = await createSessionClient();
  const { data: a } = await supabase.from("announcements").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!a) redirect("/admin/annonces?message=introuvable");
  const expires = isoToParis(a.expires_at);

  return (
    <AdminPage title="Modifier l'annonce" backHref="/admin/annonces" backLabel="Annonces">
      <Flash code={message} />
      <AnnouncementForm
        values={{
          id: a.id,
          message: a.message,
          linkUrl: a.link_url ?? "",
          linkLabel: a.link_label ?? "",
          level: a.level,
          active: a.is_active,
          expiresDate: expires.date,
          expiresTime: expires.time,
        }}
      />
    </AdminPage>
  );
}
