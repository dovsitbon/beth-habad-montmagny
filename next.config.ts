import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Photos stockées dans Supabase Storage (bucket public « media »).
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  cacheLife: {
    // Réponses de l'API Hebcal : rafraîchies toutes les 12 h.
    hebcal: {
      stale: 60 * 60,
      revalidate: 60 * 60 * 12,
      expire: 60 * 60 * 48,
    },
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
