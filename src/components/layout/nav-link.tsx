"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Lien de navigation qui signale la page courante (aria-current). Un lien externe s'ouvre dans un nouvel onglet. */
export function NavLink({
  href,
  children,
  variant = "bar",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "bar" | "panel";
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  const styles =
    variant === "bar"
      ? "rounded-full px-3 py-2 text-[0.95rem] font-semibold whitespace-nowrap transition-colors hover:bg-night-tint hover:text-night aria-[current=page]:bg-night-tint aria-[current=page]:text-night"
      : "flex min-h-14 items-center border-b border-line py-2 font-serif text-[1.75rem] font-black text-ink aria-[current=page]:text-gold-ink";

  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener" className={`${styles} text-ink`}>
        {children}
        <span className="sr-only"> (ouvre un autre site dans un nouvel onglet)</span>
      </a>
    );
  }

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`${styles} text-ink`}>
      {children}
    </Link>
  );
}
