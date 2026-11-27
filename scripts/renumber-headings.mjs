// Renumber Markdown headings in content bodies so they run ##, ###, #### ... without gaps (the page title is the <h1>).
// Relative order is kept: a body that uses ### and ##### becomes ## and ###. Front matter and code fences are untouched.
//
//   node scripts/renumber-headings.mjs src/content/blog/nl/juli-2023.md [more files ...]
//   node scripts/renumber-headings.mjs --dry src/content/event/*/*.md
//
// Note: this changes how big the headings look (e.g. ##### dates become ## headings). Check the pages after running it.
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const files = args.filter((a) => a !== "--dry");
if (!files.length) {
  console.error("usage: node scripts/renumber-headings.mjs [--dry] <file.md> ...");
  process.exit(1);
}

for (const f of files) {
  const raw = readFileSync(f, "utf8");
  const crlf = raw.includes("\r\n");
  const s = raw.replace(/\r\n/g, "\n");
  const fm = s.match(/^---\n[\s\S]*?\n---(\n|$)/); // also when the file ends right after the closing ---
  const head = fm ? fm[0] : "";
  const lines = s.slice(head.length).split("\n");

  let fence = false;
  const levels = new Set();
  for (const l of lines) {
    if (/^```/.test(l)) fence = !fence;
    else if (!fence) {
      const h = l.match(/^(#{1,6})\s/);
      if (h) levels.add(h[1].length);
    }
  }
  const sorted = [...levels].sort((a, b) => a - b);
  const map = Object.fromEntries(sorted.map((lv, i) => [lv, Math.min(i + 2, 6)]));
  if (sorted.every((lv) => map[lv] === lv)) continue;

  fence = false;
  const out = lines.map((l) => {
    if (/^```/.test(l)) {
      fence = !fence;
      return l;
    }
    return fence ? l : l.replace(/^(#{1,6})(\s)/, (_, h, sp) => "#".repeat(map[h.length]) + sp);
  });
  console.log(`${dry ? "[dry] " : ""}${f} ${JSON.stringify(map)}`);
  if (!dry) {
    const result = head + out.join("\n");
    writeFileSync(f, crlf ? result.replace(/\n/g, "\r\n") : result);
  }
}
