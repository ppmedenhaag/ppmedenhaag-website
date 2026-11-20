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

## Milestones
- [ ] **M1 Blockers** — `PUBLIC_SITE_URL` build var (default = website-v2 until cutover) + `deploy.yml` "STAGING deploy — cutover pending" warning/summary on every deploy, edge Worker (noindex on non-prod hosts, apex→www 301, trailing-slash 301), `robots.txt`, `404.astro`, `_headers` caching
- [ ] **M2 Core head** — `Seo.astro`, `utils/seo.ts`, Layout props, derived + hand-written descriptions/titles, hreflang (+self, x-default), og/twitter text tags, canonical, icons/manifest
- [ ] **M3 Previews** — `resolveSocialImage`, sharp 1200×630 pipeline (`/og/*.jpg`), **a distinct card for every page** (hero-image card or generated title card; page registry `listSeoPages()`), build report, platform QA
- [ ] **M4 Rich results** — JSON-LD graph (Organization, WebSite, WebPage, BreadcrumbList, Event, BlogPosting/Article, ContactPage), venues map, date normalizer
- [ ] **M5 Discovery** — sitemap filter/lastmod, `/sitemap.xml` + per-locale split (Hugo-identical), RSS endpoints, IndexNow (optional)
- [ ] **M6 Parity** — decide + implement legacy URLs (tags 91, ramadhan-1444 18, categories 12, author 6, teacher/notice/course/ibadah index), `seo-url-diff` = 0 gaps, `seo-audit` in build
- [ ] **M7 Speed** — image dims/lazy/fetchpriority, compress 4 big images, font preload, island hydration review, Lighthouse before/after (optional 7b: move images to `src/assets`)
- [ ] **M8 Launch** — inventory (DNS, Netlify rules), GSC/Bing, both domains on Worker, cutover, post-launch monitoring (Phase 10–11)

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
- 2026-11-20 — Added to plan/skill/reference: card image for every page (page registry `listSeoPages()`), and source pixel-size rules (upscale cap 1.5×, <400 px / extreme aspect → title card). Still no code.
- 2026-11-20 — Assessment + full plan written (this folder), skill `ppme-seo`, memories. Owner confirmed site replaces both www and apex. No code changed.
