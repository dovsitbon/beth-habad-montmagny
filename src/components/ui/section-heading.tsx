import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";

/**
 * Titre de section : surtitre or en petites capitales espacées, grand titre serif très gras,
 * phrase courte en gris. Centré par défaut.
 */
export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  align = "center",
}: {
  id: string;
  eyebrow: string;
  title: string;
  lead?: string;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-xs font-bold tracking-[0.22em] text-gold-ink uppercase">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-serif text-[2rem] leading-tight font-black text-ink sm:text-[2.6rem]">
        {title}
      </h2>
      {lead && <p className="mt-3 text-lg text-ink-muted">{lead}</p>}
    </div>
  );
}

/** « Tous les horaires → » : lien souligné suivi d'une pastille ronde avec une flèche. */
export function MoreLink({ href, children, external = false }: { href: string; children: React.ReactNode; external?: boolean }) {
  const content = (
    <>
      <span className="underline decoration-ink/40 decoration-1 underline-offset-[6px] transition-colors group-hover:decoration-night">
        {children}
      </span>
      <span
        aria-hidden
        className="inline-flex size-9 items-center justify-center rounded-full bg-night text-white transition-transform group-hover:translate-x-0.5"
      >
        <ArrowRightIcon weight="bold" className="size-4" />
      </span>
    </>
  );
  const className = "group inline-flex min-h-11 items-center gap-3 font-semibold text-ink";
  return external ? (
    <a href={href} target="_blank" rel="noopener" className={className}>
      {content}
      <span className="sr-only"> (nouvel onglet)</span>
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
