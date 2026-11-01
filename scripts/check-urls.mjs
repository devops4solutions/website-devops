// Post-build guard for URL stability and sitemap correctness.
// 1. Every path in tests/url-snapshot.txt must still exist in dist/ (published URLs never disappear).
// 2. Every <loc> in the sitemap must map to a file in dist/ (no 403s in production).
// 3. Every <loc> must match the page's own canonical tag.
// 4. Every internal href/src in built HTML must point at a file in dist/ (no broken internal links).
// Run after `astro build`. Use `--update` to append newly added URLs to the snapshot.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const SNAPSHOT = "tests/url-snapshot.txt";
const SITE = "https://devops4solutions.com";

const errors = [];

const listFiles = (dir, prefix = "") =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) return rel === "/pagefind" || rel === "/_astro" ? [] : listFiles(join(dir, entry.name), rel);
    return [rel];
  });

const built = new Set(listFiles(DIST).filter((p) => /\.(html|xml|txt)$/.test(p)));
const snapshot = readFileSync(SNAPSHOT, "utf8").split("\n").filter(Boolean);

// 1. Snapshot paths must still exist.
for (const path of snapshot) {
  if (!built.has(path)) errors.push(`Missing published URL: ${path}`);
}

// 2 + 3. Sitemap entries must resolve to built files and agree with canonicals.
const urlToFile = (url) => {
  const path = url.replace(SITE, "") || "/";
  return path === "/" ? "/index.html" : path;
};

const sitemapFiles = [...built].filter((p) => /^\/sitemap-\d+\.xml$/.test(p));
if (sitemapFiles.length === 0) errors.push("No sitemap-N.xml found in dist/");

let sitemapCount = 0;
for (const file of sitemapFiles) {
  const xml = readFileSync(join(DIST, file), "utf8");
  for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    sitemapCount++;
    const target = urlToFile(loc);
    if (!built.has(target)) {
      errors.push(`Sitemap URL has no file: ${loc}`);
      continue;
    }
    const html = readFileSync(join(DIST, target), "utf8");
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (canonical !== loc) errors.push(`Sitemap/canonical mismatch: ${loc} vs ${canonical}`);
    if (/<meta name="robots" content="noindex/.test(html)) errors.push(`noindex page listed in sitemap: ${loc}`);
  }
}

// 4. Internal links and assets.
const allFiles = new Set(listFiles(DIST));
const hasFile = (path) => allFiles.has(path) || existsSync(join(DIST, path));
const brokenLinks = new Map();
for (const page of [...built].filter((p) => p.endsWith(".html"))) {
  const html = readFileSync(join(DIST, page), "utf8");
  for (const [, raw] of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
    if (raw.startsWith("//")) continue;
    const path = decodeURI(raw.split(/[?#]/)[0]);
    const target = path === "/" ? "/index.html" : path;
    if (!hasFile(target)) brokenLinks.set(raw, [...(brokenLinks.get(raw) ?? []), page]);
  }
}
for (const [link, pages] of brokenLinks) {
  errors.push(`Broken internal link ${link} (on ${pages.length} page(s), e.g. ${pages[0]})`);
}

const added = [...built].filter((p) => !snapshot.includes(p) && !/^\/sitemap-\d+\.xml$/.test(p)).sort();

if (process.argv.includes("--update") && added.length) {
  writeFileSync(SNAPSHOT, [...snapshot, ...added].sort().join("\n") + "\n");
  console.log(`Added ${added.length} new URL(s) to ${SNAPSHOT}.`);
} else if (added.length) {
  console.log(`${added.length} new URL(s) not yet in snapshot (run with --update to record them):`);
  for (const path of added) console.log(`  + ${path}`);
}

if (errors.length) {
  console.error(`\n${errors.length} URL check error(s):`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log(`URL check passed: ${snapshot.length} snapshot URLs present, ${sitemapCount} sitemap URLs valid.`);
