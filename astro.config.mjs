import { readdirSync, readFileSync } from "node:fs";
import { defineConfig, envField } from "astro/config";
import { loadEnv } from "vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { features } from "./src/config/site.ts";

const SITE = "https://devops4solutions.com";

// Video pages flagged `noindex: true` (placeholder metadata) stay live but are left out of the sitemap.
const VIDEOS_DIR = "./src/data/videos";
const noindexVideoPaths = new Set(
	readdirSync(VIDEOS_DIR)
		.map((file) => readFileSync(`${VIDEOS_DIR}/${file}`, "utf8"))
		.filter((source) => /^noindex:\s*true\b/m.test(source))
		.map((source) => `/videos/${source.match(/^slug:\s*"?([^"\s]+)"?/m)?.[1]}`),
);

// Pages that exist but are switched off by a feature flag stay out of the sitemap (they are also noindex),
// as do pages that are never indexed, such as the form's thank-you page.
const flaggedOffPaths = new Set([
	...(features.consulting ? [] : ["/consulting"]),
	...(features.hireMe ? [] : ["/hire-me"]),
	...(features.pay ? [] : ["/pay"]),
	"/hire-me/thanks",
]);

// Content-Security-Policy, emitted by Astro as a <meta> tag on every page with hashes for each inline
// script. Third parties: Cal.com (booking pop-up), Stripe (hosted checkout, future Buy Buttons),
// Web3Forms + hCaptcha (project form), Giscus (comments), YouTube (videos) and the analytics provider
// configured in the environment. frame-ancestors can't be set in a <meta> tag, so it lives in the
// host's response headers (infra/cloudfront/security-headers-policy.json).
const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");
const analyticsOrigins = [
	env.PUBLIC_PLAUSIBLE_DOMAIN && new URL(env.PUBLIC_PLAUSIBLE_SCRIPT_URL || "https://plausible.io/js/script.js").origin,
	env.PUBLIC_UMAMI_WEBSITE_ID && env.PUBLIC_UMAMI_SCRIPT_URL && new URL(env.PUBLIC_UMAMI_SCRIPT_URL).origin,
].filter(Boolean);
const csp = {
	cal: ["https://app.cal.com", "https://cal.com"],
	stripe: ["https://js.stripe.com", "https://checkout.stripe.com"],
	web3forms: ["https://api.web3forms.com"],
	hcaptcha: ["https://web3forms.com", "https://hcaptcha.com", "https://*.hcaptcha.com"],
	giscus: ["https://giscus.app"],
	youtube: ["https://www.youtube-nocookie.com"],
	youtubeImages: ["https://img.youtube.com", "https://i.ytimg.com"],
};

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
			filter: (page) => {
				const path = new URL(page).pathname.replace(/\/$/, "");
				return !noindexVideoPaths.has(path) && !flaggedOffPaths.has(path);
			},
			serialize: (item) => ({ ...item, url: toPublishedUrl(item.url) }),
		}),
	],
	security: {
		csp: {
			scriptDirective: {
				// 'wasm-unsafe-eval' lets Pagefind's WebAssembly search run; it does not allow eval() of JavaScript.
				resources: ["'self'", "'wasm-unsafe-eval'", ...csp.cal, ...csp.stripe.slice(0, 1), ...csp.hcaptcha, ...csp.giscus, ...analyticsOrigins],
			},
			styleDirective: {
				// Shiki code highlighting and third-party widgets use inline styles.
				resources: ["'self'", "'unsafe-inline'", ...csp.hcaptcha, ...csp.giscus],
			},
			directives: [
				"default-src 'self'",
				`img-src 'self' data: ${csp.youtubeImages.join(" ")}`,
				"font-src 'self'",
				`connect-src 'self' ${[...csp.web3forms, ...csp.cal, ...csp.hcaptcha, ...analyticsOrigins].join(" ")}`,
				`frame-src ${[...csp.youtube, ...csp.giscus, ...csp.cal, ...csp.stripe, ...csp.hcaptcha].join(" ")}`,
				`form-action 'self' ${csp.web3forms.join(" ")}`,
				"base-uri 'self'",
				"object-src 'none'",
				"upgrade-insecure-requests",
			],
		},
	},
	env: {
		// All optional: the site builds without them, and each feature switches itself off when its variables are missing.
		schema: {
			PUBLIC_GISCUS_REPO: envField.string({ context: "client", access: "public", optional: true }),
			PUBLIC_GISCUS_REPO_ID: envField.string({ context: "client", access: "public", optional: true }),
			PUBLIC_GISCUS_CATEGORY: envField.string({ context: "client", access: "public", optional: true }),
			PUBLIC_GISCUS_CATEGORY_ID: envField.string({ context: "client", access: "public", optional: true }),
			PUBLIC_PLAUSIBLE_DOMAIN: envField.string({ context: "client", access: "public", optional: true }),
			PUBLIC_PLAUSIBLE_SCRIPT_URL: envField.string({ context: "client", access: "public", optional: true, default: "https://plausible.io/js/script.js" }),
			PUBLIC_UMAMI_WEBSITE_ID: envField.string({ context: "client", access: "public", optional: true }),
			PUBLIC_UMAMI_SCRIPT_URL: envField.string({ context: "client", access: "public", optional: true }),
		},
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
