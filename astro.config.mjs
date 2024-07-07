import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import { i18n, filterSitemapByDefaultLocale } from "astro-i18n-aut/integration";
import { locales, defaultLocale } from "./src/data/i18n";
import vercel from "@astrojs/vercel/serverless";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), mdx(), i18n({
    locales,
    defaultLocale
  }), sitemap({
    i18n: {
      locales,
      defaultLocale,
    },
    filter: filterSitemapByDefaultLocale({ defaultLocale }),
  }),
  ],
  output: "server",
  adapter: vercel(),
  trailingSlash: "always"
});