import Link from "next/link";
import { redirect } from "next/navigation";
import { EyeIcon } from "@phosphor-icons/react/ssr";
import { requireMember } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { mediaUrl } from "@/lib/format";
import { AdminPage, btn } from "@/components/admin/ui";
import { PageForm } from "@/components/admin/page-form";

export const instant = false;
export const metadata = { title: "Modifier un texte" };

/** Adresse publique où le texte est visible. */
const PUBLIC_URL: Record<string, string> = {
  accueil: "/",
  cteen: "/cteen",
  cours: "/cours",
  "faire-un-don": "/faire-un-don",
  "mentions-legales": "/mentions-legales",
  confidentialite: "/confidentialite",
};
/** Textes accompagnés d'une photo (aucun depuis le retrait de la page « Le Beth Habad »). */
const WITH_IMAGE = new Set<string>();

export default async function EditPageText({ params }: PageProps<"/admin/textes/[slug]">) {
  await requireMember();
  const { slug } = await params;
  const supabase = await createSessionClient();
  const { data: page } = await supabase.from("pages").select("*").eq("slug", slug).maybeSingle();
  if (!page) redirect("/admin/textes?message=introuvable");

  return (
    <AdminPage
      title={page.title}
      backHref="/admin/textes"
      backLabel="Textes des pages"
      actions={
        PUBLIC_URL[slug] && (
          <Link href={PUBLIC_URL[slug]} target="_blank" className={btn.small}>
            <EyeIcon aria-hidden weight="bold" className="size-4" />
            Voir sur le site
          </Link>
        )
      }
    >
      <PageForm
        withImage={WITH_IMAGE.has(slug)}
        mediaBaseUrl={mediaUrl("").replace(/\/$/, "")}
        values={{ slug: page.slug, title: page.title, body: page.body, imagePath: page.image_path ?? "" }}
      />
    </AdminPage>
  );
}
