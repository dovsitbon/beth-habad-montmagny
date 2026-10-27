"use server";

import { z } from "zod";
import { requireAdmin, requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { refreshSite } from "@/lib/admin/revalidate";
import { type ActionState, invalid, TECH_ERROR } from "@/lib/admin/helpers";
import { siteId } from "@/lib/supabase/env";

const url = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), `${label} : l'adresse doit commencer par https://`);

const schema = z.object({
  name: z.string().trim().min(2, "Indiquez le nom.").max(120),
  shortName: z.string().trim().min(2, "Indiquez un nom court.").max(40),
  tagline: z.string().trim().max(200),
  street: z.string().trim().max(200),
  postalCode: z.string().trim().max(10),
  city: z.string().trim().max(80),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[+0-9 ().-]{6,30}$/.test(v), "Ce numéro de téléphone ne semble pas valide."),
  email: z.string().trim().refine((v) => v === "" || z.email().safeParse(v).success, "Adresse e-mail invalide."),
  notificationEmail: z.email("Indiquez l'adresse qui recevra les messages et inscriptions."),
  whatsapp: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+?[0-9 ]{8,20}$/.test(v), "Numéro WhatsApp invalide (ex. : 06 12 34 56 78)."),
  donationUrl: url("Lien de don"),
  facebook: url("Facebook"),
  instagram: url("Instagram"),
  youtube: url("YouTube"),
});

/** Numéro saisi « 06 12 34 56 78 » → format international « 33612345678 » attendu par WhatsApp. */
function toWhatsapp(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("0")) return `33${digits.slice(1)}`;
  return digits;
}

export async function saveSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireMember();
  const get = (k: string) => String(form.get(k) ?? "");
  const parsed = schema.safeParse({
    name: get("name"),
    shortName: get("shortName"),
    tagline: get("tagline"),
    street: get("street"),
    postalCode: get("postalCode"),
    city: get("city"),
    phone: get("phone"),
    email: get("email"),
    notificationEmail: get("notificationEmail").trim(),
    whatsapp: get("whatsapp"),
    donationUrl: get("donationUrl"),
    facebook: get("facebook"),
    instagram: get("instagram"),
    youtube: get("youtube"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const supabase = await createSessionClient();
  const social = Object.fromEntries(
    Object.entries({ facebook: v.facebook, instagram: v.instagram, youtube: v.youtube }).filter(([, val]) => val),
  );
  const [a, b] = await Promise.all([
    supabase
      .from("settings")
      .update({
        name: v.name,
        short_name: v.shortName,
        tagline: v.tagline || null,
        address_street: v.street || null,
        address_postal_code: v.postalCode || null,
        address_city: v.city || null,
        phone: v.phone || null,
        email: v.email || null,
        whatsapp: toWhatsapp(v.whatsapp),
        donation_url: v.donationUrl || null,
        social,
      })
      .eq("site_id", siteId()),
    supabase.from("settings_private").update({ notification_email: v.notificationEmail }).eq("site_id", siteId()),
  ]);
  if (a.error || b.error) {
    console.error("Enregistrement des paramètres impossible :", a.error ?? b.error);
    return TECH_ERROR;
  }
  refreshSite("settings", "pages");
  return { ok: true, message: "Paramètres enregistrés : le site est à jour." };
}

const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide.");
const adminSchema = z.object({
  colorPrimary: color,
  colorAccent: color,
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  logoPath: z.string().max(300),
});

/** Paramètres techniques, réservés à l'administrateur (aussi protégés par la base de données). */
export async function saveAdminSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = adminSchema.safeParse({
    colorPrimary: form.get("colorPrimary"),
    colorAccent: form.get("colorAccent"),
    latitude: form.get("latitude"),
    longitude: form.get("longitude"),
    logoPath: form.get("logoPath") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;

  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("settings")
    .update({
      color_primary: v.colorPrimary.toUpperCase(),
      color_accent: v.colorAccent.toUpperCase(),
      latitude: v.latitude,
      longitude: v.longitude,
      logo_path: v.logoPath || null,
    })
    .eq("site_id", siteId());
  if (error) {
    console.error("Enregistrement des paramètres techniques impossible :", error);
    return TECH_ERROR;
  }
  // Nouvelle position GPS : les horaires de Chabbat sont recalculés.
  refreshSite("settings", "hebcal");
  return { ok: true, message: "Paramètres techniques enregistrés." };
}
