import path from "node:path";

import type { NextConfig } from "next";

const assetPrefix = process.env.ASSET_PREFIX || '';

const nextConfig: NextConfig = {
  output: "export",
  assetPrefix,
  images: { unoptimized: true },
  /* Every corner of the map has chrome; Next still reports build and runtime errors without the badge */
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
      /* Hairline's kernel ships as a plain script; this exports its HL without editing the file */
      "*.js": {
        condition: { path: /src\/lib\/hairline\/kernel\.js$/ },
        loaders: [path.resolve("src/lib/hairline/export-kernel.cjs")],
      },
    },
  },
};

export default nextConfig;
