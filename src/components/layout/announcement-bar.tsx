import { MegaphoneSimpleIcon } from "@phosphor-icons/react/ssr";
import { getActiveAnnouncements } from "@/lib/data/content";

/** Bandeau des annonces actives (gérées dans l'admin, avec expiration automatique). */
export async function AnnouncementBar() {
  const announcements = await getActiveAnnouncements();
  if (announcements.length === 0) return null;

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
