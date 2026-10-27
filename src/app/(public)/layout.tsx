import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileDonateBar } from "@/components/layout/mobile-donate-bar";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { OrganizationJsonLd } from "@/components/seo/organization-jsonld";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <OrganizationJsonLd />
      <SiteHeader />
      <AnnouncementBar />
      {/* pb : place pour la barre Don fixe sur mobile */}
      <main id="contenu" className="flex-1 pb-24 sm:pb-0">
        {children}
      </main>
      <SiteFooter />
      <MobileDonateBar />
    </>
  );
}
