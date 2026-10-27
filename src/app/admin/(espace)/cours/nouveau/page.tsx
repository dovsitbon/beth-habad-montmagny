import { requireMember } from "@/lib/auth";
import { AdminPage } from "@/components/admin/ui";
import { CourseForm } from "@/components/admin/course-form";

export const instant = false;
export const metadata = { title: "Nouveau cours" };

export default async function NewCoursePage() {
  await requireMember();
  return (
    <AdminPage title="Nouveau cours" backHref="/admin/cours" backLabel="Cours et activités">
      <CourseForm
        values={{
          title: "",
          audience: "tous",
          dayOfWeek: "",
          startTime: "",
          endTime: "",
          scheduleText: "",
          speaker: "",
          location: "",
          description: "",
          sortOrder: "0",
          status: "draft",
        }}
      />
    </AdminPage>
  );
}
