import type { Metadata } from "next";
import { CmsPage } from "@/components/ui/cms-page";

export const metadata: Metadata = {
  alternates: { canonical: "/mentions-legales" },
  title: "Mentions légales",
};

export default function MentionsLegalesPage() {
  return <CmsPage slug="mentions-legales" eyebrow="Informations" />;
}
