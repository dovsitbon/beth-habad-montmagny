import Link from "next/link";
import {
  CalendarDotsIcon,
  ClockIcon,
  HeartIcon,
  NavigationArrowIcon,
  PhoneIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import { getSettings } from "@/lib/data/settings";
import { directionsUrl, telHref, whatsappHref } from "@/lib/format";

type Shortcut = { href: string; label: string; Icon: Icon; external?: boolean; tone?: "gold" | "green" };

/** Six raccourcis ronds juste sous la carte « Aujourd'hui » (2 rangées de 3 sur téléphone). */
export async function Shortcuts() {
  const s = await getSettings();
  const address = [s.address.street, s.address.postalCode, s.address.city].filter(Boolean).join(", ");
  const items: Shortcut[] = [
    { href: "/horaires", label: "Horaires", Icon: ClockIcon },
    { href: "/evenements", label: "Agenda", Icon: CalendarDotsIcon },
    { href: directionsUrl(address), label: "Itinéraire", Icon: NavigationArrowIcon, external: true },
    ...(s.phone ? [{ href: telHref(s.phone), label: "Appeler", Icon: PhoneIcon }] : []),
    ...(s.whatsapp ? [{ href: whatsappHref(s.whatsapp), label: "WhatsApp", Icon: WhatsappLogoIcon, external: true, tone: "green" as const }] : []),
    { href: s.donationUrl ?? "/faire-un-don", label: "Faire un don", Icon: HeartIcon, external: Boolean(s.donationUrl), tone: "gold" },
  ];

  return (
    <nav aria-label="Accès rapides">
      <ul className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-6 sm:gap-y-4">
        {items.map(({ href, label, Icon, external, tone }) => {
          const circle =
            tone === "gold"
              ? "bg-gold text-night-deep"
              : tone === "green"
                ? "bg-whatsapp text-white"
                : "bg-surface text-night ring-1 ring-line";
          const content = (
            <>
              <span
                aria-hidden
                className={`inline-flex size-[3.25rem] items-center justify-center rounded-full shadow-[var(--shadow-soft)] transition-transform group-hover:-translate-y-0.5 sm:size-16 ${circle}`}
              >
                <Icon weight="fill" className="size-6 sm:size-7" />
              </span>
              <span className="text-sm leading-tight font-semibold text-ink">{label}</span>
            </>
          );
          const className = "group flex min-h-11 flex-col items-center gap-2 text-center";
          return (
            <li key={label}>
              {external || !href.startsWith("/") ? (
                <a href={href} {...(external ? { target: "_blank", rel: "noopener" } : {})} className={className}>
                  {content}
                  {external && <span className="sr-only"> (nouvel onglet)</span>}
                </a>
              ) : (
                <Link href={href} className={className}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
