# PPME Den Haag website

Source of [ppmedenhaag.nl](https://www.ppmedenhaag.nl), the website of PPME Den Haag, an Indonesian Islamic community
association based at Masjid Al Hikmah, Den Haag. Built with [Astro](https://astro.build) as a static site in three
languages: Dutch (default, unprefixed), Indonesian (`/id/`) and English (`/en/`).

This is the Astro rebuild of the earlier Hugo site. Every URL must stay identical to the Hugo site's (same path, same
trailing slash) so search rankings and old links keep working.

> **Status:** the site is deployed to a staging host. SEO (canonical, Open Graph, hreflang, sitemap, RSS) still points to
> `https://website-v2.ppmedenhaag.nl` and the site is noindexed until the cutover to `www.ppmedenhaag.nl`
> (see [docs/seo/PROGRESS.md](docs/seo/PROGRESS.md)).

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
- **Adding content:** put a Markdown file in `src/content/<type>/<locale>/`. Translations are intentionally partial; the
  language switcher only links to translations that exist.
- **Styling:** use the shared tokens and classes (`brand` blue, `.btn`, `.tile`, `.callout`, ...). Keep text at WCAG AA
  contrast; the contrast script must pass.
- **Page background** is a build-time choice via `PUBLIC_BACKGROUND` (`none`, `pattern`, `night`, `leaves`, `map`; default `map`).
- **Prayer times** are generated from a winter-time table plus the EU summer-time rule. The yearly page uses the build
  year, so redeploy on 1 January.

[CLAUDE.md](CLAUDE.md) has the full details (SEO system, search, i18n, known gaps) and is the reference for anyone, human or AI,
working in this repo.

## Environment variables

| Variable               | Purpose                                                                                  |
| :--------------------- | :--------------------------------------------------------------------------------------- |
| `PUBLIC_SITE_URL`      | Origin used for every absolute URL. Default: `https://website-v2.ppmedenhaag.nl` (staging) |
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
