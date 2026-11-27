// Post-build SEO audit over dist/. Errors fail the build, warnings are printed.
//   node scripts/seo-audit.mjs [--production]      (also SEO_AUDIT_MODE=production)
// --production additionally requires every absolute URL in the head to use https://www.ppmedenhaag.nl
// (guards the staging -> production cutover). Plan: docs/seo/SEO-PLAN.md Phase 9.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { parse } from "node-html-parser";
import sharp from "sharp";

const DIST = resolve("dist");
const PRODUCTION_ORIGIN = "https://www.ppmedenhaag.nl";
const production = process.argv.includes("--production") || process.env.SEO_AUDIT_MODE === "production";
const origin = (process.env.PUBLIC_SITE_URL || "https://website-v2.ppmedenhaag.nl").replace(/\/+$/, "");
const expectedOrigin = production ? PRODUCTION_ORIGIN : origin;

const errors = [];
const warnings = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

if (production && origin !== PRODUCTION_ORIGIN)
  err("(config)", `production audit but PUBLIC_SITE_URL is "${origin}", expected ${PRODUCTION_ORIGIN}`);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "pagefind" || name === "_astro") continue;
      yield* walk(p);
    } else yield p;
  }
}

const htmlFiles = [...walk(DIST)].filter((f) => f.endsWith(".html"));
const pageOf = (file) => {
  const rel = relative(DIST, file).replace(/\\/g, "/");
  if (rel === "404.html") return "/404.html";
  return "/" + rel.replace(/index\.html$/, "");
};
const localeOf = (path) => (/^\/(id|en)\//.test(path) ? path.split("/")[1] : "nl");

const pages = new Map(); // path -> {alternates, title, description, noindex}
const imageChecked = new Map();
const missingLinks = new Map();
const IGNORED_LINK = /^(\/_astro\/|\/pagefind\/|\/images\/|\/og\/|\/data\/|\/docs\/|\/forms\/|\/icons\/)/;

const redirectRules = existsSync(join(DIST, "_redirects"))
  ? readFileSync(join(DIST, "_redirects"), "utf8")
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => l.trim().split(/\s+/)[0])
  : [];
const redirected = (p) =>
  redirectRules.some((r) => (r.endsWith("*") ? p.startsWith(r.slice(0, -1)) || p === r.slice(0, -2) : p === r));
const fileExists = (p) => {
  const clean = decodeURIComponent(p.split("#")[0].split("?")[0]);
  const f = join(DIST, clean);
  return existsSync(f) && (statSync(f).isFile() || existsSync(join(f, "index.html")));
};

