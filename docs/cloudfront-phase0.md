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

CloudFront → **Policies → Response headers** → create a policy and attach it to the default behavior:

| Header | Value |
|---|---|
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` (enable *preload* only once you are sure every subdomain serves HTTPS) |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| X-Frame-Options | `SAMEORIGIN` |
| Permissions-Policy (custom header) | `camera=(), microphone=(), geolocation=()` |

A Content-Security-Policy is deliberately left for Phase 1. The site will then load Cal.com, Turnstile, Giscus and analytics, and the policy should be written once against that final list (ship it as `Content-Security-Policy-Report-Only` first).

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
