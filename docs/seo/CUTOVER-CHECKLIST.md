# Cutover checklist: www.ppmedenhaag.nl + ppmedenhaag.nl → this Astro site

Short, ordered version of SEO-PLAN.md Phase 10, written after the pre-cutover review (2026-11-21).
Steps marked **(owner)** need the Cloudflare dashboard / GitHub settings. Order matters.

## Before the switch

1. **(owner) Contact form test.** On https://website-v2.ppmedenhaag.nl/contact/ send one test message and confirm it arrives in the
   board mailbox. The form now posts to the Hugo site's Formspree form (`formspree.io/f/mvolqyea`, `src/data/site.ts`).
2. **(owner) Cloudflare → SSL/TLS → Edge Certificates → "Always Use HTTPS" = On** for the ppmedenhaag.nl zone.
   (The Worker upgrades http→https for pages; static files skip the Worker, so this zone setting covers the rest.)
3. **(owner, optional) Cache purge on deploy:** add repo secret `CLOUDFLARE_ZONE_ID` (zone overview page, right column) and give the
   `CLOUDFLARE_API_TOKEN` the extra permission *Zone › Cache Purge › Purge* for this zone.
4. **(owner) Lower the TTL** of the `www` CNAME and the apex `A` record to 5 min, a day ahead (they are DNS-only today).
5. **(owner) Export the Search Console baseline** (Performance, last 16 months + Pages report). The domain is verified by DNS TXT,
   which is untouched by the switch.

## The switch (one sitting, ~15 min)

6. **(owner) GitHub → Settings → Secrets and variables → Actions → Variables:** `PUBLIC_SITE_URL = https://www.ppmedenhaag.nl`.
   Re-run the "Build and deploy" workflow (or push). The job summary must say **PRODUCTION deploy** and the build must pass
   (`seo-audit` in production mode). Do this **before** DNS: otherwise www would serve pages whose canonical points at the
   noindexed website-v2. (Staging keeps working; it stays noindexed by the Worker.)
7. **(owner) Cloudflare DNS:** delete `www CNAME ppmedenhaag.netlify.app` and `@ A 75.2.60.5`.
   **Do not touch:** the 5 `MX` records (Google Workspace mail), `TXT` SPF, both `google-site-verification` TXT, `sa-verify` TXT,
   `sholat` (still on Netlify), `event`, `website-v2`.
8. Attach both hosts to the Worker: in `wrangler.jsonc` change `routes` to
   ```jsonc
   "routes": [
     { "pattern": "website-v2.ppmedenhaag.nl", "custom_domain": true },
     { "pattern": "www.ppmedenhaag.nl", "custom_domain": true },
     { "pattern": "ppmedenhaag.nl", "custom_domain": true }
   ],
   ```
   and push to `main` (the deploy creates the DNS records + certificates; the API token may need *Zone › DNS › Edit* and
   *Workers Routes › Edit* for the zone; if the deploy fails on permissions, add the two custom domains in the dashboard:
   Workers & Pages → ppme-website → Settings → Domains & Routes → Add → Custom domain).
   **Do not add these routes before step 7**: with the Netlify records still present the deploy fails.

## Right after

9. Verify (each must be true):
   - `curl -sI https://www.ppmedenhaag.nl/` → 200, **no** `x-robots-tag` header.
   - `curl -sI http://ppmedenhaag.nl/zakat` → one 301 to `https://www.ppmedenhaag.nl/zakat/`, which 301s to `/ibadah/sadaqah/`.
   - `curl -s https://www.ppmedenhaag.nl/robots.txt` contains `Sitemap: https://www.ppmedenhaag.nl/sitemap.xml`.
   - View source of the homepage: canonical and `og:url` are `https://www.ppmedenhaag.nl/…`; the Simple Analytics script is present.
   - Share an event link in WhatsApp: preview card appears.
   - `npm run seo:diff -- --write` against the live site: 0 missing.
10. Search Console: submit `https://www.ppmedenhaag.nl/sitemap.xml`; URL-inspect the homepage + 5 key pages. No "Change of address".
11. Keep the Netlify site (unlinked) for ≥ 2 weeks as rollback (re-create the two DNS records to roll back). Don't delete the Netlify
    team: `sholat.ppmedenhaag.nl` is hosted there.
12. Clean-up: remove the "CUTOVER PENDING" bullet in `CLAUDE.md`, the memory note, the banner in `PROGRESS.md`; optionally remove the
    `website-v2` route and set `workers_dev: false`.
