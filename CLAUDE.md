# CLAUDE.md

Context for Claude Code when working in this repository.

## Project overview

**PPME Den Haag** (ppmedenhaag.nl) — Astro rebuild of the Hugo site for an Indonesian
Islamic community association based at Masjid Al Hikmah, Den Haag. This repo is the
**migration target**; the live site's current source is the sibling repo
`../ppmedenhaag-website` (Hugo). That repo's `.migration/` directory is the
authoritative planning record for this migration — **read it before making structural
decisions here**, especially:

- `.migration/00-high-level-plan.md` — overall scope, decisions made, non-goals
- `.migration/01-project-setup.md` — why this repo (not a fresh scaffold), what was
  reused vs. rebuilt from its prior state
- `.migration/02-content-migration.md` — content collection shape and the exact
  URL-preservation rules (this is load-bearing, see below)
- `.migration/03-layouts-components.md` — Hugo shortcode → MDX/native-TS migration plan
  (not yet implemented here, see "Known gaps" below)
- `.migration/05-seo.md` — SEO gap audit (sitemap/RSS/meta — partially wired, see below)
- `.migration/06-data-i18n-strings.md` — `data/*.yml` → typed-data recreation plan
- `.migration/07-deploy-hosting.md` — Cloudflare Pages, not Vercel/Netlify

## Hard constraint: URL preservation

Every URL this Astro site serves must exactly match the current live Hugo site's URLs —
same path, same trailing slash, same unprefixed-`nl`/prefixed-`id`/`en` pattern. This is
for SEO/historical-link continuity, confirmed with the site owner. Concretely:

- `trailingSlash: "always"` in `astro.config.mjs` is required, not optional.
- Content entry `id`s are the exact original Hugo filename (via `generateId` in
  `content.config.ts`) — never let Astro's default slugify touch them.
- `nl` (default locale) is unprefixed; `id`/`en` are prefixed. Every content type gets
  **two** route files: an unprefixed one filtered to `nl` only
  (`src/pages/<section>/[...slug].astro`) and a `[locale]` dynamic one **explicitly
  excluding `nl`** (`src/pages/[locale]/<section>/[...slug].astro`). The nl-exclusion
  filter (`!id.startsWith("nl/")`) is load-bearing — omitting it silently generates
  unwanted `/nl/...` URLs that don't exist on the live site. See the `event`/`blog`
  routes for the reference implementation.

## Content collections

Defined in `src/content.config.ts` using Astro's Content Layer API (`glob()` loader),
**not** the legacy `type: 'content'` API. One collection per content type (`event`,
`blog`), each spanning all three locales — entries live at
`src/content/<type>/<locale>/<slug>.md`, and the collection `id` becomes
`<locale>/<slug>`. This is deliberately **not** three separate per-locale collections —
see `.migration/02-content-migration.md`'s "Revision" note for why.

Schemas are validated against real front matter in the Hugo source, not assumed — if a
field turns out to be optional in practice (e.g. `speaker[].designation` is missing on
some real entries), the schema reflects that rather than the content being "fixed" to
match a stricter schema.

**Sections migrated so far: `event` (fully audited 2026-11-18: all nl/id/en entries, images, shortcodes, render), `blog` (audited 2026-11-18, `{{< ref >}}`/`{{< param email >}}` resolved), `dakwah`, `about`, `ibadah`.** `about`, `contact`, `dakwah`,
`ibadah`, `notice`, `course`, `teacher`, `ramadhan-1444`, `author` are not yet ported —
follow the same pattern (schema from real front matter, two route files per section,
`nl/`-exclusion filter) when they are.

## i18n conventions

- `astro:i18n` built-ins are used directly: `Astro.currentLocale`,
  `getRelativeLocaleUrl()`. Don't hand-roll locale detection from the URL path except
  where already done in `src/utils/lang.ts` (kept for one legacy non-`.astro` call
  site — check before extending its use).
- `src/data/i18n.ts` — `defaultLocale`, `locales`, `LANG_LIST` (for the language
  switcher), `menuData` (per-locale nav tree). Extend `menuData` as new sections ship;
  don't link to a route that doesn't exist yet.
