"use client";

import { useSyncExternalStore } from "react";

// L'heure est revérifiée toutes les 30 s et au retour sur l'onglet : les bascules
// (Chabbat / semaine) se font à l'heure dite, quel que soit l'âge de la page en cache.
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 30000);
  document.addEventListener("visibilitychange", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
    window.removeEventListener("focus", onChange);
  };
}

/**
 * Valeur (texte) qui dépend de l'heure : au premier affichage, celle calculée à `computedAt`
 * (identique au HTML reçu du serveur), puis celle de l'heure réelle du navigateur.
 * `compute` doit renvoyer un texte qui ne change qu'aux moments de bascule (peu de rendus).
 */
export function useNowSnapshot(compute: (now: number) => string, computedAt: number): string {
  return useSyncExternalStore(
    subscribe,
    () => compute(Date.now()),
    () => compute(computedAt),
  );
}
