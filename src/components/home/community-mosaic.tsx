import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ImagesIcon } from "@phosphor-icons/react/ssr";
import { photos, type CommunityPhoto } from "@/lib/community-photos";

/**
 * Tuiles de la mosaïque, dans l'ordre de lecture.
 * Mobile : 2 colonnes ; grand écran : 4 colonnes. Les photos en hauteur occupent deux rangées.
 */
const tiles: { photo: CommunityPhoto; className: string; sizes: string }[] = [
  { photo: photos.menorahEnfants, className: "row-span-2", sizes: "(min-width: 1024px) 280px, 50vw" },
  { photo: photos.beignets, className: "lg:col-span-2", sizes: "(min-width: 1024px) 560px, 50vw" },
  { photo: photos.cteen, className: "row-span-2", sizes: "(min-width: 1024px) 280px, 50vw" },
  { photo: photos.familles, className: "", sizes: "(min-width: 1024px) 280px, 50vw" },
  { photo: photos.sourires, className: "col-span-2 lg:col-span-1", sizes: "(min-width: 1024px) 280px, 100vw" },
  { photo: photos.pourim, className: "", sizes: "(min-width: 1024px) 280px, 50vw" },
  { photo: photos.conference, className: "lg:col-span-2", sizes: "(min-width: 1024px) 560px, 50vw" },
];

/** Section « La vie de la communauté » de l'accueil : mosaïque de photos et lien vers la galerie. */
export function CommunityMosaic() {
  return (
    <section aria-labelledby="communaute-titre" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16">
      <p className="text-sm font-semibold tracking-[0.14em] text-gold-ink uppercase">En images</p>
      <h2 id="communaute-titre" className="mt-2 text-3xl text-night sm:text-4xl">
        La vie de la communauté
      </h2>

      <ul className="mt-8 grid grid-flow-dense auto-rows-[9.5rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] lg:grid-cols-4 lg:gap-4">
        {tiles.map(({ photo, className, sizes }) => (
          <li key={photo.alt} className={`reveal ${className}`}>
            <figure className="mosaic-tile relative h-full overflow-hidden rounded-xl bg-night-tint">
              <Image src={photo.src} alt={photo.alt} fill placeholder="blur" sizes={sizes} className="object-cover" />
              <figcaption className="mosaic-caption absolute inset-x-0 bottom-0 bg-linear-to-t from-night-deep/90 to-transparent px-4 pt-10 pb-3 font-semibold text-white">
                {photo.caption}
              </figcaption>
            </figure>
          </li>
        ))}
        <li className="reveal col-span-2 lg:col-span-1">
          <Link
            href="/galerie"
            className="flex h-full flex-col justify-between gap-4 rounded-xl bg-night p-5 text-white transition-colors hover:bg-night-deep"
          >
            <ImagesIcon aria-hidden weight="duotone" className="size-9 text-gold-soft" />
            <span className="inline-flex items-center gap-2 font-serif text-2xl">
              Voir la galerie
              <ArrowRightIcon aria-hidden weight="bold" className="size-5 text-gold-soft" />
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
