import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Docker için küçük, kendi kendine yeten çıktı
  output: process.env.NEXT_E2E ? undefined : "standalone",
  // E2E testleri geliştirme sunucusuyla çakışmasın diye ayrı derleme klasörü kullanabilir
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  cacheComponents: true,
  partialPrefetching: true,
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
