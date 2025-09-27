import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

import vercelStatic from '@astrojs/vercel/static';
import tailwindcss from "@tailwindcss/vite";
import { filterSitemapByDefaultLocale, i18n } from "astro-i18n-aut/integration";
import { defineConfig } from "astro/config";
import { defaultLocale, locales } from "./src/data/i18n";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwindcss(),mdx(), i18n({
    locales,
    defaultLocale
  }), sitemap({
    i18n: {
      locales,
      defaultLocale
    },
    filter: filterSitemapByDefaultLocale({
      defaultLocale
    })
  }), react()],
  output: 'static',
  adapter: vercelStatic(),
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
  },
});