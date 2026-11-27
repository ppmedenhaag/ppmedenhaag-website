# Site audit — ppmedenhaag.nl (2026-11-27)

Scope: the live site (`https://www.ppmedenhaag.nl`, all 287 sitemap URLs + everything linked from them) and this repo.

**Method**
- Crawled from the homepage down to every detail page: 288 HTML pages, 597 internal assets, 296 external links. Checked status, head tags, headings, images, links and JSON-LD.
- Lighthouse 12 (the engine behind PageSpeed Insights, same mobile throttling) on 16 representative pages, mobile + desktop = 32 runs. The PageSpeed Insights API itself refused (keyless daily quota, HTTP 429), so there is **no CrUX field data** here. Check *Search Console → Core Web Vitals* for real-user numbers.
- Puppeteer at 390 px and 1366 px: horizontal overflow, tap targets, text < 12 px, screenshots.
- Contrast ratios computed from the design tokens (`global.css`).
- Hunspell (nl, en-US, en-GB, id_ID) over the text of every page, plus a manual read of the UI strings, homepage copy and the About/Ibadah pages.
- Repo: `astro check`, `npm run test:worker`, `scripts/check-content.mjs`, `npm audit`, `npm outdated`, and a review of the main components.

**Caveats**
- The audit machine's DNS blocks `scripts.simpleanalyticscdn.com`. The "browser errors in console" Lighthouse reports on every page is that block, not a site bug (the host resolves fine on public DNS). Scores are slightly optimistic because the analytics script did not load.
- Lighthouse TBT is noisy: the homepage measured 130–1,170 ms across runs on the same machine.

---

## Status (branch `audit-fixes-2026-11-27`)

### Fixed in this branch
- **Facts:** About-page "years of active community" is now computed at build time from the founding date (`since: "1971-04-12"` in `data/*/homepage.yml`, `utils/funfacts.ts`), so it shows 55 now and stays correct. "Fifty years after its founding" → "More than fifty years…" (en).
- **Typos/language:** every confirmed typo in §5 (nl, id, en; 58 replacements) plus "silahkan/diatas" spelling, "Mesjid" → "Masjid", "PPME Den Haag gemeente" → "-gemeenschap", "moskee gemeenschap" → "moskeegemeenschap"; UI strings "Subyek" → "Subjek", "anda" → "Anda", "Latest Update" → "Latest News", "Type your message" → "Your message", "Lees Meer"/"Read More" → sentence case; "fraternization" rewritten; the worst machine-translated sentences in the English Ibadah pages (Toetreden, Overlijden incl. "to be complicated" → "shrouded", Trouwen, Sadaqah) rewritten; Dutch "ingewikkeld" → "in de kafan gewikkeld".
- **Sitemap / dates:** no future `article:published_time` (upcoming events) and no future `<lastmod>`; `seo-audit.mjs` now fails the build on a future lastmod and warns on descriptions > 160 chars.
- **Descriptions:** the 12 over-long ones shortened; the two id Ramadan posts and the jongerenprogramma event got their own descriptions.
- **Card excerpts:** from the first real sentence (greetings such as "Bismillaah… Assalamu'alaikum wr. wb. 🙏" are skipped, `utils/seo.ts stripLeadingGreeting`), cut at a sentence/word boundary; derived meta descriptions benefit too.
- **Accessibility:** skip link ("Naar de inhoud" / "Langsung ke konten" / "Skip to content"); contrast fixes (`DonationBox` QR caption, search dialog toggle, kbd chips, dialog footer → slate-600); valid `<dl>` and ≥ 24 px link targets on the contact page; `required` on name/email/message; search button accessible name matches its visible text (+ `aria-keyshortcuts`); "Read more" CTA link has a descriptive hidden suffix; **heading levels without gaps on every content page** (build-time plugin `src/plugins/heading-levels.mjs` renumbers Markdown headings in the HTML and tags them `md-h<original>`; CSS keeps the authored look: 141 headings on 12 pages compared with the live site at 390/1280/1600 px, identical computed styles and positions; the Markdown files are unchanged); `<h6 class="callout">` → `<p class="callout">`; one `<h1>` on the prayer-times page; prayer-table labels 9/10 px → 11 px.
- **Mobile layout:** 14 pages overflowed at 360 px (found while verifying): wide Markdown tables now scroll inside a `.table-scroll` wrapper, long page titles hyphenate/wrap, long URLs in content wrap. All 287 pages verified with no horizontal overflow at 360 px.
- **Performance:** no opacity-0 fade-in or invisible backdrop-blur on the homepage hero (LCP), none on the contact card; logo `width`/`height`; Vision/Mission background `success-story.jpg` (242 KB) → WebP (54 KB), lazy-loaded.
- **Housekeeping:** RSS main-feed description; "Tentang kita" → "Tentang Kami"; apex link in `de-levenskracht-van-onze-ummah` → www; unused `fast-xml-parser`, `src/assets/contact.jpg`, `about-ppme-notused.jpg` removed; unused import in `astro.config.mjs`; stale CLAUDE.md notes updated.

