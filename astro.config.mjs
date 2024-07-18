import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import { i18n, filterSitemapByDefaultLocale } from "astro-i18n-aut/integration";
import { locales, defaultLocale } from "./src/data/i18n";
import vercel from "@astrojs/vercel/serverless";
import sitemap from "@astrojs/sitemap";
import vercelStatic from '@astrojs/vercel/static';
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), mdx(), i18n({
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
  trailingSlash: "always"
});