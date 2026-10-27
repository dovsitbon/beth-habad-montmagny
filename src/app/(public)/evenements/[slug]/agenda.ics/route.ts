import { siteConfig } from "@/config/site.config";
import { getEventBySlug } from "@/lib/data/content";
import { getSettings } from "@/lib/data/settings";
import { buildIcs } from "@/lib/ics";
import { stripHtml } from "@/lib/format";

/** Fichier .ics d'un événement : /evenements/<slug>/agenda.ics */
export async function GET(_request: Request, ctx: RouteContext<"/evenements/[slug]/agenda.ics">) {
  const { slug } = await ctx.params;
  const [event, settings] = await Promise.all([getEventBySlug(slug), getSettings()]);
  if (!event) return new Response("Événement introuvable", { status: 404 });

  const address = [settings.address.street, settings.address.postalCode, settings.address.city].filter(Boolean).join(", ");
  const url = `${siteConfig.url}/evenements/${event.slug}`;
  const body = buildIcs(
    {
      uid: `${event.id}@${new URL(siteConfig.url).hostname}`,
      title: event.title,
      start: event.starts_at,
      end: event.ends_at,
      location: event.location ? `${event.location}${address && event.location !== address ? ` (${address})` : ""}` : address,
      description: [event.summary, stripHtml(event.description), url].filter(Boolean).join("\n\n"),
      url,
    },
    settings.name,
  );

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
