import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { AdminPage, Flash, ListCard, StatusBadge } from "@/components/admin/ui";

export const instant = false;
export const metadata = { title: "Textes des pages" };

/** Où chaque texte apparaît sur le site (pour s'y retrouver). */
const PAGE_PLACES: Record<string, string> = {
  accueil: "Page d'accueil, sous le nom du Beth Habad",
  "beth-habad": "Page « Le Beth Habad »",
  rabbin: "Page « Le Beth Habad », fiche du rabbin",
  cteen: "Page CTeen",
  cours: "Page « Cours et activités »",
  "faire-un-don": "Page « Faire un don »",
  "mentions-legales": "Mentions légales",
  confidentialite: "Politique de confidentialité",
};

export default async function AdminPagesList({ searchParams }: PageProps<"/admin/textes">) {
  await requireMember();
  const { message } = await searchParams;
  const supabase = await createSessionClient();
  const { data: pages } = await supabase.from("pages").select("slug, title, body, updated_at");
  const order = Object.keys(PAGE_PLACES);
  const sorted = (pages ?? []).sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));

  return (
    <AdminPage title="Textes des pages">
      <Flash code={message} />
      <ul className="space-y-3">
        {sorted.map((p) => (
          <li key={p.slug}>
            <ListCard href={`/admin/textes/${p.slug}`}>
              <p className="text-lg font-bold text-night">{p.title}</p>
              <p className="text-sm text-ink-muted">{PAGE_PLACES[p.slug] ?? p.slug}</p>
              {p.body.includes("[À COMPLÉTER]") && (
                <p className="mt-2">
                  <StatusBadge tone="gold">À compléter</StatusBadge>
                </p>
              )}
            </ListCard>
          </li>
        ))}
      </ul>
    </AdminPage>
  );
}
