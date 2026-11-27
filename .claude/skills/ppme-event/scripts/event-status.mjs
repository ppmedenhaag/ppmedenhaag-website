// Read-only: what the homepage CTA shows now, what is queued (commented out) and which events are coming.
// Run from the repo root: node .claude/skills/ppme-event/scripts/event-status.mjs
import { readdirSync, readFileSync } from "node:fs";

const day = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(d);
const today = day(new Date());

const events = new Map(); // slug -> { date, title, locales }
for (const locale of ["nl", "id", "en"]) {
  for (const file of readdirSync(`src/content/event/${locale}`)) {
    if (!file.endsWith(".md") || file.startsWith("_")) continue;
    const text = readFileSync(`src/content/event/${locale}/${file}`, "utf8");
    const field = (k) => text.match(new RegExp(`^${k}\\s*:\\s*"?(.*?)"?\\s*$`, "m"))?.[1];
    if (field("draft") === "true") continue;
    const slug = file.slice(0, -3);
    const e = events.get(slug) ?? { date: new Date(field("date")), title: field("title"), locales: [] };
    e.locales.push(locale);
    events.set(slug, e);
  }
}

console.log(`Today (Amsterdam): ${today}`);

console.log("\nHomepage CTA");
for (const locale of ["nl", "id", "en"]) {
  const yml = readFileSync(`src/data/${locale}/homepage.yml`, "utf8").split(/\r?\n/);
  let state;
  for (const line of yml) {
    if (/^ {2}cta\s*:/.test(line)) state = "active";
    else if (/^ {2}# cta\s*:/.test(line)) state = "queued/old";
    const link = state && line.match(/link\s*:\s*"([^"]*)"/)?.[1];
    if (!link) continue;
    const e = events.get(link.match(/^event\/([^/]+)\//)?.[1]);
    const when = e ? `${day(e.date)}${day(e.date) < today ? " PAST" : ""}` : "not an event";
    console.log(`  ${locale}  ${state.padEnd(10)}  ${link}  (${when})`);
    state = undefined;
  }
}

// Homepage video (src/data/homepage-video.yml): replaces the CTA image in every locale while set.
const videoYml = readFileSync("src/data/homepage-video.yml", "utf8");
const videoLink = videoYml.match(/^\s+youtube\s*:\s*"?([^"\r\n]*)"?\s*$/m)?.[1].trim();
const videoUntil = videoYml.match(/^\s+until\s*:\s*"?([^"\r\n]*)"?\s*$/m)?.[1].trim();
console.log(`\nHomepage video: ${videoLink ? `ON  ${videoLink}${videoUntil ? `  (until ${videoUntil} Amsterdam)` : "  (no end time)"}` : "off (CTA image shown)"}`);

console.log("\nUpcoming events (soonest first)");
const upcoming = [...events].filter(([, e]) => day(e.date) >= today).sort((a, b) => a[1].date - b[1].date);
for (const [slug, e] of upcoming) console.log(`  ${day(e.date)}  ${slug}  [${e.locales.join(",")}]  ${e.title}`);
if (!upcoming.length) console.log("  none");
