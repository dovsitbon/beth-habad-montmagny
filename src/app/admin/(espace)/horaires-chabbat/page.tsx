import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { getCalendar } from "@/lib/hebcal";
import { formatDayLong, formatTime, todayISO } from "@/lib/format";
import { AdminPage, EmptyState, Flash, StatusBadge } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/fields";
import { OverrideForm, ShabbatRulesForm } from "@/components/admin/shabbat-forms";
import { deleteOverride } from "./actions";

export const instant = false;
export const metadata = { title: "Horaires de Chabbat" };

export default async function AdminShabbatPage({ searchParams }: PageProps<"/admin/horaires-chabbat">) {
  await requireMember();
  const { message } = await searchParams;
  const supabase = await createSessionClient();
  const [{ data: settings }, { data: overrides }, calendar] = await Promise.all([
    supabase.from("settings").select("candle_minutes, havdalah_minutes").eq("id", 1).single(),
    supabase.from("shabbat_overrides").select("*").gte("date", todayISO()).order("date"),
    getCalendar(),
  ]);
  const next = calendar ? [calendar.thisShabbat, ...calendar.upcomingShabbatot.slice(0, 3)].filter((s) => s !== null) : [];

  return (
    <AdminPage title="Horaires de Chabbat">
      <Flash code={message} />
      <p className="-mt-3 mb-6 text-ink-muted">
        Les horaires sont calculés automatiquement pour la position du Beth Habad. Vous pouvez remplacer un horaire
        précis si besoin.
      </p>

      <section aria-labelledby="prochains" className="mb-8">
        <h2 id="prochains" className="mb-3 text-2xl text-night">
          Prochains Chabbatot
        </h2>
        {next.length === 0 ? (
          <EmptyState>Calcul momentanément indisponible.</EmptyState>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {next.map((s) => (
              <li key={s.date} className="flex flex-wrap items-baseline justify-between gap-2 p-4">
                <span className="font-semibold first-letter:uppercase">
                  {formatDayLong(s.date)} {s.parasha && <span className="font-normal text-ink-muted">· {s.parasha}</span>}
                </span>
                <span className="text-right">
                  Allumage <strong>{s.candles ? formatTime(s.candles.value) : "—"}</strong> · Havdala{" "}
                  <strong>{s.havdalah ? formatTime(s.havdalah.value) : "—"}</strong>
                  {(s.candles?.overridden || s.havdalah?.overridden) && (
                    <span className="ml-2">
                      <StatusBadge tone="gold">ajusté</StatusBadge>
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="corrections" className="mb-8">
        <h2 id="corrections" className="mb-3 text-2xl text-night">
          Horaires remplacés à la main
        </h2>
        {!overrides?.length ? (
          <p className="text-ink-muted">Aucun horaire remplacé.</p>
        ) : (
          <ul className="space-y-2">
            {overrides.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4">
                <span>
                  <span className="block font-semibold first-letter:uppercase">{formatDayLong(o.date)}</span>
                  {o.kind === "allumage" ? "Allumage" : "Havdala"} à <strong>{formatTime(o.time)}</strong>
                  {o.note && <span className="block text-sm text-ink-muted">{o.note}</span>}
                </span>
                <ActionButton action={deleteOverride} hidden={{ id: o.id }} confirm="Revenir à l'horaire calculé pour cette date ?">
                  Revenir au calcul
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 rounded-xl border-2 border-dashed border-gold bg-surface p-4">
          <h3 className="mb-3 text-xl text-night">Remplacer un horaire</h3>
          <OverrideForm />
        </div>
      </section>

      <section aria-labelledby="regles" className="rounded-xl border border-line bg-surface p-4">
        <h2 id="regles" className="mb-3 text-2xl text-night">
          Règles de calcul
        </h2>
        <ShabbatRulesForm candleMinutes={settings?.candle_minutes ?? 18} havdalahMinutes={settings?.havdalah_minutes ?? null} />
      </section>
    </AdminPage>
  );
}