Verified locally: `npm run build` (astro check 0 errors, SEO audit OK), `npm run test:worker`, no overflow on all 287 pages at 360 px, Lighthouse accessibility 100 on contact, Sadaqah, homepage and About (99 → 100 expected on the kajian event after its heading fix).

### Needs a manual check or a decision (not changed)
1. **Click the ING payment links** (homepage CTA, Sadaqah, kajian, Ramadan events) and `shorturl.at/gaKS6` → Microsoft Form: ING payment requests can expire; bots can't verify them.
2. **Fun facts:** confirm "201 families" and "75 children learning Qur'an" are still current.
3. **Dutch tone:** the site mixes "u" and "je"; pick one. Also "Islam" vs "islam" in Dutch titles (Taalunie: lowercase).
4. **Indonesian-only pages under nl/en URLs** (`diskusi-produk-makanan-halal` and other `contentLang` pages): canonical to the `/id/` URL, or drop them from hreflang? SEO decision (S3).
5. ~~Heading levels in older blog/event Markdown~~: done in this branch without changing the look (see "Fixed").
6. **Long event titles** (> 65 chars, 10 pages) truncate in search results; shorten if you like.
7. **Indonesian blog section name:** "Berita" (SEO title, RSS) vs "Informasi Terkini" (page heading); pick one.
8. **English Ibadah pages:** a native-speaker pass is still worthwhile beyond the sentences rewritten here.
9. **Content-Security-Policy:** start with `Content-Security-Policy-Report-Only` in `worker/index.js` and watch for violations before enforcing.
10. **http://ppmedenhaag.nl → 2 redirects:** add a Cloudflare zone redirect rule (http apex → `https://www.`) to make it one.
11. **Event JSON-LD `offers`:** needs per-event price info (free events: `price: 0`).
12. **Mobile performance:** after deploy, re-run PageSpeed Insights and check Search Console → Core Web Vitals (field data). If TBT is still high, profile the React islands and the full-page blur/mask layers.
13. **Images:** Bestuur photos are served larger than displayed (≈ 30–45 KB each); 35 MB of unlinked PDFs in `public/forms` + `public/docs` (keep for old flyers?); `public/images/logo/PPME - DEN HAAG.ai` is publicly downloadable.
14. **`npm audit`:** 4 moderate, build-time only; wait for upstream fixes (the `--force` "fix" is a downgrade).
15. **Smaller language items:** Dutch months capitalised in old posts ("1 Juli"); "Al Falaah, meaning *victory*" vs "come to *success*" on the About page; spelling variants Sadaqah/Shodaqah/Shodaqoh across the site; the id Toetreden page links to a Dutch-labelled form.
16. **Contact form without JavaScript:** the subject's hidden input only exists after hydration.

---

## 1. Scorecard

