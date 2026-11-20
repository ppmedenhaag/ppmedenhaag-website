// schema.org JSON-LD graph builder (pure). Templates/rules: .claude/skills/ppme-seo/reference/schema-templates.md
import type { LangOptions } from "../data/i18n";
import { EYEBROW, SITE_NAME, SOCIAL_LINKS, STATIC_COPY, VENUES } from "../data/seo";
import { isOnlineLocation, isoInTimeZone, parseDurationHours } from "./seo";
import { plainInline } from "./event";
import type { SeoPage } from "./seo-registry";

type Json = Record<string, unknown>;

const HOME_LABEL: Record<LangOptions, string> = { nl: "Home", id: "Beranda", en: "Home" };
const SECTION_LABEL: Record<string, (l: LangOptions) => string> = {
  event: (l) => STATIC_COPY.events[l].title,
  blog: (l) => STATIC_COPY.blog[l].title,
  ibadah: (l) => STATIC_COPY.ibadah[l].title,
  about: (l) => EYEBROW.about[l],
  dakwah: (l) => EYEBROW.dakwah[l],
};

interface Ctx {
  origin: string;
  url: string;
  page?: SeoPage;
  locale: LangOptions;
  title: string;
  description: string;
  image: { url: string; width: number; height: number };
}

const abs = (origin: string, p: string) => (/^https?:\/\//i.test(p) ? p : new URL(`/${p.replace(/^\/+/, "")}`, origin).href);

function venueOf(location: string) {
  const text = plainInline(location);
  const parts = text.split(",").map((s) => s.trim());
  const venue = VENUES.find((v) => v.match.test(text));
  const postal = text.match(/\b(\d{4}\s?[A-Z]{2})\b/)?.[1];
  const street = parts.slice(1).find((p) => /\d/.test(p) && !/^\d{4}\s?[A-Z]{2}/.test(p));
  const city = text.match(/\b(Den Haag|Rotterdam|Utrecht|Amsterdam|Enschede|Leiden|Delft)\b/)?.[1] ?? venue?.address?.city;
  const address: Json = { "@type": "PostalAddress", addressCountry: "NL" };
  if (city) address.addressLocality = city;
  // An address spelled out in the event text wins; otherwise fall back to the venue's known address.
  const useVenueAddress = venue?.address && !street;
  const finalPostal = postal ?? (useVenueAddress ? venue!.address!.postalCode : undefined);
  const finalStreet = street ?? (useVenueAddress ? venue!.address!.street : undefined);
  if (finalPostal) address.postalCode = finalPostal;
  if (finalStreet) address.streetAddress = finalStreet;
  return { "@type": "Place", name: venue?.name ?? parts[0], address } as Json;
}

function eventNode(ctx: Ctx, page: SeoPage): Json {
  const d = page.data ?? {};
  const start: Date = d.date;
  const online = isOnlineLocation(d.location);
  const node: Json = {
    "@type": "Event",
    "@id": `${ctx.url}#event`,
    name: page.title,
    description: page.description,
    startDate: isoInTimeZone(start),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: online ? { "@type": "VirtualLocation", url: ctx.url } : d.location ? venueOf(d.location) : undefined,
    image: [ctx.image.url, d.image ? abs(ctx.origin, d.image) : undefined].filter(Boolean),
    organizer: { "@id": `${ctx.origin}/#organization` },
    inLanguage: page.contentLang ?? ctx.locale,
    url: ctx.url,
  };
  const hours = parseDurationHours(d.duration);
  if (hours) node.endDate = isoInTimeZone(new Date(start.getTime() + hours * 3600_000));
  const speakers = (d.speaker ?? []) as { name: string; image?: string; designation?: string }[];
  if (speakers.length)
    node.performer = speakers.map((s) => ({
      "@type": "Person",
      name: s.name,
      jobTitle: s.designation,
      image: s.image && !/\.svg$/i.test(s.image) ? abs(ctx.origin, s.image) : undefined,
    }));
  return node;
}

function articleNode(ctx: Ctx, page: SeoPage): Json {
  const author = page.author && page.author !== SITE_NAME ? { "@type": "Person", name: page.author } : { "@id": `${ctx.origin}/#organization` };
  return {
    "@type": page.kind === "blog" ? "BlogPosting" : "Article",
    "@id": `${ctx.url}#article`,
    headline: page.title.slice(0, 110),
    description: page.description,
    datePublished: page.date ? isoInTimeZone(page.date) : undefined,
    dateModified: page.date ? isoInTimeZone(page.date) : undefined,
    author,
    publisher: { "@id": `${ctx.origin}/#organization` },
    mainEntityOfPage: { "@id": `${ctx.url}#webpage` },
    image: [ctx.image.url],
    keywords: page.tags?.length ? page.tags.join(", ") : undefined,
    articleSection: page.categories?.[0],
    inLanguage: page.contentLang ?? ctx.locale,
  };
}

function breadcrumbs(ctx: Ctx): Json | undefined {
  const page = ctx.page;
  if (!page || page.routeKey === "") return undefined;
  const segs = page.routeKey.split("/");
  const prefix = ctx.locale === "nl" ? "" : `/${ctx.locale}`;
  const items: Json[] = [{ "@type": "ListItem", position: 1, name: HOME_LABEL[ctx.locale], item: new URL(`${prefix}/`, ctx.origin).href }];
  const label = SECTION_LABEL[segs[0]];
  if (label && segs.length > 1) {
    items.push({ "@type": "ListItem", position: 2, name: label(ctx.locale), item: new URL(`${prefix}/${segs[0]}/`, ctx.origin).href });
  }
  items.push({ "@type": "ListItem", position: items.length + 1, name: page.title });
  return { "@type": "BreadcrumbList", "@id": `${ctx.url}#breadcrumb`, itemListElement: items };
}

const clean = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(clean).filter((x) => x !== undefined)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.entries(v as Json).filter(([, x]) => x !== undefined).map(([k, x]) => [k, clean(x)]))
      : v;

