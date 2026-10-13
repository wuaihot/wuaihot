import assert from "node:assert/strict";
import {
  applyTrendsSourceCatalog,
  getDefaultSourceSubtype,
  getSourceSubtypeGroups,
  getSourceVariantOptions,
} from "../src/utils/sourceSubtypes.js";
import { mergeDirectoryAndReadCatalogs } from "../src/utils/trendsCatalogSurfaceMerge.mjs";

const cliValue = (name) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || "";
};
const publicBase = String(
  cliValue("public-api") || process.env.TRENDS_PUBLIC_API || "",
).replace(/\/$/, "");
const displayBase = String(
  cliValue("display-api") ||
    process.env.TRENDS_DISPLAY_API ||
    (publicBase.endsWith("/public/v1")
      ? publicBase.replace(/\/public\/v1$/, "/display/v1")
      : ""),
).replace(/\/$/, "");
assert.ok(
  publicBase || displayBase,
  "TRENDS_PUBLIC_API / --public-api or TRENDS_DISPLAY_API / --display-api is required",
);

const fetchCatalog = async (base, label) => {
  if (!base) return null;
  const response = await fetch(`${base}/catalog`, {
    headers: { Accept: "application/json", "Cache-Control": "no-cache" },
  });
  assert.equal(response.ok, true, `${label} catalog HTTP ${response.status}`);
  const catalog = await response.json();
  assert.ok(Array.isArray(catalog?.sources), `${label} catalog must expose sources`);
  return catalog;
};

const [publicCatalog, displayCatalog] = await Promise.all([
  fetchCatalog(publicBase, "public"),
  fetchCatalog(displayBase, "display"),
]);
const catalog = mergeDirectoryAndReadCatalogs({
  directoryCatalog: null,
  publicCatalog,
  displayCatalog,
  cachedCatalog: null,
});
assert.ok(Array.isArray(catalog?.sources), "merged readable catalog must expose sources");

const projected = applyTrendsSourceCatalog(catalog);
assert.ok(projected > 0, "at least one source must be projected dynamically");

const LOCAL_VARIANT_CONTRACT_SOURCES = new Set(["bilibili"]);
const availableCatalogVariants = (source) => {
  const explicit = (source?.variantGroups || [])
    .flatMap((group) => group.options || [])
    .filter(
      (option) =>
        !option?.runtimeAvailability ||
        option.runtimeAvailability === "available",
    )
    .map((option) => String(option?.key || "").trim())
    .filter(Boolean);
  if (explicit.length) return explicit;
  const defaultVariant = String(source?.defaultVariant || "").trim();
  return defaultVariant ? [defaultVariant] : [];
};

const issues = [];
let auditedSources = 0;
let auditedVariants = 0;
for (const source of catalog.sources) {
  const sourceName = String(source?.key || "").trim();
  if (!sourceName || LOCAL_VARIANT_CONTRACT_SOURCES.has(sourceName)) continue;
  auditedSources += 1;

  const expectedVariants = availableCatalogVariants(source);
  auditedVariants += expectedVariants.length;
  const projectedVariants = getSourceVariantOptions(sourceName)
    .map((option) => String(option?.value || "").trim())
    .filter(Boolean);
  const expectedSet = new Set(expectedVariants);
  const projectedSet = new Set(projectedVariants);
  const staleFrontend = projectedVariants.filter((value) => !expectedSet.has(value));
  const missingFrontend = expectedVariants.filter((value) => !projectedSet.has(value));

  const expectedDefault = String(source?.defaultVariant || "").trim();
  const projectedDefault = String(getDefaultSourceSubtype(sourceName) || "").trim();
  const defaultMismatch = expectedDefault
    ? projectedDefault !== expectedDefault
    : projectedDefault !== "";

  if (staleFrontend.length || missingFrontend.length || defaultMismatch) {
    issues.push({
      source: sourceName,
      name: source?.name || sourceName,
      staleFrontend,
      missingFrontend,
      expectedDefault,
      projectedDefault,
      expectedVariants,
      projectedVariants,
    });
  }

  const selectorEnabled =
    source?.variantSelectorEnabled !== false && expectedVariants.length > 1;
  const projectedControls = getSourceSubtypeGroups(sourceName)
    .flatMap((group) => group.items || [])
    .map((option) => String(option?.value || "").trim())
    .filter(Boolean);
  if (!selectorEnabled && projectedControls.length) {
    issues.push({
      source: sourceName,
      name: source?.name || sourceName,
      reason: "selector-disabled-but-controls-remain",
      projectedControls,
      expectedVariants,
    });
  }
}

assert.deepEqual(
  issues,
  [],
  `Catalog-managed frontend variant drift:\n${JSON.stringify(issues, null, 2)}`,
);

assert.equal(
  getDefaultSourceSubtype("github"),
  "daily",
  "non-Catalog legacy sources must retain their local compatibility contract",
);

console.log(
  `[trends-catalog-subtypes] projected ${projected} sources; audited ${auditedSources} readable sources / ${auditedVariants} live variants with zero frontend drift`,
);
