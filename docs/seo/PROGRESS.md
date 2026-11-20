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
- [~] **M7 Speed** — done: hero `<img>` width/height + eager/high priority (event, blog), immutable caching for /_astro and /og. *Not done: other hero images (ibadah/about/dakwah), compress 4 images >600 KB, font preload, island hydration review, Lighthouse before/after, `src/assets` migration.*
- [ ] **M8 Launch** — inventory (DNS, Netlify rules: Netlify has no redirects, only headers, already ported), GSC/Bing, both domains on Worker, cutover, monitoring (Phase 10–11). **Owner actions required.**

## Decisions needed from the owner
| # | Question | Default if no answer |
|---|---|---|
| D1 | Current official address of Masjid Al Hikmah? (content has both *Medlerstraat 4, 2531 HA* and *Heeswijkplein 170*) | Block Event `location` address markup until answered; emit `Place` with name only |
| D2 | AI-crawler policy (Cloudflare managed robots.txt / AI Crawl Control): allow, or block training bots? | Leave Cloudflare default, document it |
| D3 | `/tags/*` (91 URLs) and `/categories/*`, `/author/*`: port as pages or 301 to `/blog/`? (check Search Console impressions first) | Port categories+author, 301 tags |
| D4 | `/ramadhan-1444/*`, `/course/`, `/teacher/`, `/notice/`: port or 301? | Port per CLAUDE.md "not yet ported" list; 301 if owner says content is dead |
| D5 | Homepage share image: brand card (stable) or currently promoted event image? | Brand card |
| D6 | Who owns Google Search Console / Bing / `sa-verify` token / Google Business Profile? Which sitemap URL is submitted? | Assume `/sitemap.xml`; keep it working |
| D7 | Worker (recommended) vs dashboard rules for host handling | Worker |
| D8 | X/Twitter handle or other social handles beyond Facebook/Instagram/YouTube? | Omit `twitter:site` |
| D9 | Other subdomains/DNS records on the zone (sholat., email, registration app) | Don't touch; inventory first |
| D10 | Do any Netlify redirect/header rules exist in the Hugo repo that must be ported? | Check `../ppmedenhaag-website` |

## Staging note (current state) — CUTOVER PENDING
**Owner instruction: for now ALL SEO points to `https://website-v2.ppmedenhaag.nl/`.** Default `PUBLIC_SITE_URL` = that origin; live site is still Hugo on www/apex. See SEO-PLAN §2.9. M1 includes the var, the noindex Worker and the per-deploy reminder step in `deploy.yml`, because website-v2 is indexable today.
**Remind the owner at every commit/push/deploy until cutover is done** ("SEO still targets website-v2; cutover to www/apex pending").
- [ ] Cutover step 0: set repo variable `PUBLIC_SITE_URL=https://www.ppmedenhaag.nl`, redeploy, confirm "PRODUCTION deploy" + `seo-audit --production` pass.
- [ ] After cutover: delete the reminder bullet in `CLAUDE.md`, the memory note `project-cutover-pending`, and this banner.

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

## Log
- 2026-11-21 — Implemented M1–M6 + part of M7 in one session (see milestones). Deviation from plan: non-production robots.txt is *permissive* (`Allow: /`) with `X-Robots-Tag: noindex` on every response instead of `Disallow: /`, because a Disallow stops Google from ever seeing the noindex and blocks Facebook/Twitter preview crawlers. All legacy URLs (136) are 301s in `public/_redirects` instead of ported pages. sitemap hreflang uses plain `nl|id|en` (the old `locales` map produced the invalid `en-UK`). ING payment link on the homepage updated (owner request).
- 2026-11-20 — Added to plan/skill/reference: card image for every page (page registry `listSeoPages()`), and source pixel-size rules (upscale cap 1.5×, <400 px / extreme aspect → title card). Still no code.
- 2026-11-20 — Assessment + full plan written (this folder), skill `ppme-seo`, memories. Owner confirmed site replaces both www and apex. No code changed.
