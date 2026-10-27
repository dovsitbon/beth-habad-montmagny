"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ListIcon, SignOutIcon, XIcon } from "@phosphor-icons/react";
import { signOut } from "@/app/admin/connexion/actions";

/** Menu de l'admin (panneau plein écran, utilisable d'une main). */
export function AdminMenu({ sections, isAdmin }: { sections: { href: string; label: string }[]; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname, search]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => setOpen(false);
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/30 px-3 font-semibold"
      >
        <ListIcon aria-hidden weight="bold" className="size-5" />
        Menu
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Menu de l'espace de gestion"
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-sm bg-canvas p-0 text-ink backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="font-serif text-xl text-night">Menu</p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex size-11 items-center justify-center rounded-md hover:bg-night-tint"
          >
            <XIcon aria-hidden weight="bold" className="size-6" />
            <span className="sr-only">Fermer le menu</span>
          </button>
        </div>
        <nav aria-label="Sections de l'admin" className="px-2 py-2">
          <ul>
            {sections.map((s) => (
              <li key={s.href}>
                <Link href={s.href} className="flex min-h-12 items-center rounded-md px-3 text-lg hover:bg-night-tint">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-line px-4 py-4">
          {isAdmin && <p className="mb-3 text-sm text-ink-muted">Connecté en tant qu&apos;administrateur.</p>}
          <form action={signOut}>
            <button type="submit" className="inline-flex min-h-12 items-center gap-2 font-semibold text-red-800">
              <SignOutIcon aria-hidden weight="bold" className="size-5" />
              Se déconnecter
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
