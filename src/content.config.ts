import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const site = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/site' }),
  schema: z.object({
    disclaimer: z.string(),
    useCases: z.array(
      z.object({
        number: z.number(),
        title: z.string(),
        description: z.string(),
      }),
    ),
    whyCards: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    ),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    titleTag: z.string().max(70).optional(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    readingMinutes: z.number().default(5),
  }),
});

export const collections = { site, blog };
