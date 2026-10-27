import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/format";
import { mainNav } from "@/config/site.config";
import { getSettings } from "@/lib/data/settings";
import { DonateButton } from "./donate-button";
import { MobileMenu } from "./mobile-menu";
import { NavLink } from "./nav-link";

export async function SiteHeader() {
  const settings = await getSettings();
  return (
    // Fond opaque, sans backdrop-filter : un filtre créerait un bloc conteneur
    // et casserait le positionnement « fixed » du menu mobile.
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-night focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au contenu
      </a>

      {/* « Avec l'aide de D.ieu », discret, en haut à droite comme de coutume. */}
      <div className="mx-auto flex max-w-6xl justify-end px-4 pt-1 sm:px-6">
        <span lang="he" dir="rtl" title="Baroukh Hachem" className="font-serif text-xs leading-none text-ink-muted">
          ב״ה
        </span>
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:h-20">
        <Link href="/" className="group mr-auto flex items-center gap-3">
          {/* Emblème envoyé depuis les paramètres de l'admin, à gauche du nom. */}
          {settings.logoPath && (
            <Image
              src={mediaUrl(settings.logoPath)}
              alt=""
              width={108}
              height={101}
              priority
              className="h-10 w-auto shrink-0 lg:h-12"
            />
          )}
          <span className="flex flex-col leading-none">
            <span className="font-serif text-xl font-semibold whitespace-nowrap text-night sm:text-2xl">Beth Habad</span>
            <span className="mt-1 text-xs font-semibold tracking-[0.18em] text-gold-ink uppercase">
              {settings.address.city}
            </span>
          </span>
          <span className="sr-only">, retour à l&apos;accueil</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sur mobile, le bouton Don est dans la barre fixe du bas. */}
        <div className="hidden sm:block">
          <DonateButton />
        </div>

        <MobileMenu items={mainNav} />
      </div>
    </header>
  );
}
