import type { APIRoute, GetStaticPaths } from "astro";
import { getPublishedCaseStudies, getPublishedPosts } from "../../lib/content/queries";
import { renderOgImage, type OgImageOptions } from "../../lib/seo/og-image";

// Emits /og/default.png, /og/blog/<id>.png and /og/case-studies/<id>.png at build time.
export const getStaticPaths = (async () => {
  const posts = await getPublishedPosts();
  const caseStudies = await getPublishedCaseStudies();

  return [
    { params: { route: "default" }, props: { title: "Scalable Cloud Platforms, Built for Production", eyebrow: "Enterprise AWS & DevOps" } },
    { params: { route: "consulting" }, props: { title: "Work with an AWS & DevOps architect", eyebrow: "Consulting & mentoring" } },
    ...posts.map((post) => ({
      params: { route: `blog/${post.id}` },
      props: { title: post.data.title, eyebrow: post.data.category },
    })),
    ...caseStudies.map((item) => ({
      params: { route: `case-studies/${item.id}` },
      props: { title: item.data.title, eyebrow: "Case Study" },
    })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgImage(props as OgImageOptions);
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