| Area | Result |
|---|---|
| HTTP status | 287/287 sitemap pages 200; 0 broken internal links; 0 broken assets |
| Redirects | http→https, apex→www, trailing slash, `/nl/…`, Hugo aliases, legacy sections: all 301 correctly; 404 returns 404 |
| Head/SEO tags | Title, description, canonical (self), hreflang + x-default, OG/Twitter and valid JSON-LD on **every** page |
| Security headers | HSTS (preload), nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy. **No CSP** |
| Transfer | Brotli; homepage 13.8 KB, prayer-times page 29 KB on the wire; `/_astro/*` immutable 1 y, images 30 d |
| Layout | No horizontal overflow at 390 px or 1366 px on any tested page; CLS 0–0.005 everywhere |
| Lighthouse desktop | Perf 76–100 · A11y 90–100 · Best practices 96 · SEO 92–100 |
| Lighthouse mobile | Perf **71–97** · A11y 90–100 · Best practices 96 · SEO 92–100 |
| Repo | `astro check` 0 errors; worker tests pass; content check 0 date/language mismatches; dependencies current; 4 moderate `npm audit` advisories (build-time only) |

### Lighthouse per page

| Page | Mobile perf | LCP (m) | TBT (m) | Desktop perf | A11y | SEO |
|---|---|---|---|---|---|---|
| `/` | 71 | 2.7 s | 1,170 ms | 95 | 100 | 100 |
| `/id/` | 77 | 2.6 s | 810 ms | 98 | 100 | 100 |
| `/en/` | 89 | 2.7 s | 280 ms | 97 | 100 | **92** |
| `/event/` | 89 | 2.8 s | 280 ms | 99 | 100 | 100 |
| `/event/kajian-dr-aisah-dahlan/` | 80 | 2.7 s | 600 ms | **76** | 99 | 100 |
| `/blog/` | 96 | 2.7 s | 40 ms | 98 | 100 | 100 |
| `/blog/umrah-ppme-den-haag-2026/` | 75 | 2.2 s | 1,140 ms | 97 | 100 | 100 |
| `/id/blog/ramadhan-1447/` | 95 | 2.6 s | 110 ms | 99 | 100 | 100 |
| `/ibadah/` | 96 | 2.7 s | 30 ms | 99 | 100 | 100 |
| `/ibadah/gebedstijden/` | 74 | 2.7 s | 940 ms | 98 | 100 | 100 |
| `/ibadah/sadaqah/` | 92 | 2.5 s | 220 ms | 99 | **95** | 100 |
| `/en/ibadah/toetreden-islam/` | 96 | 2.8 s | 0 ms | 100 | 98 | 100 |
| `/about/` | 85 | **4.0 s** | 120 ms | 99 | 98 | 100 |
| `/bestuur-2026/` | 84 | 2.2 s | 580 ms | 99 | 100 | 100 |
| `/dakwah/` | 97 | 2.5 s | 50 ms | 100 | 100 | 100 |
| `/contact/` | 93 | 2.6 s | 210 ms | 85 | **90** | 100 |

---

## 2. Performance

**P1. Mobile LCP is ~2.5–2.8 s on almost every page (good is ≤ 2.5 s); `/about/` is 4.0 s.**
- The LCP element on every page is the decorative map background (`<img class="nl-map__svg">`, `components/NetherlandsMap.astro`), with ~0.7–1.0 s "element render delay".
- A/B test on the live homepage with the map blocked (`--blocked-url-patterns=*nl-map*`): LCP stayed at 2.6–2.8 s (the hero text became the LCP element at the same moment). So **the map is not the bottleneck**. The delay is general render delay before first meaningful paint (CSS + font + main-thread work).
- Homepage only: the hero card has `animate-fade-up` (`Homepage.astro:55`): it starts at opacity 0 and fades in over 0.6 s, which holds back LCP when the text is the LCP element. The same goes for `contact-form.astro:21`.
- `/about/`: `public/images/backgrounds/success-story.jpg` is a 242 KB JPEG, not WebP and without `srcset` (Lighthouse: 168 KB saving). `/images/about/about-ppme.webp` could be 36 KB smaller. The Bestuur photos (`bestuur-0x`, `*-01.webp`) are served larger than displayed (≈ 30–45 KB saving each).

