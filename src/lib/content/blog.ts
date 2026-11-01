import type { CollectionEntry } from "astro:content";
import { slugify } from "../../utils/content";

type Post = CollectionEntry<"blog">;

const WORDS_PER_MINUTE = 220;

/** Reading time from the raw post body, e.g. "6 min read". Frontmatter `readingTime` overrides it. */
export const readingTime = (post: Post): string => {
  if (post.data.readingTime) return post.data.readingTime.replace(/(\d+)\s*min$/, "$1 min read");
  const text = (post.body ?? "")
    .replace(/^import .*$/gm, "") // MDX imports
    .replace(/<[^>]+>/g, " ") // MDX/HTML tags
    .replace(/[#*_>`|-]/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / WORDS_PER_MINUTE))} min read`;
};

/**
 * Related posts ranked by shared tags (2 points each) and same category (1 point),
 * newest first on ties. Only posts sharing at least one tag are returned.
 */
export const relatedPosts = (post: Post, all: Post[], limit = 3): Post[] => {
  const tags = new Set(post.data.tags.map(slugify));
  return all
    .filter((other) => other.id !== post.id)
    .map((other) => {
      const shared = other.data.tags.filter((tag) => tags.has(slugify(tag))).length;
      const score = shared * 2 + (other.data.category === post.data.category ? 1 : 0);
      return { other, shared, score };
    })
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.score - a.score || b.other.data.pubDate.getTime() - a.other.data.pubDate.getTime())
    .slice(0, limit)
    .map(({ other }) => other);
};

/** All tags with post counts, sorted by count then name. */
export const tagCounts = (posts: Post[]) => {
  const counts = new Map<string, { tag: string; slug: string; count: number }>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      const slug = slugify(tag);
      const entry = counts.get(slug) ?? { tag, slug, count: 0 };
      entry.count++;
      counts.set(slug, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
};

/** GitHub "edit this file" URL for a content entry. */
export const editUrl = (filePath: string | undefined, repo: { url: string; branch: string }) =>
  filePath ? `${repo.url}/edit/${repo.branch}/${filePath.replace(/^\.\//, "")}` : undefined;

/** Splits posts into pages of `perPage`. Always returns at least one (possibly empty) page. */
export const paginate = <T>(items: T[], perPage: number): T[][] => {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  return pages.length ? pages : [[]];
};

/** Page 1 lives at the section's main URL; later pages at <base>/page/<n>.html. */
export const pageUrl = (base: string, page: number) => (page === 1 ? `${base}.html` : `${base}/page/${page}.html`);
