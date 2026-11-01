import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPublishedPosts } from "../lib/content/queries";
import { siteConfig } from "../config/site";

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();

  return rss({
    title: "DevOps4Solutions",
    description:
      "Enterprise AWS, DevOps, Terraform, cloud migration, and platform engineering insights.",
    site: context.site ?? "https://devops4solutions.com",
    customData: "<language>en-us</language>",
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}.html`,
      categories: [post.data.category, ...post.data.tags],
      author: `${siteConfig.email} (${post.data.author})`,
    })),
  });
}
