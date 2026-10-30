import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      cardLine: z.string(),
      dates: z.string(),
      year: z.string(),
      role: z.string(),
      team: z.string().optional(),
      result: z.string().optional(),
      status: z.string().optional(),
      category: z.array(z.enum(['featured', 'web', 'systems', 'research', 'games'])),
      order: z.number(),
      stack: z.array(z.string()),
      metrics: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
      links: z.array(z.object({ label: z.string(), href: z.string().url() })).default([]),
      cover: image().optional(),
      figure: z.string().optional(),
      archive: z.boolean().default(false),
    }),
});

export const collections = { projects };
