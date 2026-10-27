import Link from "next/link";
import {
  EnvelopeSimpleIcon,
  FacebookLogoIcon,
  InstagramLogoIcon,
  MapPinIcon,
  PhoneIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/ssr";
import { mainNav } from "@/config/site.config";
import { Todo } from "@/components/ui/todo";
import { getSettings } from "@/lib/data/settings";

export async function SiteFooter() {
  const settings = await getSettings();
  const { address } = settings;
  const contact = { phone: settings.phone, email: settings.email };

  return (
    <footer className="mt-auto bg-night-deep text-white/85">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl text-white">{settings.name}</p>
          <div className="mt-4 h-px w-12 bg-gold" aria-hidden />
          <address className="mt-4 space-y-3 not-italic">
            <p className="flex gap-3">
              <MapPinIcon aria-hidden weight="bold" className="mt-1 size-5 shrink-0 text-gold" />
              <span>
                {address.street}
                <br />
                {address.postalCode} {address.city}
              </span>
            </p>
            <p className="flex gap-3">
              <PhoneIcon aria-hidden weight="bold" className="mt-1 size-5 shrink-0 text-gold" />
              {contact.phone ? (
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="underline-offset-4 hover:underline">
                  {contact.phone}
                </a>
              ) : (
                <span>
                  Téléphone <Todo />
                </span>
              )}
            </p>
            {contact.email && (
              <p className="flex gap-3">
                <EnvelopeSimpleIcon aria-hidden weight="bold" className="mt-1 size-5 shrink-0 text-gold" />
                <a href={`mailto:${contact.email}`} className="break-all underline-offset-4 hover:underline">
                  {contact.email}
                </a>
              </p>
            )}
          </address>
          {Object.keys(settings.social).length > 0 && (
            <ul className="mt-5 flex gap-2" aria-label="Réseaux sociaux">
              {(
                [
                  ["facebook", "Facebook", FacebookLogoIcon],
                  ["instagram", "Instagram", InstagramLogoIcon],
                  ["youtube", "YouTube", YoutubeLogoIcon],
                ] as const
              ).map(([key, label, Icon]) =>
                settings.social[key] ? (
                  <li key={key}>
                    <a
                      href={settings.social[key]}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex size-11 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
                    >
                      <Icon aria-hidden weight="fill" className="size-5 text-gold" />
                      <span className="sr-only">{label}</span>
                    </a>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </div>

        <nav aria-label="Plan du site">
          <p className="text-sm font-semibold tracking-[0.14em] text-gold uppercase">Le site</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-block py-1.5 underline-offset-4 hover:text-white hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-sm font-semibold tracking-[0.14em] text-gold uppercase">Informations</p>
          <ul className="mt-4 space-y-1">
            <li>
              {settings.donationUrl ? (
                <a
                  href={settings.donationUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-block py-1.5 underline-offset-4 hover:text-white hover:underline"
                >
                  Faire un don
                  <span className="sr-only"> (ouvre le site Allodons dans un nouvel onglet)</span>
                </a>
              ) : (
                <Link href="/faire-un-don" className="inline-block py-1.5 underline-offset-4 hover:text-white hover:underline">
                  Faire un don
                </Link>
              )}
            </li>
            <li>
              <Link href="/mentions-legales" className="inline-block py-1.5 underline-offset-4 hover:text-white hover:underline">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="inline-block py-1.5 underline-offset-4 hover:text-white hover:underline">
                Politique de confidentialité
              </Link>
            </li>
            <li>
              <Link href="/admin" className="inline-block py-1.5 underline-offset-4 hover:text-white hover:underline">
                Espace de gestion
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-white/65 sm:px-6">
          © {settings.name}. Ce site n&apos;utilise aucun cookie de suivi.
        </p>
      </div>
    </footer>
  );
}
