import { notFound } from "next/navigation";
import { getPage } from "@/lib/data/content";
import { PageHeader } from "./page-header";
import { RichText } from "./rich-text";

/** Page simple dont tout le texte est modifiable dans l'admin (table pages). */
export async function CmsPage({ slug, eyebrow }: { slug: string; eyebrow?: string }) {
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={page.title} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <RichText html={page.body} className="text-lg" />
      </div>
    </>
  );
}
