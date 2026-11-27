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

**Sections migrated: `event` and `blog` (audited 2026-11-18, every entry re-read 2026-11-27), `dakwah`, `about`, `ibadah`;
`contact`, `bestuur-2026` and the prayer-times page are static route files.** Not ported (their Hugo URLs 301 via
`public/_redirects`): `notice`, `course`, `teacher`, `ramadhan-1444`, `author`/`tags`/`categories`. A new section follows the same
pattern (schema from real front matter, two route files, `nl/`-exclusion filter).

**Schemas:** `eventSchema`; `postSchema` for `blog`/`ibadah`/`about`/`dakwah`; `aboutOverviewSchema` for the `_index` overviews. All
of them use `descriptionField()`: a **required**, hand-written `description` (40-160 chars) that is the single source for cards
and SEO (see "Event and blog content" below). The build fails on a missing or empty one.

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
- The yearly page renders the build-time Amsterdam year **and the next one** (`PrayerYear.astro`); an inline script shows the
  panel for today's year, so a build from year Y stays correct through Y+1. A yearly rebuild is still good practice. The
  homepage widget rolls over by itself.
- Homepage island: `components/PrayerTimes.astro` → `react/PrayerTimes.tsx` (`client:visible`).
- Yearly page: `/ibadah/gebedstijden/` (+ `/id/…`, `/en/…`) via `PrayerYear.astro`; static route files, no content entry
  (Navbar's language switcher has an `isStaticPage` bypass for it).

## SEO (plan: `docs/seo/SEO-PLAN.md`, status: `docs/seo/PROGRESS.md`, skill: `/ppme-seo`)

- **Origin:** every absolute URL derives from `Astro.site`, set from build env `PUBLIC_SITE_URL`. **Production (live since the
  2026-11-21 cutover) = repo variable `PUBLIC_SITE_URL=https://www.ppmedenhaag.nl`; do not delete or change it** — the code default
  is still the staging origin `https://website-v2.ppmedenhaag.nl` (`src/data/seo.ts`), so a missing variable would ship staging
  canonicals to the live site. Never hard-code a host. `deploy.yml` prints a PRODUCTION notice, or a STAGING warning if the variable is wrong/missing.
- **Page registry** `src/utils/seo-registry.ts` (`getSeoRegistry()`): every indexable page with title, description, card, hreflang
  alternates, dates. `Layout.astro` looks the page up by `Astro.url.pathname` and renders `components/Seo.astro` (title, description,
  canonical, hreflang + x-default, Open Graph, Twitter, RSS link, JSON-LD) **first in `<head>`**. Code-driven pages get localized
  titles/descriptions from `STATIC_COPY` in `src/data/seo.ts` (their `<Layout>` has no `title`). New page type ⇒ add it to the registry.
- **Descriptions:** **every content page uses its front matter `description`, verbatim** (required by the schema, 40-160 chars;
  written by hand for all 170 event, 68 blog and 33 ibadah/about/dakwah files on 2026-11-27). It is the card text and the
  meta/og/twitter description, JSON-LD description, RSS item and (events) calendar notes. Nothing is derived from the body any more
  (that code was removed). Event descriptions carry no date (card + structured data do). Code-driven pages (home, listings,
  contact, prayer times, board) take theirs from `STATIC_COPY` / `PRAYER_COPY` in `data/seo.ts`.
- **Link-preview cards:** `/og/<locale>/<route>.<hash>.jpg` (1200×630), generated at build by `utils/og.ts` (sharp; satori for title cards)
  through `src/pages/og/[...path].jpg.ts`. Hero image shown whole over a blurred copy (never cropped); no usable image → generated brand
  title card; every page has its own. Cached in `node_modules/.cache/ppme-og` (bump `CARD_VERSION` after changing card layout code).
  Optional front matter `social_image` overrides `image`.
- **JSON-LD** `utils/jsonld.ts` (Organization, WebSite, WebPage/CollectionPage/ContactPage, BreadcrumbList, Event, BlogPosting/Article).
  Venue address (owner-confirmed 2026-11-21) is in `VENUES`, `data/seo.ts`.
- **Discovery:** `/sitemap.xml` + `/nl|id|en/sitemap.xml` (Hugo-identical, built by `scripts/sitemap-split.mjs`, with lastmod),
  `/sitemap-index.xml`, RSS at `/[locale/][section/]index.xml` (`src/pages/[...feed]/index.xml.ts`, same 18 feeds as Hugo), `robots.txt`
  (endpoint), 404 page, icons + `site.webmanifest` (`scripts/build-icons.mjs`).
- **Edge Worker** `worker/index.js` (wrangler `main`, `run_worker_first` skips static files): http → https, apex → www, trailing slash
  (Workers' own is 307), `/x/index.html`, `//` — all combined into ONE 301; `/404`, `/404/`, `/404.html` serve the 404 page with status 404
  (they used to loop); `/nl/...` → unprefixed URL (in the Worker, because a `_redirects` `/nl/*` rule swallowed `/nl/sitemap.xml`); and **`X-Robots-Tag: noindex` + permissive robots.txt on every host except `www.ppmedenhaag.nl`**
  (website-v2 and workers.dev are noindexed on purpose). Test: `npm run test:worker`. Static files skip the Worker, so the
  zone setting "Always Use HTTPS" must be on as well. `public/_redirects` 301s the legacy Hugo URLs that are not ported
  (tags/categories/author → blog; ramadhan-1444/notice → event; course/teacher → about), **Hugo's 20 `aliases:` short links**
  (`/zakat/`, `/kelahiran/`, `/mualaf/` …, used on flyers; not in any sitemap), list pagination `/<section>/page/N/` and the
  contact-page feeds. New alias in Hugo-style front matter ⇒ add a `_redirects` line (aliases are not read by this site).
- **Gates:** `npm run build` ends with `scripts/seo-audit.mjs` (errors fail the build: head tags, canonical, og image 1200×630 ≤300 KB, hreflang
  reciprocity, JSON-LD, sitemap/robots, staging-origin leak in production mode). `npm run seo:diff -- --write` compares the live Hugo sitemaps
  with `dist/` (must stay at 0 missing; report in `docs/seo/url-diff.md`).

## Events and the homepage CTA (skill: `/ppme-event`)

- **Adding, changing, postponing or cancelling an event, or changing the homepage CTA: use `.claude/skills/ppme-event`**
  (extraction from announcement/flyer, nl/id/en pages, image, SEO input rules, CTA decision, verify, publish). It holds the
  detailed rules; don't duplicate them here. It builds on the SEO section above (`/ppme-seo` only for SEO *code* changes).
- Helper scripts in `.claude/skills/ppme-event/scripts/`: `event-status.mjs` (current/queued CTA, upcoming events),
  `prepare-image.mjs <input> <slug>` (flyer → `public/images/events/<slug>.webp`), `check-seo.mjs <slug>` (per-event SEO
  report on `dist/`).
- **Homepage CTA** = the one uncommented `cta:` block in `src/data/{nl,id,en}/homepage.yml` (rendered by
  `components/Homepage.astro`). Queued/previous ones are kept commented out below it. It does not expire by itself.
- Traps: a future `publishDate` hides an event and no scheduled rebuild reveals it; `zoom|teams|online|youtube|webinar` in
  `location` marks it online-only in JSON-LD (also for hybrid events); write `Al Hikmah` without hyphen (venue address
  match); JSON-LD `eventStatus` is always `EventScheduled`.

## Event and blog content (what's there, how it's written)

Every event and blog file was read on 2026-11-27 to write its `description`; this is the map that came out of it.

- **Inventory.** Events: 79 (170 files: nl 74, id 72, en 24), Dec 2021 - Dec 2026; only 24 exist in all three languages.
  id-only: `event-remaja`, `kajian-parenting`, `khataman-al-quran-1446`, `menggapai-kemuliaan-bersama-al-quran`, `safari`;
  nl-only: the four `geloofsbewijs-workshop*`, `event-jongeren`, `jongerenlezing-dzulhijjah-1446`, `nongkrong-sessie`.
  Blog: 31 posts (68 files: nl 30, id 29, en 9), Mar 2022 - Nov 2026; drafts: `blog-2`, `blog-3` (all locales), `jaarplanning-mei-2022`.
  `diskusi-produk-makanan-halal` nl/en carry Indonesian text (`contentLang: "id"`).
- **Recurring event types and slug patterns** (keep the pattern for new ones; existing slugs never change):
  - Saturday programme at Al Hikmah, the weekly core: TPA Al Amin (children's Qur'an school), Indonesian adult *pengajian*
    (Yasin & Tahlil, fiqh, hadith, tajwid & tafsir, Istighotsah), youth (*remaja*) sessions. 2021-22 ones are `event-1`…`event-13`.
  - Ramadan Saturdays `ramadan-<day>-<hijri year>` (also `ramadhan-1-1446`): multi-room timetables (rooms "Al Moe'minoen",
    "Al Ittihaad", "Ramadan Kidz", "Jong/Volwassen"), tadarus, iftar, tarawih, khatam Qur'an; i'tikaf (`itikaf-ramadan-1446`,
    `ramadan-25-1444`); `tarhib-ramadhan-<year>` (+ `-tpa-`), `takbiran`.
  - Eid: `idulfitri[-<year>]`, `iduladha[-<year>]` (unsuffixed = 1443H). Same text each year with Stichting Masjid Al Hikmah:
    doors 08:00, prayer 09:00, house rules (women's entrance at the back, ground floor for women, first floor for men).
  - Yearly commemorations `isra-miraj-<year>`, `maulid-nabi-<year>`: TPA performances, rebana Noer Hollandie, a lecture in
    Indonesian and one in Dutch.
  - PPME-wide: `istigotsah-akbar[-2026]` (all branches: Den Haag, Amsterdam, Rotterdam, Heemskerk, Breda), `halal-bi-halal`
    (50 years PPME Nederland); 51-year jubilee 2022: `kickoff-51`, `open-house`, `de-levenskracht-van-onze-ummah`, `leadership-training`.
  - Series and one-offs: kajian with guest speakers, *Nongkrong Sessie* (youth, with Al Fath Instituut), Geloofsbewijs workshop
    (4 lessons), SALAM (Delft), info evenings (djenazah/funeral insurance, IICC Al Ittihaad cultural-centre project).
- **Blog types:** monthly Saturday schedules 2022-23 (slugs are Indonesian month names: `maret-2023`, `agustus-2023`; keep them),
  Ramadan/Eid greetings with the dates (`ramadhan-1446/1447`, `romadhoon-1445`, `idul-fitri-1445`), zakat al-fitr/fidyah amounts and
  deadlines, Ramadan house rules, appeals with Dompet Dhuafa (`help-sumatera`, `box-of-happiness`), the yearly Umrah (guide
  Ronald Kroon), `ppme-51`, website news.
- **Vocabulary** (keep it untranslated in all languages): *pengajian/kajian* study session or lecture, Ustadz/Ustadzah teacher,
  TPA Al Amin children's Qur'an school, *remaja* youth, Istighotsah collective supplication, Yasin & Tahlil, tadarus, tarawih,
  iftar/takjil, i'tikaf, khataman, tarhib (welcoming Ramadan), halal bi halal, shahada/syahadat (conversions often happen on
  Saturdays), zakat/infaq/sadaqah (shodaqoh), Komisi Dakwah, Jenazah committee. Hijri years: 1443 ≈ 2021-22 … 1448 ≈ 2026-27.
- **Correctness traps found in the content:** Hijri dates in bodies are hand-typed: check them against the Gregorian date
  (`juli-2023` had Muharram 1444 for 1445; nl `ramadhan-1447` said 2025). Language versions are written separately, not always
  translated: facts can differ, check each. Spelling variants (Romadhoon/Ramadhan/Ramadan, Masdjid/Masjid, Shodaqoh/Sadaqah)
  belong to their period: fix real typos only. Venue is **Medlerstraat 4** (owner-confirmed; some flyers say Heeswijkplein 170).
  Many events keep a commented-out `# speaker:` block from Hugo: only an uncommented `speaker:` renders.
- **Ibadah, About, Dakwah** (5 + 1 + 3 pages, plus the About and Dakwah `_index` overviews, all in nl/id/en) follow the same
  description rules. Open content questions: `dakwah-3` nl says the Indonesian gathering lasts ~2.5 h, id/en say 1-2 h; the
  id/en `dakwah/_index.md` have no body text (only the description).
- **Descriptions are not regenerated:** when an event's or post's body changes materially (speaker, programme, price), update its
  `description` too. Rules: see the `/ppme-event` skill (events: no date; blog: the period/dates are fine when they are the point).
- **Headings:** authors pick a size with `###`/`#####`; `src/plugins/heading-levels.mjs` fixes the outline (see Known gaps note
  below). Bodies usually open with a greeting; that's fine in the body, never in a description.

## Known gaps (don't assume these are solved)

- **Event Markdown conventions after the audit:** `{{< youtube >}}` was converted to raw
  responsive `<iframe>` HTML and `{{< ref "blog/x" >}}` to a literal locale-prefixed path in
  `src/content/event/**` (same done for blog and dakwah). Raw HTML in Markdown uses PPME's own
  class names (`btn btn-primary btn-sm`, `badge badge-success`, `callout`, `accordion-*`, `row-brand`, `table-compact`,
  `sticky-col`) plus plain Tailwind utilities (`lg:hidden`, `overflow-x-auto`); no Bootstrap names remain. They are styled by
  the unlayered `.prose` rules at the bottom of `global.css`; `@source "../content"` lets Tailwind see utilities used in Markdown. `@tailwindcss/typography` is installed (it was missing, so `prose` did nothing).
  Blog uses `PostList/PostCard/PostDetail.astro` + `utils/blog.ts` (author/category shown as plain text; Hugo's `/author/`, `/categories/`, `/tags/` taxonomy pages are NOT ported). Event pages share `EventDetail/EventList/EventCard.astro` + `utils/event.ts`.

- **Bestuur 2026 story page is built** (`/bestuur-2026/`, `/id/`, `/en/`; static route files like gebedstijden, no content collection): copy + facts in `src/data/bestuur.ts`, layout in `components/Bestuur2026.astro` (photos alternate sides, scroll-driven reveal), images in `public/images/bestuur-2026/` (group photos shrunk to 2400 px; full-size originals moved to `C:\Users\rosti\Downloads\bestuur-2026-originals\`). Wired into menu (Meer), SEO registry (`STATIC_COPY.bestuur`), search section label. nl/en quotes are translations of the Indonesian originals. Linked from the three About overview pages. The per-person pages in `docs/bestuur/PLAN.md` are NOT built.

- **Hugo shortcodes:** converted in event/blog/dakwah content (see the first bullet); the 2026-11-27 crawl of the live site
  found no `{{< … >}}` residue. Recheck when porting a new section from Hugo.
- **Markdown heading levels are renumbered at build time** (`src/plugins/heading-levels.mjs`, a Sätteri hast plugin registered
  in `astro.config.mjs` → `markdown.processor`): every content page gets a gap-free outline (h1 title → h2 → h3 …) and each
  renumbered heading carries `md-h<original level>`, which the unlayered `.prose .md-hN` rules at the bottom of `global.css` style
  like the original level. Authors keep choosing sizes with `###`/`#####` as before; don't "fix" levels in Markdown. **Gotcha:**
  the content layer caches rendered Markdown in `node_modules/.astro/data-store.json` per file, so after changing a Markdown
  plugin delete that file before building, or unchanged entries keep the old HTML.
- **Site audit 2026-11-27:** `docs/audit/SITE-AUDIT-2026-11-27.md` (live crawl, Lighthouse, contrast, language). Fixed items and
  the remaining manual checks are listed in its "Status" section.
- **Cutover done (2026-11-21):** `www.ppmedenhaag.nl` and `ppmedenhaag.nl` are custom domains of the Worker (`wrangler.jsonc`
  `routes`); canonical = www, apex 301 → www. Rollback to Netlify/Hugo: `docs/seo/ROLLBACK-PLAN.md` (keep the Netlify site for ≥ 2 weeks,
  i.e. until ~2026-12-05). Search Console: the www `sitemap.xml` is submitted. Still open: see the "Afterwards" items in `docs/seo/PROGRESS.md`.
- **SEO: implemented (milestones M1–M6 mostly done, see `docs/seo/PROGRESS.md`); read the "SEO" section above.** This site
  replaces both `www.ppmedenhaag.nl` and `ppmedenhaag.nl` (canonical = www, apex 301 → www).
- **Homepage** is built (`components/Homepage.astro`, data in `src/data/{nl,id,en}/homepage.yml`, now the source of truth).
  Cross-language gaps carried over from Hugo: `course` only exists for `en`, `shodaqoh` only for `nl`/`id` — don't silently
  paper over either without flagging it.
- **Contact pages** (`/contact/`, `/id/contact/`, `/en/contact/`, URLs match Hugo) were reviewed 2026-11-21: the form posts to the
  Hugo site's Formspree form (`CONTACT.formAction`, was a 2024 prototype form), has a `_gotcha` honeypot, and a "direct contact" block
  (email, address + directions, socials) follows it. Field names differ from Hugo (`email` instead of `mail`, Formspree's reply-to name).
- **No adapter** — `output: 'static'`, intentionally (the Worker serves `dist/`, see "Deploy").

## Build & dev commands

- `npm run dev` — dev server, default port 4321.
- `npm run build` — runs `astro check && astro build && pagefind --site dist && node scripts/seo-audit.mjs` (~80 s; the first run also renders ~280 share cards and ~200 image variants).
- **Windows gotcha:** build from an upper-case drive path (`C:\Users\...`, e.g. PowerShell `Set-Location C:\Users\rosti\hugo\ppmedenhaag-website-astro`).
  From a lower-case path (`c:\...`: VS Code's terminal, Git Bash `/c/...`) Astro silently drops all component CSS (fonts, map, scoped
  styles) from every page. `seo-audit` now fails such a build ("component CSS missing"). Never `wrangler deploy` a build that failed it. CI (Linux) is unaffected.
- `npm run test:worker` — unit test of the edge Worker's redirects/noindex (no wrangler needed).
- `node scripts/check-content.mjs [--fix-dates|--write-lang]` — report wrong UTC offsets / language mismatches in front matter; `node scripts/optimize-images.mjs [--dry] [file...]` — shrink oversized public images (new event images: see `/ppme-event`); `node scripts/indexnow.mjs` — production-only Bing/Yandex ping (run by deploy.yml).
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
`CLOUDFLARE_ACCOUNT_ID`. Live at https://www.ppmedenhaag.nl (and `ppmedenhaag.nl` → www); also reachable (noindexed) at https://website-v2.ppmedenhaag.nl and
https://ppme-website.ppme-registration.workers.dev. The Cloudflare API token needs account Workers Scripts Write + zone DNS Write / Zone Read / Workers Routes Write / Cache Purge.
No manual deploy is needed after pushing, **with one exception:** `deploy.yml` (and `preview.yml`) have
`paths-ignore: **/*.md`, which also matches `src/content/**`. A push that changes only Markdown does **not** deploy: run
`gh workflow run deploy.yml --ref main`.

- **Branch previews:** every push to a branch other than `main` runs `.github/workflows/preview.yml`: build (staging origin, no
  `PUBLIC_SITE_URL`) + `wrangler versions upload --preview-alias <branch slug>`. It never deploys; the URL
  (`https://<alias>-ppme-website.<account-subdomain>.workers.dev`, noindexed by the Worker) is in the job summary and, if the branch
  has an open PR, in one auto-updated PR comment. Needs "Preview URLs" enabled on the Worker (`workers_dev: true`). Manual:
  `npm run build` then `npx wrangler versions upload --preview-alias <name>`.
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
