import Image from "next/image";
import { DonateButton } from "@/components/layout/donate-button";
import { photos } from "@/lib/community-photos";

/**
 * Bandeau pleine largeur de l'accueil, photo en fond.
 * Parallaxe en CSS pur (.parallax, voir globals.css) : la photo, plus haute que le bandeau,
 * glisse au défilement. Coupée sur mobile, en « réduire les animations » et sur les
 * navigateurs sans animations liées au défilement (la photo reste alors simplement fixe).
 */
export function ParallaxBand() {
  return (
    <section aria-labelledby="bandeau-titre" className="relative isolate overflow-hidden bg-night text-white">
      <div aria-hidden className="parallax absolute inset-x-0 -top-[20%] -z-20 h-[140%]">
        <Image src={photos.guirlandes.src} alt="" fill placeholder="blur" sizes="100vw" quality={60} className="object-cover" />
      </div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-night/82" />
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
        <h2 id="bandeau-titre" className="text-3xl font-semibold text-white sm:text-5xl">
          Une communauté chaleureuse, ouverte à tous
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-white">
          Fêtes, cours, offices et activités pour les enfants : votre soutien fait vivre le Beth Habad toute l&apos;année.
        </p>
        <DonateButton size="lg" className="mt-8" />
      </div>
    </section>
  );
}
