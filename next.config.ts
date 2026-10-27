import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Photos stockées dans Supabase Storage (bucket public « media »).
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
    // 60 : photos de fond sous un voile bleu (bannières), où la finesse ne se voit pas.
    qualities: [60, 75],
  },
  cacheLife: {
    // Réponses de l'API Hebcal : rafraîchies toutes les 12 h.
    hebcal: {
      stale: 60 * 60,
      revalidate: 60 * 60 * 12,
      expire: 60 * 60 * 48,
    },
  },
  async redirects() {
    // Ancienne page « Le Beth Habad », supprimée : les liens déjà partagés ou indexés mènent à l'accueil.
    return [{ source: "/beth-habad", destination: "/", permanent: true }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
