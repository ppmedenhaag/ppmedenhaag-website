import { getCollection, type CollectionEntry } from "astro:content";
import { locales, type LangOptions } from "../data/i18n";

export const EVENT_TZ = "Europe/Amsterdam";

/** Published = not draft and publishDate (if any) has passed — mirrors Hugo's default (buildFuture=false). */
export async function getLocaleEvents(locale: LangOptions) {
  const now = Date.now();
  const events = await getCollection(
    "event",
    ({ id, data }) =>
      id.startsWith(`${locale}/`) &&
      !data.draft &&
      (!data.publishDate || data.publishDate.valueOf() <= now),
  );
  return events.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const eventSlug = (entry: CollectionEntry<"event">) =>
  entry.id.split("/").slice(1).join("/");

export function formatDate(d: Date, locale: LangOptions) {
  return d.toLocaleDateString(locales[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: EVENT_TZ,
  });
}

export function dateBadge(d: Date, locale: LangOptions) {
  return {
    day: d.toLocaleDateString(locales[locale], { day: "2-digit", timeZone: EVENT_TZ }),
    month: d
      .toLocaleDateString(locales[locale], { month: "short", timeZone: EVENT_TZ })
      .replace(".", ""),
  };
}

export function formatTime(d: Date, locale: LangOptions) {
  return d.toLocaleTimeString(locales[locale], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: EVENT_TZ,
  });
}

/** Hugo rendered `location` via `markdownify`; front matter contains inline `<br/>` — flatten for plain-text display. */
export const plainInline = (s: string) => s.replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim();