**P2. Long main-thread task (1.0–1.5 s, mobile, 4× CPU throttling) on `/`, `/id/`, `/ibadah/gebedstijden/`, the umrah blog post and the kajian event.** Most of it is "Other/unattributable" plus style and layout, not script. Contributors: React islands (navbar + search, prayer-times widget), a 9,299-element DOM on the prayer-times page (two full years rendered, one hidden), and backdrop blur, masks and blur filters on full-page layers. Worth profiling in DevTools with "Performance → CPU 4× slowdown" to pin down. Unused JS: 22–34 KB per page (mostly the Headless UI / navbar bundle).

**P3. Smaller items**
- Logo `<img src="/images/logo.png">` has no `width`/`height` (navbar + footer, every page). CLS is 0 today thanks to fixed CSS height, but add the attributes, and serve WebP/SVG (Lighthouse saving 8 KB).
- `/ibadah/gebedstijden/` HTML is 579 KB uncompressed (29 KB Brotli) because 2026 and 2027 are both rendered. Fine on the wire, but heavy to parse on low-end phones.
- `/event/` listing has 1,270 DOM elements (all events on one page).
- 35 MB of unlinked files in `public/forms/` and `public/docs/` (`schedule-sholat-den-haag-2022…2025.pdf` are 6–9 MB each). They aren't linked from any page (old flyers may still point at them), so keep them, but they could be compressed. `public/images/logo/PPME - DEN HAAG.ai` (Illustrator source) is publicly downloadable.

---

## 3. SEO

**S1. Future `<lastmod>` in the sitemaps.** `/event/kajian-dr-aisah-dahlan/` has `2026-12-05`, `/event/istigotsah-akbar-2026/` has `2026-11-28`, and the sitemap index inherits `2026-12-05`. `scripts/sitemap-split.mjs` takes `article:published_time`, which for events is the **event date**. `article:published_time` itself is also in the future for upcoming events. Google may ignore all `lastmod` values from a site that reports future or inaccurate ones. Fix: for events use the publish/modified date (front matter `publishDate` or file mtime/git date), capped at build time.

**S2. Meta descriptions too long (> 160 chars), 12 pages**: 3 `kajian-dr-aisah-dahlan` pages (249–298 chars), 3 `nongkrong-sessie-2` pages (164–180), 2 `informatie-avond-iicc-al-ittihaad` pages (167–176), and the nl/en homepage (`STATIC_COPY.home`: 171 / 161). Front matter `description` bypasses the ≤ 155 rule in `utils/seo.ts`. Either shorten them or add a length warning to `seo-audit.mjs`.

**S3. Indonesian-only pages labelled as nl/en.** `/event/diskusi-produk-makanan-halal/`, `/en/event/…` and `/id/event/…` serve the same Indonesian text (`<html lang="id">` on all three), but hreflang declares them nl, id and en. Google will likely treat them as duplicates and ignore the hreflang. Options: canonical the nl/en URLs to `/id/…` (URLs stay live), or drop them from the hreflang set. Check the other `contentLang` pages for the same pattern.

**S4. Duplicate descriptions**: `/id/blog/ramadhan-1446/` and `/id/blog/ramadhan-1447/` share the derived description "Bismillaahirrohmanirrohiim. Jamaah PPME Den Haag yang kami hormati, bersama ini…", so the greeting-skipper in `utils/seo.ts` misses this greeting variant. Give both a front matter `description`.

**S5. Card excerpts**: `utils/text.ts truncateText()` cuts at exactly 100 characters, **mid-word** ("tijdens activite...", "dengan" → "denga..."), and excerpts come from the raw body, so most cards start with "Bismillaahirrahmaanirrahiim. Assalaamu 'alaykum wa rochmatullahi…" (visible on `/event/`, `/blog/`, the homepage and "Meer evenementen"). Use `description` when present, skip greetings (reuse the `utils/seo.ts` logic), and cut at a word boundary with "…".

