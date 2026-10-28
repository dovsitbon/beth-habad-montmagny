import Image from "next/image";
import Link from "next/link";
import {
  EnvelopeSimpleIcon,
  FacebookLogoIcon,
  InstagramLogoIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsappLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/ssr";
import { mainNav } from "@/config/site.config";
import { getSettings } from "@/lib/data/settings";
import { directionsUrl, mediaUrl, telHref, whatsappHref } from "@/lib/format";

const link = "inline-block py-1.5 underline-offset-4 hover:text-white hover:underline";

/** Pied de page bleu nuit : identité et réseaux, plan du site, contact, liens légaux. */
export async function SiteFooter() {
  const settings = await getSettings();
  const { address } = settings;
  const fullAddress = [address.street, address.postalCode, address.city].filter(Boolean).join(", ");

  // Seuls les réseaux renseignés dans l'admin apparaissent.
  const networks = [
    settings.whatsapp && { href: whatsappHref(settings.whatsapp), label: "WhatsApp", Icon: WhatsappLogoIcon },
    settings.social.instagram && { href: settings.social.instagram, label: "Instagram", Icon: InstagramLogoIcon },
    settings.social.facebook && { href: settings.social.facebook, label: "Facebook", Icon: FacebookLogoIcon },
    settings.social.youtube && { href: settings.social.youtube, label: "YouTube", Icon: YoutubeLogoIcon },
  ].filter((n): n is { href: string; label: string; Icon: typeof WhatsappLogoIcon } => Boolean(n));

  return (
    <footer className="mt-auto bg-night-deep text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pt-14 pb-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            {settings.logoPath && (
              <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-sm">
                <Image src={mediaUrl(settings.logoPath)} alt="" width={108} height={101} className="h-auto w-full" />
              </span>
            )}
            <span className="font-serif text-xl leading-tight font-black text-white">{settings.shortName}</span>
          </Link>
          <p className="mt-4 max-w-xs">
            {address.street}
            <br />
            {address.postalCode} {address.city}
          </p>
          {networks.length > 0 && (
            <ul className="mt-5 flex gap-2" aria-label="Réseaux sociaux">
              {networks.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-gold hover:text-night-deep"
                  >
                    <Icon aria-hidden weight="fill" className="size-5" />
                    <span className="sr-only">{label} (nouvel onglet)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Plan du site">
          <p className="text-xs font-bold tracking-[0.22em] text-gold uppercase">Le site</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 md:grid-cols-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                {/^https?:\/\//.test(item.href) ? (
                  <a href={item.href} target="_blank" rel="noopener" className={link}>
                    {item.label}
                    <span className="sr-only"> (ouvre un autre site dans un nouvel onglet)</span>
                  </a>
                ) : (
                  <Link href={item.href} className={link}>
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-gold uppercase">Contact</p>
          <address className="mt-4 space-y-3 not-italic">
            {settings.phone && (
              <p className="flex gap-3">
                <PhoneIcon aria-hidden weight="fill" className="mt-1 size-5 shrink-0 text-gold" />
                <a href={telHref(settings.phone)} className="underline-offset-4 hover:text-white hover:underline">
                  {settings.phone}
                </a>
              </p>
            )}
            {settings.email && (
              <p className="flex gap-3">
                <EnvelopeSimpleIcon aria-hidden weight="fill" className="mt-1 size-5 shrink-0 text-gold" />
                <a href={`mailto:${settings.email}`} className="break-all underline-offset-4 hover:text-white hover:underline">
                  {settings.email}
                </a>
              </p>
            )}
            <p className="flex gap-3">
              <MapPinIcon aria-hidden weight="fill" className="mt-1 size-5 shrink-0 text-gold" />
              <a href={directionsUrl(fullAddress)} target="_blank" rel="noopener" className="underline-offset-4 hover:text-white hover:underline">
                {fullAddress}
                <span className="sr-only"> (itinéraire, nouvel onglet)</span>
              </a>
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 pr-24 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pr-28">
          <p>© {settings.name}. Aucun cookie de suivi.</p>
          <ul className="flex flex-wrap gap-x-5">
            <li>
              <Link href="/mentions-legales" className="inline-block py-2 underline-offset-4 hover:text-white hover:underline">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="inline-block py-2 underline-offset-4 hover:text-white hover:underline">
                Confidentialité
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
