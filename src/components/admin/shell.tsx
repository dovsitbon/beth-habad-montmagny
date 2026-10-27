import Link from "next/link";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/ssr";
import type { Member } from "@/lib/auth";
import { AdminMenu } from "./menu";

export const ADMIN_SECTIONS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/evenements", label: "Événements" },
  { href: "/admin/evenements?categorie=cteen", label: "CTeen" },
  { href: "/admin/inscriptions", label: "Inscriptions" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/annonces", label: "Annonces" },
  { href: "/admin/offices", label: "Horaires des offices" },
  { href: "/admin/horaires-chabbat", label: "Horaires de Chabbat" },
  { href: "/admin/cours", label: "Cours et activités" },
  { href: "/admin/galerie", label: "Galerie photos" },
  { href: "/admin/textes", label: "Textes des pages" },
  { href: "/admin/parametres", label: "Paramètres" },
  { href: "/admin/equipe", label: "Équipe" },
  { href: "/admin/corbeille", label: "Corbeille" },
];

export function AdminShell({ member, children }: { member: Member; children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 bg-night text-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <Link href="/admin" className="mr-auto min-w-0 leading-tight">
            <span className="block truncate font-serif text-lg">Admin</span>
            <span className="block truncate text-xs text-white/70">{member.fullName ?? member.email}</span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm font-semibold whitespace-nowrap text-gold-soft hover:bg-white/10"
          >
            Le site
            <ArrowSquareOutIcon aria-hidden weight="bold" className="size-4" />
            <span className="sr-only">(nouvel onglet)</span>
          </Link>
          <AdminMenu sections={ADMIN_SECTIONS} isAdmin={member.role === "admin"} />
        </div>
      </header>
      <main id="contenu" className="flex-1">
        {children}
      </main>
    </>
  );
}
