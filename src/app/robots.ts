import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";

/** Tout le site public est indexable ; l'espace de gestion et les aperçus ne le sont pas. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/apercu", "/auth", "/api"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
