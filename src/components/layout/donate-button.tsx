import Link from "next/link";
import { HandHeartIcon } from "@phosphor-icons/react/ssr";
import { getSettings } from "@/lib/data/settings";

type Props = {
  className?: string;
  size?: "md" | "lg";
};

/**
 * Bouton « Faire un don ».
 * Si le lien Allodons est renseigné dans les paramètres, il s'ouvre directement dans un nouvel onglet ;
 * sinon on renvoie vers la page /faire-un-don.
 */
export async function DonateButton({ className = "", size = "md" }: Props) {
  const { donationUrl } = await getSettings();
  const sizing = size === "lg" ? "h-14 px-7 text-lg" : "h-11 px-5 text-base";
  const classes = `inline-flex items-center justify-center gap-2 rounded-md bg-gold font-bold whitespace-nowrap text-night-deep transition-[background-color,transform] duration-150 hover:bg-gold-soft active:scale-[0.98] ${sizing} ${className}`;
  const content = (
    <>
      <HandHeartIcon weight="fill" aria-hidden className="size-5 shrink-0" />
      Faire un don
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
