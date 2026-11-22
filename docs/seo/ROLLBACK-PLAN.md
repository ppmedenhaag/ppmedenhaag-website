# Rollback plan: www.ppmedenhaag.nl + ppmedenhaag.nl back to Netlify (Hugo)

Written 2026-11-21, right after the cutover (`fa15e71`). Companion to `CUTOVER-CHECKLIST.md`.
Steps marked **(owner)** need the Cloudflare / GitHub / Netlify dashboards.

## When to roll back

Roll back only for a problem that cannot be fixed with a quick redeploy, for example:
- the site is down or serving errors on www/apex and a redeploy does not fix it;
- the contact form, donation box or a core page is broken in a way that hurts people now;
- a Cloudflare certificate / custom-domain problem that persists beyond ~30 min.

Content or SEO bugs (wrong title, missing redirect, bad canonical) are **not** reasons to roll back: fix forward
(`public/_redirects`, push to `main`, ~1.5 min deploy). A rollback costs another DNS flip and more search-engine churn.

## What the old setup was (the state to restore)

| Name | Type | Content | Proxy | TTL |
|---|---|---|---|---|
| `www` | CNAME | `ppmedenhaag.netlify.app` | DNS only | 5 min |
| `@` (ppmedenhaag.nl) | A | `75.2.60.5` | DNS only | 5 min |

Do not touch: the 5 `MX`, SPF `TXT`, both `google-site-verification` TXT, `sa-verify` TXT, `sholat`, `tpa`, `event`, `website-v2`.
The Netlify site (Hugo, repo `../ppmedenhaag-website`) must still be there and still list `www.ppmedenhaag.nl` and
`ppmedenhaag.nl` under Domain management. **Do not delete the Netlify site or team for ≥ 2 weeks after cutover**
(`sholat` lives there too).

## Steps (about 15 min; order matters)

1. **(owner) Detach the domains from the Worker first.** Cloudflare refuses to create a `www`/apex DNS record while the
   Worker's custom domain owns that name.
   Cloudflare → Workers & Pages → `ppme-website` → Settings → Domains & Routes → delete `www.ppmedenhaag.nl` and
   `ppmedenhaag.nl` (leave `website-v2.ppmedenhaag.nl`). Deleting the custom domain also removes its auto-created DNS record.
   If a `www` or `@` record is still listed under DNS → Records afterwards, delete it.
2. **(owner) Re-create the two Netlify records** (table above): `www CNAME ppmedenhaag.netlify.app` and
   `@ A 75.2.60.5`, both **DNS only** (grey cloud), TTL 5 min.
3. **(owner) Check Netlify** → Site configuration → Domain management: both domains show as verified and HTTPS is
   active. If the certificate shows an error, click "Renew certificate" / "Verify DNS configuration".
4. **Stop the repo re-attaching the domains** (otherwise the next push to `main` re-adds them and takes DNS back):
   in `wrangler.jsonc` set `routes` back to
   ```jsonc
   "routes": [{ "pattern": "website-v2.ppmedenhaag.nl", "custom_domain": true }],
   ```
   and commit + push. (Do this right after step 1; the deploy only touches the website-v2 route.)
5. **(owner) GitHub → Settings → Secrets and variables → Actions → Variables:** delete `PUBLIC_SITE_URL` (or set it to
   `https://website-v2.ppmedenhaag.nl`). Staging builds then use the staging origin and the Worker keeps `noindex` on every
   host except www, so the Astro site cannot compete with the restored Hugo site. Push or re-run the workflow.
6. **Verify** (propagation is ~5 min thanks to the TTL; the old Cloudflare-served answers can linger in resolver caches up
   to the old TTL):
   - `curl -sI https://www.ppmedenhaag.nl/` → served by Netlify (`server: Netlify`), 200.
   - `curl -sI https://ppmedenhaag.nl/` → 301/redirect to www (as Hugo/Netlify did before).
   - `https://www.ppmedenhaag.nl/robots.txt` and `/sitemap.xml` are the Hugo ones.
   - `https://website-v2.ppmedenhaag.nl/` still 200 with `X-Robots-Tag: noindex, nofollow`.
   - The Hugo contact form still submits (Formspree `mvolqyea`, the same form the Astro site used).
7. **Search Console:** resubmit `https://www.ppmedenhaag.nl/sitemap.xml`; URL-inspect the homepage. Do not use
   "Change of address" (the host never changed).
8. **Write down why** it was rolled back in `PROGRESS.md` and fix the cause before trying again
   (re-run `CUTOVER-CHECKLIST.md` steps 6-9).

## Things that behave differently on a rollback

- **HSTS is already out in browsers.** The Worker sends `Strict-Transport-Security: max-age=31536000; includeSubDomains;
  preload` for www. After a rollback, browsers that saw it will refuse plain http for ppmedenhaag.nl **and all subdomains**
  for up to a year. Netlify serves https for `www`, apex, `sholat`, `tpa`, so this is fine **as long as every Netlify
  hostname keeps a valid certificate**. Check `sholat` and `tpa` still show valid HTTPS after the flip. Do not submit the
  domain to the HSTS preload list while a rollback is still possible.
- **Edge cache:** Cloudflare cached HTML for up to 1 h (`s-maxage=3600`). Once DNS points to Netlify (DNS only, not proxied)
  Cloudflare no longer serves www, so this does not matter for www/apex; it only affects website-v2.
- **Redirects:** Hugo/Netlify has its own `_redirects`/`netlify.toml` rules. The Astro-only ones (`public/_redirects`) stop
  applying. Short links like `/zakat/` come from Hugo `aliases:` and keep working on Netlify.
- **Indexing:** Google may have recrawled some pages from the Astro site (same URLs, so no ranking loss expected). IndexNow
  was pinged on deploy; after a rollback, content is the Hugo version again, which is a normal content change for crawlers.
- **Analytics:** both sites use the same Simple Analytics token (`sa-verify`), so stats continue unbroken.

## Rollback decision record

Fill in if used.

| Date/time | Who | Reason | Roll-forward plan |
|---|---|---|---|
| | | | |
