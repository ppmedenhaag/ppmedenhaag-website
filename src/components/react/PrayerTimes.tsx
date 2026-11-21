import { useEffect, useState } from "react";
import {
  INTL_TAG,
  PRAYER_NAMES,
  TIME_ZONE,
  amsterdamNow,
  fill,
  prayerState,
  prayerStrings,
  timesFor,
} from "../../data/prayer";
import type { LangOptions } from "../../data/i18n";

interface Props {
  locale: LangOptions;
  /** Locale-aware URL of the yearly schedule page. */
  scheduleHref: string;
}

/** The five daily prayers shown as tiles (Shoroeq only appears as "next"). */
const TILES = [0, 2, 3, 4, 5] as const;

export default function PrayerTimes({ locale, scheduleHref }: Props) {
  const s = prayerStrings[locale];
  // null on the server and on first client render → identical markup, no hydration mismatch.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(new Date());
      // One wake-up per minute, aligned to the minute boundary (the old app ran
      // four setIntervals at 200 ms–1 s and re-rendered the whole page each time).
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();
    // Timers are throttled in background tabs; resync as soon as the tab is visible again.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const parts = now ? amsterdamNow(now) : null;
  const times = parts ? timesFor(parts.year, parts.month, parts.day) : undefined;
  const state = times && parts ? prayerState(times, parts.minutes) : undefined;

  const dateLabel = now
    ? new Intl.DateTimeFormat(INTL_TAG[locale], {
        timeZone: TIME_ZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)
    : " ";

  const countdown =
    state?.minutesLeft !== undefined
      ? new Intl.RelativeTimeFormat(INTL_TAG[locale], { numeric: "always" }).format(
          state.minutesLeft,
          "minute",
        )
      : undefined;

  return (
    <section
      aria-label={s.widgetTitle}
      className="border-y border-slate-200 bg-white sm:border-x"
    >
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-center">
        <p className="eyebrow">{s.widgetTitle}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900 italic" aria-live="polite">
          {dateLabel}
        </p>
      </div>

      {now && !times ? (
        <p className="px-3 py-5 text-center text-sm text-slate-600">{s.unavailable}</p>
      ) : (
        <dl className="grid grid-cols-5 divide-x divide-slate-200">
          {TILES.map((i) => {
            const active = state?.active === i;
            return (
              <div
                key={i}
                aria-current={active ? "true" : undefined}
                className={`px-1 py-2 text-center transition-colors ${
                  active ? "bg-brand text-white" : ""
                }`}
              >
                <dt
                  className={`text-xs font-semibold sm:text-sm ${
                    active ? "text-white" : "text-slate-500"
                  }`}
                >
                  {PRAYER_NAMES[i]}
                </dt>
                <dd
                  className={`text-base font-bold tabular-nums sm:text-lg ${
                    active ? "text-white" : "text-brand"
                  }`}
                >
                  {times ? times[i] : "--:--"}
                </dd>
              </div>
            );
          })}
        </dl>
      )}

      <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-200 px-3 py-2 text-xs text-slate-600">
        <span aria-live="polite">
          {times && state && state.active === 0
            ? `${s.fadjrEnds}: ${times[1]}${countdown ? ` · ${countdown}` : ""}`
            : times && state && state.next !== -1 && countdown
            ? `${s.next}: ${PRAYER_NAMES[state.next]} ${times[state.next]} · ${countdown}`
            : " "}
        </span>
        <a
          href={scheduleHref}
          className="font-semibold text-brand underline-offset-2 hover:underline"
        >
          {fill(s.fullSchedule, { year: parts?.year ?? new Date().getFullYear() })} →
        </a>
      </div>
    </section>
  );
}
