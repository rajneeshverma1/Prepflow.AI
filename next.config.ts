import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Keep pdfjs-dist and pdf-parse out of the server bundle so the ESM dynamic
  // import works correctly in API routes (they are loaded from node_modules at runtime)
  serverExternalPackages: ['pdfjs-dist', 'pdf-parse', '@napi-rs/canvas'],
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
