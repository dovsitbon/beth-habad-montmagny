import { requireMember } from "@/lib/auth";
import { AdminPage } from "@/components/admin/ui";
import { EventForm } from "@/components/admin/event-form";
import { mediaUrl } from "@/lib/format";

export const instant = false;
export const metadata = { title: "Nouvel événement" };

export default async function NewEventPage({ searchParams }: PageProps<"/admin/evenements/nouveau">) {
  await requireMember();
  const { categorie } = await searchParams;
  const cteen = categorie === "cteen";

  return (
    <AdminPage
      title={cteen ? "Nouvelle activité CTeen" : "Nouvel événement"}
      backHref={`/admin/evenements${cteen ? "?categorie=cteen" : ""}`}
      backLabel={cteen ? "CTeen" : "Événements"}
    >
      <EventForm
        mediaBaseUrl={mediaUrl("").replace(/\/$/, "")}
        values={{
          category: cteen ? "cteen" : "general",
          title: "",
          summary: "",
          description: "",
          date: "",
          startTime: "",
          endTime: "",
          location: "",
          price: "",
          imagePath: "",
          registration: false,
          capacity: "",
          deadlineDate: "",
          status: "draft",
        }}
      />
    </AdminPage>
  );
}
