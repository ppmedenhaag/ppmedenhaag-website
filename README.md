# PPME Den Haag website

Source of [ppmedenhaag.nl](https://www.ppmedenhaag.nl), the website of PPME Den Haag, an Indonesian Islamic community
association based at Masjid Al Hikmah, Den Haag. Built with [Astro](https://astro.build) as a static site in three
languages: Dutch (default, unprefixed), Indonesian (`/id/`) and English (`/en/`).

This is the Astro rebuild of the earlier Hugo site. Every URL must stay identical to the Hugo site's (same path, same
trailing slash) so search rankings and old links keep working.

> **Status:** live at <https://www.ppmedenhaag.nl> since 2026-11-21 (`ppmedenhaag.nl` redirects to www). SEO (canonical, Open
> Graph, hreflang, sitemap, RSS) targets www. `website-v2.ppmedenhaag.nl` stays up, noindexed. See
> [docs/seo/PROGRESS.md](docs/seo/PROGRESS.md) and, for rolling back to the old Hugo/Netlify site,
> [docs/seo/ROLLBACK-PLAN.md](docs/seo/ROLLBACK-PLAN.md).

## What's on the site

PPME Den Haag is the Den Haag branch of PPME (Persatuan Pemuda Muslim se-Eropa), founded in 1971 by Indonesian students
in the Netherlands. The community meets every Saturday at Masjid Al Hikmah (Medlerstraat 4, Den Haag): Qur'an classes for
children (TPA Al Amin), Indonesian study sessions for adults, a youth programme, and the big moments of the Islamic year.

| Section | What it holds |
| :------ | :------------ |
| **Events** (`/event/`) | 79 events since December 2021 (170 pages over nl/id/en): the Saturday and Ramadan programmes, Eid prayers, Isra' Mi'raj and Maulid Nabi evenings, the PPME-wide Istighotsah Akbar, lectures, youth sessions (Nongkrong), workshops and information evenings. Upcoming events get an "add to calendar" button. |
| **News / blog** (`/blog/`) | 31 posts since March 2022 (68 pages): monthly Saturday schedules (2022-23), Ramadan and Eid announcements with the dates, zakat al-fitr and fidyah amounts, the yearly Umrah trip, aid appeals with Dompet Dhuafa, and news about PPME itself. |
| **Ibadah** (`/ibadah/`) | Practical guides: converting to Islam, Islamic marriage, birth, death and funerals, zakat and sadaqah, plus the yearly prayer-times table. |
| **Dakwah, About, Board** | Classes and lectures, PPME's history and membership, the 2026 board. |
| **Homepage** | Today's prayer times, the current highlight (a featured event), upcoming events, latest news and (nl/id) donation details. |

Not every page exists in every language: Dutch and Indonesian cover almost everything, English about a third. The language
switcher only offers translations that exist.

## Tech stack

- Astro 7 (static output, `trailingSlash: "always"`), Content Layer collections with the `glob()` loader
- Tailwind CSS v4 (CSS-first config in `src/styles/global.css`), `@tailwindcss/typography`
- React islands (Headless UI, Heroicons) for interactive UI such as the navbar, search and prayer-times widget
- Pagefind for build-time site search, no external service
- Cloudflare Workers (static assets) for hosting, with a small edge Worker in `worker/`

## Requirements

- Node.js 20 or newer (CI uses Node 24)
- npm

## Getting started

```sh
npm install
npm run build   # once: creates the search index (dist/pagefind) that the dev server serves
npm run dev     # http://localhost:4321
```

## Commands

| Command                | Action                                                                                     |
| :--------------------- | :----------------------------------------------------------------------------------------- |
| `npm run dev`          | Dev server at `localhost:4321`                                                             |
| `npm run build`        | `astro check`, build to `dist/`, Pagefind index, then the SEO audit (errors fail the build) |
| `npm run preview`      | Serve the built `dist/` locally                                                            |
| `npm run seo:audit`    | Re-run the SEO audit on `dist/`                                                            |
| `npm run seo:diff`     | Compare `dist/` with the live Hugo sitemaps (must stay at 0 missing URLs)                  |
| `npm run test:worker`  | Unit test of the edge Worker (redirects, noindex on non-production hosts)                  |
| `npx astro sync`       | Regenerate content-collection types (run when `astro check` reports stale types)           |

Other scripts in `scripts/`:

- `node scripts/check-content.mjs [--fix-dates|--write-lang]` reports wrong UTC offsets and language mismatches in front matter
- `node scripts/optimize-images.mjs` shrinks oversized images in `public/`
- `node .claude/skills/ppme-visual-design/scripts/contrast.mjs` checks WCAG contrast of the design tokens

## Project structure