**S6. Title length**: 10 titles over 65 chars (mostly long event titles, which drop the "| PPME Den Haag" suffix). OK, but they truncate in results.

**S7. Duplicate titles across languages** (41 groups, e.g. "Idul Adha 1445H | PPME Den Haag" on nl/id/en). Acceptable with hreflang, but nl pages with Indonesian titles miss Dutch keywords.

**S8. Two `<h1>` on the prayer-times pages** ("Gebedstijden Den Haag 2026" + hidden "… 2027"). Crawlers see both; consider rendering the second year's heading as an `<h2>`, or only rendering it in December.

**S9. Smaller**
- `/en/`: "Read More" link to the CTA event is non-descriptive (Lighthouse SEO 92). The nl "Lees Meer" and id "Selengkapnya" have the same problem. Use e.g. "Read more about Istigotsah Akbar" or an `aria-label`.
- RSS: the main feed channel description is "PPME Den Haag – PPME Den Haag" (`[...feed]/index.xml.ts:48` with an empty section title).
- `http://ppmedenhaag.nl/…` takes **two** 301 hops (zone "Always Use HTTPS" → apex https → Worker → www). CLAUDE.md says one combined 301; only the http-apex case is affected. A zone redirect rule straight to `https://www.` would fix it.
- `de-levenskracht-van-onze-ummah` (nl + id) links to `https://ppmedenhaag.nl` (apex, so it redirects).
- Event JSON-LD has no `offers` (Google lists it as recommended; free events can use `price: 0`).
- Section naming drift (id): SEO title/RSS "Berita", page heading "Informasi Terkini"; en heading "Latest Update" vs nav/search "News".

---

## 4. Accessibility, visibility and contrast

Brand palette passes comfortably: brand on white 8.0:1, brand on brand-50 7.1:1, footer text brand-100/200 on brand-darker 11.1 / 8.6:1, about stats brand-200 on brand-darker 8.6:1, slate-600 on white 7.6:1.

**A1. Contrast failures (WCAG AA 4.5:1)**
- `components/DonationBox.astro:81`: QR caption `text-slate-500` on the pale-blue panel = **4.42:1** (Sadaqah pages and homepage donation band).
- `components/react/Search.tsx:421`: inactive "current language / all languages" toggle, `text-slate-500` on `bg-slate-100` = **4.35:1** (inside the search dialog, which Lighthouse never opens).
- Borderline: `Search.tsx:504` footer and `:280/:593` kbd chips, slate-500 on slate-50 = 4.55:1. Footer icons and column labels in `text-brand-300` over the blurred glow = ~4.4:1 at the top-right (icons are decorative; the 11 px labels are borderline).
- Fix: use `text-slate-600` for small text on tinted backgrounds.

**A2. No "skip to main content" link** (`layouts/Layout.astro`). Keyboard users tab through the full navbar on every page.

**A3. Heading levels skipped on 113 pages**: the Markdown uses `#####`/`######` for dates and callouts (94 content files), e.g. blog `h1 → h5`, events `h1 → h6` (`<h6 class="callout">` on the kajian page), Sadaqah `h1 → h3 … h5`. Screen-reader outline is broken; also affects SEO structure. Change to `##`/`###` or plain bold.

**A4. Contact page** (A11y 90)
- `contact-form.astro:91–115`: `<dl>` contains elements other than `<dt>`/`<dd>` groups (Lighthouse `definition-list` + `dlitem`).
- Facebook/Instagram/YouTube text links are 74×20 px and close together (`target-size`).
- Name, email and message have **no `required`**, so an empty form can be submitted. The subject's hidden input only exists after hydration, so without JS no subject is sent.

**A5. Search button**: `aria-label="Zoeken"` while the visible text is "Zoeken… Ctrl K" (`label-content-name-mismatch`, every page on desktop). Drop the `aria-label` or make it start with the visible text.

