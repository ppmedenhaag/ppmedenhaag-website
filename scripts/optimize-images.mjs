// One-off/idempotent: shrinks oversized images in public/images in place (same file name + format, so no URL changes).
//   node scripts/optimize-images.mjs [--dry]
// Rules: files > 400 KB are re-encoded; width capped at 2000 px; replaced only when it saves > 15 %.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const dry = process.argv.includes("--dry");
const MAX_BYTES = 400 * 1024;
const MAX_WIDTH = 2000;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

let saved = 0;
for (const file of walk("public/images")) {
  if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
  const before = statSync(file).size;
  if (before <= MAX_BYTES) continue;
  const img = sharp(readFileSync(file)).rotate(); // buffer input: no open file handle (Windows cannot overwrite a locked file)
  const meta = await img.metadata();
  let pipeline = meta.width > MAX_WIDTH ? img.resize({ width: MAX_WIDTH }) : img;
  if (/\.jpe?g$/i.test(file)) pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true, progressive: true });
  else if (/\.webp$/i.test(file)) pipeline = pipeline.webp({ quality: 80 });
  else pipeline = pipeline.png({ palette: true, quality: 82, compressionLevel: 9 });
  const out = await pipeline.toBuffer();
  const pct = Math.round((1 - out.length / before) * 100);
  console.log(`${file}: ${(before / 1024) | 0} KB -> ${(out.length / 1024) | 0} KB (${pct}%)${pct > 15 ? "" : " skipped"}`);
  if (pct > 15 && !dry) {
    writeFileSync(file, out);
    saved += before - out.length;
  }
}
console.log(`saved ${(saved / 1024 / 1024).toFixed(1)} MB`);