export function buildJsonLd(ctx: Ctx): string {
  const { origin, url, page, locale } = ctx;
  const pageType =
    page?.routeKey === "contact" ? "ContactPage" : page?.kind === "listing" || page?.kind === "overview" ? "CollectionPage" : "WebPage";
  const graph: Json[] = [
    {
      "@type": "Organization",
      "@id": `${origin}/#organization`,
      name: SITE_NAME,
      url: `${origin}/`,
      logo: { "@type": "ImageObject", url: `${origin}/icon-512.png`, width: 512, height: 512 },
      sameAs: SOCIAL_LINKS,
      address: VENUES[0].address && {
        "@type": "PostalAddress",
        streetAddress: VENUES[0].address.street,
        postalCode: VENUES[0].address.postalCode,
        addressLocality: VENUES[0].address.city,
        addressCountry: "NL",
      },
      areaServed: "Den Haag, Nederland",
      knowsLanguage: ["nl", "id", "en"],
    },
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: `${origin}/`,
      name: SITE_NAME,
      inLanguage: locale,
      publisher: { "@id": `${origin}/#organization` },
    },
    {
      "@type": pageType,
      "@id": `${url}#webpage`,
      url,
      name: ctx.title,
      description: ctx.description,
      inLanguage: locale,
      isPartOf: { "@id": `${origin}/#website` },
      primaryImageOfPage: { "@type": "ImageObject", url: ctx.image.url, width: ctx.image.width, height: ctx.image.height },
    },
  ];
  const crumbs = breadcrumbs(ctx);
  if (crumbs) graph.push(crumbs);
  if (page?.kind === "event") graph.push(eventNode(ctx, page));
  else if (page && ["blog", "ibadah", "about", "dakwah"].includes(page.kind)) graph.push(articleNode(ctx, page));
  // Escape "<" so a title can never close the script element.
  return JSON.stringify(clean({ "@context": "https://schema.org", "@graph": graph })).replace(/</g, "\\u003c");
}
