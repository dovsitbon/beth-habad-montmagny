/**
 * Affiche un texte de page saisi dans l'admin (HTML nettoyé à l'enregistrement).
 * Les repères « [À COMPLÉTER] » sont mis en évidence pour ne pas passer inaperçus.
 */
export function RichText({ html, className = "" }: { html: string; className?: string }) {
  const highlighted = html.replace(
    /\[À COMPLÉTER\]/g,
    '<mark class="rounded-sm bg-todo px-1.5 py-0.5 text-[0.85em] font-semibold text-todo-ink">[À COMPLÉTER]</mark>',
  );
  return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: highlighted }} />;
}
