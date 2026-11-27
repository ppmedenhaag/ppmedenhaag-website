// Turns a flyer/photo into the event hero image: public/images/events/<name>.webp
// (EXIF-rotated, metadata stripped, max 1600 px wide). Run from the repo root:
//   node .claude/skills/ppme-event/scripts/prepare-image.mjs <input file> <name> [--force]
// <name> = the event slug (add -YYYYMMDD when the slug is reused for a recurring event).
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const args = process.argv.slice(2);
const force = args.includes("--force");
const [input, name] = args.filter((a) => a !== "--force");

if (!input || !name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  console.error("usage: prepare-image.mjs <input file> <lower-case-dashed-name> [--force]");
  process.exit(1);
}
const out = `public/images/events/${name}.webp`;
if (existsSync(out) && !force) {
  console.error(`${out} already exists (another event may use it). Pick another name, or --force to replace it.`);
  process.exit(1);
}

const buf = await sharp(readFileSync(input))
  .rotate()
  .resize({ width: 1600, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toBuffer();
writeFileSync(out, buf);

const { width, height } = await sharp(buf).metadata();
console.log(`${out}: ${width}x${height}, ${Math.round(buf.length / 1024)} KB (source ${Math.round(statSync(input).size / 1024)} KB)`);
if (width < 600) console.log("WARNING: narrower than 600 px; ask for a larger original.");
console.log(`front matter: image: "images/events/${name}.webp"`);
