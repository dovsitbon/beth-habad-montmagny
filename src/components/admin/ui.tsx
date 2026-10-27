import Link from "next/link";
import { ArrowLeftIcon, CheckCircleIcon, InfoIcon } from "@phosphor-icons/react/ssr";

export { btn } from "./styles";

/** Gabarit d'une page de l'admin : lien retour, titre, actions, contenu. */
export function AdminPage({
  title,
  backHref = "/admin",
  backLabel = "Tableau de bord",
  actions,
  children,
}: {
  title: string;
  backHref?: string | null;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-4 pb-28 sm:px-6">
      {backHref && (
        <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 font-semibold text-gold-ink">
          <ArrowLeftIcon aria-hidden weight="bold" className="size-4" />
          {backLabel}
        </Link>
      )}
      <div className="mt-1 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-night">{title}</h1>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Messages de confirmation transmis par l'adresse (?message=…) après une action. */
const FLASH: Record<string, string> = {
  enregistre: "C'est enregistré.",
  publie: "C'est publié : le site est à jour.",
  brouillon: "Enregistré comme brouillon : ce n'est pas encore visible sur le site.",
  cree: "C'est créé.",
  duplique: "Copie créée. Modifiez-la puis publiez-la.",
  corbeille: "Mis à la corbeille. Vous pouvez le récupérer pendant 30 jours.",
  restaure: "C'est restauré.",
  supprime: "C'est supprimé.",
  recalcule: "C'est fait : les horaires calculés sont rétablis pour cette semaine.",
  invite: "La personne a été ajoutée. Elle peut maintenant se connecter avec son adresse e-mail.",
  "reserve-admin": "Cette partie est réservée à l'administrateur du site.",
  introuvable: "Cet élément n'existe plus (il a peut-être été supprimé).",
};

export function Flash({ code }: { code?: string | string[] }) {
  const text = typeof code === "string" ? FLASH[code] : undefined;
  if (!text) return null;
  const isInfo = code === "reserve-admin" || code === "introuvable";
  return (
    <p
      role="status"
      className={`mb-6 flex gap-3 rounded-lg p-4 font-semibold ${isInfo ? "bg-gold-tint text-ink" : "bg-[#EDF3EC] text-[#2C5530]"}`}
    >
      {isInfo ? (
        <InfoIcon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0" />
      ) : (
        <CheckCircleIcon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0" />
      )}
      {text}
    </p>
  );
}

export function StatusBadge({ tone, children }: { tone: "green" | "gray" | "gold" | "red"; children: React.ReactNode }) {
  const tones = {
    green: "bg-[#EDF3EC] text-[#2C5530]",
    gray: "bg-night-tint text-ink-muted",
    gold: "bg-gold-tint text-gold-ink",
    red: "bg-[#FDEBEC] text-[#8A2A28]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-ink-muted">{children}</p>;
}

/** Carte de liste cliquable (un élément par ligne, adaptée au téléphone). */
export function ListCard({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-gold active:bg-gold-tint"
    >
      {children}
    </Link>
  );
}
