import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { formatTime } from "@/lib/format";
import { AdminPage, Flash } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/fields";
import { ServicesNoteForm, ServiceTimeForm } from "@/components/admin/service-forms";
import { DAY_OPTIONS, OFFICE_OPTIONS } from "@/components/admin/service-options";
import { trashServiceTime } from "./actions";

export const instant = false;
export const metadata = { title: "Horaires des offices" };

export default async function AdminOfficesPage({ searchParams }: PageProps<"/admin/offices">) {
  await requireMember();
  const { message } = await searchParams;
  const supabase = await createSessionClient();
  const [{ data: rows }, { data: settings }] = await Promise.all([
    supabase.from("service_times").select("*").is("deleted_at", null).order("sort_order").order("time", { nullsFirst: false }),
    supabase.from("settings").select("services_note").eq("id", 1).single(),
  ]);
  const officeLabel = Object.fromEntries(OFFICE_OPTIONS.map((o) => [o.value, o.label]));

  return (
    <AdminPage title="Horaires des offices">
      <Flash code={message} />

      <p className="-mt-3 mb-6 text-ink-muted">
        Les offices du vendredi soir et du Chabbat se règlent dans{" "}
        <Link href="/admin/ce-chabbat" className="font-semibold text-night underline underline-offset-4">
          Ce Chabbat
        </Link>
        .
      </p>

      <section className="mb-8 rounded-xl border border-line bg-surface p-4">
        <ServicesNoteForm note={settings?.services_note ?? ""} />
      </section>

      {DAY_OPTIONS.map((day) => {
        const items = (rows ?? []).filter((r) => r.day_type === day.value);
        return (
          <section key={day.value} aria-labelledby={`jour-${day.value}`} className="mb-6">
            <h2 id={`jour-${day.value}`} className="mb-2 text-2xl text-night">
              {day.label}
            </h2>
            {items.length === 0 ? (
              <p className="text-ink-muted">Aucun horaire.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((r) => (
                  <li key={r.id} className="rounded-xl border border-line bg-surface p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-bold">{officeLabel[r.office]}</p>
                      <p className="text-right">
                        {r.time && <span className="block text-xl font-bold text-night">{formatTime(r.time)}</span>}
                        {r.note && <span className="block text-sm text-ink-muted">{r.note}</span>}
                      </p>
                    </div>
                    <details className="mt-2">
                      <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-night underline underline-offset-4">
                        Modifier
                      </summary>
                      <div className="mt-3 space-y-3">
                        <ServiceTimeForm
                          submitLabel="Enregistrer"
                          values={{
                            id: r.id,
                            office: r.office,
                            dayType: r.day_type,
                            time: r.time?.slice(0, 5) ?? "",
                            note: r.note ?? "",
                            sortOrder: String(r.sort_order),
                          }}
                        />
                        <ActionButton action={trashServiceTime} hidden={{ id: r.id }} variant="danger" confirm="Supprimer cet horaire ?">
                          Supprimer cet horaire
                        </ActionButton>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <section aria-labelledby="ajouter" className="mt-8 rounded-xl border-2 border-dashed border-gold bg-surface p-4">
        <h2 id="ajouter" className="mb-3 text-2xl text-night">
          Ajouter un horaire
        </h2>
        <ServiceTimeForm submitLabel="Ajouter" values={{ office: "chaharit", dayType: "semaine", time: "", note: "", sortOrder: "0" }} />
      </section>
    </AdminPage>
  );
}
