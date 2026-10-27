import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { formatTime } from "@/lib/format";
import { AdminPage, EmptyState, Flash, StatusBadge, btn } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/fields";
import { duplicateCourse, trashCourse } from "./actions";

export const instant = false;
export const metadata = { title: "Cours et activités" };

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const AUDIENCE: Record<string, string> = { tous: "Pour tous", hommes: "Hommes", femmes: "Femmes", jeunes: "Jeunes", enfants: "Enfants" };

export default async function AdminCoursesPage({ searchParams }: PageProps<"/admin/cours">) {
  await requireMember();
  const { message } = await searchParams;
  const supabase = await createSessionClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order")
    .order("day_of_week", { nullsFirst: false });

  return (
    <AdminPage
      title="Cours et activités"
      actions={
        <Link href="/admin/cours/nouveau" className={btn.gold}>
          <PlusIcon aria-hidden weight="bold" className="size-5" />
          Ajouter
        </Link>
      }
    >
      <Flash code={message} />
      {!courses?.length ? (
        <EmptyState>Aucun cours. Appuyez sur « Ajouter » pour en créer un.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {courses.map((c) => (
            <li key={c.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex flex-wrap gap-2">
                {c.status === "published" ? <StatusBadge tone="green">Publié</StatusBadge> : <StatusBadge tone="gray">Brouillon</StatusBadge>}
                <StatusBadge tone="gold">{AUDIENCE[c.audience]}</StatusBadge>
              </div>
              <Link href={`/admin/cours/${c.id}`} className="mt-2 block text-lg font-bold text-night underline-offset-4 hover:underline">
                {c.title}
              </Link>
              <p className="text-ink-muted">
                {[c.day_of_week !== null ? DAYS[c.day_of_week] : null, c.start_time ? formatTime(c.start_time) : null, c.schedule_text]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/admin/cours/${c.id}`} className={btn.small}>
                  Modifier
                </Link>
                <ActionButton action={duplicateCourse} hidden={{ id: c.id }}>
                  Dupliquer
                </ActionButton>
                <ActionButton action={trashCourse} hidden={{ id: c.id }} confirm={`Mettre « ${c.title} » à la corbeille ?`}>
                  Supprimer
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
