// YouTube helpers for the homepage video (src/data/homepage-video.yml, components/HomepageVideo.astro).

const ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Video ID from a bare ID or any common YouTube link: youtube.com/watch?v=, youtu.be/, /live/, /shorts/, /embed/
 * (with or without www., m., music., -nocookie). Extra parameters (?si=, &t=) are ignored. null if it is neither.
 */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (ID.test(value)) return value;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null | undefined;
  if (host === "youtu.be") id = url.pathname.split("/")[1];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [first, second] = url.pathname.split("/").filter(Boolean);
    id = first === "watch" ? url.searchParams.get("v") : ["live", "shorts", "embed", "v"].includes(first) ? second : null;
  }
  return id && ID.test(id) ? id : null;
}

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
/** 480×360 thumbnail that every video has (maxresdefault does not always exist). */
export const thumbUrl = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** "YYYY-MM-DD HH:MM" as Amsterdam wall-clock time → that instant (summer/winter time handled). */
export function amsterdamTime(wallClock: string): Date {
  const [, y, mo, d, h, mi] = wallClock.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/)!.map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  // Offset of Amsterdam at (roughly) that moment; a second pass settles the hour around a DST switch.
  const offset = (t: number) => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Amsterdam", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
        .formatToParts(new Date(t))
        .map((x) => [x.type, Number(x.value)]),
    );
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - t;
  };
  let t = asUtc - offset(asUtc);
  t = asUtc - offset(t);
  return new Date(t);
}
