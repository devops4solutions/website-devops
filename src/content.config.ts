import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Pinned in frontmatter so renaming a file never changes a published URL.
// The glob loader uses `slug` as the entry id.
const slug = z.string().regex(/^[a-z0-9_-]+$/, "slug must be lowercase letters, digits, - or _");

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/data/blog" }),
  schema: z.object({
    slug,
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("Nidhi Gupta"),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    readingTime: z.string().optional(),
    canonicalUrl: z.url().optional(),
  }),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/data/case-studies" }),
  schema: ({ image }) => z.object({
    slug,
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    clientType: z.string().optional(),
    industry: z.string().optional(),
    services: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),
    challenge: z.string(),
    solution: z.string(),
    outcome: z.string(),
    image: image().optional(),
    imageAlt: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const videos = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/data/videos" }),
  schema: z.object({
    slug,
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    youtubeId: z.string(),
    videoType: z.enum(["short", "video"]),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    noindex: z.boolean().default(false),
    duration: z.string().optional(),
  }),
});

export const collections = {
  blog,
  caseStudies,
  videos,
};
