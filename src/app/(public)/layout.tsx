import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { OrganizationJsonLd } from "@/components/seo/organization-jsonld";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <OrganizationJsonLd />
      <SiteHeader />
      <AnnouncementBar />
      {/* pb : place pour le bouton WhatsApp flottant au bas de la page */}
      <main id="contenu" className="flex-1 pb-20 sm:pb-10">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
