import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/format";
import { AdminPage } from "@/components/admin/ui";
import { AdminSettingsForm, SettingsForm } from "@/components/admin/settings-forms";

export const instant = false;
export const metadata = { title: "Paramètres" };

/** « 33612345678 » → « +33 6 12 34 56 78 » pour l'affichage dans le formulaire. */
function displayWhatsapp(n: string | null): string {
  if (!n) return "";
  return n.startsWith("33") ? `0${n.slice(2)}`.replace(/(\d{2})(?=\d)/g, "$1 ") : `+${n}`;
}

export default async function SettingsPage() {
  const member = await requireMember();
  const supabase = await createSessionClient();
  const [{ data: s }, { data: priv }] = await Promise.all([
    supabase.from("settings").select("*").eq("id", 1).single(),
    supabase.from("settings_private").select("notification_email").eq("id", 1).single(),
  ]);
  if (!s) throw new Error("Paramètres introuvables");
  const social = (s.social ?? {}) as Record<string, string>;

  return (
    <AdminPage title="Paramètres">
      <SettingsForm
        values={{
          name: s.name,
          shortName: s.short_name,
          tagline: s.tagline ?? "",
          street: s.address_street ?? "",
          postalCode: s.address_postal_code ?? "",
          city: s.address_city ?? "",
          phone: s.phone ?? "",
          email: s.email ?? "",
          notificationEmail: priv?.notification_email ?? "",
          whatsapp: displayWhatsapp(s.whatsapp),
          donationUrl: s.donation_url ?? "",
          facebook: social.facebook ?? "",
          instagram: social.instagram ?? "",
          youtube: social.youtube ?? "",
        }}
      />

      {member.role === "admin" && (
        <section aria-labelledby="technique" className="mt-12 rounded-xl border-2 border-night/20 bg-night-tint p-4">
          <h2 id="technique" className="text-2xl text-night">
            Paramètres techniques
          </h2>
          <p className="mb-4 text-sm text-ink-muted">Visible uniquement par l&apos;administrateur.</p>
          <AdminSettingsForm
            mediaBaseUrl={mediaUrl("").replace(/\/$/, "")}
            values={{
              colorPrimary: s.color_primary,
              colorAccent: s.color_accent,
              latitude: String(s.latitude),
              longitude: String(s.longitude),
              logoPath: s.logo_path ?? "",
            }}
          />
        </section>
      )}
    </AdminPage>
  );
}
