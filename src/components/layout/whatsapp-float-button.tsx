"use client";

import { useEffect, useState } from "react";

/**
 * Position fixe en bas à droite. Sur téléphone, le bouton n'apparaît qu'après un peu de défilement :
 * en haut de page, il cacherait les raccourcis de l'accueil (dont « Faire un don »), qui contiennent déjà WhatsApp.
 */
export function WhatsAppFloatButton({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 640px)");
    const update = () => setVisible(wide.matches || window.scrollY > 520);
    update();
    window.addEventListener("scroll", update, { passive: true });
    wide.addEventListener("change", update);
    return () => {
      window.removeEventListener("scroll", update);
      wide.removeEventListener("change", update);
    };
  }, []);

  return (
    <div
      inert={!visible}
      className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 transition-[opacity,translate] duration-300 sm:right-6 sm:bottom-6 ${
        visible ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
