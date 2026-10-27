"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ListIcon, XIcon } from "@phosphor-icons/react";
import { NavLink } from "./nav-link";

type Item = { href: string; label: string };

/** Menu plein écran pour mobile et tablette (caché à partir de xl). */
export function MobileMenu({ items }: { items: readonly Item[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Referme le menu quand on change de page.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 font-semibold text-night"
      >
        {open ? <XIcon weight="bold" aria-hidden className="size-5" /> : <ListIcon weight="bold" aria-hidden className="size-5" />}
        Menu
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="fixed inset-x-0 top-20 bottom-0 z-40 overflow-y-auto bg-canvas px-6 pt-4 pb-28 lg:top-24"
      >
        <nav aria-label="Navigation principale">
          <ul>
            <li>
              <NavLink href="/" variant="panel">
                Accueil
              </NavLink>
            </li>
            {items.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} variant="panel">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
