import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

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
  section: "event" | "blog",
  schema: TSchema,
) {
  return defineCollection({
    loader: glob({
      pattern: "*/[^_]*.md",
      base: `./src/content/${section}`,
      generateId: ({ entry }) => entry.replace(/\.md$/, ""),
    }),
    schema,
  });
}

export const collections = {
  event: sectionCollection("event", eventSchema),
  blog: sectionCollection("blog", blogSchema),
};
