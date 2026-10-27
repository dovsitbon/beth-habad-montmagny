import { requireMember } from "@/lib/auth";
import { AdminPage } from "@/components/admin/ui";
import { AnnouncementForm } from "@/components/admin/announcement-form";

export const instant = false;
export const metadata = { title: "Nouvelle annonce" };

export default async function NewAnnouncementPage() {
  await requireMember();
  return (
    <AdminPage title="Publier une annonce" backHref="/admin/annonces" backLabel="Annonces">
      <AnnouncementForm
        values={{ message: "", linkUrl: "", linkLabel: "", level: "info", active: true, expiresDate: "", expiresTime: "" }}
      />
    </AdminPage>
  );
}
