# SEO work — progress & handoff

Plan: [`SEO-PLAN.md`](./SEO-PLAN.md) · Skill: `.claude/skills/ppme-seo/SKILL.md` · Last updated: 2026-11-20 (planning only; **no code written**).

## How to resume (read this first)
1. Read `SEO-PLAN.md` (§0 scope + §3 phases) and the skill. Load the skill with `/ppme-seo`.
2. Pick the first unchecked milestone below (M1 → M8). One milestone = one PR/commit series; push to `main` auto-deploys, so keep `npm run build` green.
3. Before touching code, re-verify the baseline you depend on (hosts, sitemap counts) — the live site changes (new events every week).
4. Update the checkboxes here and the "Log" at the bottom at the end of each session. Update `CLAUDE.md` when a milestone changes a convention.

## Fixed facts (confirmed by owner)
- **This Astro site replaces BOTH `www.ppmedenhaag.nl` and `ppmedenhaag.nl`.** Canonical = `https://www.ppmedenhaag.nl`; apex 301 → www.
- URL preservation is a hard constraint (see `CLAUDE.md`).

## Milestones (implemented 2026-11-20/21, one overnight session; all verified with build + audit + local wrangler)
- [x] **M1 Blockers** — `PUBLIC_SITE_URL` (default website-v2) + `deploy.yml` STAGING/PRODUCTION notice, edge Worker `worker/index.js` (apex→www 301, trailing-slash 301, `index.html` 301, noindex on every non-www host; unit-tested + wrangler dev), `robots.txt` endpoint, `404.astro`, `_headers` caching. *Verified live on website-v2 after the first CI run (noindex header, 301s, sitemaps, feeds, og card 200 immutable, social-crawler UAs get 200).*
- [x] **M2 Core head** — `Seo.astro`, registry + `utils/seo.ts`, derived descriptions, localized hand-written copy for code-driven pages, hreflang (+self, x-default), og/twitter, canonical, icons/manifest. *Not done: hand-written descriptions for individual ibadah/about pages (derived for now), `contentLang` for Indonesian text under /nl/.*
- [x] **M3 Previews** — registry-driven 1200×630 cards for every page (257 hero-image cards, 21 generated title cards), size rules, cache, build report. *Not done: real WhatsApp/Telegram/Facebook test (needs a human + the deployed host), `social_image` is supported but unused.*
- [x] **M4 Rich results** — JSON-LD graph (Organization, WebSite, page node, BreadcrumbList, Event, BlogPosting/Article). *Open: venue street address (D1), Rich Results Test not run (needs the deployed URL).*
- [x] **M5 Discovery** — `/sitemap.xml` + `/nl|id|en/sitemap.xml` (Hugo-identical, lastmod), RSS (18 feeds, same set as Hugo). *Not done: IndexNow.*
- [x] **M6 Parity** — `seo-audit` in the build, `seo-url-diff` = 0 missing (274 served 1:1, 136 via `_redirects`), `/ibadah/` index pages added. *Decision D3/D4 still open: the 136 legacy URLs are 301-redirected, not ported (tags/categories/author → blog, ramadhan-1444/notice → event, course/teacher → about).*
- [x] **M7 Speed (automatable part)** — hero `<img>` width/height + eager/high priority on every detail page (event, blog, ibadah, about, dakwah), 8 oversized images shrunk (-8 MB, `scripts/optimize-images.mjs`), Latin Inter font preloaded, immutable caching for /_astro and /og, Lighthouse baseline below. *Not done: responsive `srcset` images (needs `src/assets` migration, Lighthouse estimates ~220-240 KiB saving on mobile), navbar island hydration review (`client:load`, ~34 KiB unused JS).*
- [x] **M8 Launch** — both domains on the Worker, cutover done 2026-11-21 (see "Cutover — DONE" below), Search Console sitemap submitted. *Still open: post-launch monitoring items listed there, Bing Webmaster.*

