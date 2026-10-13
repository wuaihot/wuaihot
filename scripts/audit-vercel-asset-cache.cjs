const assert = require("node:assert/strict");
const fs = require("node:fs");

const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
const routes = config.routes || [];
const headerIndex = routes.findIndex(
  (route) =>
    route.continue === true &&
    route.headers?.["Cache-Control"] === "public, max-age=31536000, immutable"
);
assert.ok(headerIndex >= 0, "content-hashed files need immutable caching");
const matcher = new RegExp(routes[headerIndex].src);
const shouldMatch = [
  "/assets/index-94632cec.js",
  "/assets/AiTopic-e3870cc9.css",
  "/assets/icon-7dc5a0b1.webp",
  "/assets/font-a1b2c3d4.woff2",
];
const shouldNotMatch = [
  "/assets/index.js",
  "/assets/index-94632cec.js.map",
  "/assets/legacy-version.css",
  "/assets/icon-xyz.webp",
  "/assets/index-1234ABCD.js",
  "/sw.js",
  "/index.html",
  "/manifest.webmanifest",
  "/robots.txt",
  "/sitemap.xml",
  "/api/trends-catalog",
];
shouldMatch.forEach((pathname) =>
  assert.ok(matcher.test(pathname), `hashed asset must match: ${pathname}`)
);
shouldNotMatch.forEach((pathname) =>
  assert.ok(!matcher.test(pathname), `mutable asset must not match: ${pathname}`)
);

const apiIndex = routes.findIndex((route) => route.src === "^/api/(.*)$");
const filesystemIndex = routes.findIndex((route) => route.handle === "filesystem");
const missingIndex = routes.findIndex(
  (route) => route.src === "^/assets/(.*)$" && route.status === 404
);
const fallbackIndex = routes.findIndex((route) => route.dest === "/index.html");
assert.ok(apiIndex >= 0 && apiIndex < headerIndex, "API routing must remain first");
assert.ok(
  headerIndex < filesystemIndex &&
    filesystemIndex < missingIndex &&
    missingIndex < fallbackIndex,
  "headers → existing assets → missing assets → SPA fallback ordering must be preserved"
);
assert.equal(
  routes[missingIndex].headers?.["Cache-Control"],
  "no-store",
  "a missing hashed JS/CSS asset must not inherit one-year immutable caching"
);
assert.notEqual(routes[missingIndex].continue, true, "404 must end routing");
console.log(
  "VERCEL_HASHED_ASSET_CACHE_OK: hashed JS/CSS immutable; missing assets 404 no-store; API, SW and SPA unaffected"
);
