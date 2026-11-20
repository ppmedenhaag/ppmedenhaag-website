import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig, envField } from "astro/config";
import { defaultLocale, locales } from "./src/data/i18n";

// Dev only: serve the Pagefind index that `npm run build` wrote to dist/pagefind, so the search box
// works under `npm run dev` too. The index is a snapshot of the last build (rebuild to refresh it).
const PAGEFIND_DIR = resolve("dist/pagefind");
const PAGEFIND_MIME = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
};
function pagefindDev() {
  return {
    name: "pagefind-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/pagefind", (req, res, next) => {
        const rel = decodeURIComponent((req.url ?? "").split("?")[0]);
        const file = resolve(PAGEFIND_DIR, "." + rel);
        if (!file.startsWith(PAGEFIND_DIR) || !existsSync(file) || !statSync(file).isFile()) {
          return next();
        }
        res.setHeader("Content-Type", PAGEFIND_MIME[extname(file)] ?? "application/octet-stream");
        createReadStream(file).pipe(res);
      });
    },
  };
}

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
    // Build-time inline SVG icons (no client JS). Heroicons outline = same set as the registration app; Tabler only for gaps.
    icon({
      include: {
        heroicons: ["*"],
        // Gap-fillers Heroicons lacks (see .claude/skills/ppme-visual-design: Icons).
        tabler: ["hourglass", "building-mosque", "moon-stars", "pray"],
      },
    }),
  ],
  // Cloudflare Pages serves the static `dist/` output directly — no adapter needed.
  // See .migration/07-deploy-hosting.md in ppmedenhaag-website for why Pages over Workers/Vercel.
  output: "static",
  // Build-time page background: PUBLIC_BACKGROUND=none | pattern | night (default) | leaves.
  // e.g. PowerShell: $env:PUBLIC_BACKGROUND="night"; npm run build   (bash: PUBLIC_BACKGROUND=night npm run build)
  env: {
    schema: {
      PUBLIC_BACKGROUND: envField.enum({
        context: "client",
        access: "public",
        values: ["none", "pattern", "night", "leaves"],
        default: "night",
      }),
    },
  },
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss(), pagefindDev()],
    // Pre-bundle the navbar's React deps up front. Otherwise Vite discovers them lazily,
    // re-optimizes mid-session, and serves 504 "Outdated Optimize Dep" for the old hashes,
    // which makes the Navbar island fail to hydrate (dead menu).
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-dev-runtime",
        "@headlessui/react",
        "@heroicons/react/24/outline",
        "@heroicons/react/20/solid",
      ],
    },
  },
});
