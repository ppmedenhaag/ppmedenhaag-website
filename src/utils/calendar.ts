// "Add to calendar" for events: .ics files (src/pages/ics/[...path].ics.ts) and Google Calendar links.
import type { CollectionEntry } from "astro:content";
import { VENUES } from "../data/seo";
import { plainInline } from "./event";

const DEFAULT_MINUTES = 120;

/**
 * Event end from the free-text `duration` front matter ("~5h", "4h 30m", "2 jam", "5 uur", "7+ uren", "30 min.", "4 hours").
 * Anything unparseable ("...", "4 weken, elke zaterdag") or longer than a day falls back to 2 hours.
 */
export function eventWindow(start: Date, duration?: string) {
  let minutes = 0;
  if (duration) {
    const d = duration.toLowerCase().replace(",", ".");
    const h = d.match(/(\d+(?:\.\d+)?)\+?\s*(?:uur|uren|jam|hours?|hrs?|h|u\b)/);
    const m = d.match(/(\d+)\s*(?:min|m\b)/);
    if (h) minutes += parseFloat(h[1]) * 60;
    if (m) minutes += parseInt(m[1], 10);
  }
  if (!minutes || minutes > 24 * 60) minutes = DEFAULT_MINUTES;
  return { start, end: new Date(start.getTime() + Math.round(minutes) * 60_000) };
}

/** Location text with the venue's street address added when the text names a known venue but no address. */
export function fullLocation(location?: string) {
  if (!location) return "";
  const text = plainInline(location);
  const venue = VENUES.find((v) => v.match.test(text));
  if (!venue?.address || /\b\d{4}\s?[A-Z]{2}\b/.test(text)) return text;
  const a = venue.address;
  return `${text}, ${[a.street, [a.postalCode, a.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}`;
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545 line folding at 75 octets (UTF-8 aware). */
function fold(line: string) {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export interface CalendarEvent {
  uid: string;
  title: string;
  description: string;
  location: string;
  url: string;
  start: Date;
  end: Date;
}

export function toIcs(e: CalendarEvent) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PPME Den Haag//ppmedenhaag.nl//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(e.end)}`,
    `SUMMARY:${esc(e.title)}`,
    e.location && `LOCATION:${esc(e.location)}`,
    `DESCRIPTION:${esc([e.description, e.url].filter(Boolean).join("\n\n"))}`,
    `URL:${e.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function googleCalendarUrl(e: CalendarEvent) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${stamp(e.start)}/${stamp(e.end)}`,
    details: [e.description, e.url].filter(Boolean).join("\n\n"),
    location: e.location,
    ctz: "Europe/Amsterdam",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Calendar data for an event entry; `url` must be the absolute page URL. */
export function calendarEvent(entry: CollectionEntry<"event">, url: string, description = ""): CalendarEvent {
  const { start, end } = eventWindow(entry.data.date, entry.data.duration);
  return {
    uid: `${entry.id.replace(/\//g, "-")}@ppmedenhaag.nl`,
    title: entry.data.title,
    description,
    location: fullLocation(entry.data.location),
    url,
    start,
    end,
  };
}

/** Route param of the .ics file for an event entry: <locale>/<slug> -> /ics/<locale>/<slug>.ics */
export const icsPath = (entry: CollectionEntry<"event">) => `/ics/${entry.id}.ics`;
