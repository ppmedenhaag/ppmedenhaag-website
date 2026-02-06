import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

import vercelStatic from '@astrojs/vercel/static';
import tailwindcss from "@tailwindcss/vite";

import { defineConfig } from "astro/config";
import { defaultLocale, locales } from "./src/data/i18n";

// https://astro.build/config
export default defineConfig({
  i18n: {
    defaultLocale: "nl",
    locales: ["nl", "en", "id"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [mdx(), sitemap({
    i18n: {
      locales,
      defaultLocale
    },
  }), react()],
  output: 'static',
  adapter: vercelStatic(),
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
  },
});