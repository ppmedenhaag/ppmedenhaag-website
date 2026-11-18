import base from "./base-winter-time.json";

export type Times = readonly [string, string, string, string, string, string];

const BASE = base.months as unknown as string[][][];

const toMinutes = (hhmm: string) => +hhmm.slice(0, 2) * 60 + +hhmm.slice(3, 5);
const toHHMM = (n: number) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

/** Last Sunday of a month (monthIndex 0-based) as a UTC day-of-month. */
export function lastSunday(year: number, monthIndex: number): number {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
  return lastDay.getUTCDate() - lastDay.getUTCDay();
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * EU summer time: from the last Sunday of March through the day before the last Sunday of
 * October. (All prayer times are after 03:00 local, so the switch day itself belongs to the
 * new regime: 29 Mar 2026 is summer, 25 Oct 2026 is winter.)
 */
export function isSummerTime(year: number, month: number, day: number): boolean {
  if (month > 3 && month < 10) return true;
  if (month === 3) return day >= lastSunday(year, 2);
  if (month === 10) return day < lastSunday(year, 9);
  return false;
}

/** Full-year timetable for any year: base table, +1h on summer-time days, 29 Feb only in leap years. */
export function generateYear(year: number): Times[][] {
  return BASE.map((days, mi) => {
    const length = new Date(Date.UTC(year, mi + 1, 0)).getUTCDate();
    return days.slice(0, length).map((row, di) => {
      if (!isSummerTime(year, mi + 1, di + 1)) return row as unknown as Times;
      return row.map((t) => toHHMM(toMinutes(t) + 60)) as unknown as Times;
    });
  });
}
