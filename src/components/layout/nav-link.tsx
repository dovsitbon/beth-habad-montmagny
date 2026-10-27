"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Lien de navigation qui signale la page courante (aria-current). */
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
      ? "rounded-md px-2 py-2 text-[0.95rem] font-semibold whitespace-nowrap transition-colors hover:bg-night-tint hover:text-night aria-[current=page]:text-night aria-[current=page]:underline aria-[current=page]:decoration-gold aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
      : "flex min-h-12 items-center border-b border-line py-3 font-serif text-2xl text-ink aria-[current=page]:text-gold-ink";

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`${styles} text-ink`}>
      {children}
    </Link>
  );
}
