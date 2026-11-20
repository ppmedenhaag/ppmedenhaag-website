---
name: ppme-seo
description: Implement, review or audit SEO for the PPME Den Haag Astro site (ppmedenhaag.nl) — meta tags, canonical, hreflang, Open Graph/Twitter link-preview images, JSON-LD, sitemap, RSS, robots, redirects/URL parity, Cloudflare Worker host handling, and the cutover from Hugo/Netlify. Use for any SEO, social-share-image, schema.org, sitemap, robots, indexing, Search Console, Core Web Vitals or domain-cutover work, and whenever adding a new page type or content section.
---

# PPME Den Haag — SEO skill

**State (2026-11-21): M1–M6 are implemented. Code map:** `src/data/seo.ts` (constants + hand-written copy), `src/utils/seo-registry.ts` (page registry), `utils/seo.ts` (descriptions), `utils/og.ts` (cards), `utils/jsonld.ts`,
`components/Seo.astro`, `layouts/Layout.astro`, `pages/og/[...path].jpg.ts`, `pages/[...feed]/index.xml.ts`, `pages/robots.txt.ts`, `worker/index.js`, `public/_redirects` + `_headers`, `scripts/{seo-audit,seo-url-diff,sitemap-split,build-icons}.mjs`.
CLAUDE.md has an "SEO" section describing the conventions. When adding a page type: add it to the registry, then run `npm run build` (audit must pass) and `npm run seo:diff`.

**Source of truth: `docs/seo/SEO-PLAN.md` (what/why/acceptance) and `docs/seo/PROGRESS.md` (status, decisions, resume steps).**
Read both before changing anything; update `PROGRESS.md` when done. JSON-LD templates + image specs: `reference/schema-templates.md` (this folder).

## Non-negotiables
- This site **replaces both `www.ppmedenhaag.nl` and `ppmedenhaag.nl`** (owner-confirmed). Canonical host `https://www.ppmedenhaag.nl`; apex 301 → www, one hop.
- **URL preservation** (`CLAUDE.md`): never change a live URL; every live Hugo URL must be 200 or a 301 to a 200. `trailingSlash: "always"`.
- The *same build* is served on workers.dev, `website-v2.ppmedenhaag.nl` and production → host-dependent behaviour (noindex, robots, apex redirect) lives in the **edge Worker**, never in a build flag.
- **Absolute URLs come from `PUBLIC_SITE_URL`** (never a hard-coded host). **Owner instruction: until cutover everything points to `https://website-v2.ppmedenhaag.nl`** (default value); `https://www.ppmedenhaag.nl` only after the cutover flip (repo variable). `seo-audit --production` must pass before any production deploy.
- **Cutover reminder:** while `PUBLIC_SITE_URL` ≠ www, remind the owner on every commit/push/deploy that SEO still targets website-v2 and cutover to www/apex is pending (the deploy workflow also warns). Remove this once cutover is done.
- Never write meta tags by hand in pages: pass props to `Layout.astro` → `Seo.astro`. New section ⇒ add it to `utils/seo.ts` (+ `contentMap` in `Navbar.astro`, `search.section.*` in `ui.ts`, sitemap/RSS, JSON-LD type).
- SEO head is emitted **right after charset/viewport, before any `<style>`/stylesheet** (social crawlers read only the first KB of HTML; Astro inlines large `@font-face` CSS).
- No SaaS for SEO; everything is build-time. Don't add dependencies beyond the plan (sharp, satori, @resvg/resvg-js, small XML/HTML parsers for scripts).

