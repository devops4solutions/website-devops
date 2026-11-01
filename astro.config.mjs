import { readdirSync, readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const SITE = "https://devops4solutions.com";

// Video pages flagged `noindex: true` (placeholder metadata) stay live but are left out of the sitemap.
const VIDEOS_DIR = "./src/data/videos";
const noindexVideoPaths = new Set(
	readdirSync(VIDEOS_DIR)
		.map((file) => readFileSync(`${VIDEOS_DIR}/${file}`, "utf8"))
		.filter((source) => /^noindex:\s*true\b/m.test(source))
		.map((source) => `/videos/${source.match(/^slug:\s*"?([^"\s]+)"?/m)?.[1]}`),
);

// Pages are built as /<path>.html (build.format "file") and the host only serves those paths,
// so sitemap URLs must carry the .html extension to match the canonical tags.
const toPublishedUrl = (url) => {
	const { pathname } = new URL(url);
	const path = pathname.replace(/\/$/, "");
	return path === "" ? `${SITE}/` : `${SITE}${path}.html`;
};

export default defineConfig({
	site: SITE,
	output: "static",
	trailingSlash: "never",
	build: {
		format: "file",
	},
	integrations: [
		mdx(),
		sitemap({
			filter: (page) => !noindexVideoPaths.has(new URL(page).pathname.replace(/\/$/, "")),
			serialize: (item) => ({ ...item, url: toPublishedUrl(item.url) }),
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
