/**
 * Repère visible pour une information pas encore fournie par le Beth Habad.
 * On n'invente jamais un contenu : on affiche ce repère à la place.
 */
export function Todo({ children = "À COMPLÉTER" }: { children?: React.ReactNode }) {
  return (
    <mark className="rounded-sm bg-todo px-1.5 py-0.5 font-sans text-[0.85em] font-semibold text-todo-ink">
      [{children}]
    </mark>
  );
}

/** Étiquette « Exemple » pour les données de démonstration. */
export function ExampleBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-todo px-2 py-0.5 text-xs font-semibold tracking-wide text-todo-ink uppercase">
      Exemple
    </span>
  );
}
