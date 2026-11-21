/**
 * Prayer-time schedule for Den Haag: data access, Amsterdam-time helpers and
 * the nl/id/en strings shared by the homepage island and the yearly page.
 *
 * Replaces the stand-alone Remix app that used to be embedded as an iframe
 * (sholat.ppmedenhaag.nl). Pure TS, no Node/DOM-only APIs, so it is safe to
 * import from both `.astro` files and React islands.
 *
 * Source of the times is switchable, see `prayer/config.ts`:
 *  - "generated" (default): winter-time base table + DST rule (`prayer/generate.ts`), every year from 2025.
 *  - "manual": hand-maintained `prayer/gebedstijden-<year>.json`, registered in MANUAL_SCHEDULES below
 *    (shape: `{ year, months: [ [ [fadjr, shoroeq, dhohr, asr, maghrib, isha] × days ] × 12 ] }`, zero-padded "HH:MM").
 */
import schedule2026 from "./prayer/gebedstijden-2026.json";
import { PRAYER_SOURCE, MIN_GENERATED_YEAR } from "./prayer/config";
import { generateYear, lastSunday, type Times } from "./prayer/generate";
import type { LangOptions } from "./i18n";

export { lastSunday, type Times };
export { PRAYER_SOURCE };

export const TIME_ZONE = "Europe/Amsterdam";

/** Column order of every day row in the JSON files. */
export const PRAYER_NAMES = ["Fadjr", "Shoroeq", "Dhohr", "Asr", "Maghrib", "Isha"] as const;

export interface YearSchedule {
  year: number;
  /** months[0..11][day - 1] */
  months: Times[][];
}

/** BCP-47 tags for Intl. (`locales` in i18n.ts has the non-existent "en-UK".) */
export const INTL_TAG: Record<LangOptions, string> = {
  nl: "nl-NL",
  id: "id-ID",
  en: "en-GB",
};

/** Slug is Dutch in every locale, like the other /ibadah/ pages. */
export const PRAYER_PAGE_SLUG = "ibadah/gebedstijden/";

// ---------------------------------------------------------------------------
// Time helpers — everything is evaluated in Europe/Amsterdam, never in the
// visitor's own time zone (a visitor in Jakarta must still see Den Haag times).
// ---------------------------------------------------------------------------

const amsterdamFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export interface AmsterdamNow {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  minutes: number; // minutes since local midnight
}

export function amsterdamNow(date: Date = new Date()): AmsterdamNow {
  const p: Record<string, string> = {};
  for (const part of amsterdamFormat.formatToParts(date)) p[part.type] = part.value;
  return {
    year: +p.year,
    month: +p.month,
    day: +p.day,
    minutes: +p.hour * 60 + +p.minute,
  };
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return +h * 60 + +m;
}

/** Hand-maintained files, used when PRAYER_SOURCE === "manual". */
const MANUAL_SCHEDULES: Record<number, YearSchedule> = {
  2026: schedule2026 as unknown as YearSchedule,
};

const generatedCache = new Map<number, YearSchedule>();

export function getSchedule(year: number): YearSchedule | undefined {
  if (PRAYER_SOURCE === "manual") return MANUAL_SCHEDULES[year];
  if (!Number.isInteger(year) || year < MIN_GENERATED_YEAR) return undefined;
  let cached = generatedCache.get(year);
  if (!cached) {
    cached = { year, months: generateYear(year) };
    generatedCache.set(year, cached);
  }
  return cached;
}

/**
 * Year shown on the yearly page: the current Amsterdam year at build time (generated),
 * or the newest hand-maintained file (manual). Rebuild on 1 January to roll over.
 */
export const LATEST_YEAR =
  PRAYER_SOURCE === "manual"
    ? Math.max(...Object.keys(MANUAL_SCHEDULES).map(Number))
    : Math.max(amsterdamNow().year, MIN_GENERATED_YEAR);

export function timesFor(year: number, month: number, day: number): Times | undefined {
  return getSchedule(year)?.months[month - 1]?.[day - 1];
}

export interface PrayerState {
  /** Index into PRAYER_NAMES of the prayer to highlight, or -1 (between sunrise and Dhohr). */
  active: number;
  /** Index into PRAYER_NAMES of the upcoming time, or -1 after Isha. */
  next: number;
  /** Minutes until `next`, only when it is under an hour (else undefined). */
  minutesLeft?: number;
}

