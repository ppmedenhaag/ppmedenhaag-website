// Pure SEO helpers (no `astro:*` imports): text derivation + small formatters. Plan: docs/seo/SEO-PLAN.md.
import type { LangOptions } from "../data/i18n";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  euml: "ë",
  eacute: "é",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED_ENTITIES[n.toLowerCase()] ?? m);
}

/** Greetings / boilerplate openers that make poor descriptions (nl / id / en / ar transliterations). */
const SALUTATION =
  /^(assalam|assalaam|as-salam|bismillah|bismilah|beste\b|geachte\b|dear\b|yth\b|kepada\b|salaam|hallo\b|hi\b|lieve\b|saudara|ikhwan|akhi|bapak\b|ibu\b|jama[’']?ah|alhamdulillah|segala puji|puji syukur|in de naam van|in the name of)/i;

/** Plain text of a Markdown/MDX/HTML body, one paragraph per array item. */
export function bodyParagraphs(body: string): string[] {
  let text = body.replace(/\r\n?/g, "\n");
  text = text.replace(/<(script|style|iframe|svg|table)[\s\S]*?<\/\1>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h[1-6]|tr|blockquote)>/gi, "\n\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/```[\s\S]*?```/g, "\n");
  text = text.replace(/\{\{[<%][\s\S]*?[>%]\}\}/g, " "); // Hugo shortcode residue
  text = text.replace(/^(import|export)\s.+$/gm, "");
  text = decodeEntities(text);
  const lines = text.split("\n").map((l) => l.trim());
  const paragraphs: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) paragraphs.push(current.join(" ").replace(/\s+/g, " ").trim());
    current = [];
  };
  for (let line of lines) {
    if (!line) {
      flush();
      continue;
    }
    if (/^(#{1,6}\s|\||[-*_]{3,}$|>\s*$)/.test(line)) {
      flush(); // headings, tables, rules: not description material
      continue;
    }
    line = line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/^>\s*/, "")
      .replace(/^([-+*]|\d+[.)])\s+/, "")
      .replace(/(\*\*|__|\*|_|`)/g, "")
      .trim();
    if (!line) continue;
    if (line.length < 90 && SALUTATION.test(line)) continue; // greeting line
    if (!/[\p{L}]{3}/u.test(line)) continue;
    current.push(line);
  }
  flush();
  return paragraphs.filter(Boolean);
}

/** Cut at a sentence end (preferred) or word boundary, max `max` chars. */
export function truncateDescription(text: string, max = 155): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const slice = t.slice(0, max);
  const sentenceEnd = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  if (sentenceEnd >= 80) return slice.slice(0, sentenceEnd + 1);
  const space = slice.lastIndexOf(" ");
  return `${slice.slice(0, space > 60 ? space : max).replace(/[\s,;:–—-]+$/, "")}…`;
}

/** First meaningful paragraph of a body, or "" when there is none. */
export function deriveFromBody(body: string | undefined, max = 155): string {
  if (!body) return "";
  // Join paragraphs until there is enough text: skips one-line intros ("Programma:") and "…wensen wij u:" lead-ins.
  let acc = "";
  for (const p of bodyParagraphs(body)) {
    acc = acc ? `${acc} ${p}` : p;
    if (acc.length >= 90 && !acc.endsWith(":")) break;
  }
  return acc ? truncateDescription(acc.replace(/[:;,]\s*$/, ""), max) : "";
}

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
