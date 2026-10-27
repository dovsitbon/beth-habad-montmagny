import { MegaphoneSimpleIcon } from "@phosphor-icons/react/ssr";
import { siteConfig } from "@/config/site.config";
import { getActiveAnnouncements, getServiceTimes } from "@/lib/data/content";
import { getCalendar } from "@/lib/hebcal";
import { toHomeWindow } from "@/lib/horaires/bandeau";
import { ScheduleBar } from "./schedule-bar";

/**
 * Bandeau sous le menu. Une annonce publiée dans l'admin est prioritaire ; sans annonce,
 * il affiche automatiquement les horaires (offices du jour, ou Chabbat du vendredi 8 h à la fin de Chabbat).
 */
export async function AnnouncementBar() {
  const announcements = await getActiveAnnouncements();
  if (announcements.length === 0) {
    const [calendar, times] = await Promise.all([getCalendar(), getServiceTimes()]);
    return (
      <ScheduleBar
        windows={(calendar?.occasions.slice(0, 3) ?? []).map(toHomeWindow)}
        offices={times.map((t) => ({ office: t.office, day_type: t.day_type, time: t.time }))}
        computedAt={calendar?.computedAt ?? 0}
        timeZone={siteConfig.timeZone}
      />
    );
  }

  return (
    <section aria-label="Annonces" className="border-b border-gold/40">
      {announcements.map((a) => (
        <div key={a.id} className={a.level === "important" ? "bg-gold text-night-deep" : "bg-gold-tint text-ink"}>
          <p className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 sm:px-6">
            <MegaphoneSimpleIcon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0 text-night" />
            <span>
              <span className="font-semibold">{a.message}</span>
              {a.link_url && (
                <>
                  {" "}
                  <a href={a.link_url} className="font-semibold underline underline-offset-4">
                    {a.link_label || "En savoir plus"}
                  </a>
                </>
              )}
            </span>
          </p>
        </div>
      ))}
    </section>
  );
}
