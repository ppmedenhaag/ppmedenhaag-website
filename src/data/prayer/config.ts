/**
 * Where prayer times come from.
 *
 * - "generated" (default): one winter-time base table (`base-winter-time.json`) is reused every
 *   year and +1 hour is added in summer time (last Sunday of March → day before the last Sunday
 *   of October). Works for 2025 and every later year with no new data file.
 * - "manual": only the hand-maintained `gebedstijden-<year>.json` files registered in
 *   `MANUAL_SCHEDULES` (src/data/prayer.ts) are used; a year without a file shows "not available".
 *
 * Flip without touching code: set `PUBLIC_PRAYER_SOURCE=manual` in the build environment
 * (e.g. Cloudflare Pages → Settings → Environment variables) and redeploy; or change DEFAULT below.
 */
export type PrayerSource = "generated" | "manual";

const DEFAULT: PrayerSource = "generated";

const fromEnv = import.meta.env?.PUBLIC_PRAYER_SOURCE;

export const PRAYER_SOURCE: PrayerSource =
  fromEnv === "manual" || fromEnv === "generated" ? fromEnv : DEFAULT;

/** The base table was derived from 2025/2026; earlier years used a different table (Jan–Apr differ). */
export const MIN_GENERATED_YEAR = 2025;
