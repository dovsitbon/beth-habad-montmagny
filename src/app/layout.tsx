import type { Metadata, Viewport } from "next";
import { Assistant, Frank_Ruhl_Libre } from "next/font/google";
import { siteConfig } from "@/config/site.config";
import { getSettings } from "@/lib/data/settings";
import "./globals.css";

// Polices auto-hébergées par next/font : aucun appel à Google côté visiteur (RGPD).
const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["latin", "hebrew"],
  display: "swap",
});

const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["latin", "hebrew"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: settings.name,
      template: `%s · ${settings.name}`,
    },
    description: settings.tagline ?? siteConfig.description,
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: settings.name,
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getSettings();
  return { themeColor: settings.colors.primary };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Couleurs de la charte modifiables par l'admin (table settings).
  const { colors } = await getSettings();

  return (
    <html
      lang="fr"
      className={`${frankRuhl.variable} ${assistant.variable} antialiased`}
      style={
        {
          "--brand-primary": colors.primary,
          "--brand-accent": colors.accent,
        } as React.CSSProperties
      }
    >
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
