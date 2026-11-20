# PPME Den Haag — Maximum-SEO plan (Astro site on Cloudflare)

Status: **M1–M6 implemented (2026-11-21), M7 partly; M8 (cutover) needs the owner.** Track progress and deviations from this plan in [`PROGRESS.md`](./PROGRESS.md)
(notably: non-production robots.txt is permissive + `X-Robots-Tag: noindex`, not `Disallow: /`; legacy URLs are 301s rather than ported pages).
Written 2026-11-20. Conventions for doing the work: `.claude/skills/ppme-seo/SKILL.md`.
Earlier, shorter audit (Hugo repo): `../ppmedenhaag-website/.migration/05-seo.md` — this plan supersedes and extends it.

Goal: when ppmedenhaag.nl moves from Hugo/Netlify to this Astro/Cloudflare site, SEO must be **at least at parity on day one
and clearly better than Hugo** (rich results, correct hreflang, link previews with a real image everywhere, fast pages),
without losing a single indexed URL. Hard constraint from `CLAUDE.md` stays: **URL preservation** (path, trailing slash, locale pattern).

**Confirmed by the owner (2026-11-20): this Astro site fully REPLACES both `www.ppmedenhaag.nl` and `ppmedenhaag.nl`.**
It is a hosting/platform swap on the *same* domain, not a new domain. Consequences baked into every phase:
- Production hosts = `www.ppmedenhaag.nl` (canonical, serves content) and `ppmedenhaag.nl` (apex, **301 → www**, path + query preserved). Both must be attached to
  the Worker as custom domains (`wrangler.jsonc` `routes`, `custom_domain: true`), with TLS valid for both, and the apex 301 must work over HTTPS *and* HTTP.
- Every other host (`*.workers.dev`, `website-v2.ppmedenhaag.nl`, previews) is non-production → noindex at the edge (Phase 0.1) and retired/removed after cutover.
- Domain-level SEO equity (backlinks, history, Search Console data) carries over only if URLs stay identical → URL preservation + zero-diff gate (Phase 0.4, 9) are
  **cutover blockers**, not nice-to-haves. No "Change of address" tool in Search Console (same domain).
- Anything that points at the old stack must be found and updated or kept working: Search Console/Bing properties and submitted sitemaps, the Hugo `sa-verify` token, old
  RSS subscribers (`/index.xml` etc. keep working), emails/social profiles linking to apex or www, `sholat.ppmedenhaag.nl` and other subdomains (do not break them: inventory all
  DNS records on the zone before changing anything; only `@` and `www` move), `website-v2`, event-registration app links, Netlify-specific behaviour (redirects/headers in `netlify.toml`
  or `static/_redirects` in the Hugo repo → must be ported; check `../ppmedenhaag-website` for them).
- Netlify must keep the site reachable (unlinked) for rollback until the new site is verified, then be decommissioned so there is never a second indexable copy.

---

## 1. Evidence: where things stand (measured 2026-11-20)

| Area | Hugo (live, www.ppmedenhaag.nl) | Astro (workers.dev / website-v2) |
|---|---|---|
| `<title>` | per page; homepage = "PPME Den Haag" | per page (passed in); homepage same |
| meta description | only when front matter has one; homepage = "PPME Den Haag" | **none at all** |
| `og:*` | title/url/image/site_name; `og:type` always `article`; `og:description` = title (bug) | **none** |
| Twitter card, canonical, JSON-LD | none | none |
| hreflang | homepage only (nl/id/en); no self/x-default on inner pages | none |
| sitemap | `/sitemap.xml` index → `/nl|id|en/sitemap.xml` (166/164/80 = 410 URLs) | `/sitemap-index.xml` + `/sitemap-0.xml` (274 URLs); **no `/sitemap.xml`** |
| RSS | `/index.xml` (+ per section/language) | none (`@astrojs/rss` installed, unused) |
| robots.txt | none (404 HTML) | Cloudflare-injected content-signals comments only; no `Sitemap:` |
| 404 page | yes | **no `src/pages/404.astro`** |
| Trailing-slash redirect | Netlify 301 | Workers assets `auto-trailing-slash` = **307** (temporary) |
| Indexability of non-prod hosts | n/a | `ppme-website.ppme-registration.workers.dev` **and** `website-v2.ppmedenhaag.nl` both serve 200, no `noindex` → duplicate-content risk today |
| Apex/www | `ppmedenhaag.nl` → 301 → `www` | not set up (cutover task) |

Content facts that shape the design (from `src/content`, 264 entries):
- **246 / 264 have an empty `description`** → descriptions must be *derived*, not read.
- **261 / 264 have `image`** (161 under `images/events/`, 56 `images/blog/`…). Most are **800×600 (4:3)**; a few 800×450, 1600×901,
  2133×1600, and tiny ones (299×299, 192×192). 4 images >600 KB. All referenced files exist. `bg_image` (170×) is the same decorative
  page-title banner → never a social image.
- Only 3 entries have images in the Markdown body (so "first body image" is a rare fallback).
- Event `location` is free text: 110× "Masjid Al Hikmah", 18× "Al Hikmah moskee", 6× "Online Zoom", 3× "Online MS Teams", plus a few full
  addresses (**two different Masjid addresses appear**: Medlerstraat 4 and Heeswijkplein 170 — must confirm the current one).
