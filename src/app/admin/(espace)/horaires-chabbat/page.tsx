import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { getSettings } from "@/lib/data/settings";
import { AdminPage } from "@/components/admin/ui";
import { ShabbatRulesForm } from "@/components/admin/shabbat-forms";

export const instant = false;
export const metadata = { title: "Règles de calcul des horaires" };

export default async function AdminShabbatRulesPage() {
  await requireMember();
  const settings = await getSettings();

  return (
    <AdminPage title="Règles de calcul des horaires">
      <p className="-mt-3 mb-6 text-ink-muted">
        Ces règles donnent les heures proposées chaque semaine, pour le Chabbat et les fêtes. Pour changer une heure une
        seule semaine, ajouter le Kidouch ou une ligne, passez par{" "}
        <Link href="/admin/ce-chabbat" className="font-semibold text-night underline underline-offset-4">
          Ce Chabbat
        </Link>
        .
      </p>
      <section className="rounded-xl border border-line bg-surface p-4">
        <ShabbatRulesForm rules={settings.schedule} />
      </section>
    </AdminPage>
  );
}