- `src/data/ui.ts` — small UI-string dictionary (`useTranslations()` helper in
  `utils/lang.ts`). This is a stopgap; `.migration/06-data-i18n-strings.md` has the
  fuller plan for porting Hugo's `i18n/*.yaml`.
- **Language switcher only links to translations that actually exist** — `Navbar.astro`
  checks `getEntry()` per candidate locale before offering a link, because content
  translation is intentionally partial (not 1:1 across `nl`/`id`/`en` — see
  `.migration/02-content-migration.md`). When adding a new section to the switcher,
  add it to `Navbar.astro`'s `contentMap`, not just to `menuData`.

## Styling

Tailwind v4, CSS-first config (`@theme` block in `src/styles/global.css`) — no
`tailwind.config.js`. Visual system: **`.claude/skills/ppme-visual-design`** (shared with the
event-registration app: logo blue `#034EA2`, tokens `brand`/`brand-dark`/`brand-50..400`, `ppme-blue-*`
kept as aliases; slate neutrals; Inter self-hosted via `@fontsource-variable/inter`; flat thin-bordered
tiles, no heavy shadows/rounded-2xl/indigo). Shared classes live in `global.css`: `.btn*`, `.tile*`,
`.page-title`, `.title-rule`, `.eyebrow`, `.section`, `.page-article`, `.prose-brand`, `.field`, `.callout`,
`.app-backdrop`/`.app-grid` (applied in `Layout.astro`). Tailwind v4 gotcha: `@apply` cannot use custom
classes or `group`; use `@utility` or put `group` in the markup. Rules that restyle migrated Markdown HTML (`.prose …` content components: buttons, badges, callouts, accordion, table rows) must stay **unlayered** at the bottom of `global.css` — typography's `utilities`-layer rules beat anything in `@layer components`. `.prose table` rules in the same file
target raw-HTML `<table>` markup (prayer-time schedules use this pattern in the Hugo source — preserve it).

**Page background (build-time parameter):** `PUBLIC_BACKGROUND` = `none` (option 1) | `pattern` (option 2) | `night` (option 3) | `leaves` (option 4) | `map` (option 5, **default**, what is deployed), declared in `astro.config.mjs` via `env.schema` (an invalid value fails the build) and read with `astro:env/client`. `components/PageBackground.astro` picks the layer set used by `Layout.astro`; `Homepage.astro` only draws its CTA-band pattern in `pattern` mode. Set it per build, e.g. PowerShell `$env:PUBLIC_BACKGROUND="night"; npm run build`, bash `PUBLIC_BACKGROUND=night npm run build` (Cloudflare Pages: a build environment variable). `pattern` = a faint batik/ronce tile drawn as five stacked `.app-grid*` layers in `global.css` (different tile sizes and blur strengths, each revealed through its own random radial-gradient mask patches; the tile SVG is inlined as a data-URI and brand-blue/white for the dark CTA band). `night` = `components/NightSky.astro`: build-time seeded stars, sparkles and meteors, pure CSS animation, a sticky viewport-high stage inside the backdrop, honours `prefers-reduced-motion`; it stays on the light theme (brand-blue stars), not a dark page. `leaves` = `components/LeafBackdrop.astro`: build-time seeded branch sprigs + loose leaves (inline SVG, brand blue at low opacity, very slow CSS sway, same sticky-stage trick and reduced-motion handling). `map` = `components/NetherlandsMap.astro`: faint map of the Netherlands: only the country outline (coast, borders, islands) and the Zuid-Holland border are drawn as lines (other province borders deliberately omitted; the outline is the outer half of a stroke via an SVG mask, in one opacity group), Zuid-Holland slightly tinted, Den Haag marked with a pulsing dot and label; paths in `src/data/nl-map.ts`, **generated** by `node scripts/build-nl-map.mjs <provincie GeoJSON>` from PDOK/CBS open data (`https://cartomap.github.io/nl/wgs84/provincie_2023.geojson`) - don't hand-edit. The static artwork is the **generated** `src/assets/nl-map.svg` (`node scripts/build-nl-map-svg.mjs`, also run by `build-nl-map.mjs`), loaded as a hashed `/_astro/` image: inlining it put ~60 KB into every page's HTML. Only the animated Den Haag marker is inline (same viewBox, same `.nl-map__svg` box).

