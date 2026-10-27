import type { Metadata } from "next";
import { areaProse, siteConfig } from "@/config/site.config";
import Image from "next/image";
import { PageHeader } from "@/components/ui/page-header";
import { RichText } from "@/components/ui/rich-text";
import { getPage } from "@/lib/data/content";
import { getSettings } from "@/lib/data/settings";
import { mediaUrl } from "@/lib/format";
import { photos } from "@/lib/community-photos";

export const metadata: Metadata = {
  alternates: { canonical: "/beth-habad" },
  title: "Le Beth Habad et le Rabbin",
  description: `Présentation du ${siteConfig.name}, de son histoire et de son rabbin.`,
};

export default async function BethHabadPage() {
  const [presentation, rabbin, settings] = await Promise.all([getPage("beth-habad"), getPage("rabbin"), getSettings()]);

  return (
    <>
      <PageHeader eyebrow="Qui sommes-nous" title={presentation?.title ?? "Le Beth Habad"}>
        <p>{settings.name}, au service de la communauté juive de {areaProse} et des environs.</p>
      </PageHeader>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6 sm:py-16">
        <section aria-labelledby="presentation" className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
          <div>
            <h2 id="presentation" className="text-3xl text-night">
              Notre maison
            </h2>
            <div className="mt-2 h-px w-12 bg-gold" aria-hidden />
            {presentation?.body && <RichText html={presentation.body} className="mt-6 text-lg" />}
          </div>
          {presentation?.image_path && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-night-tint">
              <Image src={mediaUrl(presentation.image_path)} alt="" fill sizes="(min-width: 1024px) 352px, 100vw" className="object-cover" />
            </div>
          )}
        </section>

        <section aria-labelledby="rabbin" className="grid gap-8 rounded-xl border border-line bg-surface p-6 sm:p-10 md:grid-cols-[16rem_1fr]">
          <div className="relative aspect-[3/4] w-full max-w-64 overflow-hidden rounded-lg bg-night-tint">
            {rabbin?.image_path ? (
              <Image src={mediaUrl(rabbin.image_path)} alt={rabbin.title} fill sizes="256px" className="object-cover" />
            ) : (
              // Tant qu'aucun portrait n'est ajouté depuis l'admin : le rabbin lors de la fête de Hanoucca.
              <Image
                src={photos.rabbin.src}
                alt={photos.rabbin.alt}
                fill
                placeholder="blur"
                sizes="256px"
                className="object-cover object-[75%_center]"
              />
            )}
          </div>
          <div>
            <h2 id="rabbin" className="text-3xl text-night">
              {rabbin?.title ?? "Le Rabbin"}
            </h2>
            <div className="mt-2 h-px w-12 bg-gold" aria-hidden />
            {rabbin?.body && <RichText html={rabbin.body} className="mt-6 text-lg" />}
          </div>
        </section>
      </div>
    </>
  );
}