**A6. Small text**: prayer-year table on mobile uses 10 px column headers and 9 px "Zomertijd/Wintertijd begint" labels (`PrayerYear.astro:115,148`). Eyebrows, dates and labels site-wide are 11 px uppercase. Readable, but at the lower limit, especially for older visitors.

**A7. Visual check**: screenshots at 390/1366 px. No overflow, no clipped text, dark bands readable, CTA and donation band clear. The mobile homepage hero fades in from opacity 0 (see P1); with "reduce motion" it's static.

---

## 5. Language and typos

All typos below are confirmed in the source (file:line).

### Dutch (nl)
| Where | Now | Should be |
|---|---|---|
| `event/nl/leadership-training.md:80` | accomoderen | accommoderen |
| `event/nl/leadership-training.md:81` | creeëren | creëren |
| `event/nl/leadership-training.md:82` | segregratie | segregatie |
| `event/nl/itikaf-ramadan-1446.md:53` | personnen | personen |
| `blog/nl/ramadhan-1447.md:29` | woendsdag | woensdag |
| `blog/nl/april-2023.md:30` | zaterdagpogramma | zaterdagprogramma |
| `event/nl/ramadan-6-1445.md:46` | Zaterdaagprogramma | Zaterdagprogramma |
| `blog/nl/jongerenprogramma-romadhoon-1445.md:20` | rahmtullahi | rahmatullahi |
| `event/nl/hadj-oemrah-reunie.md:50` | warrohmatullohiwabarotuh | warrohmatullohi wabarokatuh |
| `ibadah/nl/toetreden-islam.md:33` | proberen de toetreding … houden | proberen de toetreding … **te** houden |
| `ibadah/nl/sadaqah.md:25` | Het behoort tot een van de vijf pilaren | Het is een van de vijf zuilen van de islam |
| `event/nl/event-3.md:43` | prostratie (= uitputting) | prosternatie / neerknielen (sujud) |
| `data/nl/homepage.yml:108` | volhoudbare | (rare) duurzame / vol te houden |
| `event/nl/eid-feest-met-bekeerlingen.md:36` | iesm | check (looks like a typo) |
| `event/nl/leadership-training.md:69,79` | bijkijken, entale | check |
| several blog posts | "Beste PPME Den Haag gemeente" | gemeenschap ("gemeente" = municipality/church parish) |
| `blog/nl/ppme-51.md` | moskee gemeenschap | moskeegemeenschap |
| `blog/nl/juli-2023.md` etc. | Zaterdag 1 Juli | 1 juli (Dutch months lowercase) |

Consistency (nl): the UI mixes **"u"** (contact form "Uw naam", event pages) and **"je"** (homepage, donation box, Toetreden). Pick one. "Toetreden tot de Islam" vs "de islam" elsewhere (Dutch writes *islam* lowercase). Button labels "Lees Meer" → "Lees meer". "zijn profeet" (`toetreden-islam.md:26`): the shahada says *rasul*, so "Zijn boodschapper", capitalised like "Zijn liefde" earlier on the same page.

