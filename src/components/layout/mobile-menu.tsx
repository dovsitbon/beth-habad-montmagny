"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ListIcon, PhoneIcon, WhatsappLogoIcon, XIcon } from "@phosphor-icons/react";
import { NavLink } from "./nav-link";

type Item = { href: string; label: string };

/**
 * Bouton menu rond (☰) et panneau plein écran : gros liens faciles à toucher,
 * puis Appeler / WhatsApp / Faire un don. Sur grand écran, il double la barre de liens.
 */
export function MobileMenu({
  items,
  logo,
  contact,
  donate,
}: {
  items: readonly Item[];
  logo: string | null;
  contact: { phone: { label: string; href: string } | null; whatsapp: string | null };
  donate: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Referme le menu quand on change de page.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
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

  const round =
    "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-night transition-colors hover:bg-night-tint";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
        className={round}
      >
        <ListIcon weight="bold" aria-hidden className="size-5" />
        <span className="sr-only">Menu</span>
      </button>

      <div
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!open}
        className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-canvas"
      >
        <div className="mx-auto flex min-h-full max-w-3xl flex-col px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo déjà chargé par l'en-tête */}
            {logo ? <img src={logo} alt="" width={47} height={44} className="h-11 w-auto" /> : <span />}
            <button
              ref={closeRef}
              type="button"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              className={round}
            >
              <XIcon weight="bold" aria-hidden className="size-5" />
              <span className="sr-only">Fermer le menu</span>
            </button>
          </div>

          <nav aria-label="Navigation principale" className="mt-6">
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

          <div className="mt-auto grid gap-3 pt-8">
            {donate}
            <div className="grid grid-cols-2 gap-3">
              {contact.phone && (
                <a
                  href={contact.phone.href}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-night/25 bg-surface font-semibold text-night"
                >
                  <PhoneIcon aria-hidden weight="fill" className="size-5" />
                  Appeler
                </a>
              )}
              {contact.whatsapp && (
                <a
                  href={contact.whatsapp}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp font-semibold text-white"
                >
                  <WhatsappLogoIcon aria-hidden weight="fill" className="size-5" />
                  WhatsApp
                  <span className="sr-only"> (nouvel onglet)</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