## Decisions needed from the owner
| # | Question | Default if no answer |
|---|---|---|
| D1 | ~~Current official address of Masjid Al Hikmah?~~ **ANSWERED 2026-11-21: Medlerstraat 4, 2531 HA Den Haag.** Footer, `VENUES` (JSON-LD) and **every** event/body mention of the old *Heeswijkplein 170, 2531 HK* were changed to *Medlerstraat 4, 2531 HA* (owner instruction). | Done |
| D2 | AI-crawler policy (Cloudflare managed robots.txt / AI Crawl Control): allow, or block training bots? | Leave Cloudflare default, document it |
| D3 | `/tags/*` (91 URLs) and `/categories/*`, `/author/*`: port as pages or 301 to `/blog/`? (check Search Console impressions first) | Port categories+author, 301 tags |
| D4 | `/ramadhan-1444/*`, `/course/`, `/teacher/`, `/notice/`: port or 301? | Port per CLAUDE.md "not yet ported" list; 301 if owner says content is dead |
| D5 | Homepage share image: brand card (stable) or currently promoted event image? | Brand card |
| D6 | Who owns Google Search Console / Bing / `sa-verify` token / Google Business Profile? Which sitemap URL is submitted? | Assume `/sitemap.xml`; keep it working |
| D7 | Worker (recommended) vs dashboard rules for host handling | Worker |
| D8 | X/Twitter handle or other social handles beyond Facebook/Instagram/YouTube? | Omit `twitter:site` |
| D9 | Other subdomains/DNS records on the zone (sholat., email, registration app) | Don't touch; inventory first |
| D10 | Do any Netlify redirect/header rules exist in the Hugo repo that must be ported? | Check `../ppmedenhaag-website` |

## Cutover — DONE 2026-11-21
`www.ppmedenhaag.nl` and `ppmedenhaag.nl` are served by the Worker (`wrangler.jsonc` routes, commit `fa15e71`); repo variable
`PUBLIC_SITE_URL=https://www.ppmedenhaag.nl` is set (do not remove: the code default is the staging origin, `deploy.yml` warns if it is
missing). Runbook: [`CUTOVER-CHECKLIST.md`](./CUTOVER-CHECKLIST.md). Rollback to Netlify/Hugo: [`ROLLBACK-PLAN.md`](./ROLLBACK-PLAN.md).
Verified right after: deploy green (PRODUCTION, `seo-audit` passed, cache purge + IndexNow ran); www 200 without `x-robots-tag`; canonical/`og:url` = www;
robots.txt `Sitemap:` = www; apex → www 301; website-v2 still `noindex`; Simple Analytics present; `/zakat` → `/ibadah/sadaqah/`
(3 hops over http: Cloudflare "Always Use HTTPS" → Worker → `_redirects`; accepted). Search Console: `https://www.ppmedenhaag.nl/sitemap.xml`
submitted, status Success.

Afterwards (owner):
- [ ] Search Console: check the child sitemaps show page counts after 1–2 days; URL-inspect + request indexing for the homepage and ~5 key pages; watch Indexing → Pages for 2 weeks.
- [ ] Real WhatsApp share test; `npm run seo:diff -- --write` against the live site (must be 0 missing).
- [ ] Keep the Netlify site unlinked for ≥ 2 weeks (until ~2026-12-05) as rollback; never delete the Netlify team (`sholat`, `tpa` live there). Check `sholat`/`tpa` keep valid HTTPS (HSTS `includeSubDomains` is live on www).
- [ ] Optional clean-up after the rollback window: drop the `website-v2` route and set `workers_dev: false` in `wrangler.jsonc`.

## Open questions to verify with data (no owner needed)
- Does `@astrojs/sitemap` `i18n` emit alternates only for existing pages? (inspect `dist/sitemap-0.xml`)
- Exact Hugo RSS feed list (crawl live `/index.xml` + section/locale variants).
- Which older entries have wrong DST offsets in `date`? (script: compare offset vs Europe/Amsterdam)
- Which `/nl/` entries are actually Indonesian text? (language heuristic → `contentLang`)
- Lighthouse baselines for Hugo vs Astro on 8 URLs.

