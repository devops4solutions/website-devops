# devops4solutions.com — Codebase Review & Roadmap

_Reviewed 2026-11-01 against `main` @ `58c6e3d`. No source files were changed during this review._

_**Revision 2 (2026-11-01):** the newsletter is out of scope for now. Payments use hosted providers only (Cal.com's Stripe app, Stripe Invoices and Payment Links, Razorpay Payment Links), so there's no payments API and no webhooks until Phase 3. The only server endpoints needed before Phase 3 are the project-request form and its upload route._

**Contents**

1. [Current state (exploration)](#1-current-state)
2. [Requirements gap analysis](#2-requirements-gap-analysis)
3. [Code-quality review](#3-code-quality-review)
4. [Target architecture](#4-target-architecture)
5. [Phased roadmap](#5-phased-roadmap)
6. [Open questions](#6-open-questions--decisions-needed)

> **Most urgent finding:** the **live sitemap lists ~170 URLs that return HTTP 403** in production. See §3.1. This is hurting indexing today and should be fixed before anything else.

---

## 1. Current state

### 1.1 Stack and versions

| Item | Installed | Latest available | Notes |
|---|---|---|---|
| astro | 7.0.7 | 7.4.4 | minor upgrade, low risk |
| @astrojs/mdx | 7.0.2 | 8.1.2 | **major** available; stay on 7.x until Astro is upgraded and checked |
| @astrojs/sitemap | 3.7.3 | 3.7.4 | |
| @astrojs/rss | 4.0.19 | — | |
| tailwindcss / @tailwindcss/vite | 4.3.2 | 4.3.3 | Tailwind 4, CSS-first config |
| pagefind | 1.5.2 | 1.6.0 | runs after `astro build` |
| typescript | 6.0.3 | 7.0.2 | stay on 6.x for now (`@astrojs/check` compatibility) |
| Node (engines) | `>=22.12.0` | | |

No UI framework integration (React etc.) is installed. No adapter is installed, so the site is purely static.

### 1.2 Config

`astro.config.mjs`:

```js
site: "https://devops4solutions.com",
output: "static",
trailingSlash: "never",
build: { format: "file" },        // => /about.html, /blog/<id>.html
integrations: [mdx(), sitemap()],
vite: { plugins: [tailwindcss()] },
```

### 1.3 Hosting (observed from live response headers)

- **AWS S3 + CloudFront** (`server: AmazonS3`, `via: … cloudfront.net`).
- Only `*.html` paths resolve. Extensionless paths return **403** with an S3 XML body (for example `/about` → 403 and `/about.html` → 200).
- No custom 404 page is configured: unknown paths return S3's 403 XML, not `404.html`.
- There are no security headers (no HSTS, CSP, X-Content-Type-Options or Referrer-Policy).
- `www.` and the apex domain both return 200. Neither redirects to the other.
- The repo contains no deployment configuration (no `.github/workflows`, no IaC, no `wrangler`, `vercel` or `netlify` files). `dist/` is committed, which suggests a manual upload to S3.

### 1.4 Folder structure

```
src/
  components/
    common/    Breadcrumbs, Button, Container, Footer, Header, MobileMenu,
               NewsletterForm*, SEOHead, SectionHeading*, TechnologyBadge*
    content/   ArchitectureDiagram, BlogCard, Callout, CaseStudyCard,
               CodeComparison, KeyTakeaways
    search/    SearchBox
    video/     VideoCard, YouTubeEmbed
  content.config.ts         blog, caseStudies, videos
  data/
    blog/ (5 posts + 1 stray extensionless file)
    case-studies/ (3)
    videos/ (135)
    site.ts                 nav, footer, social links
  layouts/  BaseLayout, ContentLayout, BlogPostLayout, CaseStudyLayout
  pages/    index, about, services, contact, privacy, 404, rss.xml.js,
            blog/[id], blog/index, case-studies/[id], case-studies/index,
            categories/[category], tags/[tag], videos/[id], videos/index,
            search/index
  styles/global.css
  utils/content.ts          formatDate, slugify, toCanonical (unused)
templates/                  blog / case-study / video frontmatter templates
public/images/…             PNG/SVG assets, served unoptimised
```
`*` marks components that nothing uses.

### 1.5 Content collections (`src/content.config.ts`)

| Collection | Loader | Key fields | Notes |
|---|---|---|---|
| `blog` | glob `src/data/blog/**/*.{md,mdx}` | title, description, pubDate, updatedDate, author (string), category (free string), tags, image (string), featured, draft, readingTime (manual string), canonicalUrl | The ID comes from the **filename**. Renaming a file changes its URL. |
| `caseStudies` | glob `src/data/case-studies` | clientType, industry, services[], technologies[], challenge/solution/outcome (single strings) | No metrics field. Images are plain strings. |
| `videos` | glob `src/data/videos` | youtubeId, videoType (short/video), category, duration | Tied to YouTube. **131 of 135 entries are placeholders** with the same title, description and date. |

### 1.6 Routing and URL patterns (production, must be preserved)

| Pattern | Example |
|---|---|
| `/<page>.html` | `/about.html`, `/services.html`, `/contact.html`, `/privacy.html`, `/search.html` |
| `/blog.html`, `/blog/<id>.html` | `/blog/enterprise-aws-patch-automation.html` |
| `/case-studies.html`, `/case-studies/<id>.html` | |
| `/videos.html`, `/videos/<id>.html` | `/videos/video--Lb682ny5tY.html` |
| `/categories/<slug>.html`, `/tags/<slug>.html` | |
| `/rss.xml`, `/sitemap-index.xml`, `/sitemap-0.xml` | |

Canonical tags correctly point at the `.html` URLs, except the homepage, whose canonical is `/index.html` rather than `/`.

### 1.7 Styling

Tailwind 4 utility classes plus a small `global.css` (149 lines) containing design tokens, `.card`, `.eyebrow` and `.prose-content`. Several components still carry classes from an earlier **dark theme** (`text-white`, `text-slate-200/300`, `cyan-*`), which are now unreadable on the light theme (see §3.4).

### 1.8 Existing forms and scripts

- **Forms:** only the search form, which runs entirely in the browser. There is no contact or newsletter form; `contact.astro` is a `mailto:` link to a Gmail address. `NewsletterForm.astro` is a placeholder that nothing uses.
- **Client scripts:** SearchBox (an inline module that falls back to Pagefind), the video category filter, the blog list filter, and click-to-load YouTube embeds via `youtube-nocookie`. All are small, vanilla JavaScript.
- **Build scripts:** `build = astro build && pagefind --site dist`. There are no other scripts.

---

## 2. Requirements gap analysis

Legend: ✅ exists · 🟡 partial · ❌ missing · ⛔ blocker

| # | Requirement | Exists | Missing | Blocked by |
|---|---|---|---|---|
| 1a | Stable blog URLs | 🟡 `.html` URLs are live and the canonicals are correct | IDs are derived from filenames, nothing checks that URLs stay put, and the **sitemap contradicts the canonicals** | ⛔ Sitemap bug (§3.1). Moving off S3 needs `.html` parity |
| 1b | Giscus comments | ❌ | Component, GitHub Discussions setup | GitHub repo with Discussions enabled |
| 1c | "Was this helpful?" | ❌ | Widget that sends an analytics custom event straight from the browser (no API) | Analytics account |
| 1d | Code-block copy button | ❌ | Expressive Code or a small script | — |
| 1e | Related posts | 🟡 simple "any shared tag" match, no ranking | Scoring by tags and category, fallback to latest | — |
| 1f | Table of contents | ❌ | Build from `render(post).headings` | — |
| 1g | Share links | ❌ | Static links (LinkedIn, X, email, copy) | — |
| 1h | Pagefind search | ✅ build step and `/search.html` with a dev fallback | Indexes the 131 placeholder video pages, which add noise | — |
| 2 | Consulting page + Cal.com + Stripe | ❌ | `/consulting.html`, a session-types data file, the Cal.com embed (Cal.com's Stripe app takes payment; no code on your site) | Cal.com account and Stripe app connection |
| 3 | Project-request form → `/api/project-request` | ❌ | Form UI, API route, Turnstile, email sending, attachment storage | ⛔ **No adapter or server runtime**. Email provider and storage not chosen |
| 4 | Stripe / Razorpay / Pay an invoice | ❌ | A static `/pay.html` that explains invoice links and lists Stripe/Razorpay Payment Links. Stripe Invoices are created in the dashboard and emailed by Stripe | Stripe account. Razorpay KYC (if UPI is needed). **No API or webhooks needed until Phase 3** |
| 5 | Learning hub | 🟡 `videos` collection only (YouTube-specific) | courses, lessons, guides, labs, paths collections, `/learn` pages, filters | Course platform not chosen |
| 6 | Testimonials, case studies, about (newsletter **deferred**) | 🟡 case studies (3, thin) and about exist | Testimonials collection, a stronger About page | — |
| 7 | Legal: privacy, terms, refunds, cookies | 🟡 `privacy.astro` holds privacy and terms together. It **claims analytics and cookies the site doesn't use** and has several `<h1>`s | Separate terms, refunds and cookie pages. Consent approach | Final list of third-party services |
| 8 | SEO: sitemap, RSS, OG, Article/Course schema | 🟡 sitemap (**broken**), RSS ✅, BlogPosting / VideoObject / Breadcrumb schema, SVG OG images | PNG OG images, `Course` schema, fuller `Person`/`Organization`, fixed sitemap | Sitemap fix (§3.1) |
| 9 | Plausible / Umami | ❌ | Script plus custom events | Account choice |
| A | No sign-up or database now, easy to add later | ✅ (nothing exists) | A service layer (`src/lib/`) so a database plugs in behind interfaces | — |
| B | Static + server adapter | ❌ | Adapter, environment schema, `prerender = false` API routes | ⛔ Hosting decision (currently S3 + CloudFront) |
| C | All forms and webhooks via `/api/*` | ❌ | Before Phase 3 this is only the project-request form. Webhooks arrive in Phase 3 | Adapter |
| D | Email as the shared identifier | ❌ | `normalizeEmail()` for leads; use the same email on Stripe invoices and Cal.com bookings | — |
| E | Stable course and lesson IDs | ❌ | Explicit `slug`/`id` in frontmatter, `reference()` links between collections | — |
| F | React islands only where needed | ✅ none used | Add `@astrojs/react` only for the project-request form | — |

**The single biggest blocker:** the site has no server runtime. Before Phase 3, only requirement 3 (the project-request form) needs one. It still means choosing a host and adapter, and moving off plain S3 hosting **without changing any `.html` URL**.

---

## 3. Code-quality review

### 3.1 SEO — critical

1. **The sitemap lists URLs that return 403 in production.**
   - `@astrojs/sitemap` writes extensionless URLs (`/about`, `/blog/designing-scalable-aws-platforms`, …), but S3 only serves `*.html`.
   - Verified live: `curl https://devops4solutions.com/about` returns **403**.
   - Every sitemap entry except `/` points to an error page, and none of them match the canonical tags.
   - **Fix:** add a `serialize` option to `sitemap()` that appends `.html` and maps `/index` to `/`, then add a CI test that every sitemap URL resolves in `dist/`.
   - **Files:** `astro.config.mjs`.
2. **No 404 page is served.** CloudFront and S3 return 403 XML for unknown paths. **Fix:** configure the host's error page so 403/404 serve `/404.html` with a 404 status.
3. **The homepage canonical is `/index.html`.** Normalise it to `https://devops4solutions.com/` in `SEOHead.astro`.
4. **131 placeholder video pages.** They share the title "DevOps & AWS Video", the same description and the same date, which makes them duplicate, thin content. Either import the real metadata or `noindex` them and drop them from the sitemap and Pagefind.
5. **OG images are SVG.** LinkedIn, X, Facebook and Slack don't render SVG `og:image`. Generate 1200×630 PNGs at build time.
6. **Thin structured data.**
   - `Person` and `Organization` have no `url`, `sameAs`, `logo`, `jobTitle` or `image`.
   - `BlogPosting` has no `image` or `publisher`.
   - Case studies have no schema at all.
   - There's no `ProfessionalService` or `Service` schema for the business.
7. **Orphaned tag and category pages.** They're linked only from `/blog.html`'s sidebar. Post headers render tags as plain `<li>` elements, not links.
8. **www and apex duplicates.** Add a 301 redirect at the CDN.

### 3.2 Structure and reuse

- The "getCollection → filter drafts → sort by date" logic, with repeated `as CollectionEntry<…>[]` casts, is duplicated in about 10 pages. Move it into `src/lib/content/queries.ts` (`getPublishedPosts()`, `getPublishedVideos()` and so on). The casts are unnecessary because `getCollection` is already typed.
- `services.astro` is about 200 lines of hand-repeated HTML. Make it data-driven (a `services` collection) and give each service its own page.
- `site.ts` duplicates values that `contact.astro` and `about.astro` then hard-code anyway (email, social URLs).
- Nothing uses `SectionHeading`, `TechnologyBadge`, `NewsletterForm`, `toCanonical()` or the `technologies` array in `index.astro`.
- `ArchitectureDiagram` is a hard-coded generic diagram with no props for content.

### 3.3 TypeScript and schema design

- Strict mode is on, which is good.
- `rss.xml.js` is plain JavaScript; convert it to `.ts`.
- The schema imports `z` from `astro:content`. Newer Astro versions recommend `astro/zod`, and `z.string().url()` may be deprecated under Zod 4. Run `astro check` after upgrading to confirm.
- `category` and `tags` are free strings, so a typo silently creates a new category page. Use `z.enum([...])` for categories, or a `topics` data collection with `reference()`.
- `image` is `z.string()` rather than the schema `image()` helper, so Astro never optimises the images.
- `readingTime` is typed by hand. Compute it with a remark plugin.
- `author` is a string. Make it a `reference("authors")` if guest authors are likely, or drop it.
- Case-study `challenge`/`solution`/`outcome` are single frontmatter strings. Move narrative into the body and add a structured `metrics: [{label, before, after}]`.
- `videos.youtubeId` locks the collection to YouTube. Replace it with `video: { provider, id }` (§4.2).

### 3.4 Accessibility

- **Leftover dark-theme colours on a light background fail contrast:**
  - `Breadcrumbs.astro`: `text-slate-300` and `text-slate-100`, roughly 1.5:1, on every content page.
  - `Callout.astro`: heading `text-white`, body `text-slate-200`, which is effectively invisible.
  - `ArchitectureDiagram` figcaption: `text-slate-300`.
  - The empty state in `blog/index.astro`: `text-slate-300`.
- Service tile `alt` text repeats the heading text, so screen readers hear it twice. Use `alt=""`.
- The `privacy.astro` heading hierarchy has several `<h1>`s and jumps from h1 to h3.
- The mobile menu uses `<details>`, which works but leaves focus where it was when opened. That's acceptable.
- Good: there's a skip link, visible focus outlines, `prefers-reduced-motion` handling, `aria-pressed` on the video filters and `aria-live` on search.

### 3.5 Performance

| Issue | Impact | Fix |
|---|---|---|
| 6 service PNGs at 1.3–1.5 MB each, plus a 1.6 MB hero | The homepage downloads ~10 MB | Move to `src/assets/`, use `<Image>` / `<Picture>` (AVIF/WebP, responsive sizes) |
| The hero image has `loading="lazy"` | Delays the largest paint above the fold (LCP) | `loading="eager" fetchpriority="high"` |
| `/videos.html` renders 135 cards and thumbnails | A heavy page | Paginate or show only featured items, once the data is real |
| `font-family: Inter`, but Inter is never loaded | Falls back to a system font, so not a real cost | Self-host Inter with `@fontsource-variable/inter`, or declare a system font stack honestly |
| JavaScript shipped | Small, vanilla. Good | Keep it that way |

### 3.6 Security

- There are no secrets in the repo; good. Once an adapter exists, use `astro:env` with `access: "secret"` for server-only keys.
- **No security headers** at the CDN. Add HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a CSP that allows YouTube, Cal.com, Stripe, Giscus, Turnstile and analytics.
- `target="_blank"` links use `rel="noreferrer"`, which is fine.
- Search results insert Pagefind's `excerptHtml` without escaping. Pagefind escapes it, so the risk is low, but keep it in mind when the search UI changes.
- For future API routes: verify Turnstile on the server, rate-limit requests, enforce body and file-size limits, validate input with zod, and (from Phase 3) verify webhook signatures using the raw request body.

### 3.7 Repo hygiene

- `node_modules/`, `dist/`, `.astro/` and `.DS_Store` are **committed** despite `.gitignore`. Diffs become noisy, and old builds can be deployed by mistake.
- `src/data/blog/Reusable Infrastructure with Terraform Modules` has no extension and uses the wrong frontmatter keys (`publishDate`, `slug`). It's never loaded and is a near-duplicate of `reusable-infrastructure-with-terraform-modules.md`.
- `Designer.png` at the repo root duplicates `public/images/hero/Designer.png`.
- `public/images/case-studies/pacth1.svg` is unused and its name has a typo.
- There's no CI: no `astro check`, build, link check or URL-regression test.

---

## 4. Target architecture

### 4.1 Hosting and adapter — recommendation: **Cloudflare Workers + `@astrojs/cloudflare`**

| | Cloudflare | Vercel | Netlify |
|---|---|---|---|
| Turnstile | Built in | External | External |
| Attachment storage | R2 (no egress fees) | Vercel Blob | Netlify Blobs |
| Request body limit | 100 MB (free tier) | ~4.5 MB per function | ~6 MB |
| Rate limiting | Built-in WAF rules | Add-on or external | Limited |
| Postgres later | Neon/Supabase over HTTP, or Hyperdrive | Excellent | Good |
| Keeping `.html` URLs | Needs `html_handling` config (see risk) | Works by default (`cleanUrls: false`) | Works, but check "Pretty URLs" |
| Cost at this scale | Free to $5/mo | Free hobby tier (non-commercial terms) | Free tier |

With only the project-request form needing a server, the request body limit matters little: attachments upload straight to storage through a signed link, not through the function. Cloudflare is still the recommendation for Turnstile and R2, but Vercel and Netlify are viable.

**Risk: URLs.** Cloudflare's static-asset default (`html_handling: "auto-trailing-slash"`) redirects `/about.html` → `/about`. Set `assets.html_handling: "none"` in `wrangler.jsonc` and **test on a preview URL** that every URL in the snapshot returns 200 with no redirect before switching DNS.

**Alternative:** stay on AWS (S3 + CloudFront for static pages, Lambda behind CloudFront for `/api/*`), deployed with Terraform or SST. That fits your brand, but there's no official Astro AWS adapter, so it means more hand-built infrastructure. It's worth considering if you want the site itself to be a portfolio piece; otherwise Cloudflare is less work.

Config sketch:

```js
// astro.config.mjs
export default defineConfig({
  site: "https://devops4solutions.com",
  output: "static",                 // pages are prerendered by default
  adapter: cloudflare(),
  trailingSlash: "never",
  build: { format: "file" },        // KEEP: preserves /x.html URLs
  integrations: [
    expressiveCode(),               // must come before mdx()
    mdx(),
    sitemap({ serialize: toHtmlUrl }),
    react({ include: ["**/islands/**"] }),
  ],
  env: { schema: { /* see 4.4 */ } },
  vite: { plugins: [tailwindcss()] },
});
```

API routes opt out of prerendering individually with `export const prerender = false;`.

### 4.2 Folder structure

```
src/
  content.config.ts
  content/                         # rename from src/data/ (optional; keep paths stable)
    blog/  case-studies/  videos/
    courses/  lessons/<course-id>/  guides/  labs/  paths/
    testimonials/  services/  sessions/
  lib/
    config/site.ts                 # moved from data/site.ts
    content/queries.ts             # getPublished*, related scoring, reading time
    seo/schema.ts                  # JSON-LD builders: Article, Course, Person, Org, Service
    seo/og.ts                      # OG image generation
    identity/email.ts              # normalizeEmail()
    services/                      # ← the seam where a database plugs in later
      leads.ts                     #   recordLead()       (today: email)
      payments.ts                  #   Phase 3: recordPayment()
      bookings.ts                  #   Phase 3: recordBooking()
    integrations/
      turnstile.ts  mailer.ts  storage.ts
      stripe.ts  cal.ts  razorpay.ts   # Phase 3 (webhook verification, API lookups)
    http/                          # json(), badRequest(), rateLimit(), parseForm()
  components/
    common/ blog/ learn/ consulting/ forms/ seo/
    islands/                       # the ONLY place React lives
      ProjectRequestForm.tsx
  layouts/
  pages/
    api/
      project-request.ts           # Phase 1: the only form endpoint
      uploads/sign.ts              # Phase 1: signed attachment uploads
      health.ts
      webhooks/stripe.ts           # Phase 3
      webhooks/cal.ts              # Phase 3
      webhooks/razorpay.ts         # Phase 3, if Razorpay is used
      checkout/session.ts          # Phase 3: selling courses on the site
    consulting.astro  project-request.astro  pay.astro (static)
    learn/index.astro  learn/[type]/[id].astro  learn/paths/[id].astro
    legal/terms.astro  legal/refunds.astro  legal/cookies.astro
    …existing pages unchanged…
```

**Rule:** API routes only parse, validate and call `lib/services/*`. Only the service layer knows *where* data goes, so adding a database means changing `lib/services/*` and nothing else.

### 4.3 New and revised content collections (example schemas)

```ts
// src/content.config.ts (excerpt)
import { defineCollection, reference } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);       // stable, URL-safe
const topic = z.enum(["aws", "terraform", "kubernetes", "cicd", "observability", "migration", "security"]);
const level = z.enum(["beginner", "intermediate", "advanced"]);
const videoSource = z.object({
  provider: z.enum(["youtube", "bunny", "mux"]),
  id: z.string(),
  durationSec: z.number().int().optional(),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) => z.object({
    slug,                                  // REQUIRED: pins today's URL (glob loader uses it as id)
    title: z.string(), description: z.string().max(170),
    pubDate: z.coerce.date(), updatedDate: z.coerce.date().optional(),
    category: z.enum(["Architecture", "Operations", "Terraform", "Kubernetes"]),
    tags: z.array(z.string()).default([]),
    topics: z.array(topic).default([]),
    cover: image().optional(), coverAlt: z.string().optional(),
    featured: z.boolean().default(false), draft: z.boolean().default(false),
    comments: z.boolean().default(true),
    canonicalUrl: z.url().optional(),
  }),
});

const courses = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/courses" }),
  schema: ({ image }) => z.object({
    id: slug,                              // never changes, even if the title does
    title: z.string(), description: z.string(),
    topics: z.array(topic), level,
    cover: image(),
    status: z.enum(["coming-soon", "available", "retired"]),
    delivery: z.object({                   // Phase 2: external platform
      platform: z.enum(["teachable", "thinkific", "podia", "gumroad", "udemy", "self"]),
      url: z.url(),
      productId: z.string().optional(),   // that platform's ID, kept for later migration
    }),
    price: z.object({ amount: z.number(), currency: z.enum(["USD", "INR"]) }).optional(),
    durationHours: z.number().optional(),
    outcomes: z.array(z.string()),
    prerequisites: z.array(z.string()).default([]),
    instructor: z.string().default("nidhi-gupta"),
    pubDate: z.coerce.date(), updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/lessons" }),
  schema: z.object({
    id: slug,                              // stable lesson ID, unique across all courses
    course: reference("courses"),
    module: z.string(), order: z.number().int(),
    title: z.string(), summary: z.string().optional(),
    video: videoSource.optional(),
    preview: z.boolean().default(false),   // free preview vs. gated (gating needs auth, Phase 3)
    draft: z.boolean().default(false),
  }),
});

const videos = defineCollection({     // revised existing collection
  loader: glob({ pattern: "**/*.md", base: "./src/content/videos" }),
  schema: z.object({
    title: z.string(), description: z.string(),
    pubDate: z.coerce.date(),
    video: videoSource,                     // replaces youtubeId
    format: z.enum(["short", "video"]),
    topics: z.array(topic).default([]),
    tags: z.array(z.string()).default([]),
    noindex: z.boolean().default(false),    // for placeholder or low-value entries
    featured: z.boolean().default(false), draft: z.boolean().default(false),
  }),
});

const guides = defineCollection({     // guides + cheat sheets
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/guides" }),
  schema: ({ image }) => z.object({
    id: slug, title: z.string(), description: z.string(),
    kind: z.enum(["guide", "cheatsheet"]),
    topics: z.array(topic), level,
    download: z.string().optional(),        // PDF in public/ or R2
    cover: image().optional(),
    pubDate: z.coerce.date(), draft: z.boolean().default(false),
  }),
});

const labs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/labs" }),
  schema: z.object({
    id: slug, title: z.string(), description: z.string(),
    topics: z.array(topic), level,
    estMinutes: z.number().int(),
    repoUrl: z.url().optional(),
    costWarning: z.string().optional(),     // e.g. "creates billable AWS resources"
    pubDate: z.coerce.date(), draft: z.boolean().default(false),
  }),
});

const paths = defineCollection({      // learning paths
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/paths" }),
  schema: z.object({
    id: slug, title: z.string(), description: z.string(), level,
    steps: z.array(z.discriminatedUnion("type", [
      z.object({ type: z.literal("course"), ref: reference("courses") }),
      z.object({ type: z.literal("guide"),  ref: reference("guides") }),
      z.object({ type: z.literal("lab"),    ref: reference("labs") }),
      z.object({ type: z.literal("video"),  ref: reference("videos") }),
      z.object({ type: z.literal("post"),   ref: reference("blog") }),
    ])),
  }),
});

const testimonials = defineCollection({
  loader: file("src/content/testimonials.yaml"),
  schema: ({ image }) => z.object({
    id: slug,
    quote: z.string(), name: z.string(),
    role: z.string().optional(), company: z.string().optional(),
    avatar: image().optional(),
    context: z.enum(["consulting", "course", "mentoring"]),
    caseStudy: reference("caseStudies").optional(),
    consentToPublish: z.literal(true),      // forces you to confirm permission
    date: z.coerce.date(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
  schema: ({ image }) => z.object({
    id: slug, title: z.string(), summary: z.string(),
    icon: image().optional(), order: z.number(),
    offerings: z.array(z.object({ heading: z.string(), items: z.array(z.string()) })),
    relatedCaseStudies: z.array(reference("caseStudies")).default([]),
    cta: z.enum(["book-call", "project-request"]).default("book-call"),
  }),
});

const sessions = defineCollection({   // consulting session types
  loader: file("src/content/sessions.yaml"),
  schema: z.object({
    id: slug,                                 // "intro-30", "deep-dive-60", "mentoring", "advisory-monthly"
    title: z.string(), description: z.string(),
    durationMin: z.number().int().optional(),
    billing: z.enum(["one-off", "monthly"]),
    price: z.object({ amount: z.number(), currency: z.enum(["USD", "INR"]) }),
    calLink: z.string(),                      // e.g. "devops4solutions/deep-dive-60"
    includes: z.array(z.string()),
  }),
});
```

Case studies gain `slug`, `metrics: [{label, before, after}]`, `testimonial: reference("testimonials").optional()` and `cover: image()`.

### 4.4 API routes

All routes set `prerender = false`, return JSON, validate input with zod and apply the IP rate limit.

**Phase 1 (the only server code before accounts):**

| Route | Method | Purpose | Notes |
|---|---|---|---|
| `/api/project-request` | POST | Project-type, budget, timeline and description form | Verify Turnstile, check the honeypot field, normalise the email, then `leads.recordLead()` emails you and auto-replies to the client |
| `/api/uploads/sign` | POST | Return a temporary signed upload URL for an attachment | Allow-list of types (pdf, png, jpg, docx, zip), maximum 10 MB per file and 3 files. Turnstile token required |
| `/api/health` | GET | Uptime checks | |

**Why there's no payments API or webhooks before Phase 3:**
- **Consulting payments:** Cal.com's Stripe app collects payment at booking. The site only embeds Cal.com.
- **Deposits and milestones:** Stripe Invoices are created in the Stripe dashboard. Stripe emails the client a link to its hosted payment page. `/pay.html` is static: it explains this and can list fixed-price Stripe or Razorpay Payment Links.
- **Notifications:** Stripe and Cal.com already email you and the client for every payment and booking. A webhook would only duplicate those emails.
- **"Was this helpful?":** the browser sends an analytics custom event directly. No endpoint is needed.

**Phase 3 additions (when a database and accounts exist):**

| Route | Method | Purpose | Notes |
|---|---|---|---|
| `/api/webhooks/stripe` | POST | `checkout.session.completed`, `invoice.paid`, `charge.refunded` | Verify the signature against the raw body, record in `payments` |
| `/api/webhooks/cal` | POST | `BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_PAID` | Verify the HMAC with `CAL_WEBHOOK_SECRET`, record in `bookings` |
| `/api/webhooks/razorpay` | POST | If Razorpay is used | Same pattern as Stripe |
| `/api/checkout/session` | POST | Selling courses on the site | Stripe Checkout with the customer's email |

Webhooks become necessary only when your own system has to react to a payment: recording it in the database, granting course access, or linking it to an account. An `events(id PRIMARY KEY)` table makes each delivery process exactly once.

### 4.5 Environment variables (`astro:env` schema)

| Name | Context | Access | Purpose |
|---|---|---|---|
| `PUBLIC_SITE_URL` | client | public | Absolute URLs |
| `PUBLIC_TURNSTILE_SITE_KEY` | client | public | Turnstile widget |
| `TURNSTILE_SECRET_KEY` | server | secret | Verify Turnstile tokens on the server |
| `PUBLIC_ANALYTICS_DOMAIN` / `PUBLIC_UMAMI_WEBSITE_ID` | client | public | Analytics |
| `PUBLIC_GISCUS_REPO`, `PUBLIC_GISCUS_REPO_ID`, `PUBLIC_GISCUS_CATEGORY_ID` | client | public | Comments |
| `PUBLIC_CAL_USERNAME` | client | public | Cal.com embed |
| `RESEND_API_KEY` (or SES credentials) | server | secret | Project-request emails |
| `MAIL_FROM`, `MAIL_TO_OWNER` | server | public | e.g. `hello@devops4solutions.com` |
| R2 binding `UPLOADS` (Cloudflare) **or** `S3_*` keys | server | secret | Attachments |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | server | secret | **Phase 3 only** |
| `CAL_WEBHOOK_SECRET` | server | secret | **Phase 3 only** |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | server | secret | **Phase 3 only**, if Razorpay is used |
| `DATABASE_URL`, `AUTH_SECRET` | server | secret | **Phase 3 only** |

Payment Links and the Cal.com embed are public URLs. They can live in `src/lib/config/site.ts` or the `sessions` data file rather than in environment variables.

Commit an `.env.example`; never commit `.env`.

### 4.6 How sign-up and a database slot in later (no rewrite)

1. **Identity is already the email.** Every record created before Phase 3 (Stripe customers and invoices, Cal.com bookings, project-request leads) carries the client's email. Use the same email when you create Stripe invoices by hand. When accounts arrive, a user row joins to all of them by email.
2. **The service layer is the only seam.** `lib/services/leads.ts` gets a Postgres implementation (Drizzle ORM plus Neon or Supabase), and `payments.ts` and `bookings.ts` are added alongside it. The project-request route, pages and components stay the same.
3. **Content stays in git.** Courses and lessons keep their stable `id`s. The database only stores *relationships* (`enrollments(user_id, course_id)`, `progress(user_id, lesson_id)`), which reference those IDs. No content moves into the database.
4. **Pages stay static.** Account pages (`/account/*`) and any gated lesson pages opt into server rendering with `prerender = false`. Astro middleware (`src/middleware.ts`) checks the session only on those paths. Everything else stays prerendered and served from the CDN.
5. **Auth choice:**
   - **Better Auth** (my default): open source, your own Postgres, runs on Workers.
   - **Supabase Auth:** fastest if you also choose Supabase for the database.
   - **Clerk:** least code, but a vendor lock-in and per-user cost.
6. **Webhooks are introduced** with idempotency through the `events` table. Past payments and bookings are backfilled from the Stripe and Cal.com APIs by email.

---

## 5. Phased roadmap

Effort: **S** ≤ half a day · **M** 1–2 days · **L** 3+ days. 🔴 = can break existing URLs or SEO; needs verification.

### Phase 0 — Quick wins and fixes (~4–5 days)

| # | Item | Files | Effort | Risks |
|---|---|---|---|---|
| 0.1 | **Fix sitemap URLs** to `.html` (and `/` for the homepage). Resubmit in Search Console | `astro.config.mjs` | S | 🔴 Fixes SEO. Check the output against canonicals |
| 0.2 | Homepage canonical `/` instead of `/index.html` | `src/components/common/SEOHead.astro` | S | 🔴 Minor canonical change; intended |
| 0.3 | **URL-snapshot test**: commit today's list of `dist/**/*.html` paths and fail CI if any disappears | `scripts/check-urls.mjs`, `tests/url-snapshot.txt`, `package.json` | S | Protects every later phase |
| 0.4 | Pin `slug:` in every blog, case-study and video file to its current ID | `src/data/**/*.md(x)`, `src/content.config.ts` | S | 🔴 Must equal the current ID exactly. The snapshot test (0.3) catches mistakes |
| 0.5 | Untrack `node_modules/`, `dist/`, `.astro/`, `.DS_Store`. Delete the stray blog file, root `Designer.png`, `pacth1.svg` | git index, `src/data/blog/Reusable…`, `public/images/case-studies/pacth1.svg` | S | Make sure deployment doesn't rely on committed `dist/` |
| 0.6 | GitHub Actions CI: `astro check`, build, URL snapshot, link check | `.github/workflows/ci.yml` | S | — |
| 0.7 | Optimise images: move to `src/assets`, use `<Image>`, load the hero eagerly | `src/pages/index.astro`, `src/assets/**`, `public/images/services/*` | M | Image URLs change; images aren't indexed pages, so the SEO effect is low |
| 0.8 | Fix contrast leftovers from the dark theme | `Breadcrumbs.astro`, `Callout.astro`, `ArchitectureDiagram.astro`, `blog/index.astro` | S | — |
| 0.9 | Video placeholders: import real metadata from the YouTube Data API (one-off script) **or** add `noindex` and drop them from the sitemap and Pagefind | `scripts/import-youtube.mjs`, `src/data/videos/*`, `src/pages/videos/[id].astro` | M | 🔴 `noindex` removes ~131 URLs from the index (intended). Keep the pages alive so links still work |
| 0.10 | PNG OG images (default plus one per post, generated at build) | `src/pages/og/[...slug].png.ts`, `SEOHead.astro`, new dependency | M | — |
| 0.11 | Structured data: `Person`, `Organization` (`sameAs`, `logo`), `BlogPosting.image/publisher`, `ProfessionalService` | `src/lib/seo/schema.ts`, `BaseLayout.astro`, `blog/[id].astro` | S | — |
| 0.12 | Positioning and copy: consulting-first tagline, hero button → Contact/Consulting, a stronger About page with photo and credentials | `Header.astro`, `index.astro`, `about.astro` | M (mostly copywriting) | — |
| 0.13 | Shared query helpers, remove the casts, delete dead components | `src/lib/content/queries.ts`, about 10 pages | M | Refactor only; the snapshot test guards it |
| 0.14 | Upgrade Astro to 7.4.x and the patch releases. Move `z` to `astro/zod` | `package.json`, `content.config.ts` | S | Run the full check and build |
| 0.15 | CDN fixes on the current S3/CloudFront: custom error page → `/404.html`, www → apex 301, security-headers policy | CloudFront config (outside the repo) | S | 🔴 Test the redirect rules carefully |

### Phase 1 — Consulting, project requests, payments, comments, search (~1.5–2 weeks)

_Newsletter deferred. Payments use hosted providers only, with no API or webhooks._

| # | Item | Files | Effort | Risks |
|---|---|---|---|---|
| 1.1 | **Add the adapter and move hosting.** Cloudflare adapter, `wrangler.jsonc` (`html_handling: "none"`), `astro:env` schema, `.env.example`. Run a preview deployment against the URL snapshot, then switch DNS | `astro.config.mjs`, `wrangler.jsonc`, `src/env.d.ts`, `.env.example`, `package.json` | M | 🔴 **Highest-risk item.** Every snapshot URL must return 200 with no redirect. Keep S3/CloudFront available for rollback. Pagefind must still run after `astro build` |
| 1.2 | `src/lib/` foundation: `http/`, `identity/email.ts`, `integrations/mailer.ts`, `integrations/turnstile.ts`, `integrations/storage.ts`, `services/leads.ts` (email-backed) | `src/lib/**` | S | — |
| 1.3 | **Consulting page.** `sessions` collection, `/consulting.html` with session cards, Cal.com embed loaded on click. Payment is collected by Cal.com's Stripe app, with no code on the site | `src/content/sessions.yaml`, `src/pages/consulting.astro`, `src/components/consulting/*`, nav in `site.ts` | M | Cal.com and Stripe account setup. Cookie-policy implications of the embed. Monthly advisory may suit a Stripe subscription Payment Link better than a booking |
| 1.5 | **Project request form.** React island with multi-step validation, Turnstile, direct R2 uploads, success state | `src/components/islands/ProjectRequestForm.tsx`, `src/pages/project-request.astro`, `src/pages/api/project-request.ts`, `src/pages/api/uploads/sign.ts`, `src/lib/integrations/storage.ts` | L | Abuse: Turnstile, honeypot, rate limit, type and size allow-list, private bucket, expiring links |
| 1.6 | Contact page: replace `mailto:` with a short form or links to the consulting and project-request pages. Use an email address on your own domain | `src/pages/contact.astro`, `src/lib/config/site.ts` | S | DNS records (SPF/DKIM/DMARC) so mail is delivered |
| 1.7 | **Pay an invoice (static).** `/pay.html` explains that invoices arrive by email from Stripe, and lists fixed-price Stripe Payment Links (and Razorpay Payment Links for UPI, if wanted). You create deposit and milestone invoices in the Stripe dashboard | `src/pages/pay.astro`, `src/lib/config/site.ts` (link URLs) | S | Use the client's email on every invoice so records join up in Phase 3. Razorpay needs Indian business KYC |
| 1.10 | **Blog features.** Expressive Code (copy button), TOC from `headings`, share links, related-post scoring, linked tags | `astro.config.mjs`, `BlogPostLayout.astro`, `ContentLayout.astro`, `src/components/blog/{Toc,Share,Related}.astro`, `src/lib/content/queries.ts` | M | Expressive Code changes code-block markup and styles; check every post visually |
| 1.11 | **Giscus** comments, loaded when scrolled into view, with a per-post `comments` flag | `src/components/blog/Comments.astro`, blog schema | S | Needs a public GitHub repo with Discussions. Use a stable `data-mapping="specific"` term (the post `slug`) so threads survive title changes |
| 1.12 | **"Was this helpful?"** widget that sends a Plausible or Umami custom event directly from the browser | `src/components/blog/Helpful.astro` | S | Results live in analytics only, and ad blockers may drop some votes |
| 1.13 | **Search.** Keep Pagefind. Add `data-pagefind-filter` for type and topic, exclude `noindex` pages, add a header search shortcut | `SearchBox.astro`, layouts | S | — |
| 1.15 | **Analytics.** Plausible or Umami plus custom events (form submitted, booking clicked, helpful vote) | `BaseLayout.astro`, `src/lib/analytics.ts` | S | Add the domain to the CSP |
| 1.16 | **Legal pages.** Split into privacy, terms, refunds and cookies. Consent: cookieless analytics plus click-to-load embeds, so a banner may not be needed. Add a small consent gate before loading Cal.com or Giscus if you serve EU users | `src/pages/legal/*.astro`, `src/pages/privacy.astro` (keep its URL), footer | M | 🔴 **Keep `/privacy.html` live.** Get the wording reviewed by a professional |
| 1.17 | Testimonials collection, plus testimonials on the homepage, consulting page and case studies | `src/content/testimonials.yaml`, `src/components/common/Testimonials.astro` | S | Need written consent from each person quoted |
| 1.18 | Services as a collection with per-service pages `/services/<id>.html`, keeping `/services.html` as the overview | `src/content/services/*`, `src/pages/services.astro`, `src/pages/services/[id].astro` | M | Adds URLs only; `/services.html` is unchanged |
| 1.19 | Security headers and CSP (Cloudflare `_headers` file or middleware) | `public/_headers` or `src/middleware.ts` | S | A CSP that's too strict breaks embeds; ship it in report-only mode first |

### Phase 2 — Learning hub with an external course platform (~2 weeks)

| # | Item | Files | Effort | Risks |
|---|---|---|---|---|
| 2.1 | Add collections: `courses`, `lessons`, `guides`, `labs`, `paths`. Migrate `videos` to a `video: {provider, id}` source | `src/content.config.ts`, `src/content/**` | M | 🔴 The video migration must keep `/videos/<id>.html` (IDs unchanged) |
| 2.2 | Provider-neutral `<VideoPlayer>` (YouTube, Bunny, Mux; click-to-load) | `src/components/learn/VideoPlayer.astro`, replacing `YouTubeEmbed.astro` | S | Bunny and Mux need their domains in the CSP |
| 2.3 | `/learn.html` hub with filters by type, topic and level (vanilla JS, or a small island if it grows) | `src/pages/learn/index.astro`, `src/components/learn/*` | M | — |
| 2.4 | Detail pages: `/learn/courses/<id>.html` (outcomes, curriculum from `lessons`, button to the external platform), `/learn/guides/<id>.html`, `/learn/labs/<id>.html` | `src/pages/learn/[type]/[id].astro` | M | Decide the URL scheme now; it's permanent |
| 2.5 | Learning paths: `/learn/paths/<id>.html` showing ordered steps | `src/pages/learn/paths/[id].astro` | S | — |
| 2.6 | `Course` + `ItemList` schema, PNG OG images for each course | `src/lib/seo/schema.ts`, OG route | S | Course rich results need provider and offer details |
| 2.7 | Outbound tracking: add UTM parameters and `?email=` (if the platform supports it) to buy links, plus an analytics event | `src/components/learn/BuyButton.astro` | S | Keep the email identifier consistent with the platform |
| 2.9 | Add **Learn** to the navigation, and cross-link from blog posts to related guides and courses | `site.ts`, `BlogPostLayout.astro` | S | — |

### Phase 3 — Optional accounts and database (~3–4 weeks, when needed)

| # | Item | Files | Effort | Risks |
|---|---|---|---|---|
| 3.1 | Postgres (Neon or Supabase) + Drizzle. Tables: `users`, `customers(email)`, `events(id)`, `leads`, `bookings`, `payments`, `feedback` | `src/lib/db/*`, `drizzle.config.ts`, `migrations/` | M | Workers need an HTTP driver or Hyperdrive |
| 3.2 | Swap `lib/services/leads.ts` from email to the database (keep the email notification too). Add `payments.ts` and `bookings.ts` | `src/lib/services/*` | M | No changes to the project-request route or pages |
| 3.3 | **Webhooks:** `/api/webhooks/stripe` (`invoice.paid`, `checkout.session.completed`, `charge.refunded`) and `/api/webhooks/cal` (`BOOKING_*`), with signature verification and idempotency through `events` | `src/pages/api/webhooks/*`, `src/lib/integrations/{stripe,cal}.ts` | M | Read the raw body for signature checks. Use Stripe's fetch HTTP client on Workers |
| 3.3a | Razorpay webhook (only if Razorpay is used) | `src/pages/api/webhooks/razorpay.ts`, `src/lib/integrations/razorpay.ts` | S | — |
| 3.3b | (Optional) Newsletter, if wanted by then: provider API behind `/api/subscribe`, linked to users by email | `src/pages/api/subscribe.ts`, `src/lib/services/subscribers.ts` | M | Provider choice. GDPR consent wording |
| 3.4 | Auth: Better Auth (or Supabase/Clerk). Email magic link or OAuth with GitHub/Google | `src/lib/auth.ts`, `src/pages/api/auth/[...all].ts`, `src/middleware.ts` | L | Session cookies change the consent picture |
| 3.5 | `/account/*` (server-rendered): bookings, invoices, purchases | `src/pages/account/*.astro` | M | `noindex` these pages |
| 3.6 | Backfill: link past Stripe customers, Cal.com bookings and project-request leads to users by email | `scripts/backfill.ts` | M | Duplicate or mismatched emails |
| 3.7 | (Optional) Sell courses on the site: Stripe Checkout, `enrollments` table, server-rendered lesson pages for gated content, move videos from the external platform to Bunny or Mux with signed URLs | `api/checkout/*`, `pages/learn/courses/[id]/[lesson].astro` | L | 🔴 If the course URL scheme changes, add redirects from the external platform's URLs |

---

## 6. Open questions / decisions needed

1. **Hosting.** Cloudflare (recommended), Vercel, Netlify, or stay on AWS with Lambda for `/api/*`? Also: how is the site deployed to S3 today (manually, or a script outside this repo)?
2. **Search Console.** Do you have access? I'd like to confirm which URLs Google has indexed. In particular, did an older site (for example the 2020 Terraform post) use different URLs that need redirects?
3. **Email.** Domain mailbox provider (Google Workspace, Zoho, …) and transactional sender for the project-request form (Resend recommended, or SES since you're AWS-oriented)?
4. ~~Newsletter provider~~ — deferred.
5. **Analytics.** Plausible (hosted, paid) or Umami (self-hosted or cloud)?
6. **Payments.** Which Stripe account country? Do you need INR/UPI from day one (Razorpay Payment Links on `/pay.html`), or can it wait? What currency will you show prices in?
7. **Cal.com.** Free or paid plan? Do you want payment collected at booking for all session types, including the monthly advisory, or is advisory invoiced?
8. **Course platform** for Phase 2: Teachable, Thinkific, Podia, Gumroad, Udemy or another? This decides how buy links and the email hand-off work.
9. **Video host** for course content: YouTube (public), Bunny Stream (cheap, private) or Mux (best developer tooling, pricier)?
10. **Giscus.** Is a public GitHub repo with Discussions acceptable for comments?
11. **Placeholder videos.** Import real metadata from YouTube (needs a YouTube Data API key) or `noindex` for now?
12. **Audience and legal.** Do you expect EU/UK visitors (GDPR consent wording) and Indian customers (GST invoices)? Will you get a professional to review the legal pages?
13. **Positioning.** Confirm "consulting first, content as proof", which drives the homepage, header and About copy.
14. **Learn URL scheme.** `/learn/courses/<id>.html`, `/learn/guides/<id>.html` and so on, keeping the `.html` convention. Confirm, because these become permanent.
