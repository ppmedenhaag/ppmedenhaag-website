// Content sanity report for SEO-relevant front matter. Read-only unless a --fix flag is given.
//   node scripts/check-content.mjs                  report
//   node scripts/check-content.mjs --fix-dates      rewrite wrong UTC offsets to the real Europe/Amsterdam offset (wall clock kept)
//   node scripts/check-content.mjs --write-lang     add `contentLang: "id"|"nl"|"en"` where the text is clearly in another language than its folder
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FIX_DATES = process.argv.includes("--fix-dates");
const WRITE_LANG = process.argv.includes("--write-lang");
const TZ = "Europe/Amsterdam";

function* walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith(".md")) yield p;
  }
}

/** Real Amsterdam offset ("+01:00" / "+02:00") at a given wall-clock time. */
function amsterdamOffset(y, mo, d, h, mi) {
  // Find the offset such that the instant formats back to the same wall clock in Amsterdam.
  for (const off of [60, 120]) {
    const utc = Date.UTC(y, mo - 1, d, h, mi) - off * 60000;
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hourCycle: "h23", hour: "2-digit", minute: "2-digit", day: "2-digit" })
      .formatToParts(new Date(utc))
      .reduce((a, p) => ((a[p.type] = p.value), a), {});
    if (+parts.hour === h && +parts.minute === mi && +parts.day === d) return off === 60 ? "+01:00" : "+02:00";
  }
  return null;
}

const STOP = {
  id: ["yang", "dan", "untuk", "dengan", "akan", "pada", "adalah", "dari", "kami", "anda", "bapak", "ibu", "ini", "itu", "kita", "juga", "dalam", "acara"],
  nl: ["het", "een", "van", "voor", "met", "zijn", "wij", "ons", "onze", "deze", "ook", "bij", "naar", "niet", "worden", "je", "jij", "uw"],
  en: ["the", "and", "for", "with", "will", "this", "that", "are", "our", "you", "your", "from", "have", "join"],
};
function detectLang(text) {
  const words = text.toLowerCase().match(/[a-zàâäéèêëïîôöùûüçñ']+/g) ?? [];
  if (words.length < 40) return null;
  const score = Object.fromEntries(Object.keys(STOP).map((l) => [l, words.filter((w) => STOP[l].includes(w)).length / words.length]));
  const [best, second] = Object.entries(score).sort((a, b) => b[1] - a[1]);
  return best[1] > 0.06 && best[1] > second[1] * 2 ? best[0] : null;
}

const dateIssues = [];
const langIssues = [];
let total = 0;
for (const section of ["event", "blog", "ibadah", "about", "dakwah"]) {
  for (const file of walk(join("src/content", section))) {
    total++;
    let raw = readFileSync(file, "utf8");
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!fm) continue;
    const locale = file.replace(/\\/g, "/").split("/")[3];
    const m = fm[1].match(/^date:\s*"?(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):\d{2}([+-]\d{2}:\d{2}|Z)"?/m);
    if (m) {
      const [, y, mo, d, h, mi, off] = m;
      const real = amsterdamOffset(+y, +mo, +d, +h, +mi);
      if (real && real !== off) {
        dateIssues.push(`${file}: date written with ${off}, Amsterdam is ${real} at ${y}-${mo}-${d} ${h}:${mi}`);
        if (FIX_DATES) {
          raw = raw.replace(m[0], m[0].replace(off, real));
          writeFileSync(file, raw);
        }
      }
    }
    if (!/^contentLang:/m.test(fm[1])) {
      const lang = detectLang(fm[2]);
      if (lang && lang !== locale) {
        langIssues.push(`${file}: folder ${locale}, text looks ${lang}`);
        if (WRITE_LANG) writeFileSync(file, raw.replace(/^---(\r?\n)/, `---$1contentLang: "${lang}"$1`));
      }
    }
  }
}
console.log(`${total} entries checked`);
console.log(`\nDST/offset mismatches (${dateIssues.length}):\n${dateIssues.join("\n") || "none"}`);
console.log(`\nLanguage mismatches (${langIssues.length}):\n${langIssues.join("\n") || "none"}`);
