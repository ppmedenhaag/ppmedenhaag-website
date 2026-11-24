// Page registry: every indexable page the site emits, with its SEO title/description/card.
// One source of truth shared by Layout (head tags), the /og/ card endpoint, RSS and JSON-LD.
// Plan: docs/seo/SEO-PLAN.md. Keep route filters in sync with the page files (draft / publishDate / locale prefix).
import { getCollection, getEntry } from "astro:content";
import { defaultLocale, locales, type LangOptions } from "../data/i18n";
import {
  BESTUUR_SHARE_IMAGE,
  EYEBROW,
  PRAYER_COPY,
  STATIC_COPY,
  STATIC_ROUTES,
  type StaticKey,
} from "../data/seo";
import { LATEST_YEAR, fill, prayerStrings } from "../data/prayer";
import { formatDate, formatTime, plainInline } from "./event";
import {
  firstBodyImage,
  inspectImage,
  makeSpec,
  type CardSpec,
  type ImageInfo,
} from "./og";
import { deriveFromBody, truncateDescription } from "./seo";

export type PageKind = "home" | "listing" | "static" | "overview" | "event" | "blog" | "ibadah" | "about" | "dakwah";

export interface SeoPage {
  locale: LangOptions;
  /** Route without locale prefix and without slashes ("" = homepage). */
  routeKey: string;
  /** Site-relative URL path, e.g. /id/event/foo/ */
  path: string;
  kind: PageKind;
  section: string;
  title: string;
  /** <title> text when it differs from `title`: entries whose title repeats in the same language get their date added. */
  docTitle?: string;
  description: string;
  subtitle: string;
  eyebrow: string;
  date?: Date;
  tags?: string[];
  categories?: string[];
  author?: string;
  /** Language of the text when it differs from the URL locale (front matter `contentLang`). */
  contentLang?: LangOptions;
  /** Raw front matter (event/blog/...), for structured data. */
  data?: Record<string, any>;
  card: CardSpec;
  /** `/og/<locale>/<route>.<hash>.jpg` */
  cardPath: string;
  /** Param for src/pages/og/[...path].jpg.ts */
  cardParam: string;
  /** Where the card came from: for the build report. */
  cardSource: "social_image" | "image" | "body-image" | "generated";
}

export interface SeoRegistry {
  pages: SeoPage[];
  byPath: Map<string, SeoPage>;
  byRoute: Map<string, SeoPage>;
}

const allLocales = Object.keys(locales) as LangOptions[];
const pathFor = (locale: LangOptions, routeKey: string) => {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return routeKey ? `${prefix}/${routeKey}/` : `${prefix}/`;
};

async function pickImage(data: { social_image?: string; image?: string }, body?: string) {
  const social = await inspectImage(data.social_image);
  if (social) return { info: social, source: "social_image" as const };
  const hero = await inspectImage(data.image);
  if (hero) return { info: hero, source: "image" as const };
  const inBody = await firstBodyImage(body);
  if (inBody) return { info: inBody, source: "body-image" as const };
  return { info: null as ImageInfo | null, source: "generated" as const };
}

function eventDescription(d: Record<string, any>, body: string | undefined, locale: LangOptions, title: string) {
  if (d.description) return String(d.description).trim();
  const when = `${formatDate(d.date, locale)}, ${formatTime(d.date, locale)}`;
  const where = d.location ? plainInline(d.location) : "";
  const prefix = [when, where].filter(Boolean).join(" · ");
  const rest = deriveFromBody(body, Math.max(60, 158 - prefix.length - 2));
  return truncateDescription(rest ? `${prefix}. ${rest}` : `${title}. ${prefix}`, 160);
}

function plainDescription(d: Record<string, any>, body: string | undefined, locale: LangOptions, title: string) {
  if (d.description) return String(d.description).trim();
  const derived = deriveFromBody(body, 155);
  return derived || truncateDescription(`${title} | ${STATIC_COPY.home[locale].subtitle}`, 155);
}

