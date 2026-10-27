import Link from "next/link";
import { redirect } from "next/navigation";
import { EyeIcon } from "@phosphor-icons/react/ssr";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { isoToParis } from "@/lib/admin/helpers";
import { mediaUrl } from "@/lib/format";
import { AdminPage, Flash, btn } from "@/components/admin/ui";
import { EventForm } from "@/components/admin/event-form";

export const instant = false;
export const metadata = { title: "Modifier l'événement" };

export default async function EditEventPage({ params, searchParams }: PageProps<"/admin/evenements/[id]">) {
  await requireMember();
  const [{ id }, { message }] = await Promise.all([params, searchParams]);
  const supabase = await createSessionClient();
  const { data: e } = await supabase.from("events").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!e) redirect("/admin/evenements?message=introuvable");

  const start = isoToParis(e.starts_at);
  const cteen = e.category === "cteen";

  return (
    <AdminPage
      title="Modifier l'événement"
      backHref={`/admin/evenements${cteen ? "?categorie=cteen" : ""}`}
      backLabel={cteen ? "CTeen" : "Événements"}
      actions={
        <Link href={e.status === "published" ? `/evenements/${e.slug}` : `/apercu/evenements/${e.id}`} target="_blank" className={btn.small}>
          <EyeIcon aria-hidden weight="bold" className="size-4" />
          {e.status === "published" ? "Voir sur le site" : "Aperçu"}
        </Link>
      }
    >
      <Flash code={message} />
      <EventForm
        mediaBaseUrl={mediaUrl("").replace(/\/$/, "")}
        values={{
          id: e.id,
          category: e.category,
          title: e.title,
          summary: e.summary ?? "",
          description: e.description,
          date: start.date,
          startTime: start.time,
          endTime: e.ends_at ? isoToParis(e.ends_at).time : "",
          location: e.location ?? "",
          price: e.price_text ?? "",
          imagePath: e.image_path ?? "",
          registration: e.registration_enabled,
          capacity: e.capacity ? String(e.capacity) : "",
          deadlineDate: e.registration_deadline ? isoToParis(e.registration_deadline).date : "",
          status: e.status,
        }}
      />
    </AdminPage>
  );
}
