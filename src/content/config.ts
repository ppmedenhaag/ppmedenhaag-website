import { defineCollection, z } from 'astro:content';

const events = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.coerce.date(),
        image: z.string().optional(),
        author: z.string().optional(),
        categories: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        draft: z.boolean().optional(),
    }),
});

export const collections = {
    events,
};
