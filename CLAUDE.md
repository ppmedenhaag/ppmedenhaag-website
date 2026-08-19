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

**Sections migrated so far: `event`, `blog` only.** `about`, `contact`, `dakwah`,
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
`tailwind.config.js`. Brand color scale is `ppme-blue-{50..950}`. `.prose table` rules
in the same file target raw-HTML `<table>` markup (prayer-time schedules use this
pattern in the Hugo source — preserve it if/when that content is ported).

React is available (`@astrojs/react`, `@headlessui/react`, `@heroicons/react`) for
interactive islands (`src/components/react/*.tsx`, hydrated with `client:load` from a
thin `.astro` wrapper, e.g. `Navbar.astro` → `ReactNavbar.tsx`). Keep this pattern for
new interactive UI rather than reaching for a different framework.

## Known gaps (don't assume these are solved)

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
