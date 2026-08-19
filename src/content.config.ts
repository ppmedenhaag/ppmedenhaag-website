import { defineCollection, z } from "astro:content";
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
  description: z.string().optional().default(""),
  image: z.string().optional(),
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

const blogSchema = z.object({
  title: z.string(),
  draft: z.boolean().default(false),
  date: z.coerce.date(),
  description: z.string().optional().default(""),
  image: z.string().optional(),
  author: z.string().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
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
  section: "event" | "blog" | "ibadah" | "about",
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
});

const aboutOverview = defineCollection({
  loader: glob({
    pattern: "*/_index.md",
    base: "./src/content/about",
    generateId: ({ entry }) => entry.replace(/\/_index\.md$/, ""),
  }),
  schema: aboutOverviewSchema,
});

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
  prayer_times: z.object({ enable: z.boolean(), link: z.url() }),
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
      funfact_item: z.array(z.object({ name: z.string(), count: z.string() })),
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
  // blogSchema rather than duplicating it. See CLAUDE.md's "ibadah ... not yet ported"
  // gap list; these 5 pages (toetreden-islam, sadaqah, geboorte, overlijden,
  // islamitisch-trouwen) are the Navbar's "Ibadah" submenu targets.
  ibadah: sectionCollection("ibadah", blogSchema),
  // Same front matter shape as blog/ibadah ("post"-style) — about-1.md ("Lidmaatschap").
  about: sectionCollection("about", blogSchema),
  "about-overview": aboutOverview,
  "homepage-nl": homepageCollection("nl"),
  "homepage-id": homepageCollection("id"),
  "homepage-en": homepageCollection("en"),
};
