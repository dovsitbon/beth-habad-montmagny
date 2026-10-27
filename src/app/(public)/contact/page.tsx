import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import {
  EnvelopeSimpleIcon,
  MapPinIcon,
  NavigationArrowIcon,
  PhoneIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { photos } from "@/lib/community-photos";
import { Todo } from "@/components/ui/todo";
import { ContactForm } from "@/components/forms/contact-form";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact",
  description: `Adresse, téléphone, WhatsApp et formulaire de contact du ${siteConfig.name}.`,
};

export default async function ContactPage() {
  const s = await getSettings();
  const { latitude: lat, longitude: lon } = s.geo;
  const address = [s.address.street, [s.address.postalCode, s.address.city].filter(Boolean).join(" ")].filter(Boolean);

  // Carte OpenStreetMap intégrée (aucun cookie de suivi) et liens d'itinéraire vers les applications courantes.
  const d = 0.004;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d * 1.6}%2C${lat - d}%2C${lon + d * 1.6}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lon}`;
  const googleMaps = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  const waze = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
  const osm = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;

  return (
    <>
      <PageHeader image={photos.synagogue.src} eyebrow="Nous écrire, nous rendre visite" title="Contact">
        <p>Une question, une demande, une envie de passer ? Le Beth Habad vous répond avec plaisir.</p>
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[22rem_1fr]">
        <aside className="space-y-6">
          <section aria-labelledby="coordonnees" className="rounded-xl border border-line bg-surface p-6">
            <h2 id="coordonnees" className="text-2xl text-night">
              Coordonnées
            </h2>
            <address className="mt-4 space-y-4 not-italic">
              <p className="flex gap-3">
                <MapPinIcon aria-hidden weight="bold" className="mt-1 size-5 shrink-0 text-gold-ink" />
                <span>
                  {address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </p>
              <p className="flex gap-3">
                <PhoneIcon aria-hidden weight="bold" className="mt-1 size-5 shrink-0 text-gold-ink" />
                {s.phone ? (
                  <a href={`tel:${s.phone.replace(/[^+\d]/g, "")}`} className="font-semibold underline underline-offset-4">
                    {s.phone}
                  </a>
                ) : (
                  <span>
                    Téléphone <Todo />
                  </span>
                )}
              </p>
              {s.email && (
                <p className="flex gap-3">
                  <EnvelopeSimpleIcon aria-hidden weight="bold" className="mt-1 size-5 shrink-0 text-gold-ink" />
                  <a href={`mailto:${s.email}`} className="break-all underline underline-offset-4">
                    {s.email}
                  </a>
                </p>
              )}
            </address>

            {s.whatsapp ? (
              <a
                href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#1F7A4D] px-5 font-bold text-white transition-colors hover:bg-[#186640]"
              >
                <WhatsappLogoIcon aria-hidden weight="fill" className="size-6" />
                Écrire sur WhatsApp
              </a>
            ) : (
              <p className="mt-6 text-sm">
                Numéro WhatsApp <Todo />
              </p>
            )}
          </section>

          <section aria-labelledby="venir" className="overflow-hidden rounded-xl border border-line bg-surface">
            <h2 id="venir" className="px-6 pt-6 text-2xl text-night">
              Venir au Beth Habad
            </h2>
            <iframe
              title={`Carte : ${s.name}`}
              src={mapSrc}
              loading="lazy"
              className="mt-4 aspect-[4/3] w-full border-y border-line"
            />
            <div className="p-6">
              <p className="flex items-center gap-2 font-semibold">
                <NavigationArrowIcon aria-hidden weight="bold" className="size-5 text-gold-ink" />
                Itinéraire avec :
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={googleMaps} target="_blank" rel="noopener" className="inline-flex h-11 items-center justify-center rounded-md border border-night px-3 font-semibold text-night hover:bg-night-tint">
                  Google Maps
                </a>
                <a href={waze} target="_blank" rel="noopener" className="inline-flex h-11 items-center justify-center rounded-md border border-night px-3 font-semibold text-night hover:bg-night-tint">
                  Waze
                </a>
              </div>
              <a href={osm} target="_blank" rel="noopener" className="mt-3 inline-block text-sm text-ink-muted underline underline-offset-4">
                Voir sur OpenStreetMap
              </a>
            </div>
          </section>
        </aside>

        <section aria-labelledby="ecrire" className="rounded-xl border border-line bg-surface p-6 sm:p-8">
          <h2 id="ecrire" className="text-3xl text-night">
            Envoyer un message
          </h2>
          <p className="mt-2 mb-6 text-ink-muted">Nous vous répondons par e-mail ou par téléphone.</p>
          <ContactForm />
        </section>
      </div>
    </>
  );
}
