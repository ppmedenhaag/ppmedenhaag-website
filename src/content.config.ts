import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob, file } from "astro/loaders";

// Field names/optionality verified against real front matter in
// ppmedenhaag-website's content/{nederland,indonesia,english}/event and /blog
// (see .migration/02-content-migration.md in that repo).

const eventSchema = z.object({
  title: z.string(),
  publishDate: z.coerce.date().optional(),
  date: z.coerce.date(),
  duration: z.string().optional(),
  draft: z.boolean().default(false),
  bg_image: z.string().optional(),
  /**
   * Required one- or two-sentence summary (what, who, highlights; no greeting, no date: the date is shown next to it).
   * It is the event card text AND the meta/og/twitter description, JSON-LD Event.description, RSS item and calendar
   * notes: nothing is derived from the body any more. Max 160 chars so search results show it whole.
   */
  description: z
    .string()
    .trim()
    .min(40, "event `description` is required: one or two sentences summarising the event (40-160 characters)")
    .max(160, "event `description` is too long: keep it at most 160 characters (it is the card text and the search snippet)"),
  image: z.string().optional(),
  /** Optional override for the link-preview (Open Graph) image; defaults to `image`. */
  social_image: z.string().optional(),
  /** Language of the text when it differs from the folder/URL locale (drives <html lang>, og:locale, JSON-LD inLanguage). */
  contentLang: z.enum(["nl", "id", "en"]).optional(),
  location: z.string().optional(),
  speaker: z
    .array(
      z.object({
        name: z.string(),
        image: z.string(),
        // Optional: confirmed omitted on some real entries (e.g. maulid-nabi-1445 (en)).
        designation: z.string().optional(),
      }),
    )
    .optional(),
});

