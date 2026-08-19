# Deploying to Cloudflare Pages

Step-by-step runbook for taking this repo from "builds locally" to "live on
Cloudflare Pages at ppmedenhaag.nl". This is the execution guide for the decision
already recorded in `../ppmedenhaag-website/.migration/07-deploy-hosting.md` — read
that file first for the *why* (Pages vs. Workers, Netlify decommission rationale); this
file is the *how*.

## Current state (as of writing)

- `astro.config.mjs` already has `output: "static"` and **no adapter** — correct for
  Cloudflare Pages, which serves the static `dist/` output directly. Don't add
  `@astrojs/cloudflare` unless the site later needs SSR/edge functions.
- `public/_headers` exists (Step 2 is done — confirmed it lands in `dist/_headers` via
  `npm run build`). `public/_redirects` intentionally does not exist — `netlify.toml`
  has no `[[redirects]]` block to port.
- `package.json` has `"engines": { "node": ">=20" }` (Step 3 is done).
- No Cloudflare Pages project exists yet — Steps 5 onward are still manual dashboard
  work for whoever has Cloudflare account access.
- No custom `404.astro` page exists yet (see the note in Step 6).
- The repo is already on GitHub: `r0stiars0/ppmedenhaag-website-astro`.

## Prerequisites

- A Cloudflare account with access to add a Pages project (and, later, to manage DNS
  for `ppmedenhaag.nl` when it's time to cut over).
- Push access to `r0stiars0/ppmedenhaag-website-astro` on GitHub.
- Node 20+ locally to sanity-check the build before pushing (`node -v`).

---

## Step 1 — Confirm the site builds cleanly

Cloudflare will run the same command you run locally, so verify it first:

```sh
npm install
npm run build
```

`npm run build` runs `astro check && astro build` — both must pass with 0 errors. This
should already be true; treat any failure here as a blocker, not something to work
around in Cloudflare's config.

## Step 2 — Netlify headers ported to a Cloudflare `_headers` file ✅ done

The live Hugo site's `netlify.toml` sets security headers and long-cache headers for
static assets. Cloudflare Pages has no TOML equivalent — it reads a `public/_headers`
file (copied verbatim into `dist/_headers` at build, then read by Cloudflare's edge).
`netlify.toml` has **no `[[redirects]]` block**, so there's nothing to port to a
`_redirects` file — confirmed by inspecting the file directly, not assumed.

`public/_headers` already exists in this repo:

```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: same-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

/*.js
  Cache-Control: public, s-maxage=86400

/*.css
  Cache-Control: public, s-maxage=86400

/*.woff
  Cache-Control: public, s-maxage=86400
```

This is a line-by-line translation of every block in `netlify.toml` — same header
names and values, Cloudflare's `_headers` syntax instead of Netlify's TOML. Verified it
lands in `dist/_headers` unchanged via `npm run build`. If `netlify.toml` changes,
re-diff it against this list rather than trusting this snapshot.

## Step 3 — Node version pinned ✅ done

`package.json` already has:
```json
"engines": { "node": ">=20" }
```
This is equivalent to `netlify.toml`'s `[build.environment] HUGO_VERSION` pin, just for
Node instead of Hugo — no separate `NODE_VERSION` environment variable is needed in the
Pages dashboard because of this.

## Step 4 — Commit and push

```sh
git add public/_headers package.json
git commit -m "Add Cloudflare Pages headers and pin Node version"
git push
```

## Step 5 — Create the Cloudflare Pages project

In the Cloudflare dashboard:

1. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Authorize Cloudflare's GitHub App if not already done, then select
   `r0stiars0/ppmedenhaag-website-astro`.
3. Build settings:
   | Field | Value |
   |---|---|
   | Framework preset | Astro (Cloudflare autodetects this; verify it filled in the row below correctly) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `/` (this repo's root — leave default) |
4. Environment variables: none required — the `engines` field from Step 3 already
   pins the Node version.
5. Click **Save and Deploy**.

> **Caveat carried over from the migration plan:** Cloudflare has been consolidating
> Pages and Workers, and its recommended default for *new* static sites may have
> shifted since `07-deploy-hosting.md` was written. Before clicking Create, do a quick
> check of Cloudflare's current "deploy a static site" docs — if Workers + static
> assets has since become the default path for new projects, the `_headers` file and
> build settings above still apply; only the deploy mechanism changes (`wrangler
> deploy` instead of Pages' git integration).

## Step 6 — Verify the first deploy

Cloudflare gives you a `*.pages.dev` preview URL immediately. Before touching DNS:

- [ ] Homepage loads for all 3 locales: `/`, `/id/`, `/en/`.
- [ ] Spot-check one page per migrated section: `/event/...`, `/blog/...`,
      `/ibadah/...`, `/about/...`, `/contact/`.
- [ ] Trailing slashes are present on every URL (`trailingSlash: "always"` in
      `astro.config.mjs` — if Cloudflare's own trailing-slash handling ever conflicts
      with this, it needs investigating here, not papered over).
- [ ] No `/nl/...` URLs exist anywhere (the whole point of the nl-exclusion filter
      documented in `CLAUDE.md` — confirm it survived the real deploy, not just local
      `astro build`).
- [ ] `_headers` took effect: `curl -I https://<preview>.pages.dev/` and confirm
      `x-frame-options`, `strict-transport-security`, etc. are present.
- [ ] Check `/some-nonexistent-path/` — Cloudflare will serve a generic Cloudflare 404
      page, since **this repo has no custom `404.astro` yet** (Hugo's site has a
      trilingual `layouts/404.html`; nothing built here replicates it). Not a deploy
      blocker, but flag it — a bare Cloudflare 404 is a worse experience than Hugo's
      current one and should get a follow-up ticket, not silent acceptance.

## Step 7 — Custom domain and DNS cutover

**Do this only after Step 6's checklist is fully green.** This is the point of no
return for traffic, so don't rush it.

1. In the Pages project → **Custom domains** → add `ppmedenhaag.nl` and `www.ppmedenhaag.nl`
   (confirm with the site owner which one is canonical and whether the other should
   redirect — this isn't specified in the migration docs and shouldn't be assumed).
2. If the domain's DNS is already on Cloudflare, adding the custom domain in Pages can
   provision the DNS record automatically — review it before accepting.
3. If DNS is still hosted elsewhere (e.g. at the registrar, or pointed at Netlify),
   you'll need to either transfer the zone to Cloudflare or add the CNAME/records
   Cloudflare gives you at the current DNS host.
4. Wait for DNS propagation and re-run the Step 6 checklist against the **real domain**,
   not just the `.pages.dev` preview URL — some behaviors (redirects, headers, canonical
   URLs) can differ once a custom domain is attached.

## Step 8 — Decommission Netlify

Only after the custom domain is confirmed live and stable:

- Remove the Netlify site (or at minimum disable its deploys) so there's no confusion
  about which host is authoritative.
- Confirm `netlify.toml` in the Hugo source repo is no longer relied upon anywhere
  (informational at this point — the Astro repo never had one).

## Rollback

Cloudflare Pages keeps every previous deployment. If something breaks post-cutover:

1. **Workers & Pages** → the project → **Deployments** → find the last known-good
   deployment → **Rollback to this deployment**. This is instant and doesn't require a
   new git push.
2. If the problem is DNS-level rather than build-level, that's a separate revert (point
   DNS back at Netlify) — only needed if Cloudflare itself is unreachable, not for
   ordinary content/build bugs.

## Open items not covered by this runbook

- No `404.astro` page exists yet (noted in Step 6) — building a trilingual one
  mirroring Hugo's `layouts/404.html` is a separate task.
- No CI step runs `npm run build` on pull requests yet — Cloudflare's own preview
  deployments cover this for now, but a dedicated GitHub Actions check would catch
  build breaks before merge rather than only on deploy.
- DNS record specifics (which registrar, current nameservers) weren't available in
  this repo or `.migration/` and need to be gathered from whoever manages
  `ppmedenhaag.nl`'s DNS today before Step 7 can actually be executed.
