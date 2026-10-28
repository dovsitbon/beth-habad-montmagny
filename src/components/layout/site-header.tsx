import Image from "next/image";
import Link from "next/link";
import { mediaUrl, telHref, whatsappHref } from "@/lib/format";
import { areaLabel, mainNav } from "@/config/site.config";
import { getSettings } from "@/lib/data/settings";
import { DonateButton } from "./donate-button";
import { MobileMenu } from "./mobile-menu";
import { NavLink } from "./nav-link";

/**
 * En-tête « flottant » : une barre blanche en pilule, détachée du haut de page,
 * qui reste collée en haut au défilement. Logo à gauche, liens au centre (grand écran),
 * bouton Don et bouton menu rond à droite.
 */
export async function SiteHeader() {
  const settings = await getSettings();
  const logo = settings.logoPath ? mediaUrl(settings.logoPath) : null;
  return (
    // Sans backdrop-filter : un filtre créerait un bloc conteneur et casserait le « fixed » du menu.
    <header className="sticky top-0 z-40 px-3 pt-2 sm:px-4 sm:pt-3">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-night focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au contenu
      </a>

      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 rounded-full bg-surface/95 pr-2 pl-3 shadow-[var(--shadow-lift)] ring-1 ring-black/5 sm:gap-3 sm:pl-4 lg:h-[4.5rem]">
        <Link href="/" className="mr-auto flex min-w-0 items-center gap-2.5">
          {logo && (
            <Image src={logo} alt="" width={108} height={101} priority className="h-10 w-auto shrink-0 lg:h-11" />
          )}
          <span className="flex min-w-0 flex-col leading-none max-[359px]:hidden">
            <span className="font-serif text-lg font-black whitespace-nowrap text-night sm:text-xl">Beth Habad</span>
            <span className="mt-1 truncate text-[0.7rem] font-bold tracking-[0.12em] text-gold-ink uppercase">
              {areaLabel}
            </span>
          </span>
          <span className="sr-only">, retour à l&apos;accueil</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden xl:block">
          <ul className="flex items-center">
            {mainNav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <DonateButton size="sm" label="Don" />

        <MobileMenu
          items={mainNav}
          logo={logo}
          contact={{
            phone: settings.phone ? { label: settings.phone, href: telHref(settings.phone) } : null,
            whatsapp: settings.whatsapp ? whatsappHref(settings.whatsapp) : null,
          }}
          donate={<DonateButton size="lg" className="w-full" />}
        />
      </div>

      {/* « Avec l'aide de D.ieu », discret, en haut à droite comme de coutume. */}
      <span
        lang="he"
        dir="rtl"
        title="Baroukh Hachem"
        className="pointer-events-none absolute top-0.5 right-4 font-serif text-[0.65rem] leading-none text-ink-muted sm:right-6"
      >
        ב״ה
      </span>
    </header>
  );
}