let cached: Promise<SeoRegistry> | undefined;
let reported = false;

export function getSeoRegistry(): Promise<SeoRegistry> {
  if (import.meta.env.DEV) return build();
  return (cached ??= build());
}

async function build(): Promise<SeoRegistry> {
  const pages: SeoPage[] = [];
  const now = Date.now();

  const add = async (p: {
    locale: LangOptions;
    routeKey: string;
    kind: PageKind;
    title: string;
    description: string;
    subtitle: string;
    eyebrow: string;
    date?: Date;
    tags?: string[];
    categories?: string[];
    author?: string;
    data?: Record<string, any>;
    image?: { social_image?: string; image?: string };
    body?: string;
  }) => {
    const picked = p.image ? await pickImage(p.image, p.body) : { info: null, source: "generated" as const };
    const card = makeSpec({ image: picked.info, title: p.title, subtitle: p.subtitle, eyebrow: p.eyebrow });
    const cardParam = `${p.locale}/${p.routeKey || "home"}.${card.hash}`;
    const segs = p.routeKey.split("/");
    pages.push({
      locale: p.locale,
      routeKey: p.routeKey,
      path: pathFor(p.locale, p.routeKey),
      kind: p.kind,
      section: segs[0] || "home",
      title: p.title,
      description: p.description,
      subtitle: p.subtitle,
      eyebrow: p.eyebrow,
      date: p.date,
      tags: p.tags,
      categories: p.categories,
      author: p.author,
      contentLang: p.data?.contentLang,
      data: p.data,
      card,
      cardPath: `/og/${cardParam}.jpg`,
      cardParam,
      cardSource: picked.source,
    });
  };

  // --- code-driven pages (every locale) -----------------------------------------------------------
  for (const locale of allLocales) {
    for (const key of Object.keys(STATIC_COPY) as Exclude<StaticKey, "prayer">[]) {
      const c = STATIC_COPY[key][locale];
      await add({
        locale,
        routeKey: STATIC_ROUTES[key],
        kind: key === "home" ? "home" : key === "contact" || key === "bestuur" ? "static" : "listing",
        title: c.title,
        description: c.description,
        subtitle: c.subtitle,
        eyebrow: key === "bestuur" ? EYEBROW.about[locale] : EYEBROW.site[locale],
        image: key === "bestuur" ? { image: BESTUUR_SHARE_IMAGE } : undefined,
      });
    }
    await add({
      locale,
      routeKey: STATIC_ROUTES.prayer,
      kind: "static",
      title: fill(prayerStrings[locale].pageTitle, { year: LATEST_YEAR }),
      description: PRAYER_COPY[locale].description,
      subtitle: PRAYER_COPY[locale].subtitle,
      eyebrow: EYEBROW.ibadah[locale],
    });
  }

  // --- section overviews (about, dakwah): content entries, one per locale -------------------------
  for (const section of ["about", "dakwah"] as const) {
    for (const locale of allLocales) {
      const entry = await getEntry(`${section}-overview` as "about-overview" | "dakwah-overview", locale);
      if (!entry || entry.data.draft) continue;
      await add({
        locale,
        routeKey: section,
        kind: "overview",
        title: entry.data.title,
        description: plainDescription(entry.data, entry.body, locale, entry.data.title),
        subtitle: EYEBROW[section][locale],
        eyebrow: EYEBROW[section][locale],
        data: entry.data,
        image: entry.data,
        body: entry.body,
      });
    }
  }

  // --- entries -----------------------------------------------------------------------------------
  const events = await getCollection(
    "event",
    ({ data }) => !data.draft && (!data.publishDate || data.publishDate.valueOf() <= now),
  );
  const blog = await getCollection("blog", ({ data }) => !data.draft && data.date.valueOf() <= now);
  const ibadah = await getCollection("ibadah", ({ data }) => !data.draft);
  const about = await getCollection("about", ({ data }) => !data.draft);
  const dakwah = await getCollection("dakwah", ({ data }) => !data.draft);

  const entryPages: [PageKind, string, any[]][] = [
    ["event", "event", events],
    ["blog", "blog", blog],
    ["ibadah", "ibadah", ibadah],
    ["about", "about", about],
    ["dakwah", "dakwah", dakwah],
  ];
  for (const [kind, section, entries] of entryPages) {
    for (const entry of entries) {
      const [locale, ...rest] = entry.id.split("/") as [LangOptions, ...string[]];
      if (!allLocales.includes(locale)) continue;
      const slug = rest.join("/");
      const d = entry.data as Record<string, any>;
      const eyebrow = EYEBROW[section][locale];
      await add({
        locale,
        routeKey: `${section}/${slug}`,
        kind,
        title: d.title,
        description:
          kind === "event" ? eventDescription(d, entry.body, locale, d.title) : plainDescription(d, entry.body, locale, d.title),
        subtitle:
          kind === "event"
            ? `${formatDate(d.date, locale)} · ${d.location ? plainInline(d.location) : "PPME Den Haag"}`
            : STATIC_COPY.home[locale].subtitle,
        eyebrow,
        date: d.date,
        tags: d.tags,
        categories: d.categories,
        author: d.author,
        data: d,
        image: d,
        body: entry.body,
      });
    }
  }

  // Same title twice in one language (legacy "Jongeren Programma", "Ramadan Programma" ...): add the date so every
  // page has a unique <title>. The visible heading and share card keep the plain title.
  const titleGroups = new Map<string, SeoPage[]>();
  for (const p of pages) {
    if (!p.date || !["event", "blog", "ibadah", "about", "dakwah"].includes(p.kind)) continue;
    const key = `${p.locale}|${p.title.trim().toLowerCase()}`;
    titleGroups.set(key, [...(titleGroups.get(key) ?? []), p]);
  }
  for (const group of titleGroups.values()) {
    if (group.length < 2) continue;
    for (const p of group) {
      const when = p.date!.toLocaleDateString(locales[p.locale], { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" });
      p.docTitle = `${p.title} (${when.replace(".", "")})`;
    }
  }

  const byPath = new Map(pages.map((p) => [p.path, p]));
  const byRoute = new Map(pages.map((p) => [`${p.locale}|${p.routeKey}`, p]));

  if (!reported && !import.meta.env.DEV) {
    reported = true;
    report(pages);
  }
  return { pages, byPath, byRoute };
}

function report(pages: SeoPage[]) {
  const by = (s: SeoPage["cardSource"]) => pages.filter((p) => p.cardSource === s).length;
  const low = pages.filter((p) => p.card.image?.quality === "low");
  const generatedEntries = pages.filter(
    (p) => p.cardSource === "generated" && ["event", "blog", "ibadah", "about", "dakwah", "overview"].includes(p.kind),
  );
  console.info(
    `[seo] ${pages.length} pages · cards: ${by("social_image")} social_image, ${by("image")} hero image, ${by("body-image")} body image, ${by("generated")} generated title card`,
  );
  if (low.length) console.info(`[seo] low-resolution source images (400–599 px, used at natural size): ${low.map((p) => p.card.image!.rel).join(", ")}`);
  if (generatedEntries.length)
    console.info(`[seo] entries without a usable image (title card used): ${generatedEntries.map((p) => p.path).join(", ")}`);
  const empty = pages.filter((p) => !p.description);
  if (empty.length) console.warn(`[seo] pages with empty description: ${empty.map((p) => p.path).join(", ")}`);
}

/** hreflang alternates: only locales where the same route exists (translation is partial by design). */
export function alternatesFor(reg: SeoRegistry, page: SeoPage): { locale: LangOptions; path: string }[] {
  return allLocales
    .map((locale) => reg.byRoute.get(`${locale}|${page.routeKey}`))
    .filter((p): p is SeoPage => !!p)
    .map((p) => ({ locale: p.locale, path: p.path }));
}
