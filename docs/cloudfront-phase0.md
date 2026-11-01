# CloudFront fixes (roadmap item 0.15)

These settings live in AWS, not in this repo. Apply them to the CloudFront distribution that serves `devops4solutions.com`, then check them with the `curl` commands at the end.

## 1. Serve the real 404 page

Today, unknown paths return S3's `403 AccessDenied` XML.

CloudFront → Distribution → **Error pages** → *Create custom error response*, twice:

| HTTP error code | Customize error response | Response page path | HTTP response code | Error caching min TTL |
|---|---|---|---|---|
| 403 | Yes | `/404.html` | 404 | 60 |
| 404 | Yes | `/404.html` | 404 | 60 |

## 2. Redirect `www` → apex (301)

Create a **CloudFront Function** (runtime `cloudfront-js-2.0`) and associate it with the default cache behavior on **Viewer request**:

```js
function handler(event) {
  var request = event.request;
  var host = request.headers.host && request.headers.host.value;

  if (host === "www.devops4solutions.com") {
    var qs = Object.keys(request.querystring)
      .map(function (k) { return k + "=" + request.querystring[k].value; })
      .join("&");
    return {
      statusCode: 301,
      statusDescription: "Moved Permanently",
      headers: {
        location: { value: "https://devops4solutions.com" + request.uri + (qs ? "?" + qs : "") },
        "cache-control": { value: "max-age=3600" },
      },
    };
  }

  return request;
}
```

Do **not** rewrite `.html` paths in this function. The site's canonical URLs are the `.html` paths.

## 3. Security headers

The headers are kept in the repo as CloudFront response-headers policies:

| File | What it sets | Attach to |
|---|---|---|
| `infra/cloudfront/security-headers-policy.json` | HSTS, `nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, and a CSP header with `frame-ancestors 'self'; object-src 'none'; base-uri 'self'` | Default behavior (`*`) |
| `infra/cloudfront/giscus-theme-cors-policy.json` | CORS for the Giscus comments theme | A behavior for `/giscus-theme.css` |

```sh
aws cloudfront create-response-headers-policy \
  --response-headers-policy-config file://infra/cloudfront/security-headers-policy.json
aws cloudfront create-response-headers-policy \
  --response-headers-policy-config file://infra/cloudfront/giscus-theme-cors-policy.json
```

Then, in the CloudFront console:
1. **Behaviors** → edit **Default (\*)** → *Response headers policy* → `devops4solutions-security-headers`.
2. **Create behavior** for the path pattern `/giscus-theme.css`, using the same S3 origin, with *Response headers policy* set to `devops4solutions-giscus-theme-cors`.

To change a policy later, use `aws cloudfront update-response-headers-policy` with the policy's `--id` and `--if-match` ETag.

**Where the full Content-Security-Policy lives:**
- **In each page:** Astro writes it as a `<meta http-equiv="content-security-policy">` tag, with a hash for every inline script (`security.csp` in `astro.config.mjs`). It's regenerated on every build, so it never goes out of date when scripts change.
- **In the CloudFront header:** only the directives a `<meta>` tag cannot set (`frame-ancestors`). Browsers enforce both policies together.
- **New third-party services** (for example a different analytics provider or a Stripe Buy Button) must be added to the `csp` lists in `astro.config.mjs`.

**Moving to Netlify or Cloudflare Pages?** Put the same headers in a `public/_headers` file:

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), usb=()
  Content-Security-Policy: frame-ancestors 'self'; object-src 'none'; base-uri 'self'
/giscus-theme.css
  Access-Control-Allow-Origin: https://giscus.app
```

## 4. Deploy the new build

1. Run `npm run build && npm run check:urls`. Both must pass.
2. Upload `dist/` to the bucket, for example `aws s3 sync dist/ s3://<bucket>/ --delete`. Check `--delete` first with `--dryrun`: it removes the old `/images/services/*.png` and `/images/hero/Designer.png`, which are now built into `/_astro/`.
3. Invalidate CloudFront: `aws cloudfront create-invalidation --distribution-id <id> --paths "/*"`.
4. In Google Search Console, resubmit `https://devops4solutions.com/sitemap-index.xml`.

## Verify

```sh
curl -sI https://devops4solutions.com/does-not-exist.html | head -1   # HTTP/2 404
curl -sI https://www.devops4solutions.com/about.html | grep -i '^location'  # https://devops4solutions.com/about.html
curl -sI https://devops4solutions.com/ | grep -iE 'strict-transport|x-content-type'
curl -s https://devops4solutions.com/sitemap-0.xml | grep -o '<loc>[^<]*</loc>' | head -3   # .html URLs
curl -sI https://devops4solutions.com/blog/enterprise-aws-patch-automation.html | head -1      # HTTP/2 200
```
