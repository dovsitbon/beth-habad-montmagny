import Link from "next/link";
import { HeartIcon } from "@phosphor-icons/react/ssr";
import { getSettings } from "@/lib/data/settings";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** gold : bouton principal ; white : sur fond bleu (bandeau don). */
  tone?: "gold" | "white";
  /** Texte visible (« Don » dans l'en-tête). */
  label?: string;
};

/**
 * Bouton « Faire un don », en pilule.
 * Si le lien Allodons est renseigné dans les paramètres, il s'ouvre directement dans un nouvel onglet ;
 * sinon on renvoie vers la page /faire-un-don.
 */
export async function DonateButton({ className = "", size = "md", tone = "gold", label = "Faire un don" }: Props) {
  const { donationUrl } = await getSettings();
  const sizing = { sm: "h-11 px-4 text-[0.95rem]", md: "h-12 px-6 text-base", lg: "h-14 px-8 text-lg" }[size];
  const colors =
    tone === "white" ? "bg-white text-night hover:bg-gold-tint" : "bg-gold text-night-deep hover:bg-gold-soft";
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap shadow-sm transition-[background-color,transform] duration-150 active:scale-[0.97] ${sizing} ${colors} ${className}`;
  const content = (
    <>
      <HeartIcon weight="fill" aria-hidden className="size-[1.1em] shrink-0" />
      {label}
      {label !== "Faire un don" && <span className="sr-only"> (faire un don)</span>}
    </>
  );

  if (donationUrl) {
    return (
      <a href={donationUrl} target="_blank" rel="noopener" className={classes}>
        {content}
        <span className="sr-only">(ouvre le site Allodons dans un nouvel onglet)</span>
      </a>
    );
  }

  return (
    <Link href="/faire-un-don" className={classes}>
      {content}
    </Link>
  );
}
