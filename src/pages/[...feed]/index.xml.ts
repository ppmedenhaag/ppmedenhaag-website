// RSS feeds mirroring the Hugo site: /index.xml, /<section>/index.xml and the same under /id/ and /en/
// (root, event, blog, dakwah, ibadah, about). Plan: docs/seo/SEO-PLAN.md Phase 6.
import rss from "@astrojs/rss";
import type { APIRoute, GetStaticPaths } from "astro";
import { defaultLocale, locales, type LangOptions } from "../../data/i18n";
import { SITE_NAME } from "../../data/seo";
import { getSeoRegistry } from "../../utils/seo-registry";

const SECTIONS = ["", "event", "blog", "dakwah", "ibadah", "about"] as const;
const FEED_KINDS = new Set(["event", "blog", "ibadah", "about", "dakwah"]);
const TITLES: Record<string, Record<LangOptions, string>> = {
  "": { nl: SITE_NAME, id: SITE_NAME, en: SITE_NAME },
  event: { nl: "Evenementen", id: "Event & Kegiatan", en: "Events" },
  blog: { nl: "Nieuws", id: "Berita", en: "News" },
  dakwah: { nl: "Dakwah", id: "Dakwah", en: "Dakwah" },
  ibadah: { nl: "Ibadah", id: "Ibadah", en: "Ibadah" },
  about: { nl: "Over ons", id: "Tentang kita", en: "About us" },
};

export const getStaticPaths = (() => {
  const paths: { params: { feed: string | undefined }; props: { locale: LangOptions; section: string } }[] = [];
  for (const locale of Object.keys(locales) as LangOptions[]) {
    for (const section of SECTIONS) {
      const feed = [locale === defaultLocale ? "" : locale, section].filter(Boolean).join("/");
      paths.push({ params: { feed: feed || undefined }, props: { locale, section } });
    }
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props, site }) => {
  const { locale, section } = props as { locale: LangOptions; section: string };
  const { pages } = await getSeoRegistry();
  const items = pages
    .filter((p) => p.locale === locale && FEED_KINDS.has(p.kind) && (!section || p.section === section) && p.date)
    .sort((a, b) => b.date!.valueOf() - a.date!.valueOf())
    .map((p) => ({
      title: p.title,
      link: new URL(p.path, site).href,
      pubDate: p.date!,
      description: p.description,
    }));
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const selfHref = new URL(`${prefix}${section ? `/${section}` : ""}/index.xml`, site).href;
  const title = section ? `${TITLES[section][locale]} | ${SITE_NAME}` : SITE_NAME;
  return rss({
    title,
    description: `${TITLES[section][locale]} – ${SITE_NAME}`,
    site: site!,
    items,
    trailingSlash: true,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: `<language>${locale}</language><atom:link href="${selfHref}" rel="self" type="application/rss+xml"/>`,
  });
};
