# Phase 1a: manual setup

Everything in Phase 1a works without setup **except** comments and analytics, which stay switched off until their environment variables are set. Values starting with `PUBLIC_` are baked into the site at build time: set them in `.env` (or your CI/host build settings), then **rebuild and redeploy**.

## 1. Giscus comments

1. **Enable Discussions:** github.com/devops4solutions/website-devops → **Settings → General → Features** → tick **Discussions**.
2. **Create a category:** **Discussions** tab → pencil icon next to *Categories* → **New category**:
   - Name: `Blog comments`
   - Format: **Announcement**, so only you and Giscus can start threads and readers can still reply.
3. **Install the Giscus app:** https://github.com/apps/giscus → **Install** → **Only select repositories** → `website-devops`.
4. **Get the IDs** at https://giscus.app:
   - *Repository:* `devops4solutions/website-devops`. It must say "Success! This repository meets all of the above criteria."
   - *Page ↔ Discussions Mapping:* "Discussion title contains a specific term". The site sends the post slug as the term.
   - *Discussion Category:* `Blog comments`
   - Scroll to *Enable giscus* and copy `data-repo-id` and `data-category-id` from the generated script.
5. **Add to `.env`:**
   ```
   PUBLIC_GISCUS_REPO=devops4solutions/website-devops
   PUBLIC_GISCUS_REPO_ID=R_xxxxxxxxxx
   PUBLIC_GISCUS_CATEGORY=Blog comments
   PUBLIC_GISCUS_CATEGORY_ID=DIC_xxxxxxxxxx
   ```
6. **Allow the custom theme:** Giscus loads `https://devops4solutions.com/giscus-theme.css` from inside its iframe, which needs a CORS header on that file. In CloudFront, add a response headers policy for the path pattern `/giscus-theme.css`, or for the whole site, with:
   - `Access-Control-Allow-Origin: https://giscus.app`
   - `Access-Control-Allow-Methods: GET`

   Until this is in place, set `comments.theme` to `"light"` in `src/config/site.ts`. The built-in theme needs no CORS.
7. Rebuild, deploy, and open a post. The first comment creates the discussion thread automatically.

**Per-post opt-out:** add `comments: false` to a post's frontmatter.

## 2. Analytics (choose one)

Analytics load only in production builds (`npm run build`), never in `npm run dev`.

**Plausible**
1. Create an account at plausible.io and add the site `devops4solutions.com`.
2. In `.env`: `PUBLIC_PLAUSIBLE_DOMAIN=devops4solutions.com`. Leave `PUBLIC_PLAUSIBLE_SCRIPT_URL` at its default unless you self-host.
3. To report custom events, add each one under **Site settings → Goals → Add goal → Custom event**, with the name exactly as shown below.

**Umami**
1. Create a website in Umami Cloud (cloud.umami.is) or your self-hosted instance.
2. In `.env`: `PUBLIC_UMAMI_WEBSITE_ID=<website id>` and `PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js`, or your own instance's script URL.
3. Custom events appear under **Events** automatically.

**Custom events sent by the site**

| Event | Properties | When |
|---|---|---|
| `Helpful` | `post`, `vote` (yes/no) | "Was this article helpful?" vote (once per browser) |
| `Share` | `post`, `method` (native/linkedin/x/copy) | Share buttons |
| `Copy code` | `language`, `page` | Code block copy button |
| `Search open` | `page` | Search dialog opened |
| `Book a call` | `page`, `location` (header/mobile menu) | Book a call button |
| `Related course` | `page`, `post` | Related-course call-to-action |

## 3. Optional frontmatter (all optional; existing posts need no changes)

```yaml
comments: false            # hide Giscus on this post (default: shown)
readingTime: "9 min"       # override the computed reading time
relatedCourse:             # call-to-action box at the end of the post
  title: "Terraform for AWS: Zero to Production"
  url: "https://your-course-platform.com/terraform-aws"
  description: "Hands-on course with labs."   # optional
  cta: "Enroll now"                            # optional, default "View course"
```

## 4. Other settings in `src/config/site.ts`

- `xHandle`: set to your X handle (e.g. `"@devops4solutions"`) to add the `twitter:site` meta tag.
- `postsPerPage`: posts per page on `/blog.html` and tag pages (default 9). Later pages are `/blog/page/2.html`, `/tags/<tag>/page/2.html` and so on. After the first time a page 2 appears, run `npm run check:urls -- --update` to record the new URLs.

## 5. Trying search locally

Pagefind builds its index during `npm run build`, so search works only on a build:

```sh
npm run build && npm run preview   # then open http://localhost:4321 and press Ctrl/⌘+K
```

In `npm run dev` the search dialog shows a message instead of results.
