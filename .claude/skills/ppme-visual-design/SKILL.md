---
name: ppme-visual-design
description: Upgrade or review the visual design of the PPME Den Haag Astro website — colors, fonts, CSS, Tailwind v4 styling and animation — so it matches the PPME event-registration app (logo blue #034EA2, flat thin-bordered layout, Inter, slate neutrals, subtle motion). Use when asked to restyle, modernize, polish, theme, animate, or make a page/component visually consistent, and whenever adding a new component.
---

# PPME Den Haag — visual design system

This site and the PPME event-registration app (`C:\Users\rosti\ppmedenhaag\event-registration`, see its
`web/app/app.css`, `web/app/components/ui.tsx` and `.claude/skills/ui-design/SKILL.md`) are one brand.
This skill ports that app's visual language to the Astro site. When in doubt, open those files and copy
the pattern rather than inventing a new one.

Look: **flat, crisp, premium.** Thin borders and dividers, one blue accent, neutral slate base, a faint
brand glow, restrained motion. No bubble cards, no heavy shadows, no emojis, no indigo.

Styling only. Never change routes, content `id`s, locale logic or `trailingSlash`
(CLAUDE.md "Hard constraint: URL preservation"). CLAUDE.md wins over this skill.

## Workflow

1. Read `src/styles/global.css`, `src/layouts/Layout.astro`, and the component being changed.
2. Change tokens in `global.css` first, then components. No hard-coded hex in components.
3. Purge off-brand patterns (below) instead of restyling them.
4. `npm run build` (runs `astro check`), then `npm run dev`; check `/`, `/id/`, `/en/`, event list+detail,
   blog post (with raw-HTML table and `.btn` link), contact form, at phone width (no horizontal scroll).
5. `node .claude/skills/ppme-visual-design/scripts/contrast.mjs` must pass.

## Color

Brand is the logo blue **`#034EA2`** (RGB 3/78/162, CMYK 100/80/0/0), same as the registration app.
Tints are brand mixed with white; dark is brand at 70% brightness. **No indigo** as an accent.

Registration-app tokens (reuse verbatim so both sites agree) plus a few extra steps the website needs.
The existing `ppme-blue-*` names stay as aliases of the same ramp, so current classes keep working:

```css
@theme {
  /* Shared with event-registration/web/app/app.css */
  --color-brand: #034ea2;
  --color-brand-dark: #023771;
  --color-brand-50: #ebf1f8;
  --color-brand-100: #d7e3f0;
  --color-brand-200: #b3cae3;
  /* Website-only extensions (same hue, same mixing rule) */
  --color-brand-300: #81a6d0;
  --color-brand-400: #4f83be;
  --color-brand-darker: #022954;   /* footer / dark hero */
  --color-brand-darkest: #011c3b;

  /* Back-compat aliases for existing ppme-blue-* utilities */
  --color-ppme-blue-50: var(--color-brand-50);
  --color-ppme-blue-100: var(--color-brand-100);
  --color-ppme-blue-200: var(--color-brand-200);
  --color-ppme-blue-300: var(--color-brand-300);
  --color-ppme-blue-400: var(--color-brand-400);
  --color-ppme-blue-500: #2968b0;
  --color-ppme-blue-600: var(--color-brand);
  --color-ppme-blue-700: #034289;
  --color-ppme-blue-800: var(--color-brand-dark);
  --color-ppme-blue-900: var(--color-brand-darker);
  --color-ppme-blue-950: var(--color-brand-darkest);
}
```

- **Neutrals:** Tailwind `slate-*` (50 background, 200 borders, 500 secondary text, 700 body, 900 headings).
  Replace raw `gray-*` with `slate-*`.
- **Semantic only:** emerald = success, red = error/destructive, amber = warning. Nothing else.
- **Roles:** primary action `bg-brand hover:bg-brand-dark text-white`; links `text-brand hover:text-brand-dark`;
  tinted surface `bg-brand-50`; dark band (footer/CTA) `bg-brand-darker text-brand-100`.
- **Contrast floor:** body 4.5:1, large text/UI borders 3:1. Never `brand-300/400` text on white.
- **Gradients:** only (a) the title-text gradient and (b) the faint backdrop glow below, plus optionally a
  flat-ish `from-brand to-brand-dark` on a CTA band. No multi-hue gradients.
- Light-only (`color-scheme: light`), as in the registration app. Don't add dark mode unless asked.
- Replace strays: `bg-indigo-600`, `text-indigo-600`, `ring-indigo-600`, `ring-blue-500`, `bg-blue-500`.

## Typography

- **Inter Variable, self-hosted:** `npm i @fontsource-variable/inter`, import it in `Layout.astro`
  frontmatter. No Google Fonts/CDN (EU site; same privacy rule as the registration app).
- Same tokens as the app:
  ```css
  @theme {
    --font-sans: "Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    --font-mono: ui-monospace, "SF Mono", "Cascadia Mono", Consolas, monospace;
  }
  body { font-feature-settings: "cv11", "ss01"; text-rendering: optimizeLegibility; }
  html { color-scheme: light; -webkit-tap-highlight-color: transparent; }
  ```
- Hierarchy: h1 `text-3xl md:text-4xl font-bold tracking-tight`, h2 `text-2xl font-semibold tracking-tight`,
  body `text-base leading-relaxed text-slate-700`, meta `text-sm text-slate-500`.
- **Eyebrow** (small label above headings/values): `text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-500`.
- **Gradient page titles** (hero and page h1 only): neutral into brand, stays above AA:
  ```css
  .text-gradient-brand {
    background-image: linear-gradient(to right, var(--color-slate-900), var(--color-brand-dark) 55%, var(--color-slate-800));
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  ```
- If Arabic text is ever added (greetings), self-host `@fontsource/noto-naskh-arabic` with `dir="rtl"`, as the
  registration app does, so it doesn't vary per OS.

## Surfaces, borders, layout (the "flat" rule)

- **Backdrop** (copy from the app): neutral `slate-50` with a faint brand radial glow at top, plus a fine grid
  that fades out. Put `.app-backdrop` on the page wrapper and `.app-grid` in an absolutely positioned
  `h-[26rem]` layer:
  ```css
  @layer components {
    .app-backdrop {
      background-color: var(--color-slate-50);
      background-image:
        radial-gradient(60rem 28rem at 15% -8rem, rgb(3 78 162 / 0.11), transparent 70%),
        radial-gradient(40rem 22rem at 95% -6rem, rgb(3 78 162 / 0.07), transparent 70%);
      background-repeat: no-repeat;
    }
    .app-grid {
      background-image:
        linear-gradient(to right, rgb(15 23 42 / 0.045) 1px, transparent 1px),
        linear-gradient(to bottom, rgb(15 23 42 / 0.045) 1px, transparent 1px);
      background-size: 32px 32px;
      mask-image: linear-gradient(to bottom, black, transparent 26rem);
    }
  }
  ```
- **Anti-patterns (purge, don't restyle):** `shadow-lg/xl` at rest, `rounded-2xl/3xl`, isolated white rounded boxes
  on gray, emoji, childish decoration. Current offender: `EventCard.astro` (`rounded-lg shadow-lg ... border-gray-100`);
  same in `PostCard`, `Pagination`, `DakwahIndex`, homepage CTA.
- **Do instead:** thin borders `border border-slate-200/80`, dividers `divide-y divide-slate-200/60`, list/grids separated by
  hairlines, square or `rounded-md`/`rounded-lg` on controls only. Card grids become bordered tiles
  (`border border-slate-200 bg-white`, hover `border-brand/40` + title turning `text-brand`), images square-cornered.
- **Callouts:** flat with a left accent rule, not coloured rounded boxes:
  `flex gap-3 border-l-2 border-brand bg-brand-50/60 px-4 py-3 text-sm text-slate-700` (warning = amber, danger = red,
  success = emerald, neutral = slate). Use for notices, and map `.prose .alert-*` onto the same look.
- Container `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`; section rhythm `py-12 md:py-20`.
- Metadata (date, time, place, speaker) shown as a border-separated list or split horizontal grid with small inline
  icons, not cards. Header: logo on the same row as the title where it fits.
- Glass only for sticky bars: `backdrop-blur-md bg-white/70 border-b border-slate-200/60`.

## Components and buttons

Define once in `global.css` (`@layer components`), mirroring `buttonClass()` from the app's `ui.tsx`, so Astro files stop
repeating long class strings. Keep them **outside** `.prose` (the content classes are scoped to `.prose`).

```css
.btn { @apply inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap select-none
  transition-all duration-200 min-h-11 px-4 py-2 text-sm
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand; }
.btn-primary   { @apply bg-brand text-white shadow-sm shadow-brand/20 hover:bg-brand-dark; }
.btn-secondary { @apply border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900; }
.btn-ghost     { @apply text-brand hover:bg-brand-50 hover:text-brand-dark; }
```
Sizes: sm `min-h-9 px-3 text-[13px]`, lg `min-h-12 px-6 text-[15px]`. Every primary/secondary action carries a
leading or trailing icon (Heroicons **24/outline** only, `size-4`/`size-5`, never mixed with solid; colour follows text
hierarchy: `text-slate-400` or `text-brand`). Existing React islands already depend on `@heroicons/react`.

## Icons

- **Primary: Heroicons 24/outline** — the same set the registration app uses (and `@heroicons/react` already
  powers the React navbar). In `.astro` files use `astro-icon`: `import { Icon } from "astro-icon/components"`,
  `<Icon name="heroicons:map-pin" class="size-5 text-brand" aria-hidden="true" />`. It inlines SVG at build time
  (zero client JS). Use `heroicons:<name>` (outline); never mix `-solid` variants in one view. In React islands keep
  importing from `@heroicons/react/24/outline`.
- **Gap-filler: Tabler** (`tabler:<name>`, also 24px outline) only when Heroicons has no fit, e.g. `hourglass`,
  `building-mosque`, `moon-stars`, `pray`. Global CSS normalises its stroke to 1.5px to match. Whitelist each icon in
  `astro.config.mjs` (`icon({ include })`) so only used icons ship.
- **Brand logos** (Facebook, Instagram, YouTube): keep the existing `/icons/*.svg`, or if replacing use
  `@iconify-json/simple-icons`; never Heroicons for logos.
- Sizes `size-4` (inline with text) / `size-5` (meta rows); colour `text-brand` for meaning, `text-slate-400` for
  decoration; always `aria-hidden="true"` when text is adjacent.
- Semantic map: location `map-pin`, date `calendar-days`, time `clock`, duration `tabler:hourglass`, author `user`,
  category `tag`, speaker `microphone`/`user-circle`, link/CTA `arrow-right`, contact `paper-airplane`,
  worship/mosque `tabler:building-mosque`.

## `.prose` (migrated Hugo content)

Markdown bodies contain raw HTML. It used to carry Bootstrap 4 class names; those were migrated to PPME's own names
(no Bootstrap names should reappear). **Scan before styling**:
`grep -rhoE 'class="[^"]*"' src/content | tr ' ' '\n' | sort | uniq -c | sort -rn` lists every class in use. Anything
without a rule renders as plain text. In use: `btn btn-primary [btn-sm]`, `badge badge-success|warning|danger`,
`callout [callout-success]`, `accordion-item/-trigger/-panel/-body`, `table-compact`, `row-muted/-brand/-info/-success`,
`sticky-col`, and Tailwind utilities (`text-center`, `text-nowrap`, `block lg:hidden`, `hidden lg:block`, `overflow-x-auto`,
`italic`). Tailwind finds those through `@source "../content"` in `global.css`. No inline `color`/`background` in Markdown
except self-contained posters; use the classes above.

- **Gotcha #1 — layers beat specificity.** Tailwind v4's typography plugin puts `.prose a { color }` in the `utilities`
  layer. Rules inside `@layer components` lose to it even with higher specificity (this made migrated buttons dark text on
  blue). Everything that restyles `.prose` content lives **unlayered** at the bottom of `global.css` (unlayered beats all
  layers). Never move those shims back inside `@layer`.
- **Accordion:** `data-accordion-trigger` / `data-accordion-target="#id"` / `data-accordion-group="#group"`, open state
  class `is-open` on `.accordion-panel`; toggled by the small script in `Layout.astro` (keyboard + `aria-expanded`).
- **Buttons:** `a.btn` (always written `btn btn-primary [btn-sm]`).
  Always white on `brand` (hover `brand-dark`), underline off, `visited` colour pinned, focus ring, 44px tall (36px for
  `-sm`). `btn-secondary` = white with slate border.
- **Badges:** flat tinted chips: default `brand-50`/`brand-dark`, success emerald-50/800, warning amber-50/900,
  danger red-50/800. Each pair ≥ 4.5:1 (checked in `contrast.mjs`).
- **Alerts and accordion headers:** flat `brand-50` with a left rule (`callout`) or chevron (`accordion-trigger`), text `brand-darker`.
- **Tables:** thin `slate-200` borders, header `brand-50`/`brand-dark`, hover row `brand-50/50`, no shadow.
  Prayer-time tables are raw HTML, don't break them. Self-contained posters scoped to their own wrapper
  (e.g. `.ppme-wrap` in `ietiekaaf-voor-broeders`) bring their own palette; leave them alone.
- New markup in components (not Markdown) should use `.btn .btn-primary`, `.callout`, etc., never these shims.
- Article wrapper: `prose prose-brand page-article`. Link colour `brand`, hover `brand-dark`.

## Animation

Light and purposeful; CSS only, no animation library. Content must be visible by default (progressive enhancement).

- Durations: 150–200ms hover/color (`transition-all duration-200`, as the app's buttons), 250ms menus, 500–600ms entrance.
  Ease `cubic-bezier(0.22, 1, 0.36, 1)`. Animate only `opacity`, `transform`, `background-color`, `border-color`, `box-shadow`.
- Entrance + stagger:
  ```css
  @keyframes fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @layer utilities { .animate-fade-up { animation: fade-up .55s cubic-bezier(.22,1,.36,1) both; } }
  ```
  Stagger with `style="animation-delay: calc(var(--i) * 60ms)"`.
- Scroll reveal: `animation-timeline: view()` inside `@supports`, else a tiny `IntersectionObserver`.
- Hover: tile border to `brand/40`, image `scale-[1.03]` over 500ms inside `overflow-hidden`, link underline offset. No big lifts.
- Spinners/loading states reuse the app's SVG ring (`animate-spin`) for the contact-form submit.
- Mobile menu: HeadlessUI `Transition` (already a dependency).
- **Always** honor reduced motion:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important;
      transition-duration: .01ms !important; scroll-behavior: auto !important; }
  }
  ```
- No parallax, autoplay carousels or looping decoration. Don't add Astro view transitions unless asked.

## Page recipes

- **Hero:** `app-backdrop` + `app-grid`, eyebrow, `text-gradient-brand` h1, one `btn-primary` + one `btn-secondary`, `animate-fade-up`.
  The homepage is a stub (CLAUDE.md); style real `homepage.yml` sections when ported, don't invent content.
- **Event/blog list:** bordered tiles or a divided list; date as eyebrow; title `font-semibold text-slate-900 group-hover:text-brand`.
- **Navbar:** sticky glass bar, `border-b border-slate-200/60`, active link `text-brand` with 2px `brand` underline.
- **Footer:** `bg-brand-darker`, text `text-brand-100`, links `text-brand-200 hover:text-white`.
- **Forms** (contact + Listbox): `rounded-lg border-slate-300 focus:border-brand focus:ring-brand`; explicit error text in red;
  Headless UI controls, no native `select`; no `alert()`.

## Don'ts

- No indigo, no Lucide, no UI kits (daisyUI, Bootstrap), no `tailwind.config.js` (Tailwind v4 CSS-first).
- No hard-coded colors outside `@theme`; no `!important` outside the existing shims and reduced-motion block.
- Don't restyle by editing Markdown content; fix in CSS/components.
- Don't call it done without `npm run build` and a check of all three locales.

## Done checklist

- [ ] Tokens match the registration app (`brand`, `brand-dark`, `brand-50/100/200`); `ppme-blue-*` aliased
- [ ] Inter self-hosted; backdrop, eyebrow, gradient title in place
- [ ] No `shadow-lg/xl`, `rounded-2xl/3xl`, `indigo-*`, raw `gray-*`, or emoji left
- [ ] `.btn*` and callout classes used instead of long repeated class strings
- [ ] Focus-visible rings and reduced-motion handled; phone width has no horizontal scroll
- [ ] Contrast script passes; `npm run build` passes; `/`, `/id/`, `/en/` checked
