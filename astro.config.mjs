import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from "astro/config";
import { defaultLocale, locales } from "./src/data/i18n";

// https://astro.build/config
export default defineConfig({
  site: "https://www.ppmedenhaag.nl",
  i18n: {
    defaultLocale: "nl",
    locales: ["nl", "id", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        locales,
        defaultLocale,
      },
    }),
    react(),
  ],
  // Cloudflare Pages serves the static `dist/` output directly — no adapter needed.
  // See .migration/07-deploy-hosting.md in ppmedenhaag-website for why Pages over Workers/Vercel.
  output: "static",
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
  },
});