**Shared page pieces (added at the pre-cutover review, 2026-11-21):**
- `data/site.ts` = contact + donation facts (email, Formspree action = the Hugo site's form, address, IBAN, iDEAL link, Maps URLs). Footer, contact page and `DonationBox` read it; change them there.
- `components/Img.astro` + `utils/img.ts` + `src/pages/img/[...path].webp.ts`: build-time WebP `srcset` variants (480/800/1200[/full]) for every `image` in front matter and the homepage CTA, at `/img/<content-hash>/<w>/<name>.webp` (immutable cache). The original public/ path stays the `src`. Use `<Img sizes="card|hero|cta|thumb">` for new card/hero images; images not referenced from front matter/homepage data get no srcset (by design, so a srcset never points at an ungenerated file). Cache: `node_modules/.cache/ppme-img`.
- `components/DonationBox.astro` (`band` on the nl/id homepage, `panel` on the Sadaqah pages): iDEAL button, IBAN + copy, build-time QR of the iDEAL link (`qrcode`, inline SVG).
- `components/ShareBar.astro` (event + blog detail: WhatsApp, copy link, native share sheet) and `components/AddToCalendar.astro` (upcoming events: `/ics/<locale>/<slug>.ics` from `src/pages/ics/[...path].ics.ts` + Google Calendar link; end time parsed from the free-text `duration` by `utils/calendar.ts`, default 2 h). Event cards show an "upcoming" label.
- Global behaviours in `Layout.astro`'s script, by attribute: `[data-copy]` (+`data-copied`, `[data-copy-label]`), `[data-share]` (revealed only where `navigator.share` exists), `[data-expires]` (element removed once the ISO time has passed, so stale builds never show past-event UI). `window.dispatchEvent(new Event("ppme:search"))` opens the search dialog (used by the 404 page).
- Navbar island hydrates `client:idle` (the SSR'd navbar is visible at once).
- `<title>`: entries whose title repeats in one language get their date appended via the registry's `docTitle` (visible heading unchanged).

React is available (`@astrojs/react`, `@headlessui/react`, `@heroicons/react`) for
interactive islands (`src/components/react/*.tsx`, hydrated with `client:idle`/`client:load`/`client:visible` from a
thin `.astro` wrapper, e.g. `Navbar.astro` → `ReactNavbar.tsx`). Keep this pattern for
new interactive UI rather than reaching for a different framework.

## Site search (Pagefind, build-time, no SaaS)

- `npm run build` ends with `pagefind --site dist`, which indexes the **rendered HTML** (one index per `<html lang>`: nl/id/en)
  into `dist/pagefind/`. Drafts, the `nl/` exclusion filter etc. therefore apply automatically.
- `Layout.astro` puts `data-pagefind-body` on `<main>` plus `section` (first path segment) and `lang` filters. Pages that
  shouldn't be indexed (homepage, event/blog listings, contact) pass `searchable={false}` — once any page has
  `data-pagefind-body`, pages without it are skipped. New listing-style pages should do the same.
- UI: `react/Search.tsx` (inside the Navbar island): icon button on mobile, field-style button on desktop, Ctrl/Cmd+K or `/`
  opens a full-screen sheet (phones) / command-palette modal (`sm+`). Strings are `search.*` keys in `data/ui.ts`;
  section labels are `search.section.<segment>` — add one when a new section is added.
- "All languages" toggle uses `mergeIndex("/pagefind/./", {language})` (the `./` dodges Pagefind's same-path skip) and falls back
  to current-language-only if that ever breaks after a Pagefind upgrade.
- **Dev:** `npm run dev` serves the index from `dist/pagefind` (Vite plugin `pagefindDev` in `astro.config.mjs`). Run
  `npm run build` once to create it; it is a snapshot, so rebuild to pick up content changes. Without it the dialog shows a hint.

## Prayer times (replaces the old sholat.ppmedenhaag.nl iframe)

- Times are **generated**: `src/data/prayer/base-winter-time.json` (one winter-time row per calendar day, incl.
  29 Feb = rounded midpoint of 28 Feb/1 Mar) + `prayer/generate.ts` adds +1h in EU summer time (last Sunday of
  March → day before last Sunday of October). Works for 2025 and every later year, no new file needed. Verified
  identical to the old hand-made 2025 and 2026 tables (365/365 days) and 2024 Jun–Dec; 2024 Jan–Apr was an older table.
- **Fallback flip:** `PUBLIC_PRAYER_SOURCE=manual` (build env var) or `DEFAULT` in `prayer/config.ts` switches to the
  hand-maintained `prayer/gebedstijden-<year>.json` files (register them in `MANUAL_SCHEDULES` in `prayer.ts`).
- The yearly page shows the build-time Amsterdam year (generated mode): **rebuild/redeploy on 1 January**
  (e.g. a Cloudflare Pages deploy hook on a yearly cron). The homepage widget rolls over by itself.
- Homepage island: `components/PrayerTimes.astro` → `react/PrayerTimes.tsx` (`client:visible`).
- Yearly page: `/ibadah/gebedstijden/` (+ `/id/…`, `/en/…`) via `PrayerYear.astro`; static route files, no content entry
  (Navbar's language switcher has an `isStaticPage` bypass for it).

## SEO (plan: `docs/seo/SEO-PLAN.md`, status: `docs/seo/PROGRESS.md`, skill: `/ppme-seo`)

- **Origin:** every absolute URL derives from `Astro.site`, set from build env `PUBLIC_SITE_URL` (default
  `https://website-v2.ppmedenhaag.nl` = staging, see `src/data/seo.ts`). Cutover = repo variable
  `PUBLIC_SITE_URL=https://www.ppmedenhaag.nl` (+ DNS). Never hard-code a host. `deploy.yml` prints a STAGING/PRODUCTION notice.
- **Page registry** `src/utils/seo-registry.ts` (`getSeoRegistry()`): every indexable page with title, description, card, hreflang
  alternates, dates. `Layout.astro` looks the page up by `Astro.url.pathname` and renders `components/Seo.astro` (title, description,
  canonical, hreflang + x-default, Open Graph, Twitter, RSS link, JSON-LD) **first in `<head>`**. Code-driven pages get localized
  titles/descriptions from `STATIC_COPY` in `src/data/seo.ts` (their `<Layout>` has no `title`). New page type ⇒ add it to the registry.
- **Descriptions:** front matter, else derived from the body (`utils/seo.ts`: skips greetings, joins to ≥90 chars, ≤155). Events get a
  "date, time · location." prefix.
- **Link-preview cards:** `/og/<locale>/<route>.<hash>.jpg` (1200×630), generated at build by `utils/og.ts` (sharp; satori for title cards)
  through `src/pages/og/[...path].jpg.ts`. Hero image shown whole over a blurred copy (never cropped); no usable image → generated brand
  title card; every page has its own. Cached in `node_modules/.cache/ppme-og` (bump `CARD_VERSION` after changing card layout code).
  Optional front matter `social_image` overrides `image`.
- **JSON-LD** `utils/jsonld.ts` (Organization, WebSite, WebPage/CollectionPage/ContactPage, BreadcrumbList, Event, BlogPosting/Article).
  Venue address is intentionally partial until the owner confirms it (`VENUES` in `data/seo.ts`).
- **Discovery:** `/sitemap.xml` + `/nl|id|en/sitemap.xml` (Hugo-identical, built by `scripts/sitemap-split.mjs`, with lastmod),
  `/sitemap-index.xml`, RSS at `/[locale/][section/]index.xml` (`src/pages/[...feed]/index.xml.ts`, same 18 feeds as Hugo), `robots.txt`
  (endpoint), 404 page, icons + `site.webmanifest` (`scripts/build-icons.mjs`).
- **Edge Worker** `worker/index.js` (wrangler `main`, `run_worker_first` skips static files): http → https, apex → www, trailing slash
  (Workers' own is 307), `/x/index.html`, `//` — all combined into ONE 301; `/404`, `/404/`, `/404.html` serve the 404 page with status 404
  (they used to loop); and **`X-Robots-Tag: noindex` + permissive robots.txt on every host except `www.ppmedenhaag.nl`**
  (website-v2 and workers.dev are noindexed on purpose until cutover). Test: `npm run test:worker`. Static files skip the Worker, so the
  zone setting "Always Use HTTPS" must be on as well. `public/_redirects` 301s the legacy Hugo URLs that are not ported
  (tags/categories/author → blog; ramadhan-1444/notice → event; course/teacher → about), **Hugo's 20 `aliases:` short links**
  (`/zakat/`, `/kelahiran/`, `/mualaf/` …, used on flyers; not in any sitemap), `/nl/*`, list pagination `/<section>/page/N/` and the
  contact-page feeds. New alias in Hugo-style front matter ⇒ add a `_redirects` line (aliases are not read by this site).
- **Gates:** `npm run build` ends with `scripts/seo-audit.mjs` (errors fail the build: head tags, canonical, og image 1200×630 ≤300 KB, hreflang
  reciprocity, JSON-LD, sitemap/robots, staging-origin leak in production mode). `npm run seo:diff -- --write` compares the live Hugo sitemaps
  with `dist/` (must stay at 0 missing; report in `docs/seo/url-diff.md`).

## Known gaps (don't assume these are solved)

- **Event Markdown conventions after the audit:** `{{< youtube >}}` was converted to raw
  responsive `<iframe>` HTML and `{{< ref "blog/x" >}}` to a literal locale-prefixed path in
  `src/content/event/**` (same done for blog and dakwah). Raw HTML in Markdown uses PPME's own
  class names (`btn btn-primary btn-sm`, `badge badge-success`, `callout`, `accordion-*`, `row-brand`, `table-compact`,
  `sticky-col`) plus plain Tailwind utilities (`lg:hidden`, `overflow-x-auto`); no Bootstrap names remain. They are styled by
  the unlayered `.prose` rules at the bottom of `global.css`; `@source "../content"` lets Tailwind see utilities used in Markdown. `@tailwindcss/typography` is installed (it was missing, so `prose` did nothing).
  Blog uses `PostList/PostCard/PostDetail.astro` + `utils/blog.ts` (author/category shown as plain text; Hugo's `/author/`, `/categories/`, `/tags/` taxonomy pages are NOT ported). Event pages share `EventDetail/EventList/EventCard.astro` + `utils/event.ts`.

- **Bestuur (board) section is planned, not built:** `docs/bestuur/PLAN.md` (routes `/bestuur/` + `/bestuur/<slug>/`, content shape,
  wiring checklist, open decisions, source texts). Photos wait in `C:\Users\rosti\Downloads\` (`eddy|hamzah|archi|marwan|gusti|wati.png`, `bestuur-1..3.png`).

- **Hugo shortcodes are not converted.** Migrated content still contains literal
  `{{< youtube ... >}}`, `{{< ref ... >}}`, `{{< param email >}}` text in Markdown
  bodies — it will render as-is (broken-looking) until the MDX/native-TS work in
  `.migration/03-layouts-components.md` is done. Don't be surprised by this in event/blog
  content; it's tracked, not missed.
- **CUTOVER PENDING — remind the owner at every commit/push/deploy.** For now all SEO (canonical, OG, hreflang,
  sitemap, RSS) must point to `https://website-v2.ppmedenhaag.nl/`, not www. When committing, pushing or deploying, end
  with one line: "Reminder: SEO still targets website-v2; cutover to www/apex is pending (docs/seo/PROGRESS.md)." Remove
  this bullet after the cutover step in `docs/seo/SEO-PLAN.md` Phase 10 is done.
- **SEO: implemented (milestones M1–M6 mostly done, see `docs/seo/PROGRESS.md`); read the "SEO" section below.** This site
  replaces both `www.ppmedenhaag.nl` and `ppmedenhaag.nl` (canonical = www, apex 301 → www at cutover).
- **Homepage (`src/pages/index.astro` and `[locale]/index.astro`) is a stub** — just
  renders `<CTA />`. `src/data/config.ts`'s `CTA_CONFIG` is stale sample data (an old
  "Eid al-Adha 1445H / June 2024" promo, not the live site's current promoted event).
  The real source of truth for what the homepage should show is
  `../ppmedenhaag-website/data/{nl,id,en}/homepage.yml` — see
  `.migration/06-data-i18n-strings.md` for the full key-by-key recreation plan
  (including two real cross-language content gaps found there: `course` only exists for
  `en`, `shodaqoh` only exists for `nl`/`id` — don't silently paper over either without
  flagging it).
- **Contact pages** (`/contact/`, `/id/contact/`, `/en/contact/`, URLs match Hugo) were reviewed 2026-11-21: the form posts to the
  Hugo site's Formspree form (`CONTACT.formAction`, was a 2024 prototype form), has a `_gotcha` honeypot, and a "direct contact" block
  (email, address + directions, socials) follows it. Field names differ from Hugo (`email` instead of `mail`, Formspree's reply-to name).
- **No adapter, no deploy config yet** — `output: 'static'`, intentionally no adapter
  (Cloudflare Pages serves `dist/` directly). No Cloudflare Pages project has been
  created yet; that requires dashboard/account access this session doesn't have.

## Build & dev commands

- `npm run dev` — dev server, default port 4321.
- `npm run build` — runs `astro check && astro build && pagefind --site dist && node scripts/seo-audit.mjs` (~80 s; the first run also renders ~280 share cards and ~200 image variants).
- **Windows gotcha:** build from an upper-case drive path (`C:\Users\...`, e.g. PowerShell `Set-Location C:\Users\rosti\hugo\ppmedenhaag-website-astro`).
  From a lower-case path (`c:\...`: VS Code's terminal, Git Bash `/c/...`) Astro silently drops all component CSS (fonts, map, scoped
  styles) from every page. `seo-audit` now fails such a build ("component CSS missing"). Never `wrangler deploy` a build that failed it. CI (Linux) is unaffected.
- `npm run test:worker` — unit test of the edge Worker's redirects/noindex (no wrangler needed).
- `node scripts/check-content.mjs [--fix-dates|--write-lang]` — report wrong UTC offsets / language mismatches in front matter; `node scripts/optimize-images.mjs` — shrink oversized public images; `node scripts/indexnow.mjs` — production-only Bing/Yandex ping (run by deploy.yml).
- `npm run seo:audit` / `npm run seo:diff` — re-run the SEO audit on `dist/` / compare with the live Hugo sitemaps.
- `npx astro sync` — regenerate content-collection types after changing
  `content.config.ts` or adding/removing collections. Run this whenever `astro check`
  reports `Property 'data' does not exist on type 'never'` for a collection — it means
  types are stale, not that the code is wrong.

For side-by-side comparison against the Hugo source during migration work: run
`hugo server` in `../ppmedenhaag-website` (port 1313) alongside `npm run dev` here — no
port conflict, fully independent processes.

## Deploy

Deployed to **Cloudflare Workers (static assets)**, Worker `ppme-website` (config: `wrangler.jsonc`, serves `dist/`).
The earlier Cloudflare Pages plan (`.migration/07-deploy-hosting.md`) was superseded.

**Auto-deploy is live.** The GitHub repo is `ppmedenhaag/ppmedenhaag-website` (`origin`). Every push to `main` runs
`.github/workflows/deploy.yml` (build + `npx wrangler deploy`) using the repo secrets `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`. Live at https://ppme-website.ppme-registration.workers.dev. DNS for ppmedenhaag.nl is not touched.
No manual deploy is needed after pushing.

- CI uses Node 24 and `npm install` rather than `npm ci`: the lockfile (generated on Windows) lacks cross-platform optional
  `@emnapi/*` entries, so `npm ci` fails on Linux runners. To restore `npm ci`, regenerate `package-lock.json` on Linux.
- `src/icons/` is intentionally empty (`.gitkeep`): astro-icon scans it by default and warns if it is missing. Icons come
  from the Iconify sets listed in `astro.config.mjs`.
- Manual deploy (fallback): `npm run build` then `npx wrangler deploy` (needs `npx wrangler login` once). See the Windows gotcha above.
- Optional repo secret `CLOUDFLARE_ZONE_ID` (+ token permission Zone › Cache Purge) enables the purge-everything step after each deploy
  (HTML is edge-cached up to 1 h). Skipped while the secret is absent.
- Simple Analytics (the Hugo site's cookieless analytics, `sa-verify` token) is emitted **only in production builds** (`PUBLIC_SITE_URL`
  = www), so staging traffic never reaches the stats.
- Cutover runbook with exact steps: `docs/seo/CUTOVER-CHECKLIST.md`.