for (const file of htmlFiles) {
  const path = pageOf(file);
  const html = readFileSync(file, "utf8");
  // Component CSS (incl. the self-hosted Inter @font-face) is inlined into every page (inlineStylesheets: "always").
  // On Windows, building from a lower-case drive path (c:\..., e.g. VS Code's terminal) silently drops it -> unstyled site.
  if (!html.includes("@font-face")) err(path, "component CSS missing (no inlined @font-face). On Windows, build from an upper-case C:\\ path (see CLAUDE.md)");
  const root = parse(html, { blockTextElements: { script: true, style: true } });
  const head = root.querySelector("head");
  const meta = (sel) => head.querySelector(sel)?.getAttribute("content");
  const is404 = path === "/404.html";
  const titles = head.querySelectorAll("title");
  const title = titles[0]?.text.trim();
  const description = meta('meta[name="description"]');
  const canonical = head.querySelector('link[rel="canonical"]')?.getAttribute("href");
  const robots = meta('meta[name="robots"]') ?? "";
  const noindex = /noindex/i.test(robots);

  if (titles.length !== 1) err(path, `expected exactly 1 <title>, found ${titles.length}`);
  else if (title.length > 70) warn(path, `title is ${title.length} chars`);
  if (!description) err(path, "missing meta description");
  else if (description.length < 60 || description.length > 160) warn(path, `description length ${description.length} (Google shows ~155-160)`);
  // <html lang> is the language of the text (front matter `contentLang` may differ from the URL locale) and must agree with og:locale.
  const htmlLang = root.querySelector("html")?.getAttribute("lang");
  const ogLang = (meta('meta[property="og:locale"]') ?? "").slice(0, 2);
  if (!htmlLang || (ogLang && htmlLang !== ogLang)) err(path, `html lang "${htmlLang}" does not match og:locale "${ogLang}"`);
  else if (htmlLang !== localeOf(path)) warn(path, `text language "${htmlLang}" differs from URL locale "${localeOf(path)}" (contentLang)`);
  if (noindex && !is404) err(path, "noindex on an indexable page");
  if (is404 && !noindex) err(path, "404 page must be noindex");
  if (production && noindex && !is404) err(path, "noindex in production");

  const expectedCanonical = `${expectedOrigin}${is404 ? "/404/" : path}`;
  if (!canonical) err(path, "missing canonical");
  else if (!is404 && canonical !== expectedCanonical) err(path, `canonical ${canonical} != ${expectedCanonical}`);

  // Open Graph / Twitter
  for (const p of ["og:title", "og:description", "og:url", "og:image", "og:image:width", "og:image:height", "og:type", "og:site_name", "og:locale", "og:image:alt"])
    if (!meta(`meta[property="${p}"]`)) err(path, `missing ${p}`);
  for (const n of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"])
    if (!meta(`meta[name="${n}"]`)) err(path, `missing ${n}`);
  if (meta('meta[property="og:description"]') !== description) warn(path, "og:description differs from description");
  if (meta('meta[property="og:title"]') !== title) warn(path, "og:title differs from <title>");

  const ogImage = meta('meta[property="og:image"]');
  if (ogImage) {
    if (!ogImage.startsWith(`${expectedOrigin}/og/`)) err(path, `og:image not under ${expectedOrigin}/og/: ${ogImage}`);
    const rel = ogImage.replace(expectedOrigin, "");
    if (!imageChecked.has(rel)) {
      const f = join(DIST, decodeURIComponent(rel));
      if (!existsSync(f)) imageChecked.set(rel, "missing");
      else {
        const { width, height, format } = await sharp(f).metadata();
        const bytes = statSync(f).size;
        imageChecked.set(rel, { width, height, format, bytes });
      }
    }
    const info = imageChecked.get(rel);
    if (info === "missing") err(path, `og:image file missing in dist: ${rel}`);
    else {
      if (info.width !== 1200 || info.height !== 630 || info.format !== "jpeg") err(path, `og:image is ${info.width}x${info.height} ${info.format}, expected 1200x630 jpeg`);
      if (info.bytes > 300 * 1024) err(path, `og:image ${Math.round(info.bytes / 1024)} KB (> 300 KB, WhatsApp may drop it)`);
      else if (info.bytes > 250 * 1024) warn(path, `og:image ${Math.round(info.bytes / 1024)} KB (> 250 KB)`);
    }
  }

  // hreflang
  const alts = head.querySelectorAll('link[rel="alternate"][hreflang]').map((l) => [l.getAttribute("hreflang"), l.getAttribute("href")]);
  if (!is404) {
    const self = alts.find(([, href]) => href === expectedCanonical);
    if (alts.length && !self) err(path, "hreflang set has no self-reference");
    if (alts.length && !alts.some(([l]) => l === "x-default")) err(path, "hreflang missing x-default");
    if (!alts.length) warn(path, "no hreflang alternates");
  }

  // JSON-LD
  const ld = head.querySelectorAll('script[type="application/ld+json"]');
  if (!ld.length) err(path, "missing JSON-LD");
  for (const s of ld) {
    try {
      const data = JSON.parse(s.text);
      const types = (data["@graph"] ?? [data]).map((n) => n["@type"]);
      if (!types.includes("WebPage") && !types.includes("CollectionPage") && !types.includes("ContactPage")) err(path, "JSON-LD has no page node");
      for (const n of data["@graph"] ?? []) {
        if (n["@type"] === "Event") {
          for (const k of ["name", "startDate", "location", "eventAttendanceMode", "image"]) if (!n[k]) err(path, `Event missing ${k}`);
        }
        if (n["@type"] === "BlogPosting" || n["@type"] === "Article") {
          for (const k of ["headline", "datePublished", "author", "image"]) if (!n[k]) err(path, `${n["@type"]} missing ${k}`);
        }
      }
      if (production && s.text.includes("website-v2")) err(path, "JSON-LD references the staging host");
    } catch (e) {
      err(path, `JSON-LD does not parse: ${e.message}`);
    }
  }

  if (production) {
    const headHtml = head.toString();
    if (/website-v2\.ppmedenhaag\.nl|workers\.dev/.test(headHtml)) err(path, "head references a non-production host");
  }

  // body checks
  if (!is404) {
    const h1 = root.querySelectorAll("h1").length;
    if (h1 !== 1) warn(path, `${h1} <h1> elements`);
    const noAlt = root.querySelectorAll("img").filter((i) => i.getAttribute("alt") === undefined).length;
    if (noAlt) warn(path, `${noAlt} <img> without alt attribute`);
  }
  for (const a of is404 ? [] : root.querySelectorAll("a[href^='/']")) {
    const href = a.getAttribute("href");
    if (href.startsWith("//") || IGNORED_LINK.test(href)) continue;
    const p = href.split("#")[0].split("?")[0];
    if (!p || fileExists(p) || redirected(p)) continue;
    if (!missingLinks.has(href)) missingLinks.set(href, path);
  }

  pages.set(path, { alts, title, description, noindex, locale: localeOf(path) });
}

// hreflang reciprocity
for (const [path, p] of pages) {
  for (const [, href] of p.alts) {
    if (!href?.startsWith(expectedOrigin)) continue;
    const target = pages.get(href.slice(expectedOrigin.length));
    if (!target) {
      err(path, `hreflang target does not exist: ${href}`);
      continue;
    }
    if (!target.alts.some(([, h]) => h === `${expectedOrigin}${path}`)) err(path, `hreflang target ${href} does not link back`);
  }
}

// duplicates (per locale)
for (const key of ["title", "description"]) {
  const seen = new Map();
  for (const [path, p] of pages) {
    if (path === "/404.html") continue;
    const k = `${p.locale}|${p[key]}`;
    if (seen.has(k)) warn(path, `duplicate ${key} with ${seen.get(k)}`);
    else seen.set(k, path);
  }
}

// sitemap + robots + feeds
for (const f of ["sitemap.xml", "sitemap-index.xml", "sitemap-0.xml", "nl/sitemap.xml", "id/sitemap.xml", "en/sitemap.xml", "robots.txt", "index.xml", "id/index.xml", "en/index.xml", "site.webmanifest"])
  if (!existsSync(join(DIST, f))) err("(site)", `missing ${f}`);
if (existsSync(join(DIST, "sitemap-0.xml"))) {
  const locs = [...readFileSync(join(DIST, "sitemap-0.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const inMap = new Set(locs.map((l) => l.slice(origin.length)));
  for (const l of locs) {
    if (!l.startsWith(expectedOrigin)) err("(sitemap)", `URL not on ${expectedOrigin}: ${l}`);
    else if (!fileExists(l.slice(expectedOrigin.length))) err("(sitemap)", `URL has no page in dist: ${l}`);
  }
  for (const [path, p] of pages)
    if (path !== "/404.html" && !p.noindex && !inMap.has(path) && !expectedOrigin.startsWith("x")) warn(path, "not in sitemap");
}
// A future <lastmod> (e.g. an upcoming event's date) makes search engines distrust every lastmod on the site.
for (const f of ["sitemap.xml", "nl/sitemap.xml", "id/sitemap.xml", "en/sitemap.xml"]) {
  if (!existsSync(join(DIST, f))) continue;
  const now = Date.now() + 60 * 60 * 1000; // 1 h clock slack
  for (const m of readFileSync(join(DIST, f), "utf8").matchAll(/<lastmod>([^<]+)<\/lastmod>/g))
    if (Date.parse(m[1]) > now) err(`(${f})`, `lastmod in the future: ${m[1]}`);
}
if (existsSync(join(DIST, "robots.txt"))) {
  const robots = readFileSync(join(DIST, "robots.txt"), "utf8");
  if (!robots.includes(`Sitemap: ${expectedOrigin}/sitemap.xml`)) err("(robots)", `robots.txt Sitemap line does not point to ${expectedOrigin}/sitemap.xml`);
  if (/^Disallow:\s*\/\s*$/m.test(robots)) err("(robots)", "robots.txt disallows everything");
}

if (missingLinks.size) {
  const sample = [...missingLinks].slice(0, 15).map(([h, p]) => `${h} (on ${p})`);
  warnings.push(`(links) ${missingLinks.size} internal link(s) with no page/redirect, e.g.: ${sample.join("; ")}`);
}

const cardCount = imageChecked.size;
console.log(`\n[seo-audit] ${pages.size} pages, ${cardCount} share images, mode: ${production ? "PRODUCTION" : "staging"}, origin: ${expectedOrigin}`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, 60)) console.log("  - " + w);
  if (warnings.length > 60) console.log(`  … and ${warnings.length - 60} more`);
}
if (errors.length) {
  console.error(`\n${errors.length} ERROR(S):`);
  for (const e of errors.slice(0, 80)) console.error("  x " + e);
  if (errors.length > 80) console.error(`  … and ${errors.length - 80} more`);
  process.exit(1);
}
console.log("\n[seo-audit] OK");
