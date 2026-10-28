"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClockIcon } from "@phosphor-icons/react";
import { bandeauAt, type Bandeau, type HomeWindow, type OfficeRow } from "@/lib/horaires/bandeau";
import { useNowSnapshot } from "@/components/shabbat/use-now-snapshot";

type Props = { windows: HomeWindow[]; offices: OfficeRow[]; computedAt: number; timeZone: string };

/**
 * Bandeau du haut quand aucune annonce n'est publiée : les offices du jour, ou les horaires
 * de Chabbat du vendredi 8 h à la fin de Chabbat. Bascule dans le navigateur, à l'heure de Paris.
 */
export function ScheduleBar({ windows, offices, computedAt, timeZone }: Props) {
  const state = useNowSnapshot((now) => JSON.stringify(bandeauAt(windows, offices, now, timeZone)), computedAt);
  const bandeau = JSON.parse(state) as Bandeau | null;
  // Sur l'accueil, la carte « Aujourd'hui » affiche déjà ces horaires, en plus grand.
  const home = usePathname() === "/";
  if (!bandeau || home) return null;

  const chabbat = bandeau.kind === "chabbat";
  const [first, ...rest] = chabbat ? bandeau.parts : [bandeau.day, ...bandeau.parts];
  return (
    <section aria-label={chabbat ? "Horaires de Chabbat" : "Offices du jour"} className="mx-auto mt-3 w-full max-w-6xl px-3 sm:px-4">
      <Link
        href={chabbat ? "/horaires" : "/offices"}
        className="flex items-start gap-2.5 rounded-2xl bg-gold-tint px-4 py-2.5 text-[0.95rem] leading-snug text-ink ring-1 ring-gold/40 hover:underline sm:items-center sm:px-5"
      >
        <ClockIcon aria-hidden weight="fill" className="mt-0.5 size-5 shrink-0 text-night sm:mt-0" />
        <span className="line-clamp-2">
          <strong className="font-semibold text-night">{first}</strong>
          {rest.map((part) => (
            <span key={part}>
              <span aria-hidden className="mx-0.5 text-gold-ink">
                {" · "}
              </span>
              <span className="whitespace-nowrap">{part}</span>
            </span>
          ))}
        </span>
      </Link>
    </section>
  );
}
