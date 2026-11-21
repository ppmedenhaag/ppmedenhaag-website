// "Add to calendar" file per event: /ics/<locale>/<slug>.ics (text/calendar). See src/utils/calendar.ts.
import type { APIRoute, GetStaticPaths } from "astro";
import type { CollectionEntry } from "astro:content";
import { defaultLocale, locales, type LangOptions } from "../../data/i18n";
import { DEFAULT_SITE_URL } from "../../data/seo";
import { calendarEvent, toIcs } from "../../utils/calendar";
import { eventSlug, getLocaleEvents } from "../../utils/event";
import { getSeoRegistry } from "../../utils/seo-registry";

export const getStaticPaths = (async () => {
  const paths = [];
  for (const locale of Object.keys(locales) as LangOptions[]) {
    for (const entry of await getLocaleEvents(locale)) {
      paths.push({ params: { path: entry.id }, props: { entry, locale } });
    }
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props, site }) => {
  const entry = props.entry as CollectionEntry<"event">;
  const locale = props.locale as LangOptions;
  const pagePath = `${locale === defaultLocale ? "" : `/${locale}`}/event/${eventSlug(entry)}/`;
  const url = new URL(pagePath, site ?? DEFAULT_SITE_URL).href;
  const description = (await getSeoRegistry()).byPath.get(pagePath)?.description ?? "";
  const body = toIcs(calendarEvent(entry, url, description));
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${eventSlug(entry).replace(/[^\w-]+/g, "-")}.ics"`,
    },
  });
};
