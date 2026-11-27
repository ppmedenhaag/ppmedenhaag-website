// Read-only SEO report for one event, from the built pages. Run from the repo root after `npm run build`:
//   node .claude/skills/ppme-event/scripts/check-seo.mjs <slug>
// Complements scripts/seo-audit.mjs (site-wide) with event-specific checks. Exit code 1 = fix before publishing.
import { existsSync, readFileSync, statSync } from "node:fs";
import { parse } from "node-html-parser";
import sharp from "sharp";

const slug = process.argv[2];
if (!slug) {
  console.error("usage: check-seo.mjs <slug>");
  process.exit(1);
}

let failed = false;
const say = (level, msg) => {
  if (level === "FIX") failed = true;
  console.log(`  ${level.padEnd(5)} ${msg}`);
};

for (const locale of ["nl", "id", "en"]) {
  const path = `${locale === "nl" ? "" : `/${locale}`}/event/${slug}/`;
  console.log(`\n${path}`);
  const source = `src/content/event/${locale}/${slug}.md`;
  if (!existsSync(source)) {
    say("NOTE", "no translation (fine only if intended)");
    continue;
  }
  const file = `dist${path}index.html`;
  if (!existsSync(file)) {
    say("FIX", "page not built: draft, future publishDate, or stale dist");
    continue;
  }
  const md = readFileSync(source, "utf8");
  const field = (k) => md.match(new RegExp(`^${k}\\s*:\\s*"?(.*?)"?\\s*$`, "m"))?.[1] ?? "";
  const root = parse(readFileSync(file, "utf8"), { blockTextElements: { script: true, style: true } });
  const attr = (sel, name = "content") => root.querySelector(sel)?.getAttribute(name) ?? "";

  const title = root.querySelector("head title")?.text.trim() ?? "";
  const description = attr('meta[name="description"]');
  say(title.length > 70 ? "FIX" : "ok", `title (${title.length}): ${title}`);
  say(description.length < 70 || description.length > 160 ? "FIX" : "ok", `description (${description.length}): ${description}`);
  say("info", `canonical: ${attr('link[rel="canonical"]', "href")}`);
  say("info", `hreflang: ${root.querySelectorAll("link[hreflang]").map((l) => l.getAttribute("hreflang")).join(" ")}`);

  const og = attr('meta[property="og:image"]');
  say(og ? "info" : "FIX", `share card (open it): dist${og.replace(/^https?:\/\/[^/]+/, "")}`);
  if (!field("image")) say("WARN", "no image: share card is a plain title card");

  const h1 = root.querySelectorAll("h1").length;
  if (h1 !== 1) say("FIX", `${h1} <h1> elements (no single "#" headings in the body)`);

  const graph = root.querySelectorAll('script[type="application/ld+json"]').flatMap((s) => JSON.parse(s.text)["@graph"] ?? []);
  const event = graph.find((n) => n["@type"] === "Event");
  if (!event) {
    say("FIX", "no Event JSON-LD");
    continue;
  }
  const mode = event.eventAttendanceMode.split("/").pop();
  const place = event.location;
  say("info", `startDate ${event.startDate}`);
  say(event.endDate ? "ok" : "WARN", event.endDate ? `endDate ${event.endDate}` : "no endDate (duration missing or unparseable)");
  if (field("date").slice(0, 16) !== event.startDate.slice(0, 16)) say("FIX", `front matter date ${field("date")} has the wrong UTC offset`);
  say("info", `${mode}: ${place ? [place.name, ...Object.values(place.address ?? {}).slice(1), place.url].filter(Boolean).join(" | ") : "no location"}`);
  if (!place) say("FIX", "Event has no location");
  if (mode === "OnlineEventAttendanceMode" && /masjid|moskee|mosque|hikmah/i.test(field("location")))
    say("FIX", "hybrid event marked online-only: keep only the venue in `location`, mention the stream in the body");
  if (place?.address && !place.address.streetAddress) say("WARN", "venue has no street address: use `Name, Street 1, 1234 AB City`");
  if (event.performer) say("info", `performers: ${event.performer.map((p) => p.name).join(", ")}`);
}
// Images the event pages reference: hero, social_image, speaker photos and local body images.
console.log("\nimages");
const images = new Map(); // public-relative path -> is hero
// front matter `image:` / `social_image:` / speaker `image:`, Markdown images, raw <img>
const IMAGE_REF = /(?:^[ \t]*(image|social_image)[ \t]*:[ \t]*"?|!\[[^\]]*\]\(|<img[^>]+src=")([^"\s)]+\.(?:jpe?g|png|webp|gif))/gim;
for (const locale of ["nl", "id", "en"]) {
  const source = `src/content/event/${locale}/${slug}.md`;
  if (!existsSync(source)) continue;
  const md = readFileSync(source, "utf8");
  for (const m of md.matchAll(IMAGE_REF)) {
    const rel = m[2].replace(/^\/+/, "");
    if (/^https?:/.test(rel)) continue;
    const hero = m[1] === "image" && m[0].startsWith("image"); // unindented = the event image, not a speaker
    images.set(rel, images.get(rel) || hero);
  }
}
for (const [rel, hero] of images) {
  const file = `public/${rel}`;
  if (!existsSync(file)) {
    say("FIX", `${rel}: file does not exist (check upper/lower case)`);
    continue;
  }
  const kb = Math.round(statSync(file).size / 1024);
  const { width, height } = await sharp(file).metadata();
  const issues = [kb > 400 && "over 400 KB", width > 2000 && "wider than 2000 px", hero && !/\.webp$/i.test(rel) && "hero is not WebP"].filter(Boolean);
  say(issues.length ? "FIX" : "ok", `${rel}: ${width}x${height}, ${kb} KB${issues.length ? ` (${issues.join(", ")})` : ""}`);
  const built = `dist/event/${slug}/index.html`;
  if (hero && width >= 450 && existsSync(built) && !/srcset="\/img\//.test(readFileSync(built, "utf8")))
    say("FIX", "hero has no responsive WebP variants on the built page (rebuild)");
}
if (!images.size) say("info", "none");
process.exit(failed ? 1 : 0);
