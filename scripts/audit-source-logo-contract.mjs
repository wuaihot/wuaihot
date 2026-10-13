import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { fetchCatalog } = require("./lib/trends-catalog-build.cjs");

const baselineDisplaySources = [
  "antutu-rankings",
  "apple-app-store",
  "apple-music",
  "apple-podcasts",
  "arxiv-ai",
  "cdc-mmwr",
  "china-film-boxoffice",
  "cisa-kev",
  "european-commission-news",
  "federal-register",
  "govuk-news",
  "greasy-fork",
  "hongguo-rank",
  "hotbook-discovery",
  "lol-top-canyon",
  "ludashi-rankings",
  "modeldial-radar",
  "nasa-news",
  "nvd-cves",
  "nws-alerts",
  "openfda",
  "oppo-app-store",
  "stackoverflow",
  "tencent-software-center",
  "usgs-earthquakes",
  "vscode-marketplace",
  "wikipedia",
  "xiaomi-app-store",
  "ximalaya-rankings",
  "yingyongbao-store",
  "qq-music",
  "sonkwo-deals",
  "netease-music",
  "kugou-music",
  "kuwo-music",
  "techcrunch",
  // 2026-09-29 full Public Display logo debt audit.
  "ecb-press",
  "federal-reserve",
  "gelonghui",
  "ifeng",
  "lol-esports",
  "lol-official-news",
  "lol-ranked",
  "quark-hot",
  "quark-video-rankings",
  "quark-novel-rankings",
  "sec-press-releases",
  "so360-hot",
  "so360-video-rankings",
  "sogou-hot",
  "africanews",
  "buenosaires-herald",
  "cdc-news",
  "cisco-talos",
  "docker-blog",
  "esa-space-science",
  "ft-world",
  "gitlab-blog",
  "japan-times",
  "jetbrains-blog",
  "mexico-news-daily",
  "microsoft-security",
  "mozilla-hacks",
  "sans-isc",
  "taipei-times",
  // Aliased AI sources must resolve through the same contract.
  "producthunt-ai",
  "hackernews-ai",
  "qbitai-ai",
];

const frozenDisplayCatalog = JSON.parse(
  fs.readFileSync("scripts/fixtures/public-display-source-keys.json", "utf8"),
);
const frozenDisplaySources = Array.isArray(frozenDisplayCatalog?.sourceKeys)
  ? frozenDisplayCatalog.sourceKeys.map((source) => String(source || "").trim()).filter(Boolean)
  : [];
assert.equal(
  frozenDisplaySources.length,
  Number(frozenDisplayCatalog?.sourceCount || 0),
  "frozen Public Display logo audit fixture must keep sourceCount in sync",
);

const logoSource = fs.readFileSync("src/utils/sourceLogos.js", "utf8");

const parseMap = (name) => {
  const block =
    logoSource.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`))?.[1] ||
    "";
  const entries = new Map();
  for (const match of block.matchAll(
    /^\s*(?:"([^"]+)"|([A-Za-z0-9_-]+))\s*:\s*"([^"]+)"/gm,
  )) {
    entries.set(match[1] || match[2], match[3]);
  }
  return entries;
};

const entries = parseMap("SOURCE_LOGO_MAP");
const aliases = parseMap("SOURCE_LOGO_ALIAS_MAP");

const catalog = await fetchCatalog().catch((error) => {
  console.warn(
    `[source-logo-contract] remote catalog unavailable; auditing offline baseline: ${error.message}`,
  );
  return null;
});

const catalogDisplaySources = Array.isArray(catalog?.sources)
  ? catalog.sources
      .filter((source) => source?.displayAvailable === true)
      .map((source) => String(source?.key || "").trim())
      .filter(Boolean)
  : [];

const requiredSources = [
  ...new Set([
    ...baselineDisplaySources,
    ...frozenDisplaySources,
    ...catalogDisplaySources,
  ]),
].sort();

const failures = [];
for (const source of requiredSources) {
  const alias = aliases.get(source) || source;
  const asset =
    entries.get(source) ||
    entries.get(alias) ||
    `/logo/${alias}.png`;

  // Explicit remote brand assets remain valid; the critical failure mode is the
  // implicit /logo/<key>.png fallback silently pointing at a non-existent file.
  if (/^https?:\/\//i.test(asset)) continue;

  if (!asset.startsWith("/")) {
    failures.push(`${source}: logo must be an absolute public asset or explicit https URL, got ${asset}`);
    continue;
  }

  const filePath = path.join("public", asset.slice(1));
  if (!fs.existsSync(filePath)) {
    failures.push(
      `${source}: logo resolver points at a missing asset: ${filePath}`,
    );
    continue;
  }
  if (fs.statSync(filePath).size <= 0) {
    failures.push(`${source}: mapped asset is empty: ${filePath}`);
  }
}

assert.deepEqual(failures, [], failures.join("\n"));
console.log(
  `[source-logo-contract] ${requiredSources.length} source logos resolve to explicit remote or existing local brand assets` +
    (catalogDisplaySources.length
      ? ` (including ${catalogDisplaySources.length} live Catalog display sources)`
      : ` (offline fixture: ${frozenDisplaySources.length} Public Display sources)`),
);