// Post-shaped front matter (Hugo `type: "post"`), shared by ibadah, about and dakwah: description optional there.
const postSchema = z.object({
  title: z.string(),
  draft: z.boolean().default(false),
  date: z.coerce.date(),
  description: z.string().optional().default(""),
  image: z.string().optional(),
  social_image: z.string().optional(),
  contentLang: z.enum(["nl", "id", "en"]).optional(),
  author: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// Blog posts: same shape, but the description is required (it is the card text and the search snippet).
const blogSchema = postSchema.extend({
  /**
   * Required one- or two-sentence summary of the post (no greeting). Like events: it is the post card text AND the
   * meta/og/twitter description, JSON-LD description and RSS item; nothing is derived from the body. Max 160 chars.
   */
  description: z
    .string()
    .trim()
    .min(40, "blog `description` is required: one or two sentences summarising the post (40-160 characters)")
    .max(160, "blog `description` is too long: keep it at most 160 characters (it is the card text and the search snippet)"),
});

// Entries live at src/content/<section>/<locale>/<slug>.md — id becomes
// "<locale>/<slug>", exactly preserving the Hugo filename as the slug.
// See .migration/02-content-migration.md ("Revision 2026-08-19") for why one
// collection per section (not one per section+locale) was chosen.
//
// NOTE: this must stay generic (<TSchema>), not a `typeof eventSchema | typeof
// blogSchema` union parameter — a union parameter made TypeScript infer the same
// merged/unioned `data` type for both collections instead of each one's own
// distinct shape, breaking `entry.data.speaker` / `.location` / `.author` etc.
// across both call sites.
function sectionCollection<TSchema extends ReturnType<typeof z.object>>(
  section: "event" | "blog" | "ibadah" | "about" | "dakwah",
  schema: TSchema,
) {
  return defineCollection({
    loader: glob({
      // Excludes _index.md — that's the section-overview page (e.g. about/_index.md),
      // handled separately by the aboutOverview collection below since it has a
      // different front matter shape (no date/author/type) and one entry per locale.
      pattern: "*/[^_]*.md",
      base: `./src/content/${section}`,
      generateId: ({ entry }) => entry.replace(/\.md$/, ""),
    }),
    schema,
  });
}

// Mirrors content/<locale>/about/_index.md — the Hugo section-overview page rendered
// by layouts/about/list.html ("Overzicht" in the Navbar). Distinct from the `about`
// collection (about-1.md / "Lidmaatschap") which uses the single-page `post`-shaped
// front matter via sectionCollection above.
const aboutOverviewSchema = z.object({
  title: z.string(),
  draft: z.boolean().default(false),
  bg_image: z.string().optional(),
  description: z.string().optional().default(""),
  image: z.string().optional(),
  social_image: z.string().optional(),
});

function overviewCollection(section: "about" | "dakwah") {
  return defineCollection({
    loader: glob({
      pattern: "*/_index.md",
      base: `./src/content/${section}`,
      generateId: ({ entry }) => entry.replace(/\/_index\.md$/, ""),
    }),
    schema: aboutOverviewSchema,
  });
}
const aboutOverview = overviewCollection("about");

// Mirrors data/<locale>/homepage.yml in the Hugo source (see
// .migration/06-data-i18n-strings.md for the key-by-key usage audit this schema is
// based on). `course`/`shodaqoh`/`slider`/`vision_mission` are genuinely absent from
// some locales' files (not a schema gap) — kept optional to reflect that honestly
// rather than padding the source YAML to satisfy a stricter schema.
const homepageSchema = z.object({
  slider: z
    .object({
      enable: z.boolean(),
      bg_image: z.string().optional(),
      slider_item: z
        .array(
          z.object({
            title: z.string(),
            content: z.string(),
            animation_in: z.string().optional(),
            animation_out: z.string().optional(),
            button: z.object({
              enable: z.boolean(),
              label: z.string(),
              link: z.string(),
            }),
          }),
        )
        .optional(),
    })
    .optional(),
  about: z.object({
    enable: z.boolean(),
    title: z.string(),
    image: z.string(),
    content: z.string(),
    button: z.object({
      enable: z.boolean(),
      label: z.string(),
      link: z.string(),
    }),
  }),
  course: z.object({ enable: z.boolean(), title: z.string().optional() }).optional(),
  shodaqoh: z.object({ enable: z.boolean(), title: z.string() }).optional(),
  cta: z.object({
    enable: z.boolean(),
    subtitle: z.string(),
    title: z.string(),
    button: z.object({
      enable: z.boolean(),
      label: z.string(),
      link: z.string(),
    }),
    youtube: z.object({
      enable: z.boolean(),
      title: z.string().optional(),
      id: z.string().optional(),
    }),
    img: z.object({
      enable: z.boolean(),
      src: z.string(),
      desc: z.string(),
    }),
  }),
  prayer_times: z.object({ enable: z.boolean() }),
  vision_mission: z
    .object({
      enable: z.boolean(),
      bg_image: z.string().optional(),
      vision_title: z.string(),
      mission_title: z.string(),
      vision: z.string(),
      mission: z.string(),
    })
    .optional(),
  event: z.object({ enable: z.boolean(), title: z.string() }),
  funfacts: z
    .object({
      enable: z.boolean(),
      // `since: "YYYY-MM-DD"` instead of `count`: whole years since that date, computed at build time (never stale).
      funfact_item: z.array(
        z
          .object({ name: z.string(), count: z.string().optional(), since: z.coerce.date().optional() })
          .refine((i) => i.count || i.since, { message: "funfact_item needs `count` or `since`" }),
      ),
    })
    .optional(),
  blog: z.object({ enable: z.boolean(), title: z.string() }),
});

function homepageCollection(locale: "nl" | "id" | "en") {
  return defineCollection({
    loader: file(`./src/data/${locale}/homepage.yml`),
    schema: homepageSchema,
  });
}

export const collections = {
  event: sectionCollection("event", eventSchema),
  blog: sectionCollection("blog", blogSchema),
  // Same front matter shape as blog (both are Hugo `type: "post"` content) — reusing
  // postSchema (blogSchema minus the required description) rather than duplicating it. See CLAUDE.md's "ibadah ... not yet ported"
  // gap list; these 5 pages (toetreden-islam, sadaqah, geboorte, overlijden,
  // islamitisch-trouwen) are the Navbar's "Ibadah" submenu targets.
  ibadah: sectionCollection("ibadah", postSchema),
  // Same front matter shape as blog/ibadah ("post"-style) — about-1.md ("Lidmaatschap").
  about: sectionCollection("about", postSchema),
  "about-overview": aboutOverview,
  // Dakwah: same shapes as about (post-style entries + per-locale _index overview).
  dakwah: sectionCollection("dakwah", postSchema),
  "dakwah-overview": overviewCollection("dakwah"),
  "homepage-nl": homepageCollection("nl"),
  "homepage-id": homepageCollection("id"),
  "homepage-en": homepageCollection("en"),
};
