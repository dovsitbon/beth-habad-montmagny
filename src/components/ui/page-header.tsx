import Image, { type StaticImageData } from "next/image";

/**
 * En-tête commun des pages intérieures (bandeau bleu avec filet doré).
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
    <div className="relative isolate overflow-hidden bg-night text-white">
      {image && (
        <>
          <Image
            src={image}
            alt=""
            fill
            priority
            fetchPriority="high"
            placeholder="blur"
            sizes="100vw"
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
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold" />
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 sm:px-6 sm:pt-14 sm:pb-16">
        {eyebrow && <p className="text-sm font-semibold tracking-[0.18em] text-gold-soft uppercase">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-white sm:text-5xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg text-white/90">{children}</div>}
      </div>
    </div>
  );
}
