import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { loadAdminOccasions } from "@/lib/admin/occasions";
import { AdminPage, EmptyState, Flash } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/fields";
import { WeekForm, type WeekFormSection } from "@/components/admin/week-form";
import { WhatsAppButtons } from "@/components/admin/whatsapp-buttons";
import { formatHeure, minutesToHHMM, toWhatsApp } from "@/lib/horaires/calcul";
import { resetWeek } from "./actions";

export const instant = false;
export const metadata = { title: "Ce Chabbat" };

/** « 2026-10-24 » → « 24/10 » */
const dayMonth = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

export default async function CeChabbatPage({ searchParams }: PageProps<"/admin/ce-chabbat">) {
  await requireMember();
  const { message, semaine } = await searchParams;
  const loaded = await loadAdminOccasions();
  const choices = loaded?.occasions.slice(0, 8) ?? [];
  const occasion = choices.find((o) => o.key === semaine) ?? choices[0];

  if (!loaded || !occasion) {
    return (
      <AdminPage title="Ce Chabbat">
        <EmptyState>Le calcul des horaires est momentanément indisponible. Réessayez dans quelques minutes.</EmptyState>
      </AdminPage>
    );
  }

  const week = loaded.weeks.find((w) => w.date === occasion.key);
  const sections: WeekFormSection[] = occasion.sections.map((s) => ({
    id: s.id,
    label: s.label,
    kidouch: s.kidouch,
    lines: s.lines
      .filter((l) => !l.added)
      .map((l) => ({
        id: l.id,
        label: l.label,
        value: l.minutes === null ? null : minutesToHHMM(l.minutes),
        prefix: l.prefix,
        computed: l.adjusted && l.computed !== null ? formatHeure(l.computed) : null,
        hidden: l.hidden,
        warning: l.warning,
      })),
  }));
  const text = toWhatsApp(occasion);

  return (
    <AdminPage title="Ce Chabbat">
      <Flash code={message} />
      <p className="-mt-3 mb-5 text-ink-muted">
        Les heures sont calculées automatiquement. Changez seulement ce qui est différent cette semaine, puis copiez le
        message pour les groupes WhatsApp.
      </p>

      <nav aria-label="Choisir la semaine" className="-mx-4 mb-6 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {choices.map((o) => {
            const current = o.key === occasion.key;
            return (
              <li key={o.key} className="shrink-0">
                <Link
                  href={`/admin/ce-chabbat?semaine=${o.key}`}
                  aria-current={current ? "page" : undefined}
                  className={`flex min-h-11 flex-col justify-center rounded-lg border px-3 py-1.5 text-sm leading-tight ${
                    current ? "border-night bg-night text-white" : "border-line bg-surface text-night"
                  }`}
                >
                  <span className="font-semibold">{o.title.replace(/^Horaires\s+/i, "")}</span>
                  <span className={current ? "text-white/80" : "text-ink-muted"}>{dayMonth(o.days[0])}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby="message" className="mb-8 rounded-xl border border-line bg-surface p-4">
        <h2 id="message" className="mb-3 text-2xl text-night">
          Message WhatsApp
        </h2>
        <pre className="mb-4 max-h-96 overflow-y-auto rounded-lg bg-canvas p-4 font-sans text-base whitespace-pre-wrap text-ink">
          {text}
        </pre>
        <WhatsAppButtons text={text} />
      </section>

      <section aria-labelledby="modifier" className="mb-8">
        <h2 id="modifier" className="mb-1 text-2xl text-night">
          Modifier cette semaine
        </h2>
        <p className="mb-4 text-ink-muted">Décochez « Afficher » pour retirer une ligne cette semaine seulement.</p>
        {/* La clé force un formulaire neuf quand on change de semaine. */}
        <WeekForm
          key={occasion.key}
          occasionKey={occasion.key}
          sections={sections}
          extras={week?.extra_lines ?? []}
          kidouch={week?.kidouch ?? ""}
          note={week?.note ?? ""}
          title={week?.title ?? ""}
          computedTitle={occasion.computedTitle}
          closing={week?.closing ?? ""}
          computedClosing={occasion.computedClosing}
        />
      </section>

      {week && (
        <section className="mb-8 rounded-xl border border-line bg-surface p-4">
          <p className="mb-3 text-ink-muted">Effacer tous les changements de cette semaine (heures, lignes, Kidouch, note).</p>
          <ActionButton
            action={resetWeek}
            hidden={{ key: occasion.key }}
            variant="danger"
            confirm="Revenir aux horaires calculés et effacer le Kidouch, les lignes ajoutées et la note de cette semaine ?"
          >
            Revenir au calcul automatique
          </ActionButton>
        </section>
      )}

      <p className="text-ink-muted">
        Heures par défaut (Tania, Chaharit, Cours, Minha…) :{" "}
        <Link href="/admin/horaires-chabbat" className="font-semibold text-night underline underline-offset-4">
          règles de calcul
        </Link>
        .
      </p>
    </AdminPage>
  );
}