- Event `duration` is free text ("~5h", "2 jam", "...") → `endDate` mostly not derivable; omit rather than guess.
- Event `date` carries a UTC offset (+01:00 ×75, +02:00 ×91). Recent entries look right; some older ones (e.g. a June post with +01:00) have the
  wrong DST offset. `utils/event.ts` already renders in `EVENT_TZ`.
- **Missing vs live sitemap: 136 URLs** → 91 `/tags/*`, 18 `/ramadhan-1444/*`, 12 `/categories/*`, 6 `/author/*`, 3 `/teacher/`,
  3 `/notice/`, 3 `/course/` (nl/id/en), plus the 3 `/ibadah/` section indexes. New-only: the 3 `gebedstijden` pages.
- Home HTML is ~104 KB with a large inline `@font-face` `<style>` in `<head>` → social crawlers that read only the first N KB of HTML could
  miss OG tags placed after it. **SEO head must be the very first thing after charset/viewport.**
- Social sharing in this community is overwhelmingly **WhatsApp** (also Telegram, Instagram bio, Facebook). WhatsApp is the strictest
  consumer: absolute https URL, image roughly ≤300 KB, ~1.91:1 for the large card, tags early in the HTML, fast response.

---

## 2. Decisions (defaults chosen; owner can overrule — see §10 for the ones that need an answer)

