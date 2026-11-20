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

**Page background (build-time parameter):** `PUBLIC_BACKGROUND` = `none` (option 1) | `pattern` (option 2) | `night` (option 3, **default**) | `leaves` (option 4) | `map` (option 5), declared in `astro.config.mjs` via `env.schema` (an invalid value fails the build) and read with `astro:env/client`. `components/PageBackground.astro` picks the layer set used by `Layout.astro`; `Homepage.astro` only draws its CTA-band pattern in `pattern` mode. Set it per build, e.g. PowerShell `$env:PUBLIC_BACKGROUND="night"; npm run build`, bash `PUBLIC_BACKGROUND=night npm run build` (Cloudflare Pages: a build environment variable). `pattern` = a faint batik/ronce tile drawn as five stacked `.app-grid*` layers in `global.css` (different tile sizes and blur strengths, each revealed through its own random radial-gradient mask patches; the tile SVG is inlined as a data-URI and brand-blue/white for the dark CTA band). `night` = `components/NightSky.astro`: build-time seeded stars, sparkles and meteors, pure CSS animation, a sticky viewport-high stage inside the backdrop, honours `prefers-reduced-motion`; it stays on the light theme (brand-blue stars), not a dark page. `leaves` = `components/LeafBackdrop.astro`: build-time seeded branch sprigs + loose leaves (inline SVG, brand blue at low opacity, very slow CSS sway, same sticky-stage trick and reduced-motion handling). `map` = `components/NetherlandsMap.astro`: faint outline of the Netherlands with all 12 provinces (Zuid-Holland slightly tinted) and Den Haag marked with a pulsing dot and label; paths in `src/data/nl-map.ts`, **generated** by `node scripts/build-nl-map.mjs <provincie GeoJSON>` from PDOK/CBS open data (`https://cartomap.github.io/nl/wgs84/provincie_2023.geojson`) - don't hand-edit.

React is available (`@astrojs/react`, `@headlessui/react`, `@heroicons/react`) for
interactive islands (`src/components/react/*.tsx`, hydrated with `client:load` from a
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

## Known gaps (don't assume these are solved)

- **Event Markdown conventions after the audit:** `{{< youtube >}}` was converted to raw
  responsive `<iframe>` HTML and `{{< ref "blog/x" >}}` to a literal locale-prefixed path in
  `src/content/event/**` (same done for blog and dakwah). Raw HTML in Markdown uses PPME's own
  class names (`btn btn-primary btn-sm`, `badge badge-success`, `callout`, `accordion-*`, `row-brand`, `table-compact`,
  `sticky-col`) plus plain Tailwind utilities (`lg:hidden`, `overflow-x-auto`); no Bootstrap names remain. They are styled by
  the unlayered `.prose` rules at the bottom of `global.css`; `@source "../content"` lets Tailwind see utilities used in Markdown. `@tailwindcss/typography` is installed (it was missing, so `prose` did nothing).
  Blog uses `PostList/PostCard/PostDetail.astro` + `utils/blog.ts` (author/category shown as plain text; Hugo's `/author/`, `/categories/`, `/tags/` taxonomy pages are NOT ported). Event pages share `EventDetail/EventList/EventCard.astro` + `utils/event.ts`.

- **Hugo shortcodes are not converted.** Migrated content still contains literal
  `{{< youtube ... >}}`, `{{< ref ... >}}`, `{{< param email >}}` text in Markdown
  bodies — it will render as-is (broken-looking) until the MDX/native-TS work in
  `.migration/03-layouts-components.md` is done. Don't be surprised by this in event/blog
  content; it's tracked, not missed.
- **No SEO head component yet** — no canonical tag, no Twitter Cards, no JSON-LD. Only
  `@astrojs/sitemap` (configured with `i18n` locales) is wired. Full plan:
  `.migration/05-seo.md`.
- **No `@astrojs/rss` endpoints yet** — the package is installed but no feed files
  exist. Hugo generates one per site/section/language; match that when built.
- **Homepage (`src/pages/index.astro` and `[locale]/index.astro`) is a stub** — just
  renders `<CTA />`. `src/data/config.ts`'s `CTA_CONFIG` is stale sample data (an old
  "Eid al-Adha 1445H / June 2024" promo, not the live site's current promoted event).
  The real source of truth for what the homepage should show is
  `../ppmedenhaag-website/data/{nl,id,en}/homepage.yml` — see
  `.migration/06-data-i18n-strings.md` for the full key-by-key recreation plan
  (including two real cross-language content gaps found there: `course` only exists for
  `en`, `shodaqoh` only exists for `nl`/`id` — don't silently paper over either without
  flagging it).
- **`contact.astro` pages exist but haven't been audited** against this CLAUDE.md's
  conventions yet — don't assume they follow the URL-preservation rule above without
  checking.
- **No adapter, no deploy config yet** — `output: 'static'`, intentionally no adapter
  (Cloudflare Pages serves `dist/` directly). No Cloudflare Pages project has been
  created yet; that requires dashboard/account access this session doesn't have.

## Build & dev commands

- `npm run dev` — dev server, default port 4321.
- `npm run build` — runs `astro check && astro build`.
- `npx astro sync` — regenerate content-collection types after changing
  `content.config.ts` or adding/removing collections. Run this whenever `astro check`
  reports `Property 'data' does not exist on type 'never'` for a collection — it means
  types are stale, not that the code is wrong.

For side-by-side comparison against the Hugo source during migration work: run
`hugo server` in `../ppmedenhaag-website` (port 1313) alongside `npm run dev` here — no
port conflict, fully independent processes.

## Deploy

Target is **Cloudflare Pages** (decided against Vercel and Netlify — see
`.migration/07-deploy-hosting.md` for the reasoning and the `netlify.toml` →
`_redirects`/`_headers` mapping). Not yet set up.
