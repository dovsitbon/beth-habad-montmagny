import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { ArrowSquareOutIcon, HandHeartIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { PageHeader } from "@/components/ui/page-header";
import { RichText } from "@/components/ui/rich-text";
import { Todo } from "@/components/ui/todo";
import { getPage } from "@/lib/data/content";
import { getSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  alternates: { canonical: "/faire-un-don" },
  title: "Faire un don",
  description: `Soutenir le ${siteConfig.name} par un don en ligne sécurisé.`,
};

export default async function DonPage() {
  const [page, settings] = await Promise.all([getPage("faire-un-don"), getSettings()]);

  return (
    <>
      <PageHeader eyebrow="Tsédaka" title="Faire un don">
        <p>Votre soutien fait vivre les activités du Beth Habad, tout au long de l&apos;année.</p>
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_24rem]">
        <div>{page?.body && <RichText html={page.body} className="text-lg" />}</div>

        <aside className="rounded-xl border border-gold/50 bg-surface p-6 sm:p-8">
          <HandHeartIcon aria-hidden weight="duotone" className="size-10 text-gold-ink" />
          <h2 className="mt-3 text-2xl text-night">Don en ligne</h2>
          {settings.donationUrl ? (
            <>
              <p className="mt-2 text-ink-muted">
                Le paiement se fait sur la plateforme sécurisée Allodons, dans un nouvel onglet.
              </p>
              <a
                href={settings.donationUrl}
                target="_blank"
                rel="noopener"
                className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-md bg-gold px-6 text-lg font-bold text-night-deep transition-colors hover:bg-gold-soft"
              >
                Faire un don sur Allodons
                <ArrowSquareOutIcon aria-hidden weight="bold" className="size-5" />
                <span className="sr-only">(nouvel onglet)</span>
              </a>
              <p className="mt-4 flex gap-2 text-sm text-ink-muted">
                <ShieldCheckIcon aria-hidden weight="bold" className="mt-0.5 size-4 shrink-0" />
                Aucune donnée bancaire ne transite par ce site.
              </p>
            </>
          ) : (
            <p className="mt-3">
              Lien de don Allodons <Todo />
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
