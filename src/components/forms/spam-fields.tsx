"use client";

import { useEffect, useRef } from "react";

/**
 * Champs anti-spam invisibles :
 *  - « site_web » : pot de miel, caché aux humains (et aux lecteurs d'écran), rempli par les robots ;
 *  - « debut » : heure d'affichage du formulaire, posée par le navigateur (absente chez les robots sans JavaScript).
 */
export function SpamFields() {
  const startedAt = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // defaultValue (et non value) : React réinitialise le formulaire après chaque envoi,
    // l'horodatage doit survivre à cette remise à zéro. Le champ n'a volontairement pas
    // de prop defaultValue, sinon React l'écraserait à chaque nouveau rendu.
    if (startedAt.current) startedAt.current.defaultValue = String(Date.now());
  }, []);

  return (
    <>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Ne pas remplir ce champ
          <input type="text" name="site_web" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input ref={startedAt} type="hidden" name="debut" />
    </>
  );
}
