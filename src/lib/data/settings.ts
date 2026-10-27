import { cacheLife, cacheTag } from "next/cache";
import { siteConfig } from "@/config/site.config";
import { createPublicClient } from "@/lib/supabase/public";

export type SiteSettings = {
  name: string;
  shortName: string;
  tagline: string | null;
  address: { street: string | null; postalCode: string | null; city: string | null };
  geo: { latitude: number; longitude: number };
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  donationUrl: string | null;
  social: { facebook?: string; instagram?: string; youtube?: string };
  candleMinutes: number;
  /** null = Havdala à la tombée de la nuit (8,5°) */
  havdalahMinutes: number | null;
  servicesNote: string | null;
  logoPath: string | null;
  colors: { primary: string; accent: string };
};

/** Valeurs de secours issues de site.config.ts (si la base est vide ou injoignable). */
function fallback(): SiteSettings {
  return {
    name: siteConfig.name,
    shortName: siteConfig.shortName,
    tagline: null,
    address: {
      street: siteConfig.address.street,
      postalCode: siteConfig.address.postalCode,
      city: siteConfig.address.city,
    },
    geo: siteConfig.geo,
    phone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    whatsapp: siteConfig.contact.whatsapp,
    donationUrl: siteConfig.donationUrl,
    social: {},
    candleMinutes: 18,
    havdalahMinutes: null,
    servicesNote: null,
    logoPath: null,
    colors: { ...siteConfig.colors },
  };
}

/**
 * Paramètres du site (table settings), mis en cache et invalidés par le tag « settings »
 * quand l'admin les modifie.
 */
export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag("settings");
  cacheLife("days");

  const { data, error } = await createPublicClient().from("settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) {
    console.error("Lecture des paramètres impossible, valeurs par défaut utilisées.", error);
    return fallback();
  }

  return {
    name: data.name,
    shortName: data.short_name,
    tagline: data.tagline,
    address: { street: data.address_street, postalCode: data.address_postal_code, city: data.address_city },
    geo: { latitude: Number(data.latitude), longitude: Number(data.longitude) },
    phone: data.phone,
    email: data.email,
    whatsapp: data.whatsapp,
    donationUrl: data.donation_url,
    social: (data.social ?? {}) as SiteSettings["social"],
    candleMinutes: data.candle_minutes,
    havdalahMinutes: data.havdalah_minutes,
    servicesNote: data.services_note,
    logoPath: data.logo_path,
    colors: { primary: data.color_primary, accent: data.color_accent },
  };
}