## Conventions
- **Titles** `{page} | PPME Den Haag`, drop the suffix if >~62 chars. **Descriptions** 70–160 chars (target ≤155): front matter → derived from body (skip salutations like "Assalamu'alaikum…", "Beste leden…", strip shortcode residue) → section template. 246/264 entries have empty descriptions, so derivation is the norm.
- **hreflang**: only translations that exist (same `getEntry` check as `Navbar.astro`); always self-reference + `x-default` → nl; absolute URLs; reciprocal.
- **Canonical**: own URL, absolute, trailing slash, no query. Pagination pages self-canonical. 404/search-only pages: `noindex`, no canonical.
- **og:type**: `website` for home/listings/static, `article` for entries. `og:locale` nl_NL / id_ID / en_GB (+alternates for existing translations). Twitter `summary_large_image`.
- **Social image** chain: `social_image` → `image` → first body image → **generated per-page title card** → locale default card (last resort/noindex only). **Every indexable page gets its own card** (homepage, listings, contact, gebedstijden, overviews too), driven by one page registry (`listSeoPages()`); audit fails on default-card fallback or shared images. Never `bg_image` / logos / icons. Output **1200×630 JPEG ≤250 KB** (hard limit 300 KB for WhatsApp), "contain on blurred backdrop" (never crop flyers), URL `/og/{section}/{locale}/{slug}.{hash8}.jpg`, absolute in tags, with width/height/type/alt. Source-size rules (full table in SEO-PLAN Phase 3): foreground is always the whole image `fit: inside`; ≥1200×630 downscale; 600–1199 px upscale capped at 1.5×; 400–599 px natural size on the backdrop (log "low quality"); <400 px or extreme aspect (wider than ~2.4:1 / taller than 1:2) → generated title card; GIF/SVG → first frame. Read true pixel size with sharp `metadata()`; reuse it for `<img width height>` and JSON-LD; report every upscaled/low-quality/card-replaced image in the build report. Don't block `/og/`, `/images/`, `/_astro/` in robots.
- **JSON-LD**: one `@graph` per page with stable `@id`s; Event startDate must carry the correct Europe/Amsterdam offset (front matter offsets are sometimes wrong for DST — normalize from wall-clock digits); omit `endDate` unless parseable; no SearchAction, no FAQ/Review markup.
- **Sitemap**: keep `/sitemap.xml` index + `/nl|id|en/sitemap.xml` (Hugo-identical) and `sitemap-index.xml`; exclude 404/noindex; `lastmod` from content dates; ignore changefreq/priority.
- **Cloudflare**: social + search crawlers must never be challenged (Verified Bots allowed); `/_astro/*` and `/og/*` immutable; Workers assets trailing-slash redirects are 307 → handle with 301 in the Worker.

## Workflow
1. `git status`, read `docs/seo/PROGRESS.md`, pick the next milestone; confirm any needed owner decision (D1–D10) — if unanswered, use the documented default and say so.
2. Implement in small steps; keep `npm run build` (astro check + build + pagefind + audit) green.
3. Verify with evidence, not assumption: `node scripts/seo-audit.mjs` (once built), `curl -sI` for headers/redirects/robots, inspect `dist/` HTML heads, test a real WhatsApp/Telegram/Facebook preview for any image change, Rich Results Test for Event pages.
4. Compare against live Hugo with `scripts/seo-url-diff.mjs` (once built) before any cutover-related change.
5. Update `PROGRESS.md` (checkboxes + Log) and `CLAUDE.md` if a convention changed. Commit only when asked.

## Quick checks (copy/paste)
```bash
curl -sI https://ppmedenhaag.nl/x/ | head -5                       # apex → 301 → www (after cutover)
curl -s  https://www.ppmedenhaag.nl/robots.txt                      # production robots + Sitemap line
curl -sI https://ppme-website.ppme-registration.workers.dev/ | grep -i x-robots-tag   # must be noindex
curl -sL https://www.ppmedenhaag.nl/nl/sitemap.xml | grep -c '<loc>' # URL counts vs live baseline (166/164/80)
```
Live-site baseline and the 136 missing URLs are recorded in `PROGRESS.md`.

## Do not
- Ship `noindex` on production, or leave a non-production host indexable.
- Add canonicals that point to a different locale or to non-existent URLs.
- Generate alternates for translations that don't exist (content translation is intentionally partial).
- Hot-link raw 800×600 flyers as `og:image`, or crop them to 1.91:1.
- Invent facts for structured data (addresses, phone, opening hours, organizer details) — use owner-confirmed data (decision D1) or omit.
