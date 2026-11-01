import { getCollection, type CollectionEntry } from "astro:content";

type Dated = { data: { pubDate: Date; featured: boolean } };

export const byNewest = (a: Dated, b: Dated) => b.data.pubDate.getTime() - a.data.pubDate.getTime();

export const featuredFirst = (a: Dated, b: Dated) =>
  a.data.featured === b.data.featured ? byNewest(a, b) : a.data.featured ? -1 : 1;

/** Published (non-draft) blog posts, newest first. */
export const getPublishedPosts = async (): Promise<CollectionEntry<"blog">[]> =>
  (await getCollection("blog", ({ data }) => !data.draft)).sort(byNewest);

/** Published case studies, newest first. */
export const getPublishedCaseStudies = async (): Promise<CollectionEntry<"caseStudies">[]> =>
  (await getCollection("caseStudies", ({ data }) => !data.draft)).sort(byNewest);

/** Published videos, newest first. Pass `indexable: true` to drop `noindex` placeholders. */
export const getPublishedVideos = async ({ indexable = false } = {}): Promise<CollectionEntry<"videos">[]> =>
  (await getCollection("videos", ({ data }) => !data.draft && (!indexable || !data.noindex))).sort(byNewest);