### Indonesian (id)
| Where | Now | Should be |
|---|---|---|
| `ibadah/id/toetreden-islam.md:25` | agak orang lain | **agar** orang lain |
| `ibadah/id/toetreden-islam.md:28` | melaui | melalui |
| `ibadah/id/toetreden-islam.md:32`, `event/id/event-5.md:57` | di mulai | dimulai |
| `ibadah/id/geboorte.md:25` | beryukur | bersyukur |
| `ibadah/id/geboorte.md:21` | anugrah | anugerah |
| `event/id/ramadan-25-1444.md:29,36` | berniatntuk | berniat untuk |
| `event/id/jumat.md:37` | disiarkang | disiarkan |
| `event/id/itikaf-ramadan-1446.md:54` | progam | program |
| `event/id/leadership-training.md:36` | sekaranga | sekarang |
| `event/id/leadership-training.md:41` | dinais | check |
| `event/id/safari.md:34` | silahturahmi | silaturahmi |
| `event/id/ietiekaaf-voor-broeders.md:31` | mentargetkan | menargetkan |
| `event/id/iduladha-1444/1445/1446.md:62` | mentaati | menaati |
| `blog/id/juni-2023.md:60` | dilanjuti | dilanjutkan |
| `blog/id/ppme-51.md:134` | bhasa | bahasa |
| `blog/id/blog-1.md:20` | berterimakasih | berterima kasih |
| `dakwah/id/dakwah-1.md:33` | beaya | biaya |
| `blog/id/ramadhan-1446/1447.md`, `romadhoon-1445.md` | bathin | batin |
| `blog/id/ppme-51.md:32,36,38` (+6 more) | (di/mem)persilahkan, silahkan | (di/mem)persilakan, silakan |
| `blog/id/zakat-fitrah-fidyah-1446.md:33`, `event/id/event-12.md:45`, `event/id/itikaf-ramadan-1446.md:55`, `blog/id/romadhoon-1445.md:28` (10 total) | diatas, dibawah, disini, kedepan | di atas, di bawah, di sini, ke depan |

Consistency (id): "Mesjid" vs "Masjid" (5 files); "Denhaag" vs "Den Haag"; "Syahadat"/"Syahadah"; "anda" (contact form, `ui.ts:85,87`) vs "Anda" (`ui.ts:111`), and KBBI wants **Anda**; "Subyek" → **Subjek** (`ui.ts:84`); "pengajian sabtu" → "Sabtu"; the id Toetreden page links to "📄 Formulier Mualaf" (Dutch label).

### English (en)
| Where | Now | Should be |
|---|---|---|
| `event/en/ramadan-18-1447.md:96` | particpate | participate |
| `event/en/istigotsah-akbar.md:46` | partitipations | participation |
| `event/en/maulid-nabi-1444.md:45` | schedue | schedule |
| `event/en/event-5.md:39` (+ nl copy) | wassallam | wassalam |
| `data/en/homepage.yml:110` | strives for **fraternization** | brotherhood / fellowship ("fraternization" suggests fraternizing with the enemy or romance) |
| `ibadah/en/toetreden-islam.md:24` | Muhammad is his prophet | Muhammad is His Messenger |
| `ibadah/en/toetreden-islam.md:27,38,39` | accession to Islam, interested parties, ambiguities | embracing Islam / conversion, people who are interested, questions |
| `ibadah/en/overlijden.md:31`, `islamitisch-trouwen.md:35,46` | Are you converted? | Are you a convert? |
| `ibadah/en/overlijden.md` | Jenazah Committee … Jenazah Commission | one term (Committee) |
| `ibadah/en/overlijden.md` | Ritual ablution / Wrapping / Pray / Buried | Washing / Shrouding / Funeral prayer / Burial |
| `ibadah/en/sadaqah.md` | It belongs to one of the five pillars … spend … to those | It is one of the five pillars … spend … on those |
| `en/about/about-1`, `en/ibadah/overlijden` | € 7,50 / € 0,00 | €7.50 / €0.00 |
| `about/en/about-1.md:19` | Since PPME was founded in the 1970s, you can join as a member | Membership has been open since PPME was founded in the 1970s |

The English Ibadah pages (Toetreden, Overlijden, Trouwen, Sadaqah) read as machine translations of the Dutch and are worth one native-speaker pass. UI: "Latest Update" → "Latest news"; title case is mixed ("Read More", "Send Message" vs "See all", "Learn more").

### Content facts to update
- **About pages, all 3 languages: "53 Jaren van actieve gemeenschap / Tahun Komunitas Aktif / Years of Active Community"** (`data/*/homepage.yml` `funfacts`). PPME was founded 12 April 1971, so it's **55** in 2026. Also re-check "201 families" and "75 children". Consider computing the years at build time.
- `about/en/_index.md`: "Fifty years after its founding, PPME has five branches" (now 55).
- Spelling of the same word across the site: Sadaqah / Shodaqah / Shodaqoh / sadaqa / shodaqah; "Al Falaah, meaning *victory*" then "come to *success*" (about page; *falah* = success/prosperity).

