/**
 * Manifeste de l'application « Admin Beth Habad » : permet de l'installer sur l'écran
 * d'accueil du téléphone (elle s'ouvre alors en plein écran, comme une application).
 * Limité à /admin : le site public n'est pas concerné.
 */
export function GET() {
  return Response.json(
    {
      name: "Admin Beth Habad",
      short_name: "Admin Beth Habad",
      description: "Espace de gestion du site du Beth Habad",
      lang: "fr",
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      orientation: "portrait",
      background_color: "#FAF7F0",
      theme_color: "#0F2444",
      icons: [
        { src: "/admin-icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/admin-icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/admin-icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
