import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), mdx()],
  output: "server",
  adapter: vercel(),
  trailingSlash: "always",

  i18n: {
    defaultLocale: "nl",
    locales: ["nl", "id", "en"],
    routing: {
        prefixDefaultLocale: false
    },
    redirectToDefaultLocale : true
  }
});