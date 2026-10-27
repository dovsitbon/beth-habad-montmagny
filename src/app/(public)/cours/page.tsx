import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { ClockIcon, MapPinIcon, UserIcon } from "@phosphor-icons/react/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { photos } from "@/lib/community-photos";
import { RichText } from "@/components/ui/rich-text";
import { getCourses, getPage, type Course } from "@/lib/data/content";
import { formatTime } from "@/lib/format";

export const metadata: Metadata = {
  alternates: { canonical: "/cours" },
  title: "Cours et activités",
  description: `Cours de Torah, activités pour les femmes, les enfants et les jeunes au ${siteConfig.name}.`,
};

const AUDIENCES: { key: Course["audience"]; label: string }[] = [
  { key: "tous", label: "Pour tous" },
  { key: "hommes", label: "Pour les hommes" },
  { key: "femmes", label: "Pour les femmes" },
  { key: "jeunes", label: "Pour les jeunes" },
  { key: "enfants", label: "Pour les enfants" },
];

const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** « Chaque mardi, de 20 h 30 à 21 h 30 » + précision libre éventuelle. */
function schedule(course: Course): string | null {
  const parts: string[] = [];
  if (course.day_of_week !== null) parts.push(`Chaque ${DAYS[course.day_of_week]}`);
  if (course.start_time && course.end_time) {
    parts.push(`de ${formatTime(course.start_time)} à ${formatTime(course.end_time)}`);
  } else if (course.start_time) {
    parts.push(`à ${formatTime(course.start_time)}`);
  }
  let text = parts.join(", ");
  if (course.schedule_text) text = text ? `${text} · ${course.schedule_text}` : course.schedule_text;
  return text || null;
}

export default async function CoursPage() {
  const [intro, courses] = await Promise.all([getPage("cours"), getCourses()]);
  const groups = AUDIENCES.map((a) => ({ ...a, items: courses.filter((c) => c.audience === a.key) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <>
      <PageHeader image={photos.conference.src} eyebrow="Étudier ensemble" title="Cours et activités">
        <p>Cours de Torah et activités régulières, pour tous les âges.</p>
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-14">
        {intro?.body && (
          <section aria-label="Présentation" className="max-w-3xl">
            <RichText html={intro.body} className="text-lg" />
          </section>
        )}

        {groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-ink-muted">
            Le programme des cours sera bientôt publié.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.key} aria-labelledby={`public-${group.key}`}>
              <h2 id={`public-${group.key}`} className="mb-5 text-3xl text-night">
                {group.label}
              </h2>
              <ul className="grid gap-5 md:grid-cols-2">
                {group.items.map((course) => {
                  const when = schedule(course);
                  return (
                    <li key={course.id} className="rounded-xl border border-line bg-surface p-6">
                      <h3 className="text-xl text-night">{course.title}</h3>
                      <ul className="mt-3 space-y-1.5 text-ink-muted">
                        {when && (
                          <li className="flex gap-2">
                            <ClockIcon aria-hidden weight="bold" className="mt-1 size-4 shrink-0 text-gold-ink" />
                            <span className="font-semibold text-ink">{when}</span>
                          </li>
                        )}
                        {course.speaker && (
                          <li className="flex gap-2">
                            <UserIcon aria-hidden weight="bold" className="mt-1 size-4 shrink-0 text-gold-ink" />
                            {course.speaker}
                          </li>
                        )}
                        {course.location && (
                          <li className="flex gap-2">
                            <MapPinIcon aria-hidden weight="bold" className="mt-1 size-4 shrink-0 text-gold-ink" />
                            {course.location}
                          </li>
                        )}
                      </ul>
                      {course.description && <RichText html={course.description} className="mt-4" />}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
