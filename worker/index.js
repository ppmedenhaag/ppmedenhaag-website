// Edge Worker in front of the static assets (wrangler.jsonc: main + assets.binding + run_worker_first).
// Host-dependent behaviour has to live here: the SAME build is served on website-v2.ppmedenhaag.nl, *.workers.dev
// and (after the cutover) www.ppmedenhaag.nl / ppmedenhaag.nl. Plan: docs/seo/SEO-PLAN.md Phase 0.1.
//
//  * http://                        -> 301 to https:// (Netlify did this; static files skip the Worker, so ALSO turn on
//                                      Cloudflare "Always Use HTTPS" for the zone)
//  * apex ppmedenhaag.nl            -> 301 to https://www.ppmedenhaag.nl (path + query kept)
//  * non-production hosts           -> `X-Robots-Tag: noindex, nofollow` on every HTML response and a permissive robots.txt
//                                      (crawlers must be allowed to fetch the page to *see* noindex; social-preview bots keep working)
//  * missing trailing slash on HTML -> 301 (Workers' own auto-trailing-slash redirect is a temporary 307)
//  * /index.html, `//`              -> 301 to the clean URL
//  * /nl/...                        -> 301 to the unprefixed Dutch URL (Hugo alias); /nl/sitemap.xml is a real file
//  * /404, /404/, /404.html         -> the 404 page with status 404 (otherwise the flat dist/404.html bounced between
//                                      the assets' 307 /404/ -> /404 and our trailing-slash 301 forever)
// All fixes are combined into ONE 301 hop. Everything else is passed to the static assets.

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
    const method = request.method;
    const isRead = method === "GET" || method === "HEAD";
    let redirect = false;

    if (url.protocol === "http:") {
      url.protocol = "https:";
      url.port = "";
      redirect = true;
    }
    if (url.hostname === APEX_HOST) {
      url.hostname = PRODUCTION_HOST;
      url.port = "";
      redirect = true;
    }

    if (isRead) {
      // //foo//bar -> /foo/bar
      if (url.pathname.includes("//")) {
        url.pathname = url.pathname.replace(/\/{2,}/g, "/");
        redirect = true;
      }
      if (/^\/404(\/|\.html)?$/.test(url.pathname)) {
        if (!redirect) return notFound(request, env, url.hostname === PRODUCTION_HOST);
      } else if (url.pathname.endsWith("/index.html")) {
        // /foo/index.html -> /foo/
        url.pathname = url.pathname.slice(0, -"index.html".length);
        redirect = true;
      } else {
        // /foo -> /foo/ (only for extension-less paths, i.e. pages; files like /sitemap.xml or /og/x.jpg are left alone)
        const last = url.pathname.split("/").pop() ?? "";
        if (!url.pathname.endsWith("/") && !last.includes(".")) {
          url.pathname += "/";
          redirect = true;
        }
      }
      // /nl/foo/ -> /foo/ (nl is unprefixed). Not in public/_redirects: it would also redirect /nl/sitemap.xml.
      if (url.pathname.startsWith("/nl/") && url.pathname !== "/nl/sitemap.xml") {
        url.pathname = url.pathname.slice("/nl".length);
        redirect = true;
      }
    }

    if (redirect) return Response.redirect(url.href, 301);

    const isProduction = url.hostname === PRODUCTION_HOST;

    if (!isProduction && url.pathname === "/robots.txt") {
      return new Response(NON_PROD_ROBOTS, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" },
      });
    }

    const response = await env.ASSETS.fetch(request);
    return isProduction ? response : noindex(response);
  },
};

/** @param {Response} response */
function noindex(response) {
  const out = new Response(response.body, response);
  out.headers.set("X-Robots-Tag", "noindex, nofollow");
  return out;
}

/** The site's 404 page with a real 404 status (assets `not_found_handling: "404-page"` for a path that never exists). */
async function notFound(request, env, isProduction) {
  const probe = new URL("/__ppme_not_found__/", request.url);
  const response = await env.ASSETS.fetch(new Request(probe, { method: request.method, headers: request.headers }));
  return isProduction ? response : noindex(response);
}
