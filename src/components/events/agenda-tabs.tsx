import Link from "next/link";

/** Onglets « À venir / Passés » (deux pages distinctes : pas de JavaScript nécessaire). */
export function AgendaTabs({ current, base = "/evenements" }: { current: "upcoming" | "past"; base?: string }) {
  const tabs = [
    { key: "upcoming", href: base, label: "À venir" },
    { key: "past", href: `${base}/passes`, label: "Passés" },
  ] as const;

  return (
    <nav aria-label="Période" className="mb-8 flex gap-2 border-b border-line">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === current ? "page" : undefined}
          className="-mb-px inline-flex min-h-11 items-center border-b-2 border-transparent px-4 font-semibold text-ink-muted hover:text-night aria-[current=page]:border-gold aria-[current=page]:text-night"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
