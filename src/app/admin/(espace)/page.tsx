import Link from "next/link";
import {
  CalendarPlusIcon,
  ChatCircleTextIcon,
  ClockIcon,
  ImagesIcon,
  ListChecksIcon,
  MegaphoneSimpleIcon,
} from "@phosphor-icons/react/ssr";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { Flash } from "@/components/admin/ui";
import { ADMIN_SECTIONS } from "@/components/admin/shell";

// Page lue à chaque visite (session) : voir le commentaire dans (espace)/layout.tsx.
export const instant = false;
export const metadata = { title: "Tableau de bord" };

/** Les six actions les plus fréquentes, en très gros boutons. */
const MAIN_ACTIONS = [
  { href: "/admin/evenements/nouveau", label: "Ajouter un événement", Icon: CalendarPlusIcon },
  { href: "/admin/offices", label: "Modifier les horaires des offices", Icon: ClockIcon },
  { href: "/admin/annonces/nouvelle", label: "Publier une annonce", Icon: MegaphoneSimpleIcon },
  { href: "/admin/galerie", label: "Ajouter des photos", Icon: ImagesIcon },
  { href: "/admin/inscriptions", label: "Voir les inscriptions", Icon: ListChecksIcon },
  { href: "/admin/messages", label: "Voir les messages", Icon: ChatCircleTextIcon },
];

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const member = await requireMember();
  const { message } = await searchParams;
  const supabase = await createSessionClient();
  const now = new Date().toISOString();

  const [{ count: unread }, { count: upcoming }, { data: regs }] = await Promise.all([
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).is("read_at", null).is("deleted_at", null),
    supabase.from("events").select("id", { count: "exact", head: true }).gte("starts_at", now).is("deleted_at", null).eq("status", "published"),
    supabase.from("registrations").select("party_size, events!inner(starts_at)").gte("events.starts_at", now),
  ]);
  const people = (regs ?? []).reduce((sum, r) => sum + r.party_size, 0);
  const firstName = (member.fullName ?? "").split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6">
      <Flash code={message} />
      <h1 className="text-3xl text-night">Bonjour{firstName ? ` ${firstName}` : ""} !</h1>
      <p className="mt-1 text-ink-muted">Que voulez-vous faire ?</p>

      <ul className="mt-6 grid grid-cols-2 gap-3">
        {MAIN_ACTIONS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex h-full min-h-32 flex-col justify-between gap-3 rounded-xl bg-night p-4 text-lg leading-snug font-bold text-white transition-colors hover:bg-night-soft active:bg-night-deep"
            >
              <Icon aria-hidden weight="duotone" className="size-9 text-gold" />
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="en-bref" className="mt-8">
        <h2 id="en-bref" className="text-xl text-night">
          En bref
        </h2>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Stat label="message(s) non lu(s)" value={unread ?? 0} href="/admin/messages" highlight={(unread ?? 0) > 0} />
          <Stat label="événement(s) à venir" value={upcoming ?? 0} href="/admin/evenements" />
          <Stat label="personne(s) inscrite(s)" value={people} href="/admin/inscriptions" />
        </dl>
      </section>

      <nav aria-labelledby="tout" className="mt-8">
        <h2 id="tout" className="text-xl text-night">
          Tout gérer
        </h2>
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
          {ADMIN_SECTIONS.slice(1).map((s) => (
            <li key={s.href}>
              <Link href={s.href} className="flex min-h-12 items-center justify-between px-4 font-semibold hover:bg-night-tint">
                {s.label}
                <span aria-hidden className="text-gold-ink">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function Stat({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link href={href} className={`rounded-xl border p-3 ${highlight ? "border-gold bg-gold-tint" : "border-line bg-surface"}`}>
      <dd className="font-serif text-3xl text-night">{value}</dd>
      <dt className="text-sm text-ink-muted">{label}</dt>
    </Link>
  );
}
