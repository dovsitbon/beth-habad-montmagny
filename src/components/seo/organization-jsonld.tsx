import { siteConfig } from "@/config/site.config";
import { getSettings } from "@/lib/data/settings";
import { mediaUrl } from "@/lib/format";

/**
 * Données structurées schema.org du Beth Habad (type Synagogue, sous-type de PlaceOfWorship) :
 * nom, adresse, position, contact. Aide Google et les assistants IA à identifier le lieu.
 */
export async function OrganizationJsonLd() {
  const s = await getSettings();
  const sameAs = Object.values(s.social).filter(Boolean);

  const data = {
    "@context": "https://schema.org",
    "@type": "Synagogue",
    "@id": `${siteConfig.url}/#organisation`,
    name: s.name,
    alternateName: s.shortName,
    description: s.tagline ?? siteConfig.description,
    url: siteConfig.url,
    ...(s.logoPath ? { logo: mediaUrl(s.logoPath), image: mediaUrl(s.logoPath) } : {}),
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.email ? { email: s.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: s.address.street,
      postalCode: s.address.postalCode,
      addressLocality: s.address.city,
      addressRegion: siteConfig.address.region,
      addressCountry: "FR",
    },
    geo: { "@type": "GeoCoordinates", latitude: s.geo.latitude, longitude: s.geo.longitude },
    ...(sameAs.length ? { sameAs } : {}),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
  );
}
