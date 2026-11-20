// Astro integration: after @astrojs/sitemap has written dist/sitemap-0.xml, derive the sitemap layout the live Hugo site
// uses so Search Console submissions keep working:
//   /sitemap.xml            index -> /nl/sitemap.xml, /id/sitemap.xml, /en/sitemap.xml
//   /<locale>/sitemap.xml   the URLs of that locale (nl = unprefixed paths)
// and add <lastmod> (taken from each page's article:published_time meta, when it has one).
// /sitemap-index.xml + /sitemap-0.xml stay in place. Plan: docs/seo/SEO-PLAN.md Phase 6.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LOCALES = ["nl", "id", "en"];
const NS =
  'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml"';

function lastmodFor(distDir, pathname) {
  const file = join(distDir, decodeURIComponent(pathname), "index.html");
  if (!existsSync(file)) return undefined;
  const head = readFileSync(file, "utf8").slice(0, 20000);
  const m = head.match(/<meta property="article:published_time" content="([^"]+)"/);
  return m?.[1];
}

export default function sitemapSplit() {
  return {
    name: "ppme-sitemap-split",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const distDir = fileURLToPath(dir);
        const src = join(distDir, "sitemap-0.xml");
        if (!existsSync(src)) {
          logger.warn("sitemap-0.xml not found; skipping sitemap split");
          return;
        }
        const xml = readFileSync(src, "utf8");
        const urls = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0]);
        const groups = { nl: [], id: [], en: [] };
        let newest = {};
        const withLastmod = urls.map((block) => {
          const loc = block.match(/<loc>([^<]+)<\/loc>/)[1];
          const { pathname } = new URL(loc);
          const lm = lastmodFor(distDir, pathname);
          const out = lm && !block.includes("<lastmod>") ? block.replace("</loc>", `</loc><lastmod>${lm}</lastmod>`) : block;
          const locale = LOCALES.find((l) => l !== "nl" && (pathname === `/${l}/` || pathname.startsWith(`/${l}/`))) ?? "nl";
          groups[locale].push(out);
          if (lm && (!newest[locale] || lm > newest[locale])) newest[locale] = lm;
          return out;
        });
        const origin = new URL(xml.match(/<loc>([^<]+)<\/loc>/)[1]).origin;
        const urlset = (items) => `<?xml version="1.0" encoding="UTF-8"?><urlset ${NS}>${items.join("")}</urlset>`;
        for (const l of LOCALES) {
          const out = join(distDir, l, "sitemap.xml");
          mkdirSync(dirname(out), { recursive: true });
          writeFileSync(out, urlset(groups[l]));
        }
        // Keep the combined map too, now with lastmod.
        writeFileSync(src, urlset(withLastmod));
        const index = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${LOCALES.map(
          (l) =>
            `<sitemap><loc>${origin}/${l}/sitemap.xml</loc>${newest[l] ? `<lastmod>${newest[l]}</lastmod>` : ""}</sitemap>`,
        ).join("")}</sitemapindex>`;
        writeFileSync(join(distDir, "sitemap.xml"), index);
        logger.info(
          `sitemap: /sitemap.xml -> nl ${groups.nl.length}, id ${groups.id.length}, en ${groups.en.length} URLs (${urls.length} total)`,
        );
      },
    },
  };
}
