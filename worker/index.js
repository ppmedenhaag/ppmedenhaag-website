// Edge Worker in front of the static assets (wrangler.jsonc: main + assets.binding + run_worker_first).
// Host-dependent behaviour has to live here: the SAME build is served on website-v2.ppmedenhaag.nl, *.workers.dev
// and (after the cutover) www.ppmedenhaag.nl / ppmedenhaag.nl. Plan: docs/seo/SEO-PLAN.md Phase 0.1.
//
//  * apex ppmedenhaag.nl            -> 301 to https://www.ppmedenhaag.nl (path + query kept)
//  * non-production hosts           -> `X-Robots-Tag: noindex, nofollow` on every HTML response and a permissive robots.txt
//                                      (crawlers must be allowed to fetch the page to *see* noindex; social-preview bots keep working)
//  * missing trailing slash on HTML -> 301 (Workers' own auto-trailing-slash redirect is a temporary 307)
//  * /index.html                    -> 301 to the clean URL
// Everything else is passed to the static assets.

const PRODUCTION_HOST = "www.ppmedenhaag.nl";
const APEX_HOST = "ppmedenhaag.nl";

const NON_PROD_ROBOTS = `# Non-production host: not indexed (X-Robots-Tag: noindex on every page).
User-agent: *
Allow: /
`;

export default {
  /**
   * @param {Request} request
   * @param {{ ASSETS: { fetch: (r: Request) => Promise<Response> } }} env
   */
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.hostname === APEX_HOST) {
      url.protocol = "https:";
      url.hostname = PRODUCTION_HOST;
      url.port = "";
      return Response.redirect(url.href, 301);
    }

    const isProduction = url.hostname === PRODUCTION_HOST;
    const method = request.method;
    const isRead = method === "GET" || method === "HEAD";

    if (isRead) {
      // /foo/index.html -> /foo/
      if (url.pathname.endsWith("/index.html")) {
        url.pathname = url.pathname.slice(0, -"index.html".length);
        return Response.redirect(url.href, 301);
      }
      // /foo -> /foo/ (only for extension-less paths, i.e. pages; files like /sitemap.xml or /og/x.jpg are left alone)
      const last = url.pathname.split("/").pop() ?? "";
      if (!url.pathname.endsWith("/") && !last.includes(".")) {
        url.pathname += "/";
        return Response.redirect(url.href, 301);
      }
    }

    if (!isProduction && url.pathname === "/robots.txt") {
      return new Response(NON_PROD_ROBOTS, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" },
      });
    }

    const response = await env.ASSETS.fetch(request);
    if (isProduction) return response;

    const out = new Response(response.body, response);
    out.headers.set("X-Robots-Tag", "noindex, nofollow");
    return out;
  },
};