/**
 * Which prayer is current, given today's times and the minutes since midnight.
 *
 * - Before Fadjr (incl. just after midnight) Isha of the previous night is
 *   still current. The old app highlighted nothing between 00:00 and Fadjr.
 * - Between Shoroeq and Dhohr no obligatory prayer is highlighted (sunrise → noon; optional prayers such as Dhuha fall here).
 */
export function prayerState(times: Times, minutes: number): PrayerState {
  const t = times.map(toMinutes);
  let current = -1;
  for (let i = 0; i < t.length; i++) if (minutes >= t[i]) current = i;

  const next = current === t.length - 1 ? -1 : current + 1;
  const left = next === -1 ? undefined : t[next] - minutes;
  return {
    active: current === -1 ? t.length - 1 : current === 1 ? -1 : current,
    next,
    minutesLeft: left !== undefined && left > 0 && left < 60 ? left : undefined,
  };
}

// ---------------------------------------------------------------------------
// Strings
// ---------------------------------------------------------------------------

export interface PrayerStrings {
  widgetTitle: string;
  next: string;
  /** Shown while Fadjr is current: the Fadjr period ends at sunrise (Shoroeq). */
  fadjrEnds: string;
  fullSchedule: string; // "{year}" placeholder
  unavailable: string;
  pageTitle: string; // "{year}" placeholder
  pageIntro: string;
  date: string;
  jumuah: string;
  dstStart: string;
  dstEnd: string;
  months: string;
  note: string;
  verse: string;
  verseSource: string;
}

export const prayerStrings: Record<LangOptions, PrayerStrings> = {
  nl: {
    widgetTitle: "Gebedstijden voor de regio Den Haag",
    next: "Volgende",
    fadjrEnds: "Fadjr eindigt bij zonsopgang (Shoroeq)",
    fullSchedule: "Volledig rooster {year}",
    unavailable: "De gebedstijden van vandaag zijn nog niet beschikbaar.",
    pageTitle: "Gebedstijden Den Haag {year}",
    pageIntro:
      "Het volledige jaarrooster van de gebedstijden voor de regio Den Haag, per dag en in Nederlandse tijd (CET/CEST).",
    date: "Datum",
    jumuah: "Vrijdag (Djoemoea)",
    dstStart: "Zomertijd begint",
    dstEnd: "Wintertijd begint",
    months: "Maanden",
    note: "Tijden gelden voor Den Haag en omgeving. Shoroeq is zonsopgang.",
    verse:
      "“Voorwaar, het gebed is voor de gelovigen een voorgeschreven plicht op vastgestelde tijden.”",
    verseSource: "An-Nisa 4:103",
  },
  id: {
    widgetTitle: "Jadwal Sholat Area Den Haag",
    next: "Berikutnya",
    fadjrEnds: "Waktu Shubuh berakhir saat terbit matahari (Shoroeq)",
    fullSchedule: "Jadwal lengkap {year}",
    unavailable: "Jadwal sholat hari ini belum tersedia.",
    pageTitle: "Jadwal Sholat Den Haag {year}",
    pageIntro:
      "Jadwal sholat lengkap setahun untuk area Den Haag, per hari dan dalam waktu Belanda (CET/CEST).",
    date: "Tanggal",
    jumuah: "Jumat",
    dstStart: "Waktu musim panas dimulai",
    dstEnd: "Waktu musim dingin dimulai",
    months: "Bulan",
    note: "Waktu berlaku untuk Den Haag dan sekitarnya. Shoroeq adalah waktu terbit matahari.",
    verse:
      "“Sungguh, sholat itu adalah kewajiban yang ditentukan waktunya atas orang-orang yang beriman.”",
    verseSource: "An-Nisa 4:103",
  },
  en: {
    widgetTitle: "Prayer Times for The Hague Area",
    next: "Next",
    fadjrEnds: "Fadjr ends at sunrise (Shoroeq)",
    fullSchedule: "Full {year} schedule",
    unavailable: "Today's prayer times are not available yet.",
    pageTitle: "Prayer Times The Hague {year}",
    pageIntro:
      "The full-year prayer timetable for The Hague area, day by day, in Dutch time (CET/CEST).",
    date: "Date",
    jumuah: "Friday (Jumu'ah)",
    dstStart: "Daylight saving time starts",
    dstEnd: "Daylight saving time ends",
    months: "Months",
    note: "Times apply to The Hague and surroundings. Shoroeq is sunrise.",
    verse:
      "“Indeed, prayer has been decreed upon the believers at specified times.”",
    verseSource: "An-Nisa 4:103",
  },
};

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}
