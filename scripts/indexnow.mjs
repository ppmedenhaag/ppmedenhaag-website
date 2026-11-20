// Tells Bing/Yandex (IndexNow) about every URL of the freshly deployed site. Runs only for production deploys
// (PUBLIC_SITE_URL=https://www.ppmedenhaag.nl); a no-op on staging. Key file: public/<key>.txt (public by design).
//   node scripts/indexnow.mjs [--force]
import { existsSync, readFileSync } from "node:fs";

const KEY = "229f03206844d9ebc7c7bcd3a7f351ff";
const PRODUCTION = "https://www.ppmedenhaag.nl";
const origin = (process.env.PUBLIC_SITE_URL || "").replace(/\/+$/, "");

if (origin !== PRODUCTION && !process.argv.includes("--force")) {
  console.log(`[indexnow] skipped (PUBLIC_SITE_URL is "${origin || "unset"}", not production)`);
  process.exit(0);
}
if (!existsSync("dist/sitemap-0.xml")) throw new Error("dist/sitemap-0.xml missing: build first");
const urls = [...readFileSync("dist/sitemap-0.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const host = new URL(PRODUCTION).host;
for (let i = 0; i < urls.length; i += 9000) {
  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: KEY, keyLocation: `${PRODUCTION}/${KEY}.txt`, urlList: urls.slice(i, i + 9000) }),
  });
  console.log(`[indexnow] submitted ${Math.min(urls.length, i + 9000)}/${urls.length} URLs -> HTTP ${res.status}`);
}