```text
src/
  content/<type>/<locale>/<slug>.md   event, blog, dakwah, about, ibadah (one collection per type, all locales)
  content.config.ts                   collection schemas
  pages/                              unprefixed pages (nl) and [locale]/ pages (id, en); og/, feeds, robots
  components/                         .astro components; react/ holds the interactive islands
  layouts/Layout.astro                shared layout, SEO head, search markers
  data/                               i18n, UI strings, SEO copy, prayer times, map paths
  plugins/heading-levels.mjs          Markdown plugin: gap-free heading levels, authored look kept
  utils/                              SEO registry, JSON-LD, share cards, helpers
  styles/global.css                   Tailwind theme tokens and shared classes
public/                               static files, images, _redirects
scripts/                              build tooling (sitemaps, icons, audits)
worker/index.js                       edge Worker (redirects, host handling, noindex off production)
docs/seo/                             SEO plan, progress and URL diff report
```

## Conventions that matter

- **URLs are fixed.** Content entry ids are the original Hugo filenames. Each section has two route files: an unprefixed
  one for `nl` and a `[locale]` one that excludes `nl`. Never change routes, ids or `trailingSlash` without checking
  [CLAUDE.md](CLAUDE.md).
- **Adding content:** see "Adding or changing content" below. Translations are intentionally partial; the language switcher
  only links to translations that exist.
- **Styling:** use the shared tokens and classes (`brand` blue, `.btn`, `.tile`, `.callout`, ...). Keep text at WCAG AA
  contrast; the contrast script must pass.
- **Page background** is a build-time choice via `PUBLIC_BACKGROUND` (`none`, `pattern`, `night`, `leaves`, `map`; default `map`).
- **Prayer times** are generated from a winter-time table plus the EU summer-time rule. The yearly page contains the build
  year and the next one and shows the current year in the browser, so a build stays correct into the next year.

## Adding or changing content

Events and news posts are Markdown files: `src/content/event/<nl|id|en>/<slug>.md` and `src/content/blog/<nl|id|en>/<slug>.md`.
The same slug in another language folder is its translation.

- **Events:** use the `/ppme-event` skill in Claude Code (`.claude/skills/ppme-event`): paste the announcement or flyer and it
  writes the nl/id/en pages, prepares the image, updates the homepage highlight if needed, builds and publishes. To do it by
  hand, copy a recent event (e.g. `istigotsah-akbar-2026.md`) and follow the rules in that skill.
- **`description` is required** for events and posts (40-160 characters; the build fails without it). Write one or two
  sentences: what happens, who speaks or organises, the highlights, no greeting. It is the card text **and** the Google snippet,
  the WhatsApp/Facebook preview, the structured data, RSS and the calendar entry, so nothing is cut from the body
  automatically. Event descriptions leave out the date (it is shown next to them); update the description when the body changes.
- **Never rename a published file**: the file name is the URL. A changed URL needs a 301 line in `public/_redirects`.
- **Headings:** pick a size with `###`, `####`, `#####` as usual; the build fixes the heading order for screen readers and
  search engines without changing how it looks.
- **Images** go in `public/images/events/` or `public/images/blog/` as WebP (`node scripts/optimize-images.mjs` shrinks large ones).
- Pushing to `main` deploys automatically, **except** a push that changes only Markdown: then run
  `gh workflow run deploy.yml --ref main`.

[CLAUDE.md](CLAUDE.md) has the full details (SEO system, search, i18n, known gaps) and is the reference for anyone, human or AI,
working in this repo.

## Environment variables

| Variable               | Purpose                                                                                  |
| :--------------------- | :--------------------------------------------------------------------------------------- |
| `PUBLIC_SITE_URL`      | Origin used for every absolute URL. Production: `https://www.ppmedenhaag.nl` (GitHub repo variable, required). Code default: `https://website-v2.ppmedenhaag.nl` (staging) |
| `PUBLIC_BACKGROUND`    | Page background variant (see above)                                                      |
| `PUBLIC_PRAYER_SOURCE` | Set to `manual` to use the hand-maintained prayer-time tables                            |

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`: build, then `npx wrangler deploy` to the Cloudflare Worker
`ppme-website`. It needs the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. No manual step is
needed. For a manual deploy: `npm run build && npx wrangler deploy` (after `npx wrangler login`).

CI uses `npm install` rather than `npm ci` because the lockfile was generated on Windows.

## Further reading

- [CLAUDE.md](CLAUDE.md): project guide and conventions
- [DEPLOYMENT.md](DEPLOYMENT.md): the original Cloudflare Pages runbook (superseded by the Workers setup above)
- [docs/seo/SEO-PLAN.md](docs/seo/SEO-PLAN.md) and [docs/seo/PROGRESS.md](docs/seo/PROGRESS.md): SEO plan and status
