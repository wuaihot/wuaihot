const assert = require("node:assert/strict");
const {
  extractVisibleStaticSourceNames,
  projectSubtypeGroupsForBuild,
  selectBuildSourceNames,
} = require("./lib/trends-catalog-build.cjs");

const ENV_KEYS = [
  "TRENDS_CATALOG_URL",
  "TRENDS_PUBLIC_CATALOG_URL",
  "TRENDS_CATALOG_BUILD_SYNC",
  "TRENDS_CATALOG_BUILD_REQUIRED",
  "TRENDS_CATALOG_BUILD_TIMEOUT_MS",
  "TRENDS_CATALOG_BUILD_ATTEMPTS",
  "TRENDS_CATALOG_BUILD_RETRY_DELAY_MS",
  "VERCEL_ENV",
];

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);
const originalFetch = global.fetch;

const resetEnv = () => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
};

const setTestDefaults = () => {
  process.env.TRENDS_CATALOG_URL = "https://catalog.invalid/test";
  process.env.TRENDS_PUBLIC_CATALOG_URL = "";
  process.env.TRENDS_CATALOG_BUILD_SYNC = "1";
  process.env.TRENDS_CATALOG_BUILD_TIMEOUT_MS = "50";
  process.env.TRENDS_CATALOG_BUILD_ATTEMPTS = "2";
  process.env.TRENDS_CATALOG_BUILD_RETRY_DELAY_MS = "1";
  delete process.env.TRENDS_CATALOG_BUILD_REQUIRED;
  delete process.env.VERCEL_ENV;
};

const run = async () => {
  const staticGroups = {
    local: [{ label: "Local", items: [{ value: "hot", label: "Hot" }] }],
  };

  setTestDefaults();
  let fallbackCalls = 0;
  global.fetch = async () => {
    fallbackCalls += 1;
    throw new Error("temporary catalog failure");
  };
  const fallback = await projectSubtypeGroupsForBuild(
    staticGroups,
    "catalog-build-test-preview",
  );
  assert.equal(fallbackCalls, 2);
  assert.equal(fallback.projected, 0);
  assert.equal(fallback.groups, staticGroups);

  setTestDefaults();
  process.env.VERCEL_ENV = "production";
  let productionCalls = 0;
  global.fetch = async () => {
    productionCalls += 1;
    throw new Error("temporary catalog failure");
  };
  await assert.rejects(
    () =>
      projectSubtypeGroupsForBuild(
        staticGroups,
        "catalog-build-test-production",
      ),
    /Trends catalog is required for production build: temporary catalog failure/,
  );
  assert.equal(productionCalls, 2);

  setTestDefaults();
  process.env.VERCEL_ENV = "production";
  let retryCalls = 0;
  global.fetch = async () => {
    retryCalls += 1;
    if (retryCalls === 1) throw new Error("first attempt failed");
    return {
      ok: true,
      status: 200,
      json: async () => ({ sources: [] }),
    };
  };
  const retrySuccess = await projectSubtypeGroupsForBuild(
    staticGroups,
    "catalog-build-test-retry",
  );
  assert.equal(retryCalls, 2);
  assert.equal(retrySuccess.projected, 0);

  // The production catalogue must also retry a stalled HTTP connection,
  // not only a synchronous fetch failure, without returning partial SEO data.
  setTestDefaults();
  process.env.VERCEL_ENV = "production";
  let timeoutCalls = 0;
  global.fetch = async (_url, options) => {
    timeoutCalls += 1;
    return new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => {
        reject(new DOMException("catalog request timed out", "AbortError"));
      }, { once: true });
    });
  };
  await assert.rejects(
    () => projectSubtypeGroupsForBuild(staticGroups, "catalog-build-test-abort"),
    /Trends catalog is required for production build: catalog request timed out/,
  );
  assert.equal(timeoutCalls, 2);

  const visibleStaticSourceNames = extractVisibleStaticSourceNames(`
const mockStore = {
  defaultNewsArr: [
    {
      name: "visible-static",
      show: true,
    },
    {
      name: "hidden-static",
      show: false,
    },
    {
      name: "implicit-visible",
    },
  ],
  newsArr: [],
};
`);
  assert.deepEqual(
    visibleStaticSourceNames,
    ["visible-static", "implicit-visible"],
    "static SEO sources must respect defaultNewsArr show:false while keeping visible and implicit-visible entries",
  );
  assert.deepEqual(
    selectBuildSourceNames({
      staticSourceNames: [...visibleStaticSourceNames, "legacy-static"],
      catalogSources: [
        { key: "visible-static", priorityTier: "C" },
        { key: "dynamic-a", priorityTier: "A" },
        { key: "dynamic-c", priorityTier: "C" },
      ],
      projectionSourceNames: ["visible-static", "dynamic-a"],
    }),
    ["visible-static", "implicit-visible", "legacy-static", "dynamic-a"],
    "SEO source selection must keep visible local sources, add A/B Catalog sources, dedupe projections and exclude hidden static sources",
  );

  setTestDefaults();
  process.env.VERCEL_ENV = "production";
  process.env.TRENDS_CATALOG_URL = "";
  process.env.TRENDS_PUBLIC_CATALOG_URL = "";
  global.fetch = async () => {
    throw new Error("fetch must not be called without a URL");
  };
  await assert.rejects(
    () =>
      projectSubtypeGroupsForBuild(
        staticGroups,
        "catalog-build-test-missing-url",
      ),
    /production build requires Trends catalog sync/,
  );

  console.log(
    "[trends-catalog-build] preview fallback, production fail-closed, retry recovery, visible static SEO sources and missing-url guard verified",
  );
};

run()
  .finally(() => {
    global.fetch = originalFetch;
    resetEnv();
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
