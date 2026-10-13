const cliValue = (name) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || "";
};

const hasFlag = (name) => process.argv.includes(`--${name}`);

const displayBase = String(
  cliValue("display-api") || process.env.TRENDS_DISPLAY_API || "",
).replace(/\/$/, "");
if (!displayBase) {
  throw new Error(
    "TRENDS_DISPLAY_API or --display-api is required for Display health audit",
  );
}

const concurrency = Math.max(
  1,
  Math.min(16, Number(cliValue("concurrency") || 8) || 8),
);
const timeoutMs = Math.max(
  1000,
  Math.min(30000, Number(cliValue("timeout-ms") || 10000) || 10000),
);
const failOnEmpty = hasFlag("fail-on-empty");

const fetchJson = async (url, timeout = timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    return { response, payload };
  } finally {
    clearTimeout(timer);
  }
};

const catalogUrl = `${displayBase}/catalog`;
const { response: catalogResponse, payload: catalog } =
  await fetchJson(catalogUrl, 15000);
if (!catalogResponse.ok) {
  throw new Error(`Display catalog HTTP ${catalogResponse.status}`);
}
if (!Array.isArray(catalog?.sources)) {
  throw new Error("Display catalog must expose sources");
}

const isReadableSource = (source) => {
  if (!source?.key) return false;
  if (source.displayAvailable === false) return false;
  const availability = String(source.runtimeAvailability || "").trim();
  return !availability || availability === "available";
};

const readableSources = catalog.sources.filter(isReadableSource);
let cursor = 0;
const results = [];

const auditSource = async (source) => {
  const sourceName = String(source.key).trim();
  const variant = String(source.defaultVariant || "").trim();
  const url = new URL(
    `${displayBase}/rankings/${encodeURIComponent(sourceName)}`,
  );
  url.searchParams.set("limit", "1");
  if (variant) url.searchParams.set("variant", variant);

  const startedAt = Date.now();
  try {
    const { response, payload } = await fetchJson(url.toString());
    const elapsedMs = Date.now() - startedAt;
    if (!response.ok) {
      return {
        source: sourceName,
        variant,
        status: "http-error",
        httpStatus: response.status,
        elapsedMs,
        errorCode: String(payload?.error?.code || ""),
      };
    }

    if (
      payload?.data?.profile !== "public-display-v1" ||
      payload?.data?.source?.key !== sourceName ||
      !Array.isArray(payload?.data?.items)
    ) {
      return {
        source: sourceName,
        variant,
        status: "schema-error",
        httpStatus: response.status,
        elapsedMs,
      };
    }

    return {
      source: sourceName,
      variant,
      status: payload.data.items.length ? "healthy" : "empty",
      httpStatus: response.status,
      itemCount: payload.data.items.length,
      elapsedMs,
    };
  } catch (error) {
    return {
      source: sourceName,
      variant,
      status: error?.name === "AbortError" ? "timeout" : "request-error",
      httpStatus: 0,
      elapsedMs: Date.now() - startedAt,
      errorCode: String(error?.code || ""),
      message: String(error?.message || error || "").slice(0, 180),
    };
  }
};

const worker = async () => {
  while (cursor < readableSources.length) {
    const index = cursor;
    cursor += 1;
    results[index] = await auditSource(readableSources[index]);
  }
};

await Promise.all(
  Array.from(
    { length: Math.min(concurrency, Math.max(readableSources.length, 1)) },
    () => worker(),
  ),
);

const counts = new Map();
for (const result of results) {
  counts.set(result.status, (counts.get(result.status) || 0) + 1);
}

const hardFailures = results.filter(
  (result) =>
    !["healthy", "empty"].includes(result.status) ||
    (failOnEmpty && result.status === "empty"),
);
const empty = results.filter((result) => result.status === "empty");

const summary = [
  `sources=${results.length}`,
  `healthy=${counts.get("healthy") || 0}`,
  `empty=${counts.get("empty") || 0}`,
  `http-error=${counts.get("http-error") || 0}`,
  `schema-error=${counts.get("schema-error") || 0}`,
  `timeout=${counts.get("timeout") || 0}`,
  `request-error=${counts.get("request-error") || 0}`,
].join(" ");

console.log(`[trends-display-health] ${summary}`);

const noteworthy = results.filter((result) => result.status !== "healthy");
if (noteworthy.length) {
  console.log(
    JSON.stringify(
      noteworthy.sort((left, right) => left.source.localeCompare(right.source)),
      null,
      2,
    ),
  );
}

if (empty.length && !failOnEmpty) {
  console.log(
    `[trends-display-health] ${empty.length} source(s) returned HTTP 200 with zero items; reported for triage but not treated as a hard failure by default`,
  );
}

if (hardFailures.length) {
  process.exitCode = 1;
}
