import Image, { type StaticImageData } from "next/image";

/**
 * En-tête commun des pages intérieures : carte bleue très arrondie, détachée des bords.
 * Avec `image`, une photo discrète apparaît en fond sous un voile bleu :
 * 90 % côté texte (contraste AA garanti même sur une zone blanche de la photo),
 * qui s'éclaircit vers la droite sur grand écran, là où il n'y a pas de texte.
 */
export function PageHeader({
  eyebrow,
  title,
  image,
  imagePosition = "center",
  children,
}: {
  eyebrow?: string;
  title: string;
  image?: StaticImageData;
  /** object-position CSS, pour cadrer une photo en hauteur (ex. "center 30%"). */
  imagePosition?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-3 mt-3 sm:mx-4">
    <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl bg-night text-white shadow-[var(--shadow-soft)]">
      {image && (
        <>
          <Image
            src={image}
            alt=""
            fill
            priority
            fetchPriority="high"
            placeholder="blur"
            sizes="(min-width: 1152px) 1152px, 100vw"
            quality={60}
            className="-z-20 object-cover"
            style={{ objectPosition: imagePosition }}
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-night/90 lg:bg-transparent lg:bg-linear-to-r lg:from-night/90 lg:from-55% lg:to-night/60"
          />
        </>
      )}
      <div className="px-6 pt-10 pb-11 sm:px-10 sm:pt-14 sm:pb-16">
        {eyebrow && <p className="text-xs font-bold tracking-[0.22em] text-gold-soft uppercase">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-4xl font-black text-white sm:text-5xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg text-white/90">{children}</div>}
      </div>
    </div>
    </div>
  );
}