1. **Canonical host = `https://www.ppmedenhaag.nl`** (matches Hugo's `baseURL`, `site` in `astro.config.mjs`, current apex→www 301).
2. `nl` unprefixed, `id`/`en` prefixed — unchanged. Canonical = the page's own URL with trailing slash.
3. One typed `Seo.astro` head component fed by `Layout.astro` props; pages never hand-write meta tags.
4. Descriptions: front matter wins, otherwise derived from the body by a deterministic, localized function (§5).
5. Social image: **resolve → normalize to 1200×630 JPEG at build time** (never hot-link the raw 800×600 file) (§6).
6. Structured data: one JSON-LD `@graph` per page (Organization + WebSite + WebPage/Article/Event + BreadcrumbList).
7. Non-production hosts are **noindex + `Disallow: /`** at the edge (the same build is served on every host, so this cannot be a build flag).
8. No SaaS dependencies for SEO; everything generated at build (consistent with the Pagefind approach).
9. **Owner instruction (2026-11-20): until cutover, ALL SEO points to `https://website-v2.ppmedenhaag.nl/`** (canonical, `og:url`, `og:image`, hreflang, JSON-LD, sitemap, RSS, robots `Sitemap:` line). So the **default is the staging origin**; production is opt-in at cutover (safe failure mode: forgetting to flip leaves a noindexed staging site, never a production site canonicalized to the wrong host).
   **Absolute-URL origin is a build parameter `PUBLIC_SITE_URL`** (declared in `astro.config.mjs` `env.schema` like `PUBLIC_BACKGROUND`; `site` reads it; **default `https://website-v2.ppmedenhaag.nl`**; cutover sets the GitHub repo variable `PUBLIC_SITE_URL=https://www.ppmedenhaag.nl`). Nothing else in the code may hard-code a host; everything derives from `Astro.site`.
   **Deploy reminder (every deployment):** `.github/workflows/deploy.yml` gets a step that, whenever `PUBLIC_SITE_URL` is not `https://www.ppmedenhaag.nl`, emits a `::warning::` annotation and writes a job-summary block: "STAGING deploy — SEO points to website-v2; site is noindexed; cutover to www/apex still pending → see docs/seo/PROGRESS.md (Phase 10)". When it *is* production it instead runs `seo-audit --production` and prints "PRODUCTION deploy". Claude also reminds the owner at every commit/push/deploy while the cutover is pending (instruction in `CLAUDE.md` + memory).
   Today the code hard-codes the production `www` origin, so on the staging host `https://website-v2.ppmedenhaag.nl/` canonicals, `og:url`, **`og:image`**, hreflang, JSON-LD and the sitemap would
   point at `www` (= the live Hugo site, which has no `/og/*.jpg`) → previews break and staging looks like a duplicate. Staging phase: GitHub deploy sets `PUBLIC_SITE_URL=https://website-v2.ppmedenhaag.nl`
   (everything self-consistent, previews testable). **Cutover flips it to `https://www.ppmedenhaag.nl`.** Guards: the Worker always noindexes non-production hosts regardless of the build; `seo-audit` has a
   `--production` mode that fails if any absolute URL isn't `https://www.ppmedenhaag.nl`, and `deploy.yml` runs it when the production flag is set, so the staging origin can never ship to production.

---

## 3. Phased plan

Each phase = one reviewable PR. Acceptance criteria are checked by the audit scripts in Phase 9 wherever possible.

### Phase 0 — Safety net & launch blockers (do first, small, high value)

**0.1 Edge Worker in front of static assets** (new `worker/index.ts`, `wrangler.jsonc` → `main` + `assets.binding` + `run_worker_first`
limited to HTML/robots paths and excluding `/_astro/*`, `/images/*`, `/og/*`, `/pagefind/*` so static files stay free/fast).
Responsibilities, in one small file:
- Production host allow-list = exactly `www.ppmedenhaag.nl` (serves) and `ppmedenhaag.nl` (redirects to www; never serves content, never indexable).
- Non-production hosts (anything not `www.ppmedenhaag.nl`): add `X-Robots-Tag: noindex, nofollow` to every response and serve
  `robots.txt` = `User-agent: *\nDisallow: /`.
- `ppmedenhaag.nl` (apex) → **301** to `https://www.ppmedenhaag.nl{path}{search}` (needed at cutover; harmless before).
- Missing trailing slash → **301** (instead of Workers' 307) for HTML routes; keeps old external links permanent.
- `/index.html` and `//` style duplicates → 301 to the clean URL.
- Everything else → `env.ASSETS.fetch(request)`.
Alternative if a Worker is unwanted: Cloudflare Transform Rule (response header by hostname) for `website-v2` + `workers_dev: false`
after cutover. Worker is preferred because it is versioned in the repo and also covers `workers.dev`.
*Accept:* `curl -sI https://ppme-website…workers.dev/` shows `x-robots-tag: noindex`; `https://www…/` does not (verify post-cutover);
`curl -sI …/event` is 301.

**0.2 `public/robots.txt`** (production content; the Worker overrides it on other hosts):
```
User-agent: *
Allow: /
Disallow: /pagefind/
Sitemap: https://www.ppmedenhaag.nl/sitemap.xml
```
Do **not** disallow `/images/`, `/og/`, `/_astro/` (social crawlers + Google rendering need them). Cloudflare "managed robots.txt /
AI Crawl Control" content-signals get prepended on a Cloudflare zone — owner decision on AI crawlers (§10).

**0.3 `src/pages/404.astro`** (+ localized text via `ui.ts`): helpful links, search entry point, `noindex`, no canonical. Must return HTTP 404
(Workers `not_found_handling: "404-page"` already does).

**0.4 Legacy URL parity decision for the 136 missing URLs** (the biggest *ranking-loss* risk, more than any meta tag):
- `/tags/*` (91), `/categories/*` (12), `/author/*` (6): taxonomy pages. Options: (a) port as real listing pages (best for long-tail
  SEO, small cost with existing `PostList`), or (b) **301 to the closest section** (`/tags/x/` → `/blog/`). Default recommendation:
  **(a) for `categories`+`author` (few), 301 for `tags`** unless GSC shows `tags` pages get impressions. Decide with Search Console data.
- `/ramadhan-1444/*` (18), `/course/`, `/teacher/`, `/notice/`, `/ibadah/` index: port per `CLAUDE.md` "not yet ported" list, or 301 with
  owner approval. The 3 `/ibadah/` indexes are a quick win (section already migrated).
- Implement redirects via `public/_redirects` (Workers assets supports it, ≤2000 static rules) or the Worker. Never leave a live URL as 404.
*Accept:* `scripts/seo-url-diff.mjs` (Phase 9) reports **0** live URLs that are neither 200 nor 301→200.

**0.5 `/sitemap.xml` continuity** — see Phase 6 (needed before cutover because Search Console likely has `/sitemap.xml` submitted).

---

### Phase 1 — `Seo.astro` head + Layout API

New: `src/components/Seo.astro`, `src/utils/seo.ts`, `src/data/seo.ts` (site constants). Changed: `Layout.astro`.

`Layout` props (all optional except `title`): `description`, `image` (`{src,width,height,alt}`), `type` (`website|article|profile`),
`noindex`, `publishedTime`, `modifiedTime`, `alternates` (`{locale,href}[]`), `jsonLd` (extra nodes), `breadcrumbs`, `contentLang`.

Head order (matters for crawlers): `charset` → `viewport` → **`Seo`** → theme-color/icons → stylesheet → inline styles.
Emits:
- `<title>` via template: `{page} | PPME Den Haag`; drop the brand suffix when the result would exceed ~62 chars; homepage has its own
  localized keyword title (§5.1).
- `meta description` (§5), `link rel=canonical` (absolute, from `Astro.site` + pathname, trailing slash, **no query/hash**).
- `meta robots` only when `noindex` (404, search-only pages): `noindex, follow`.
- Open Graph: `og:site_name`, `og:type` (home/listings `website`; entry pages `article`; events `article` too — Facebook has no event
  type for plain pages), `og:title`, `og:description`, `og:url`, `og:locale` (`nl_NL`, `id_ID`, `en_GB`) + `og:locale:alternate` for each
  existing translation, `og:image`, `og:image:secure_url` (skip—redundant), `og:image:width/height/type/alt`,
  `article:published_time` / `article:modified_time` / `article:section` / `article:tag` for entries.
- Twitter: `twitter:card=summary_large_image`, `twitter:title/description/image/image:alt` (`twitter:site` only if a handle is supplied).
- hreflang `link rel=alternate` for every existing translation **including self** + `x-default` → nl (Phase 4).
- Feeds/sitemap discovery: `link rel=alternate type=application/rss+xml` (site + section where applicable), `link rel=sitemap`.
- Icons: keep `favicon.svg`; add `favicon.ico` (32), `apple-touch-icon.png` (180), `site.webmanifest` (192/512 + `theme_color #034ea2`).
  Current `public/favicon.svg` is a 1440px Inkscape export → also produce an optimized one.
- Verification tokens: carry over the Hugo `sa-verify` meta (find out which service owns it) and add Google/Bing tokens only if DNS-based
  Search Console verification is not used (DNS preferred).

Pages migrated to pass real props: every `<Layout …>` call site (19 today, list via `grep -rn "<Layout" src`). Prefer passing the *entry*
and letting `utils/seo.ts` derive everything (`seoForEntry(entry, section, locale)`), so adding a section later is one line.

*Accept:* audit script finds title, description (70–160 chars), canonical, og:*, twitter:*, hreflang on **100 %** of non-404 pages;
no meta tag appears after the first `<style>`/`<link rel=stylesheet>`.

---

### Phase 2 — Titles & descriptions that actually rank

`src/utils/seo.ts`:
- `deriveDescription(entry, locale)` order: front matter `description` → first meaningful body text → section template.
  Body processing: strip front-matter remnants, Markdown/MDX/HTML/shortcodes, tables, `{{< … >}}` leftovers; **skip salutation/boilerplate
  lines** (regex per language: `^(assalam|bismillah|beste |geachte |dear |yth|kepada)…`), collapse whitespace, decode entities, take whole
  sentences up to **≤155 chars** on a word boundary, add `…` only if cut mid-sentence.
- Events prepend context when room remains: `"{za 21 nov 2026, 20:00} · {location}. {sentence}"` (localized date via existing `formatDate/Time`).
- Section fallback templates (localized): ibadah, dakwah, about, blog, event listing, contact, prayer times.
- Titles: events may append the date if ≤62 chars; others `{title} | PPME Den Haag`.
- **Hand-write** descriptions + titles (3 languages) for: homepage, about overview, contact, prayer times (yearly page), the 5 ibadah pages,
  event/blog listings. These are the pages people actually search for ("gebedstijden Den Haag", "toetreden islam", "islamitisch trouwen").
  Keyword brief per page kept in `docs/seo/KEYWORDS.md` (to create in this phase; seed with nl/id/en terms: *gebedstijden Den Haag,
  jadwal sholat Den Haag, moskee Den Haag, Indonesische moslims Nederland, PPME Den Haag, Masjid Al Hikmah, pengajian Den Haag…*).
- Optional new front matter field `description` stays optional; add `social_image` (override) and `contentLang` (see Phase 4) to the schemas
  in `content.config.ts` as **optional** fields.
- Duplicate guard: audit fails if two pages in one locale share a title or description.

*Accept:* 0 pages without description; 0 duplicates; length windows respected; spot-check 20 derived descriptions by eye (per language).

---

### Phase 3 — Social / link-preview images ("most prominent image available")

**Resolution chain** (`resolveSocialImage(entry|page)` in `utils/seo.ts`, first hit wins; each candidate must pass the quality gate):
1. front matter `social_image` (new, explicit override)
2. front matter `image` — the page's own hero (261/264 entries)
3. first non-decorative `<img>` / `![](…)` in the body
4. *(events only)* none of the speaker photos by default (small portraits); allow opt-in via `social_image`
5. **generated per-page title card** (brand-blue `#034EA2`, white logo, the page's own title in Inter 700, section eyebrow, locale chip, optional one-line subtitle) — used when nothing else qualifies. **This applies to every page without a usable hero, not just entries**: homepage, `/event/` and `/blog/` listings (+ paginated pages: "page N"), about/dakwah/ibadah overviews, contact, prayer times (`gebedstijden`, with the year), and each locale of each. Cards are localized (title text per language).
6. locale default card (`/og/default-{nl,id,en}.jpg`) — **last resort only** (e.g. the generator failed) and for `noindex` pages (404). It must never be the normal outcome for an indexable page.

**Coverage rule: every indexable page gets its own, distinct `og:image` URL** (paginated listing pages may share the page-1 card). The audit (Phase 9) fails the build if an indexable page falls back to a default card or if two unrelated pages share an image.
Per-page card specifics: homepage = brand card with localized tagline + logo (optionally the promoted event, decision D5); listings = section card (icon-free, title + "Masjid Al Hikmah · Den Haag"); prayer-times = card with title + current year; static pages = title + short localized subtitle from `ui.ts`/page description. Card text comes from the same `title`/`description` the head uses, so card and snippet never disagree. Pages with a hero image keep the image card (full flyer, no overlay) — the title is already in the page title/description of the share.

Quality gate: file exists in `public/`; width ≥ 600 (Facebook minimum) — below 400px (the 299² / 192² files) → *don't* upscale; place on a
branded card instead; never use `bg_image`/`page-title.jpg`/logo files/icons as the primary image; log every fallback to a build report.

**Handling different source pixel sizes / aspect ratios** (all end as 1200×630; foreground is always the *whole* image, `fit: inside`, never cropped):
| Source | Rule |
|---|---|
| ≥1200×630 (e.g. 1600×901, 2133×1600) | downscale to fit; re-encode ≤250 KB |
| 600–1199 px wide (most: 800×600 → 840×630) | upscale **capped at 1.5×**; if the fit would need more, keep it smaller on the backdrop rather than soften it |
| 400–599 px wide | natural size on the blurred backdrop, no upscale; logged "low quality" |
| <400 px (e.g. 299², 192²) | not used as main image → generated title card |
| aspect wider than ~2.4:1 or taller than 1:2 | too extreme for a useful preview → title card (tall posters between 1:1 and 1:2 are fine: fit to height 630, wide blurred sides) |
| GIF / SVG / WebP-animated | first frame rasterized, then same rules |
The pipeline reads true pixel size with sharp (`metadata()`), and the same numbers feed the page's `<img width height>` (CLS) and JSON-LD `image` entries. The build report lists every upscaled, low-quality or card-replaced image so better sources can be swapped in for important pages.

**Normalization** (build-time, `sharp` — already a transitive Astro dependency; add it explicitly to `package.json`):
- Output **1200×630 JPEG** (mozjpeg, progressive, q82; step down to q72/q62 until **≤ 250 KB**; hard fail >300 KB).
- Layout "contain on blurred backdrop": background = same image `cover` + gaussian blur + slight darken; foreground = full image `inside`
  1200×630 (**no cropping** — flyers contain text and dates; 4:3 sources fit at 840×630). No logo overlay on photos/flyers (would hide text).
- Static endpoint `src/pages/og/[...path].jpg.ts` with `getStaticPaths` enumerating every page that needs a generated image.
  URL shape: `/og/{section}/{locale}/{slug}.{hash8}.jpg` (hash of source bytes + title + generator version → automatic cache-busting when
  the flyer changes; platforms cache OG images aggressively). Cache results in `node_modules/.cache/og/` to keep CI builds fast.
- Title cards: `satori` + `@resvg/resvg-js` with a **bundled** static Inter TTF/WOFF (satori can't read woff2; Linux CI has no system fonts —
  do **not** rely on sharp/librsvg SVG text).
- Add `/og/*` and `/_astro/*` immutable cache headers (Phase 7).

**Meta output** (from Phase 1): `og:image` + `twitter:image` = absolute `https://www.ppmedenhaag.nl/og/….jpg`, with `width=1200 height=630
type=image/jpeg alt=<title>`.
JSON-LD `image` arrays reuse these (plus the original file) — Google's Event/Article guidelines want multiple aspect ratios.

Homepage image: its own branded per-locale card (stable, always on-brand). Optional switch (decision §10): use the currently promoted event's image
(`homepage.yml → cta.img.src`) so a shared homepage link shows the current event.
Implementation: `getStaticPaths` of `src/pages/og/[...path].jpg.ts` is driven by one **page registry** (`utils/seo.ts → listSeoPages()`: every route the site emits, with
section, locale, slug, title, subtitle, resolved image source) — the same registry feeds the sitemap `lastmod`, the audit and the card generator, so a new page type cannot ship without a card.

Platform checklist (add to audit + manual QA before cutover): WhatsApp (send link to self; add `?v=2` to bust its cache), Telegram
(`@WebpageBot` to refresh), Facebook Sharing Debugger, LinkedIn Post Inspector, X Card validator (or opengraph.xyz), Slack, iMessage.
**Cloudflare gotcha:** make sure WAF/Bot Fight Mode/rate limiting never challenge `facebookexternalhit`, `WhatsApp`, `Twitterbot`,
`TelegramBot`, `LinkedInBot`, `Slackbot`, `Googlebot`, `bingbot` (Verified Bots must be allowed); social crawlers fail silently otherwise.

*Accept:* every page has its **own** `og:image` (no indexable page on a default card) that exists in `dist/`, is 1200×630, ≤250 KB, returns 200 `image/jpeg`; build report lists which source each page used (hero / body image / generated card); manual WhatsApp
test of one event, one blog post, the homepage and one title-card page shows a large card.

---

### Phase 4 — hreflang & language correctness

- `getAlternates(section, slug)` in `utils/seo.ts` using the **same existence check** Navbar already does (`getEntry` per locale; translations are
  partial by design). Emit self-reference + each existing translation + `x-default` → nl if nl exists, else the page itself.
  Static pages (contact, gebedstijden, homepage, section indexes) have all three.
- Reciprocity guaranteed by construction; audit verifies a↔b.
- Sitemap `<xhtml:link>` alternates (from `@astrojs/sitemap` `i18n`) must agree with head hreflang — verify they only reference existing pages.
- Optional `contentLang` front matter: some `/nl/` entries are written in Indonesian (e.g. *diskusi-produk-makanan-halal* sits in the nl feed with
  Indonesian text). When set, it drives `<article lang>`, `inLanguage` in JSON-LD and `og:locale` — **not** the URL/hreflang. Start by listing
  mismatches with a small script (language-detect heuristic) and decide per entry.
- Keep `<html lang>` = locale (already correct). Do not copy Hugo's `maximum-scale=1` viewport (accessibility/ranking-neutral but bad UX).

*Accept:* audit: every alternate target exists and links back; exactly one self-reference; x-default present.

---

### Phase 5 — Structured data (JSON-LD)

Components in `src/components/seo/` (`JsonLd.astro` + builders in `utils/jsonld.ts`, pure functions, unit-testable). One `<script type="application/ld+json">`
with an `@graph`, stable `@id`s (`https://www.ppmedenhaag.nl/#organization`, `#website`, `{url}#webpage`, `{url}#event`…).
Templates are in `.claude/skills/ppme-seo/reference/schema-templates.md`.

| Page | Nodes |
|---|---|
| every page | `Organization` (name, url, `logo` ImageObject ≥112px square-ish PNG, `sameAs` Facebook/Instagram/YouTube from `footer.astro`, address, `areaServed` Den Haag/Netherlands, `knowsLanguage`), `WebSite` (`inLanguage`, `publisher`; **no SearchAction** — Google dropped the sitelinks searchbox), `WebPage` |
| inner pages | + `BreadcrumbList` (Home › Section › Page; labels from `menuData`) |
| event | `Event`: `name`, `startDate` (ISO with correct Amsterdam offset), `eventStatus` (EventScheduled; Cancelled/Postponed via optional front matter `status`), `eventAttendanceMode` (Offline; Online when `location` matches Zoom/Teams/YouTube; Mixed if both), `location` (`Place`+`PostalAddress` from a venue map, or `VirtualLocation` w/ URL), `image[]`, `description`, `organizer`, `performer[]` from `speaker` (Person: name, jobTitle←designation, image), `isAccessibleForFree`/`offers` (price 0, url, availability) when free, `inLanguage`, `url`. **No `endDate` unless parseable** (durations are free text). Past events keep their markup. |
| blog | `BlogPosting` (headline ≤110, datePublished, dateModified, author as Organization "PPME Den Haag" or Person, image[], publisher, mainEntityOfPage, keywords←tags, articleSection←categories, inLanguage) |
| ibadah / dakwah / about | `Article` (same fields) |
| contact | `ContactPage` |
| prayer times | `WebPage` (+ visible, crawlable table is the real asset; no Dataset needed) |
| listings | `CollectionPage` + `ItemList` (first page only) |

Supporting data: `src/data/venues.ts` mapping the recurring location strings ("Masjid Al Hikmah", "Al Hikmah moskee", …) to a `Place` with
address, geo, `sameAs`. **Needs the correct current address from the owner** (two addresses exist in content). Date normalizer: take the wall-clock digits
as written, compute the true Europe/Amsterdam offset for that date (fixes wrong-DST front matter) before emitting `startDate`.
Skip: FAQPage/HowTo/Review (no eligibility / not applicable), LocalBusiness opening hours (association, not a shop).

Validate with Google Rich Results Test (Event), Schema Markup Validator, and the local audit (required-property checks per type).

*Accept:* 100 % of event pages produce a valid `Event` with no errors in Rich Results Test (sample 10); warnings documented; JSON-LD parses on all pages.

---

### Phase 6 — Sitemap, RSS, discovery

**Sitemap** (keep `@astrojs/sitemap`, add):
- `filter`: exclude `/404`, drafts, `noindex` pages. `serialize`: add `lastmod` from entry `date`/`modified` (skip for static pages unless known).
  Ignore `changefreq/priority` (Google ignores them).
- Hugo URL continuity: Search Console probably holds `https://www.ppmedenhaag.nl/sitemap.xml` and the three per-locale maps. A build hook
  (`astro:build:done` in a small integration, or a post-build script in the `build` chain next to pagefind) **splits** `sitemap-0.xml` by locale prefix and writes
  `dist/sitemap.xml` (index) + `dist/nl/sitemap.xml`, `dist/id/sitemap.xml`, `dist/en/sitemap.xml` — identical structure to Hugo — while keeping
  `sitemap-index.xml` working. `robots.txt` points at `/sitemap.xml`.
- Confirm in output that `<xhtml:link>` alternates only point at real pages.

**RSS** (`@astrojs/rss`, mirror the Hugo set; enumerate exact list from the live site first — see Phase 9 diff): `/index.xml`, `/event/index.xml`,
`/blog/index.xml`, `/id/index.xml`, `/id/event/index.xml`, `/id/blog/index.xml`, `/en/…` (and any other section Hugo emits). Items: title, link, pubDate,
`description` (= derived description), `guid` = permalink; add `content:encoded` only if sanitized (sanitize-html). `<language>` per feed.
Hugo also had taxonomy feeds (`/tags/x/index.xml`…): follow the Phase 0.4 outcome (redirect with their pages).

**Discovery:** `link rel=alternate type=application/rss+xml` in head; sitemap + robots; Bing/Yandex **IndexNow** ping in the GitHub deploy workflow after
`wrangler deploy` (optional, cheap; or enable Cloudflare Crawler Hints on the zone).

*Accept:* all four sitemap URLs 200 and valid XML; URL counts ≈ Hugo + new pages; every feed validates (W3C feed validator); feed set ⊇ Hugo's.

---

### Phase 7 — Technical SEO, Core Web Vitals, caching

- **Headers** (`public/_headers`): `/_astro/*` and `/og/*` → `public, max-age=31536000, immutable`; `/images/*` → `public, max-age=2592000`; `/pagefind/*`
  → short; HTML stays `max-age=0, must-revalidate`. (Current file only sets `s-maxage` on js/css/woff.) Keep the existing security headers.
- **Images:** emit `width`/`height` (read via sharp at build) on every hero/content image to kill CLS; `loading="lazy"` below the fold,
  `fetchpriority="high"` + no lazy on the LCP hero; compress the 4 images >600 KB; decide whether to migrate `public/images` → `src/assets` so
  `astro:assets` can produce responsive WebP/AVIF `srcset` (larger refactor; do after Phases 1–6, tracked as an optional Phase 7b). Raw HTML `<img>` in Markdown:
  add a rehype step that injects `loading=lazy decoding=async` and warns on missing `alt`.
- **Fonts:** keep self-hosted Inter; preload only the Latin subset woff2; confirm `font-display: swap` (present) and no layout-shifting fallback metrics.
- **JS:** Navbar React island is `client:load` on every page; measure, and consider `client:idle` for the search part or splitting the island, so LCP/INP
  on mobile stay green. Prayer widget already `client:visible`.
- **Baselines:** run Lighthouse (mobile) on ~8 representative URLs on Hugo vs Astro **before** changing anything and again after; targets
  LCP < 2.5 s, CLS < 0.1, INP < 200 ms, Lighthouse SEO = 100, Accessibility ≥ 95.
- **Heading/semantic audit:** exactly one `<h1>` per page, logical `h2/h3`, `<article>`/`<nav>` landmarks, descriptive link text, `alt` on all content images.
- **Pagination:** listing page N self-canonical (not canonical to page 1), title "… – page N", all pages indexable, links `?`-free (`/blog/page/2/` — verify it matches Hugo).
- **Redirect hygiene:** no chains; trailing slash 301 (Phase 0.1); `http→https` + HSTS at the zone.
- **Cloudflare zone settings:** Always Use HTTPS, HTTP/3, Brotli, Early Hints on; Rocket Loader off; do not enable Email Obfuscation on pages that carry contact emails
  unless intended (it rewrites HTML and can hide emails from crawlers).

---

### Phase 8 — Content-level SEO & internal links

- Headline/keyword pass on the hand-written pages (Phase 2); each important page gets a short intro paragraph that states *what / where / who* (Den Haag, Masjid Al Hikmah).
- Internal linking: related events/posts block on detail pages exists (`EventDetail` shows 3) → extend to blog/ibadah; link ibadah pages from the homepage and footer;
  breadcrumbs visible in UI (mirrors JSON-LD).
- Event pages: keep past events indexed (history = authority); add "past event" label via structured status rather than deleting.
- Link-text/anchor audit for generic "klik hier"; convert raw Hugo-era shortcodes still left in bodies (`{{< … >}}` residue shows up in derived descriptions — strip in the derivation *and* fix the content).
- Ensure Pagefind pages marked `searchable={false}` are still indexable by search engines (they are — Pagefind attribute ≠ robots).
- Local SEO off-site (owner tasks, not code): Google Business Profile for the association / Masjid listing, consistent NAP (name, address, phone) on site, Facebook, Instagram,
  YouTube; link the website from those profiles (also gives `sameAs` its weight); Wikipedia/Wikidata only if notability ever applies.

---

### Phase 9 — Verification tooling (build gate)

New scripts (Node, no deps beyond `node-html-parser`/`fast-xml-parser`, wired into `npm run build` after Pagefind, errors fail the build, warnings print a report):
- `scripts/seo-audit.mjs` over `dist/`: single `<title>`; description length; canonical absolute + self-consistent + trailing slash; og/twitter completeness; og:image file
  exists, 1200×630, ≤300 KB; hreflang reciprocity/self/x-default; JSON-LD parse + per-type required fields; one `<h1>`; `lang` vs path locale; no `noindex` on production
  pages; images have `alt`; duplicate titles/descriptions; internal-link resolver (broken links, links to redirected URLs); every sitemap URL exists and is indexable; every
  indexable page is in the sitemap.
- `scripts/seo-url-diff.mjs` (run manually/pre-cutover, needs network): fetch live `/nl|id|en/sitemap.xml`, request each URL on the Astro host, report `200`/`301→200`/`404`
  and **meta parity** (title/description/canonical vs live). Also compares the RSS URL set. Output markdown to `docs/seo/url-diff.md`.
- `scripts/seo-social-check.md`: manual checklist for Phase 3 platforms.
- Optional CI job `lighthouse-ci` on 4 URLs with budgets.

---

### Phase 10 — Cloudflare configuration & cutover runbook

Pre-cutover (owner/dashboard unless noted):
0. **Inventory** (code + dashboard, no changes yet): all DNS records on the `ppmedenhaag.nl` zone (MX/SPF/DKIM for email, `sholat.`, `website-v2`, registration app, verification TXT);
   Hugo-repo `netlify.toml` / `static/_redirects` / `_headers` (port every redirect/header rule); inbound links known to the owner (Facebook/Instagram/YouTube bios, mosque site, emails,
   Google Business Profile) using apex vs www.
1. Confirm which DNS host serves ppmedenhaag.nl today (Netlify → Cloudflare zone?). `wrangler.jsonc` already has the custom domain `website-v2.ppmedenhaag.nl`, so the zone is
   in this Cloudflare account — verify. Only the apex (`@`) and `www` records change at cutover; leave mail and other subdomains untouched.
2. Search Console: add a **Domain property** (DNS TXT) if not already; verify existing sitemap submissions; export Performance (last 16 months) + Pages report as the baseline;
   Bing Webmaster Tools (import from GSC).
3. Run `seo-url-diff` + `seo-audit` clean; run Lighthouse baseline; manual social-preview QA.
4. Lower DNS TTLs 24–48 h ahead.
5. Add **both** `www.ppmedenhaag.nl` and `ppmedenhaag.nl` as Worker custom domains in `wrangler.jsonc` (the deploy workflow's API token needs zone permission for this); apex→www **301**
   handled in the Worker (Phase 0.1) with a Cloudflare Redirect Rule as belt-and-braces. Verify: `curl -sI http://ppmedenhaag.nl/x/?a=1` → 301 straight to `https://www.ppmedenhaag.nl/x/?a=1`
   (single hop, not http→https→www chain), same for `http://www…` → https. HSTS (already in `_headers`) only after both hosts serve valid HTTPS.
6. Bot/WAF review for verified & social crawlers; decide AI-crawler policy.
Cutover step 0 (**the SEO flip**): set repo variable `PUBLIC_SITE_URL=https://www.ppmedenhaag.nl`, redeploy, confirm the deploy log says "PRODUCTION deploy" and `seo-audit --production` passed
(all canonicals/og/hreflang/sitemap/RSS/robots use `www`), *then* continue below. Staging (`website-v2`) stays noindexed by the Worker. Remove the "staging pending" reminder from `CLAUDE.md` and memory when done.
Cutover (replaces Hugo/Netlify on **both** hosts): switch DNS (`www` + apex) to the Worker; immediately verify robots.txt (production), no `x-robots-tag` on www, sitemap, a few redirects, hreflang, OG on WhatsApp.
Remove `website-v2` route and set `workers_dev: false` (or leave noindexed) afterwards. Keep Netlify live (unlinked) ≥2 weeks for rollback.
Post-cutover: resubmit `/sitemap.xml`; use URL Inspection on home + 5 key pages; do **not** use "Change of address" (same domain).

### Phase 11 — Monitoring (first 8 weeks, then monthly)

Weekly: GSC Pages (indexed vs not indexed reasons), Crawl Stats (response codes, host status), Enhancements (Events, Breadcrumbs), Performance by section/language; CWV field data;
broken-link report from `seo-audit`; 404s from Workers observability (already enabled) → add 301s. Targets: indexed pages ≥ Hugo's, no sustained impression drop >10 % vs baseline
after week 2, Event rich results valid on all upcoming events. Yearly (1 Jan): rebuild so the prayer-time page rolls over (already in `CLAUDE.md`) — add to the checklist and sitemap `lastmod`.

---

## 4. File map

New: `worker/index.ts`, `public/robots.txt`, `public/_redirects`, `src/pages/404.astro`, `src/components/Seo.astro`, `src/components/seo/JsonLd.astro`, `src/utils/seo.ts`,
`src/utils/jsonld.ts`, `src/utils/og.ts`, `src/data/seo.ts`, `src/data/venues.ts`, `src/pages/og/[...path].jpg.ts`, `src/pages/{index.xml,event/index.xml,blog/index.xml}.ts` (+ locale variants),
`scripts/seo-audit.mjs`, `scripts/seo-url-diff.mjs`, `scripts/build-sitemaps.mjs` (or integration), `public/apple-touch-icon.png`, `public/favicon.ico`, `public/site.webmanifest`,
`public/og/default-*.jpg` (or generated), `docs/seo/KEYWORDS.md`, `docs/seo/url-diff.md` (generated).
Changed: `Layout.astro`, all `<Layout>` call sites, `content.config.ts` (optional fields), `wrangler.jsonc`, `public/_headers`, `astro.config.mjs` (sitemap filter/serialize, rehype plugin),
`package.json` (sharp, satori, @resvg/resvg-js, audit deps; build script), `.github/workflows/deploy.yml` (IndexNow, optional), `CLAUDE.md` (SEO section replaces the "Known gaps" SEO bullets).

## 5. Risks & gotchas

- Same build is served on workers.dev, website-v2 and (later) www → host-dependent behavior **must** live in the Worker, not in build flags.
- `@astrojs/sitemap` `i18n` assumes URL-pattern translation; verify it never emits alternates to non-existent translations.
- Workers assets trailing-slash redirects are 307, not 301 (measured) → Phase 0.1.
- Cloudflare auto-prepends managed robots.txt / content-signals; decide policy so it doesn't surprise anyone.
- OG: cached aggressively by platforms → content-hashed image URLs; WhatsApp ignores images much over ~300 KB.
- satori needs non-woff2 font files; Linux CI has no system fonts.
- Derived descriptions can include Hugo shortcode residue or greetings → covered by the derivation rules + audit duplicate/length checks.
- Wrong DST offsets in older front matter → normalize in JSON-LD (display already uses `EVENT_TZ`).
- Scope creep: taxonomy/legacy pages (Phase 0.4) are SEO-critical but are content-port work; keep them separate PRs.

## 6. Suggested order (PR-sized milestones)

1. **M1 (blockers):** Phase 0.1–0.3 + robots + 404 + `_headers` caching.  
2. **M2 (core head):** Phase 1 + 2 (Seo.astro, derived descriptions, hand-written key pages, hreflang from Phase 4).  
3. **M3 (previews):** Phase 3 OG pipeline (+ audit of image checks).  
4. **M4 (rich results):** Phase 5 JSON-LD.  
5. **M5 (discovery):** Phase 6 sitemap split + RSS.  
6. **M6 (parity):** Phase 0.4 legacy URLs + Phase 9 scripts → zero-diff.  
7. **M7 (speed):** Phase 7 perf/images.  
8. **M8 (launch):** Phase 10 runbook, then Phase 11.  

## 7. Open decisions for the owner

See `PROGRESS.md → Decisions needed`. Key ones: current Masjid address/venue facts; AI-crawler policy; `/tags` strategy (port vs redirect); homepage OG = brand card vs promoted event;
who owns the `sa-verify` token and existing Search Console / Bing properties; whether to use a Worker (recommended) or dashboard rules for host handling; Twitter/X handle if any.
