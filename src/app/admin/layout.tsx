import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { default: "Espace de gestion", template: "%s · Admin Beth Habad" },
  robots: { index: false, follow: false },
  // Application installable sur l'écran d'accueil du téléphone (« Admin Beth Habad »).
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Admin Beth Habad", statusBarStyle: "default" },
  icons: { apple: "/admin-icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0F2444",
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="flex min-h-dvh flex-col bg-canvas">{children}</div>;
}
