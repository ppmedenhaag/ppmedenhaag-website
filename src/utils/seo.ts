// Pure SEO helpers (no `astro:*` imports): small formatters for titles, dates and URLs. Plan: docs/seo/SEO-PLAN.md.
import type { LangOptions } from "../data/i18n";

// Descriptions are hand-written in front matter for every content page (required by content.config.ts); the old
// body-derived fallback (greeting skipping, paragraph joining, truncation) was removed on 2026-11-27.

/** Page <title>: "{title} | PPME Den Haag", brand dropped when the result would be too long. */
export function fullTitle(title: string, siteName: string): string {
  if (title.includes(siteName)) return title;
  const withBrand = `${title} | ${siteName}`;
  return withBrand.length <= 64 ? withBrand : title;
}

/** Wall-clock ISO string with the real Europe/Amsterdam offset for that instant, e.g. 2026-11-21T20:00:00+01:00. */
export function isoInTimeZone(d: Date, timeZone = "Europe/Amsterdam"): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const local = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
  const asUtc = Date.parse(`${local}Z`);
  const offsetMin = Math.round((asUtc - Math.floor(d.getTime() / 1000) * 1000) / 60000);
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${local}${sign}${hh}:${mm}`;
}

/** "2 jam", "~5h", "5 uur", "2 hours" → hours; free-text durations that don't parse return undefined. */
export function parseDurationHours(duration?: string): number | undefined {
  if (!duration) return undefined;
  const m = duration.match(/(\d+(?:[.,]\d+)?)\s*(h\b|hr|hrs|hour|hours|uur|jam)/i);
  if (!m) return undefined;
  const n = parseFloat(m[1].replace(",", "."));
  return n > 0 && n <= 24 ? n : undefined;
}

export const isOnlineLocation = (loc?: string) => !!loc && /zoom|teams|online|youtube|webinar/i.test(loc);

/** `images/x.webp` / `/images/x.webp` → `images/x.webp` (public-relative). */
export const publicPath = (p: string) => p.replace(/^\/+/, "");

export function routeKeyOf(pathname: string, locale: LangOptions, defaultLocale: LangOptions): string {
  const segs = pathname.split("/").filter(Boolean);
  if (locale !== defaultLocale && segs[0] === locale) segs.shift();
  return segs.join("/");
}
