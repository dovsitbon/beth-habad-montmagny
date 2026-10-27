import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";
import { getAlbums, getUpcomingEvents, getPastEvents } from "@/lib/data/content";

/** Plan du site pour les moteurs de recherche : pages fixes, événements et albums publiés. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const [upcoming, past, albums] = await Promise.all([getUpcomingEvents(200), getPastEvents(100), getAlbums()]);

  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/horaires`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/evenements`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/offices`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/cours`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/cteen`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/galerie`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/faire-un-don`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/evenements/passes`, changeFrequency: "weekly", priority: 0.3 },
    { url: `${base}/mentions-legales`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.1 },
  ];

  return [
    ...pages,
    ...[...upcoming, ...past].map((e) => ({
      url: `${base}/evenements/${e.slug}`,
      lastModified: e.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...albums.map((a) => ({
      url: `${base}/galerie/${a.slug}`,
      lastModified: a.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
  ];
}
