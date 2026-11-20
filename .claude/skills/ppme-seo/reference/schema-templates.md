# Reference — JSON-LD templates, meta templates, image specs (PPME Den Haag)

Values in `{braces}` come from `utils/seo.ts` / content. Never hard-code facts the owner has not confirmed (address: decision D1).
Base URL `https://www.ppmedenhaag.nl`. Stable ids: `…/#organization`, `…/#website`, `{url}#webpage`, `{url}#event`, `{url}#article`.

## Site-wide nodes (every page)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.ppmedenhaag.nl/#organization",
      "name": "PPME Den Haag",
      "alternateName": "Persatuan Pelajar dan Masyarakat Indonesia ...",  // only if confirmed
      "url": "https://www.ppmedenhaag.nl/",
      "logo": { "@type": "ImageObject", "url": "https://www.ppmedenhaag.nl/images/logo/logo.png", "width": 3564, "height": 1844 },
      "sameAs": [
        "https://www.facebook.com/PPMEcabDenHaag/",
        "https://www.instagram.com/ppme_denhaag/",
        "https://www.youtube.com/@ppmedenhaag5842"
      ],
      "areaServed": "Den Haag, Nederland",
      "knowsLanguage": ["nl", "id", "en"]
    },
    {
      "@type": "WebSite",
      "@id": "https://www.ppmedenhaag.nl/#website",
      "url": "https://www.ppmedenhaag.nl/",
      "name": "PPME Den Haag",
      "inLanguage": "{nl|id|en}",
      "publisher": { "@id": "https://www.ppmedenhaag.nl/#organization" }
    },
    {
      "@type": "WebPage",
      "@id": "{url}#webpage",
      "url": "{url}",
      "name": "{title}",
      "description": "{description}",
      "inLanguage": "{locale}",
      "isPartOf": { "@id": "https://www.ppmedenhaag.nl/#website" },
      "primaryImageOfPage": { "@type": "ImageObject", "url": "{ogImageUrl}", "width": 1200, "height": 630 }
    }
  ]
}
```
Logo note: Google wants a logo that is crawlable, ≥112×112, ideally square-ish; the current 3564×1844 wordmark is wide — consider adding a 512×512 square logo (`public/images/logo/logo-512.png`) and using that.

## BreadcrumbList (inner pages)
```json
{ "@type": "BreadcrumbList", "@id": "{url}#breadcrumb",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "{Home label}", "item": "https://www.ppmedenhaag.nl/" },
    { "@type": "ListItem", "position": 2, "name": "{Section label from menuData}", "item": "{sectionUrl}" },
    { "@type": "ListItem", "position": 3, "name": "{title}" }
  ] }
```

## Event (event entries)
```json
{
  "@type": "Event",
  "@id": "{url}#event",
  "name": "{title}",
  "description": "{description}",
  "startDate": "2026-11-21T20:00:00+01:00",          // wall-clock digits + true Europe/Amsterdam offset
  "eventStatus": "https://schema.org/EventScheduled", // EventCancelled / EventPostponed via front matter `status`
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode", // Online…/Mixed… when location matches Zoom|Teams|YouTube
  "location": {                                       // offline
    "@type": "Place",
    "name": "Masjid Al Hikmah",
    "address": { "@type": "PostalAddress", "streetAddress": "{D1}", "postalCode": "{D1}", "addressLocality": "Den Haag", "addressCountry": "NL" }
  },
  // online instead: "location": { "@type": "VirtualLocation", "url": "{join or page url}" }
  "image": ["{ogImageUrl}", "{originalImageAbsoluteUrl}"],
  "organizer": { "@id": "https://www.ppmedenhaag.nl/#organization" },
  "performer": [ { "@type": "Person", "name": "{speaker.name}", "jobTitle": "{speaker.designation?}", "image": "{speaker.image abs}" } ],
  "isAccessibleForFree": true,
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR", "availability": "https://schema.org/InStock", "url": "{url}" },
  "inLanguage": "{locale|contentLang}",
  "url": "{url}"
}
```
Rules: omit `endDate` unless the free-text `duration` parses ("2 uur", "5 jam", "~5h"); omit `offers` if the event is not free/unknown; omit address fields that aren't confirmed; keep past events.

## BlogPosting / Article
```json
{
  "@type": "BlogPosting",            // Article for ibadah/dakwah/about
  "@id": "{url}#article",
  "headline": "{title ≤110 chars}",
  "description": "{description}",
  "datePublished": "{ISO date}", "dateModified": "{ISO modified || date}",
  "author": { "@type": "Organization", "name": "{author || PPME Den Haag}" },
  "publisher": { "@id": "https://www.ppmedenhaag.nl/#organization" },
  "mainEntityOfPage": { "@id": "{url}#webpage" },
  "image": ["{ogImageUrl}"],
  "keywords": "{tags joined}", "articleSection": "{categories[0]}",
  "inLanguage": "{locale|contentLang}"
}
```
Other types: contact → `ContactPage`; listings → `CollectionPage` (+ `ItemList` first page); prayer times → `WebPage`.
Do **not** add: SearchAction (sitelinks searchbox retired), FAQPage/HowTo/Review (no eligibility/not applicable), LocalBusiness opening hours.

## Head template (order matters)
```html
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content="{description}" />
<link rel="canonical" href="{absUrl}" />
<link rel="alternate" hreflang="nl" href="…" /> … <link rel="alternate" hreflang="x-default" href="…" />
<meta property="og:site_name" content="PPME Den Haag" />
<meta property="og:type" content="{website|article}" />
<meta property="og:title" content="{title}" /><meta property="og:description" content="{description}" />
<meta property="og:url" content="{absUrl}" /><meta property="og:locale" content="{nl_NL|id_ID|en_GB}" />
<meta property="og:locale:alternate" content="…" />
<meta property="og:image" content="{absImage}" /><meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" /><meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:alt" content="{imageAlt}" />
<meta name="twitter:card" content="summary_large_image" /> (+ title/description/image/image:alt)
<meta property="article:published_time" content="{ISO}" /> (entries only; + modified_time, section, tag)
<script type="application/ld+json">{…}</script>
<!-- only then: theme-color, icons, stylesheet, inline styles -->
```

## Social image spec
| Item | Value |
|---|---|
| Size / ratio | 1200×630 (1.91:1) JPEG, progressive mozjpeg |
| Weight | target ≤250 KB; fail >300 KB (WhatsApp) |
| Composition | full source `inside` 1200×630 over blurred+darkened `cover` copy of itself; no crop; no logo on photos/flyers |
| Title card | bg `#034EA2`, white logo, Inter 700 title (≤3 lines, ellipsis), section eyebrow, locale chip |
| Source ≥1200×630 | downscale to fit, re-encode ≤250 KB |
| Source 600–1199 px wide | upscale capped at 1.5× (else smaller on backdrop) |
| Source 400–599 px wide | natural size on backdrop, no upscale, logged "low quality" |
| Source <400 px, or aspect wider than ~2.4:1 / taller than 1:2 | generated title card instead |
| GIF / SVG / animated WebP | first frame rasterized, then same rules |
| Every page | own card: hero-image card or generated per-page title card; default card = last resort / noindex only |
| URL | `/og/{section}/{locale}/{slug}.{hash8}.jpg` (hash = source bytes + title + generator version) |
| Defaults | `/og/default-nl.jpg`, `/og/default-id.jpg`, `/og/default-en.jpg` |
| Test | WhatsApp (send to self, `?v=n` to bust cache), Telegram `@WebpageBot`, Facebook Sharing Debugger, LinkedIn Post Inspector, opengraph.xyz |
