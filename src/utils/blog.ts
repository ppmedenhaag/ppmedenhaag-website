import { getCollection, type CollectionEntry } from "astro:content";
import { locales, type LangOptions } from "../data/i18n";
import { EVENT_TZ } from "./event";

/** Published posts for a locale, newest first. Future-dated posts are hidden, as Hugo does by default. */
export async function getLocalePosts(locale: LangOptions) {
  const now = Date.now();
  const posts = await getCollection(
    "blog",
    ({ id, data }) =>
      id.startsWith(`${locale}/`) && !data.draft && data.date.valueOf() <= now,
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const postSlug = (entry: CollectionEntry<"blog">) =>
  entry.id.split("/").slice(1).join("/");

export function formatPostDate(d: Date, locale: LangOptions) {
  return d.toLocaleDateString(locales[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: EVENT_TZ,
  });
}
