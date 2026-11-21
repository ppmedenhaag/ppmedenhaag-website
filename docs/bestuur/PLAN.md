# Bestuur (board) section: plan

Status: **plan only, no code written** (2026-11-21). Resume with "implement docs/bestuur/PLAN.md".
Source photos: `C:\Users\rosti\Downloads\` (see "Images"). Source texts: Appendix A.

## Goal

An overview page of the PPME Den Haag board (bestuur, 6 people) and one page per person, each with a photo,
role, and the short personal facts they supplied. nl/id/en like the rest of the site.

## URLs (new section, so no Hugo parity constraint, but keep the site's conventions)

| Page | nl (unprefixed) | id | en |
|---|---|---|---|
| Overview | `/bestuur/` | `/id/bestuur/` | `/en/bestuur/` |
| Person | `/bestuur/<slug>/` | `/id/bestuur/<slug>/` | `/en/bestuur/<slug>/` |

Slugs are identical in every locale (like Hugo filenames): `eddy-cahyono-sandino`, `raymond-hamzah-sparreboom`,
`archi-delphinanto`, `marwan-wirianto`, `la-gusti-negeri`, `wati-chaeron`.
`trailingSlash: "always"`; `nl` excluded from the `[locale]` routes with `!id.startsWith("nl/")` (CLAUDE.md rule).

## Content shape

`src/content/bestuur/<locale>/<slug>.md` + `src/content/bestuur/<locale>/_index.md` (overview), mirroring `about`/`dakwah`
(`sectionCollection` + `overviewCollection` in `content.config.ts`; add `"bestuur"` to the section union).
Do **not** reuse `blogSchema` (no date/author); new `bestuurSchema`:

```yaml
title: "Eddy Cahyono Sandino"     # person name (used for <title>, SEO, search)
role: "Ketua"                     # localized display role
role_order: 1                     # 1..6, sort key, same in every locale
image: "images/bestuur/eddy.webp"
birthplace: "Surabaya"
favorite_food: "..."
hobby: "..."
description: ""                   # optional; else derived from body (utils/seo.ts)
draft: false
```
Body = the "Pendapat tentang PPME" statement as Markdown (rendered as a blockquote section). Field labels
("Tempat lahir", "Makanan favorit", "Hobi", "Pendapat tentang PPME") are `bestuur.*` keys in `data/ui.ts`, not repeated per file.

## Pages / components

- `components/BestuurCard.astro` (tile: portrait 4:5, name, role), `BestuurList.astro` (responsive grid, sorted by `role_order`),
  `BestuurDetail.astro` (portrait + role badge + fact list + quote). Use existing `.tile*`, `.page-title`, `.title-rule`,
  `.eyebrow`, `.prose-brand` classes; no new visual language (skill `ppme-visual-design`).
- Overview: group photo as hero (whole, not cropped), short intro from `_index.md`, then the 6 cards.
  Order: Ketua, Wakil ketua, Sekretaris, Bendahara I, II, III.
- Four route files: `pages/bestuur/index.astro`, `pages/bestuur/[...slug].astro`, `pages/[locale]/bestuur/index.astro`,
  `pages/[locale]/bestuur/[...slug].astro` (copy the `about` pair, swap collection).
- Person page: "back to bestuur" link and prev/next person.

## Wiring checklist (each is a known gotcha in CLAUDE.md)

1. `data/i18n.ts` `menuData`: add "Bestuur" under **Meer**, next to "Over ons" (new `MenuLabels.bestuur`: Bestuur / Pengurus / Board).
2. `Navbar.astro` `contentMap` for the language switcher (only link locales whose entry exists).
3. `data/ui.ts`: `search.section.bestuur` + the `bestuur.*` labels.
4. SEO: add the new page types to `utils/seo-registry.ts` (+ `STATIC_COPY` for the overview if code-driven), JSON-LD
   `Person` (name, jobTitle, image, `worksFor` Organization) and `Organization.member`; **do not** put birthplace/hobby/food in JSON-LD.
5. Link-preview cards come for free via `utils/og.ts` (bump nothing); portrait is the hero, so use the optimized webp.
6. Pagefind: section filter is automatic (first path segment). Overview and detail pages are `searchable` (detail pages yes, overview yes).
7. Sitemaps/hreflang: automatic from the registry. Run `npm run seo:diff -- --write`: it should show **0 missing** (new URLs are additions).
8. RSS: no feed for this section (not time-based). `_redirects`: nothing.
9. Optionally link from `/about/` ("Ontmoet het bestuur") and the homepage later; not in this scope.

## Images

Source files (all in `C:\Users\rosti\Downloads\`):

| File | Size | Use |
|---|---|---|
| `eddy.png`, `hamzah.png`, `archi.png`, `gusti.png`, `marwan.png` | 2016x1512, ~3 MB each | person portraits |
| `wati.png` | ~200 px wide, 30 KB | **too small** for a hero portrait; ask for a higher-res original, else show small (card only) |
| `bestuur-2.png`, `bestuur-3.png` | 1366x911, ~2 MB | group photos: overview hero (+ one more in the body) |
| `bestuur-1.png` | 200x190 | too small for the page; skip unless owner wants it as a thumbnail |

Steps: copy to `public/images/bestuur/`, name by slug-first-name (`eddy.webp` ...), convert to webp via `scripts/optimize-images.mjs`
(portraits: crop 4:5 around the face, ~900 px wide, <120 KB; group: 1366 wide, <200 KB; the SEO gate caps og images at 300 KB).
Keep the PNG originals out of the repo (3 MB each). Alt text = person's name + role.
Filename to person mapping is by the owner's filenames; confirm once at implementation.

## Translations

The owner supplied Indonesian only. Default: write `id` verbatim, and `nl` + `en` as faithful translations of
role/labels/quote (the site is trilingual and the board speaks to all three audiences). Roles:
Ketua / Voorzitter / Chairman; Wakil ketua / Vicevoorzitter / Vice Chairman; Sekretaris / Secretaris / Secretary;
Bendahara I-III / Penningmeester I-III / Treasurer I-III. Partial translation is allowed by site convention
(switcher hides missing ones), so nl/en can ship later without breaking anything.

## Decisions needed from the owner (defaults in bold)

1. Publication consent: each person agreed to publish name, photo, birthplace, hobby, quote? **Assume yes, they supplied it; confirm before the production cutover.**
2. Translate to nl/en now? **Yes, I draft, owner/board approves.**
3. Typos: "sampel terasi" in Eddy's text is probably "sambal terasi"; "Naf'an" uses a typographic apostrophe. **Fix the first, keep the second.**
4. Term of office / "Periode 20xx": unknown. **Omit until given.**
5. Menu position: **under Meer, below Over ons.**
6. Wati's photo resolution (see Images).
7. Show birthplace + favorite food + hobby for all (they supplied them for this purpose). **Yes.**

## Acceptance criteria

- `npm run build` passes (`astro check`, Pagefind, `seo-audit.mjs` with 0 errors); `/bestuur/`, 6 detail pages, same for `/id/`, `/en/` (as translated); no `/nl/bestuur/...` URL exists.
- Overview lists 6 people in role order; each card links to a page with portrait, role, 3 facts, quote.
- Language switcher offers only existing translations; hreflang reciprocal; each page has its own og card.
- Mobile 375 px: 2-column grid at most, no horizontal scroll; images have width/height (no CLS), lazy except hero.
- Search finds a board member by name.

## How to resume

1. Read this file and Appendix A. 2. Answer/accept the decisions above. 3. Implement in this order: images, schema + content
(id first), components + routes, menu/ui/Navbar, SEO registry + JSON-LD, translations, build + audit. 4. Update `CLAUDE.md`
("Sections migrated") and remember the CUTOVER reminder on commit/push.

---

## Appendix A: source data (as supplied, Indonesian, 2026-11-21)

**1. Eddy Cahyono Sandino, Ketua** (`eddy.png`)
- Tempat lahir: Surabaya
- Pendapat tentang PPME: PPME adalah organisasi yang penuh manfaat, menjadi wadah untuk mempererat tali silaturahmi, memperkuat ukhuwah Islamiyah, serta saling berbagi ilmu dan kebaikan.
- Makanan favorit: Sayur asem dengan daging empal goreng dan sampel [sambal?] terasi xtra pedes.
- Hobi: Sepak bola dan melukis.

**2. Raymond (Hamzah) Sparreboom, Wakil ketua** (`hamzah.png`)
- Tempat lahir: Rotterdam
- Pendapat tentang PPME: PPME adalah rumah dan keluarga saya. Tempat saya menjalani kehidupan Islami, menjaga serta mencintai akar budaya Indonesia saya. Tempat membangun persatuan, kasih sayang, dan semangat kebersamaan. Dan insyaallah, kita semua akan meraih surga tertinggi.
- Makanan favorit: Sate kambing
- Hobi: Olahraga tinju dan 'kerajinan tangan'.

**3. Archi Delphinanto, Sekretaris** (`archi.png`)
- Tempat lahir: Malang
- Pendapat tentang PPME: PPME bukan sekadar organisasi, tetapi rumah persaudaraan dan tempat kebaikan tumbuh. Saya bersyukur menjadi bagian dari perjalanan ini. Terima kasih kepada para pendiri, pendahulu, dan seluruh rekan. Semoga PPME terus menjaga persatuan dan menebarkan kebaikan hingga generasi mendatang. Semoga menjadi amal jariyah yang terus mengalir. InsyaAllah.
- Makanan favorit: Bakso dong!
- Hobi: Membaca dan olahraga ringan

**4. Marwan Wirianto, Bendahara I** (`marwan.png`)
- Tempat lahir: Jakarta
- Pendapat tentang PPME: PPME adalah keluarga besar kami di Belanda. Di tengah jauhnya tanah kelahiran, PPME menjadi tempat kami menemukan kehangatan rumah, merawat persaudaraan, dan saling menguatkan dalam suka maupun duka.
- Makanan favorit: Makanan enak yang GRATIS!
- Hobi: Menghitung duit

**5. La Gusti Negeri, Bendahara II** (`gusti.png`)
- Tempat lahir: Surabaya
- Pendapat tentang PPME: Alhamdulillah dengan adanya PPME terasa ada wadah yang baik untuk umat muslim Indonesia di Belanda. Semoga Allah ridha atas semuanya di PPME Den Haag ini.
- Makanan favorit: Sate kambing
- Hobi: Nonton sepakbola

**6. Wati Chaeron, Bendahara III** (`wati.png`)
- Tempat lahir: Den Haag
- Pendapat tentang PPME: Orang tua saya merupakan jamaah generasi pertama PPME. Saya ingin meneruskan dakwah ini bersama kawan-kawan, sebagaimana orang tua kami dahulu membangun organisasi ini bersama Bapak Hambali dan alm. Bapak Naf'an Sulchan. Semoga Allah SWT senantiasa memberkahi langkah kita semua. Aamiin.
- Makanan favorit: Patat met mayonaise, sambal goreng tempe, tahu dan terong
- Hobi: Menulis, membaca dan belajar Bahasa Arab