---

## 6. Repo and code

- **`astro check`**: 0 errors, 0 warnings, 2 hints (unused `locales` import in `astro.config.mjs:10`; deprecated `document.execCommand` fallback in `Layout.astro:142`, fine as a fallback).
- **`npm audit`**: 4 moderate, all build-time (satori → fflate, @tailwindcss/typography → postcss-selector-parser). Not reachable from visitors; the suggested `--force` fixes are downgrades, so ignore them until upstream releases fixes.
- **Unused**: `fast-xml-parser` dependency (no imports); `src/assets/contact.jpg` (1.1 MB, unreferenced); `public/images/about/about-ppme-notused.jpg`.
- **No Content-Security-Policy header.** The site loads only self-hosted assets + Simple Analytics + YouTube embeds + Formspree, so a CSP is feasible (start with `Content-Security-Policy-Report-Only`).
- CLAUDE.md is stale in two places: the prayer-times page now renders the build year **and** the next one, so the "rebuild on 1 January" note is less critical; and the "Known gaps → Hugo shortcodes are not converted" bullet contradicts the audit note above it (the crawl found **0** shortcode leftovers).
- External links: ING `payreq` links (homepage CTA, Sadaqah, events) time out for scripted requests (bot protection), so they could not be verified automatically. **Click them by hand**: ING payment requests can expire. `shorturl.at/gaKS6` (Eid-feest) redirects to a Microsoft Form; check it is still open. Facebook/Linktree "errors" are bot blocks, not dead links.

---

## 7. Verified OK (no action)

Status codes · internal links · images (all have `alt`; decorative ones `alt=""`) · iframes have titles · `target=_blank` links have `rel` · no `http://` links · no duplicate IDs · no Hugo shortcode leftovers · canonical = URL everywhere · hreflang present on every page (reciprocity is enforced by the `seo-audit.mjs` build gate) · JSON-LD parses on every page · robots.txt · sitemap index + per-language sitemaps · RSS feeds (4 spot-checked) · `.ics` files · webmanifest · 404 status · noindex only on non-production hosts · security headers · caching · Brotli · no horizontal overflow · CLS ≈ 0 · `prefers-reduced-motion` respected.

---

## 8. Prioritised fix list

**Do first (content, < 1 h each)**
1. About stats: 53 → 55 years (or compute it); re-check member/children counts.
2. Fix the typo tables in §5 (nl/id/en), starting with the Ibadah pages, which are evergreen and well visited.
3. Shorten the 12 meta descriptions (S2).
4. Manually click the ING payment links and the shorturl/forms links.

**Next (small code changes)**
5. Sitemap `lastmod` / `article:published_time` must not be the future event date (S1).
6. Card excerpts: use `description`, skip greetings, cut at a word boundary (S5).
7. Contrast: `DonationBox.astro:81` and `Search.tsx:421` → `text-slate-600` (A1).
8. Skip link in `Layout.astro` (A2); `required` on the contact fields and a valid `<dl>` (A4); fix the search button label (A5).
9. Logo `width`/`height` (+ WebP); `success-story.jpg` → WebP + `<Img>` srcset; shrink the Bestuur photos (P1/P3).
10. hreflang/canonical for Indonesian-only pages (S3).

**Later (bigger)**
11. Mobile LCP/TBT: remove the opacity-0 entrance animation on the homepage hero, profile the long main-thread task (islands, blur/mask layers, prayer-year DOM), consider rendering the second prayer year only from December.
12. Markdown heading levels (`#####`/`######` → `##`/`###`) across 94 content files (A3).
13. One native-speaker pass over the English Ibadah pages; pick u/je for Dutch.
14. CSP (report-only first), zone rule for a single http-apex 301, remove unused deps/assets.
