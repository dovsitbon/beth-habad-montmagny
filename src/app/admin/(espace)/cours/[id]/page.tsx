import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { AdminPage, Flash } from "@/components/admin/ui";
import { CourseForm } from "@/components/admin/course-form";

export const instant = false;
export const metadata = { title: "Modifier le cours" };

export default async function EditCoursePage({ params, searchParams }: PageProps<"/admin/cours/[id]">) {
  await requireMember();
  const [{ id }, { message }] = await Promise.all([params, searchParams]);
  const supabase = await createSessionClient();
  const { data: c } = await supabase.from("courses").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  if (!c) redirect("/admin/cours?message=introuvable");

  return (
    <AdminPage title="Modifier le cours" backHref="/admin/cours" backLabel="Cours et activités">
      <Flash code={message} />
      <CourseForm
        values={{
          id: c.id,
          title: c.title,
          audience: c.audience,
          dayOfWeek: c.day_of_week === null ? "" : String(c.day_of_week),
          startTime: c.start_time?.slice(0, 5) ?? "",
          endTime: c.end_time?.slice(0, 5) ?? "",
          scheduleText: c.schedule_text ?? "",
          speaker: c.speaker ?? "",
          location: c.location ?? "",
          description: c.description,
          sortOrder: String(c.sort_order),
          status: c.status,
        }}
      />
    </AdminPage>
  );
}
