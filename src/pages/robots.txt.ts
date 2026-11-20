// Production robots.txt (the edge Worker serves its own, non-blocking version on non-production hosts: worker/index.js).
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\nDisallow: /pagefind/\n\nSitemap: ${new URL("/sitemap.xml", site).href}\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