## Baseline snapshot (2026-11-20) for before/after comparisons
Hugo live: sitemap 410 URLs (nl 166 / id 164 / en 80); title+og+hreflang(home only); no canonical/Twitter/JSON-LD/robots.txt.
Astro (workers.dev): sitemap 274 URLs; title only; 246/264 empty descriptions; 261/264 entries have a hero image (mostly 800×600).
Missing vs live: 136 URLs (91 tags, 18 ramadhan-1444, 12 categories, 6 author, 3 teacher, 3 notice, 3 ibadah index, 3 course). Staging hosts indexable. Trailing-slash redirect = 307.

## Lighthouse baseline (mobile, 2026-11-21, one run each)
| page | perf | SEO | a11y | best-pr. | LCP |
|---|---|---|---|---|---|
| Hugo home (www) | 71 | 100 | 87 | 89 | 5.5 s |
| **Astro home (website-v2)** | **93** | 69* | 100 | 100 | 3.1 s |
| Hugo event | 82 | 100 | 91 | 89 | 4.1 s |
| **Astro event** | **90** | 69* | 93 | 100 | 3.4 s |
* the only failing SEO audit is `is-crawlable` = the deliberate staging `X-Robots-Tag: noindex`; it passes after the cutover. Re-run after cutover: `npx lighthouse@12 <url> --only-categories=performance,seo,accessibility,best-practices`.

## Log
- 2026-11-21 (3) — Pre-cutover review (live Hugo vs website-v2: 962 Hugo build paths probed, 281 pages / 764 resources crawled, page-by-page content diff) and fixes: 20 Hugo `aliases:` short links + `/nl/` + `/<section>/page/N/` + contact feeds → `_redirects`; Worker: http→https in the same single 301, `/404` loop fixed, `//` collapsed, `npm run test:worker`; contact form back on the Hugo Formspree form + honeypot + direct-contact block; email/IBAN in footer; Simple Analytics restored (production builds only); optional cache purge in deploy.yml (`CLOUDFLARE_ZONE_ID`). Performance: map SVG moved out of every page (homepage HTML 110→51 KB), WebP srcset variants for heroes/cards/CTA, navbar `client:idle`. Quick gains: add-to-calendar (.ics + Google), WhatsApp/copy/native share, donation box with QR on Sadaqah + homepage band, Maps "Route" links, "upcoming" label. Visual: hero letterbox, CTA date clipping on phones, subject field border, 404 search button, unique `<title>` for duplicate legacy titles, flyer `<h1>`, alt texts, NL form typos. Found + guarded a Windows build bug (building from lower-case `c:\` drops all component CSS → now a seo-audit error). Runbook: `CUTOVER-CHECKLIST.md`.
- 2026-11-21 (2) — Owner: Masjid Al Hikmah address is Medlerstraat 4, 2531 HA Den Haag → footer, JSON-LD venue + Organization address and all former "Heeswijkplein 170 / 2531 HK" mentions in content changed (note: some flyer *images* may still print the old address). Fixed the mobile pagination ("1 / 10" with number buttons: `inline-flex` in the shared class string beat `hidden`). Automated recommendations done: image optimization, hero dims everywhere, font preload, `scripts/check-content.mjs` (26 wrong DST offsets fixed so displayed times match the live site, e.g. Eid 08:00 instead of 07:00; `contentLang` for 2 Indonesian events under /nl and /en, drives <html lang>/og:locale/JSON-LD), hand-written descriptions (dakwah overviews, Geloofsbewijs series), IndexNow key + production-only ping step in deploy.yml.
- 2026-11-21 — Implemented M1–M6 + part of M7 in one session (see milestones). Deviation from plan: non-production robots.txt is *permissive* (`Allow: /`) with `X-Robots-Tag: noindex` on every response instead of `Disallow: /`, because a Disallow stops Google from ever seeing the noindex and blocks Facebook/Twitter preview crawlers. All legacy URLs (136) are 301s in `public/_redirects` instead of ported pages. sitemap hreflang uses plain `nl|id|en` (the old `locales` map produced the invalid `en-UK`). ING payment link on the homepage updated (owner request).
- 2026-11-20 — Added to plan/skill/reference: card image for every page (page registry `listSeoPages()`), and source pixel-size rules (upscale cap 1.5×, <400 px / extreme aspect → title card). Still no code.
- 2026-11-20 — Assessment + full plan written (this folder), skill `ppme-seo`, memories. Owner confirmed site replaces both www and apex. No code changed.
