# Homepage video (YouTube link on the homepage): plan

Status: **implemented 2026-11-27** with the default decisions (D1-D4 below). Owner steps: README, "Showing a YouTube
video on the homepage".

Implementation notes:
- `src/data/homepage-video.yml` holds `video: { youtube, until }` (the `file()` loader needs a top-level entry key).
- `until` must be quoted, `"YYYY-MM-DD HH:MM"`, Amsterdam time (`amsterdamTime()` in `utils/youtube.ts`); an unquoted
  YAML timestamp would be read as UTC, so the schema rejects it. An `until` already past at build time renders the plain image.
- Verified: homepage HTML unchanged with an empty link (apart from the new script); seven link forms parse, non-YouTube
  links and a bad `until` fail the build with a message naming the field; video mode renders in nl/id/en with localized
  labels, the flyer as poster and the hidden fallback image; desktop screenshot checked. Not tested in a real
  browser session: the click → player swap and Lighthouse (criteria 2 click, 4, 6, 8): check on the branch preview.

## Goal

Paste a YouTube link (a recording or a live stream) in **one place**, push, and the homepage shows that video in the
CTA band in all three languages. Remove the link and the CTA goes back to its image. No code change per use.

## Design (revised: not a copy of Hugo's)

### 1. One shared file, one line

New file `src/data/homepage-video.yml`:

```yaml
# Homepage video. Paste a YouTube link (watch?v=, youtu.be/, /live/, /shorts/) or a video ID.
# While set, the homepage CTA band shows this video instead of its image, in nl, id and en.
# Title, subtitle and button keep coming from the cta: block in src/data/<locale>/homepage.yml.
# Empty = normal CTA image.
youtube: ""

# Optional: after this time (Amsterdam time) visitors see the CTA image again, even if nobody removes the link.
# until: 2026-11-28T19:00
```

Why this shape instead of Hugo's `cta.youtube: { enable, title, id }` in every `homepage.yml`:

| | Hugo-style (`cta.youtube` per locale) | Shared file (proposed) |
|---|---|---|
| Edits to switch on | 3 files × 2 keys (`enable`, `id`), plus `img.enable: false` in Hugo | **1 line** |
| Risk of languages getting out of step | Real (one file forgotten) | None; a YouTube ID has no language |
| Placeholder noise | A dead `youtube:` block in every active and commented CTA | None |
| Forgotten after the event | Stays on until someone notices | Optional `until` switches back by itself |
| Per-language video | Possible | Not possible (never needed so far; can be added later as an override) |

### 2. Validation at build time

- The value is parsed by `parseYouTubeId()` (bare 11-char ID; `youtube.com/watch?v=`, `youtu.be/`, `/live/`,
  `/shorts/`, `/embed/`; with or without `www.`/`m.`/`-nocookie`; extra parameters like `?si=` or `&t=` ignored).
- A non-empty value that cannot be parsed **fails the build** with a message naming the file, so a broken embed
  never ships. `until` must be a valid date-time.
- Loaded as a `file()` content collection (like `homepage-<locale>`) with a zod schema, or as a plain YAML import
  validated in a small `src/data/homepage-video.ts`. The collection is preferred: same pattern as the homepage data.

### 3. Rendering: click-to-play poster

`src/components/HomepageVideo.astro`, used by `Homepage.astro` in place of the CTA `<Img>` when a video is set:

- A 16:9 box in the CTA image's frame (`max-w-xl border border-white/20`) showing a poster and a brand-styled play
  button. It is an `<a href="https://www.youtube.com/watch?v=<id>">`, so it works without JavaScript.
- Poster = the CTA image if the active CTA has one (local file, srcset via `<Img>`, no request to Google on page load),
  otherwise `https://i.ytimg.com/vi/<id>/hqdefault.jpg`.
- On click, a few lines of script (a `[data-youtube]` behaviour in `Layout.astro`, like `[data-copy]`/`[data-expires]`)
  swap in `https://www.youtube-nocookie.com/embed/<id>?autoplay=1` with the `allow` list already used by the
  22 content iframes, and move focus into it. A click is needed anyway: browsers block autoplay with sound.
- Accessible name: localized "Play video" (new `ui.ts` key in nl/id/en) + the locale's `cta.title`.
- `until`: the video carries `data-expires="<until>"` (the existing behaviour removes it once the time has passed) and
  the CTA image is rendered next to it, hidden, and revealed by the same script when the video is removed. Without
  `until`, the image is not rendered at all.

Why not a plain iframe like Hugo: it loads roughly 0.5-1 MB of YouTube player code on the busiest page for every
visitor, including those who never press play, and it sets YouTube cookies on load.

Why not a package: `@astro-community/astro-embed-youtube` (0.5.10, wraps `lite-youtube-embed`) does the same job,
but its last release is from January 2026, before Astro 7 (this site is on `astro ^7.2.4`), and it pins
`lite-youtube-embed ^0.3.4` while 0.4.0 is out. About 60 lines of our own code are cheaper to keep working and to style.

### 4. Remove the Hugo leftovers

