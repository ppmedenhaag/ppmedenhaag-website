// Unit test for the edge Worker (no wrangler needed): node worker/test.mjs  (npm run test:worker)
import worker from "./index.js";
const env = { ASSETS: { fetch: async (r) => { const p = new URL(r.url).pathname; return p.startsWith("/__ppme_not_found__") ? new Response("404 page", { status: 404 }) : new Response("ok " + p, { status: 200, headers: { "content-type": "text/html" } }); } } };
const cases = [
  ["http://ppmedenhaag.nl/x/?a=1", 301, "https://www.ppmedenhaag.nl/x/?a=1"],
  ["http://ppmedenhaag.nl/x?a=1", 301, "https://www.ppmedenhaag.nl/x/?a=1"],
  ["https://ppmedenhaag.nl/", 301, "https://www.ppmedenhaag.nl/"],
  ["http://www.ppmedenhaag.nl/event", 301, "https://www.ppmedenhaag.nl/event/"],
  ["http://www.ppmedenhaag.nl/event/", 301, "https://www.ppmedenhaag.nl/event/"],
  ["https://www.ppmedenhaag.nl/event", 301, "https://www.ppmedenhaag.nl/event/"],
  ["https://www.ppmedenhaag.nl/event//", 301, "https://www.ppmedenhaag.nl/event/"],
  ["https://www.ppmedenhaag.nl/event/index.html", 301, "https://www.ppmedenhaag.nl/event/"],
  ["https://www.ppmedenhaag.nl/404/", 404, null],
  ["https://www.ppmedenhaag.nl/404", 404, null],
  ["https://www.ppmedenhaag.nl/404.html", 404, null],
  ["https://www.ppmedenhaag.nl/sitemap.xml", 200, null],
  ["https://www.ppmedenhaag.nl/event/", 200, null],
  ["https://website-v2.ppmedenhaag.nl/event/", 200, null],
  ["https://website-v2.ppmedenhaag.nl/robots.txt", 200, null],
  ["https://website-v2.ppmedenhaag.nl/404/", 404, null],
];
let fail = 0;
for (const [u, st, loc] of cases) {
  const r = await worker.fetch(new Request(u), env);
  const got = r.headers.get("location");
  const ok = r.status === st && (loc === null || got === loc);
  const xr = r.headers.get("x-robots-tag");
  if (!ok) fail++;
  console.log(ok ? "PASS" : "FAIL", r.status, u, got ?? "", xr ? "[noindex]" : "");
}
process.exit(fail ? 1 : 0);
