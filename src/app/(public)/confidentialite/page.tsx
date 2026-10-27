import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";
import { CmsPage } from "@/components/ui/cms-page";

export const metadata: Metadata = {
  alternates: { canonical: "/confidentialite" },
  title: "Politique de confidentialité",
  description: `Données personnelles collectées par le site du ${siteConfig.name}, durée de conservation et vos droits.`,
};

export default function ConfidentialitePage() {
  return <CmsPage slug="confidentialite" eyebrow="Vos données" />;
}