Delete `cta.youtube` from `homepageSchema` (`src/content.config.ts` L169-173) and the `youtube:` blocks from the
active and commented CTAs in `src/data/{nl,id,en}/homepage.yml`. They are a placeholder for a feature that never
rendered, and leaving them next to the new file would make it unclear which one counts.

## How fast it goes live (measured 2026-11-27)

- Deploy (`deploy.yml`) takes **~1.5-2 min** per push (last 5 runs: 1:15-1:52).
- The workflow purges the Cloudflare cache after each deploy: `CLOUDFLARE_ZONE_ID` is set and the step ran in
  the last deploy. So a YAML change is visible at the edge right after the deploy. Returning visitors' browsers may
  keep the old page for up to 5 min (`max-age=300`).
- `.yml` changes are not matched by `paths-ignore: **/*.md`, so a push deploys by itself.

So a commit is quick enough even during an event. Rejected for that reason:
- **Runtime switch** (Worker KV or a JSON fetched by the browser): no rebuild, but more code and a state that is not in git.
- **Build variable** (like `PUBLIC_BACKGROUND`): state hidden outside the repo, and changing a repo variable does not trigger a deploy.

Other alternatives considered:
- **Video on the event** (front matter `youtube:`, CTA picks it up from the linked event): the CTA is not always an
  event (the Umrah one was a blog post), and event bodies already embed videos as iframes.
- **YouTube's "current live stream of a channel" embed** (`embed/live_stream?channel=…`): it would not need the stream
  link in advance, but YouTube's support for it is patchy. A scheduled stream gets its `youtube.com/live/<id>` link
  when it is scheduled, so paste that.

## Files to touch

| File | Change |
|---|---|
| `src/data/homepage-video.yml` (new) | The file above, `youtube: ""`. |
| `src/utils/youtube.ts` (new) | `parseYouTubeId`, `embedUrl`, `watchUrl`, `thumbUrl`. |
| `src/content.config.ts` | New `homepageVideo` collection (`file()` loader, schema with the parse refinement and optional `until`); remove `cta.youtube`. |
| `src/components/HomepageVideo.astro` (new) | Poster link + `data-youtube` (+ `data-expires`) markup. |
| `src/components/Homepage.astro` | Video when set, else the CTA image as now; hidden image fallback when `until` is set. |
| `src/layouts/Layout.astro` (script) | `[data-youtube]` click handler; reveal the fallback image when an expired video is removed. |
| `src/data/ui.ts` | "Play video" key in nl/id/en. |
| `src/data/{nl,id,en}/homepage.yml` | Remove the `youtube:` blocks (active and commented). |
| `.claude/skills/ppme-event/scripts/event-status.mjs` | Print "Homepage video: off" or "on (<id>, until …)". |
| `.claude/skills/ppme-event/SKILL.md` §4 | How to switch the video on and off; suggest `until` = end of the event. |
| `CLAUDE.md` "Events and the homepage CTA" | One line pointing to `homepage-video.yml`. |

## Acceptance criteria

1. With `youtube: ""`, the three homepage HTML files are unchanged apart from whitespace (diff `dist/index.html`,
   `dist/id/index.html`, `dist/en/index.html` before/after).
2. A bare ID, a `youtu.be/…?si=…` link and a `youtube.com/live/…` link each build and show the poster in all three
   languages; click plays inline; with JS off the link opens YouTube.
3. `youtube: "nonsense"` or an invalid `until` fails `npm run build` with a message naming `homepage-video.yml`.
4. With a CTA image present, no request goes to YouTube/Google before the click (DevTools network tab).
5. `until` in the past (test in the browser by setting it a minute ahead): the video disappears and the CTA image shows.
6. Keyboard: Tab reaches the play control, Enter plays it, focus ring visible; localized accessible name.
7. `npm run build` from the upper-case path ends with `[seo-audit] OK`; `npm run test:worker` passes.
8. Lighthouse mobile on `/` with the video on: performance within a few points of image mode.

## Owner decisions (defaults used if there is no answer)

| # | Question | Default |
|---|---|---|
| D1 | One shared link for all languages, or a separate link per language? | **Shared** |
| D2 | Video in the CTA band (under its title, above its button), or its own band above the CTA? | **In the CTA band** |
| D3 | Poster: the CTA image, or YouTube's thumbnail? | **CTA image**, thumbnail if there is none |
| D4 | Build the optional `until` switch-back? | **Yes** |

## Timing note

Istigotsah Akbar 2026 is on **Saturday 28 November 2026**; in 2023 the Hugo video CTA was first used for this
event's live stream. Implementation is about an hour plus a build.

## How to resume

1. Read this file. Implement the "Files to touch" table top to bottom; `npx astro sync` after the schema change.
2. Build with `youtube: ""` and diff the homepage HTML (criterion 1), then test 2-6 by temporarily setting a link
   (revert unless the owner wants it on).
3. Update the ppme-event skill and `CLAUDE.md`, mark this file **implemented**, commit on a branch (preview via
   `preview.yml`), open a PR.
