import { applyTrendsSourceCatalog } from "@/utils/sourceSubtypes";
import {
  catalogMatchesSurfaceStatus,
  mergedCatalogSurfaceMatchesStatus,
  mergeDirectoryAndReadCatalogs,
} from "@/utils/trendsCatalogSurfaceMerge.mjs";

const CACHE_KEY = "dailyhot:trends-source-catalog:v4";
const STALE_MS = 24 * 60 * 60 * 1000;
const REVALIDATE_MS = 5 * 60 * 1000;
const catalogRefreshUrl = (url, force = false) => {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  const revision = force ? Date.now() : Math.floor(Date.now() / REVALIDATE_MS);
  return `${url}${separator}_catalog=${revision}`;
};
const DIRECTORY_API = String(
  import.meta.env.VITE_TRENDS_DIRECTORY_API || "",
).replace(/\/$/, "");
const PUBLIC_API = String(
  import.meta.env.VITE_TRENDS_PUBLIC_API || "",
).replace(/\/$/, "");
const deriveDisplayApi = (publicApi, directoryApi) => {
  if (/\/public\/v1$/.test(publicApi)) {
    return publicApi.replace(/\/public\/v1$/, "/display/v1");
  }
  return directoryApi ? directoryApi + "/display/v1" : "";
};
const DISPLAY_API = String(
  import.meta.env.VITE_TRENDS_DISPLAY_API ||
    deriveDisplayApi(PUBLIC_API, DIRECTORY_API),
).replace(/\/$/, "");
const STATUS_API = DISPLAY_API ? DISPLAY_API + "/status" : "";

const catalogReadUrl = (url, force = false) => {
  if (!import.meta.env.PROD) return catalogRefreshUrl(url, force);
  const surface = url === DIRECTORY_API + "/catalog.json" ? "directory"
    : url === PUBLIC_API + "/catalog" ? "public"
    : url === DISPLAY_API + "/catalog" ? "display" : "status";
  return "/api/trends-catalog?surface=" + surface + (force ? "&force=1" : "") + "&revision=" + (force ? Date.now() : Math.floor(Date.now() / REVALIDATE_MS));
};
let loadingPromise = null;

const cachedCatalog = () => {
  if (typeof localStorage === "undefined") return null;
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (!cached?.catalog || !Number.isFinite(cached?.storedAt)) return null;
    return cached;
  } catch {
    return null;
  }
};

const persistCatalog = (catalog) => {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ storedAt: Date.now(), catalog }));
  } catch {
    // Catalog persistence is an optimization only.
  }
};

const fetchJsonCatalog = async (url, { force = false } = {}) => {
  if (!url) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), import.meta.env.PROD ? 4500 : 2200);
  try {
    const response = await fetch(catalogReadUrl(url, force), {
      headers: { Accept: "application/json" },
      credentials: import.meta.env.PROD ? "same-origin" : "omit",
      ...(force ? { cache: "no-store" } : {}),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("trends_catalog_http_" + response.status);
    const catalog = await response.json();
    if (!Array.isArray(catalog?.sources)) throw new Error("trends_catalog_invalid_payload");
    return catalog;
  } finally {
    clearTimeout(timer);
  }
};

const fetchSurfaceStatus = async () => {
  if (!STATUS_API) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), import.meta.env.PROD ? 4000 : 1800);
  try {
    const separator = STATUS_API.includes("?") ? "&" : "?";
    const response = await fetch(import.meta.env.PROD ? catalogReadUrl(STATUS_API, true) : `${STATUS_API}${separator}_status=${Date.now()}`, {
      headers: { Accept: "application/json" },
      credentials: import.meta.env.PROD ? "same-origin" : "omit",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const firstPartyDisplay = payload?.data || payload;
    return firstPartyDisplay ? { firstPartyDisplay } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const fetchCatalog = async () => {
  if (!PUBLIC_API && !DISPLAY_API && !DIRECTORY_API) return null;
  const [directoryResult, publicResult, displayResult, statusResult] =
    await Promise.allSettled([
      fetchJsonCatalog(DIRECTORY_API ? DIRECTORY_API + "/catalog.json" : ""),
      fetchJsonCatalog(PUBLIC_API ? PUBLIC_API + "/catalog" : ""),
      fetchJsonCatalog(DISPLAY_API ? DISPLAY_API + "/catalog" : ""),
      fetchSurfaceStatus(),
    ]);
  const directoryCatalog =
    directoryResult.status === "fulfilled" ? directoryResult.value : null;
  const publicCatalog =
    publicResult.status === "fulfilled" ? publicResult.value : null;
  let displayCatalog =
    displayResult.status === "fulfilled" ? displayResult.value : null;
  const surfaceStatus =
    statusResult.status === "fulfilled" ? statusResult.value : null;
  const displayStatus = surfaceStatus?.firstPartyDisplay || null;

  if (
    displayCatalog &&
    displayStatus &&
    !catalogMatchesSurfaceStatus(displayCatalog, displayStatus)
  ) {
    console.warn(
      "First-party Display Catalog does not match live status; forcing a fresh catalog read.",
    );
    try {
      const forcedDisplayCatalog = await fetchJsonCatalog(
        DISPLAY_API ? DISPLAY_API + "/catalog" : "",
        { force: true },
      );
      displayCatalog = catalogMatchesSurfaceStatus(
        forcedDisplayCatalog,
        displayStatus,
      )
        ? forcedDisplayCatalog
        : null;
    } catch {
      displayCatalog = null;
    }
  }

  const cachedSnapshot = cachedCatalog()?.catalog || null;
  const coherentCachedCatalog =
    !displayStatus ||
    mergedCatalogSurfaceMatchesStatus(
      cachedSnapshot,
      displayStatus,
      "displayAvailable",
    )
      ? cachedSnapshot
      : null;
  const catalog = mergeDirectoryAndReadCatalogs({
    directoryCatalog,
    publicCatalog,
    displayCatalog,
    cachedCatalog: coherentCachedCatalog,
  });
  if (!catalog) {
    throw (
      directoryResult.reason ||
      publicResult.reason ||
      displayResult.reason ||
      new Error("trends_catalog_unavailable")
    );
  }
  applyTrendsSourceCatalog(catalog);
  persistCatalog(catalog);
  return catalog;
};

const revalidateCatalog = (fallbackCatalog = null) => {
  if (!loadingPromise) {
    loadingPromise = fetchCatalog()
      .catch((error) => {
        if (!fallbackCatalog) console.warn("Trends source catalog unavailable", error);
        return fallbackCatalog;
      })
      .finally(() => {
        loadingPromise = null;
      });
  }
  return loadingPromise;
};

export const preloadTrendsSourceCatalog = async () => {
  const cached = cachedCatalog();
  const age = cached ? Date.now() - cached.storedAt : Number.POSITIVE_INFINITY;
  const fallbackCatalog = cached?.catalog && age <= STALE_MS ? cached.catalog : null;
  if (fallbackCatalog) {
    applyTrendsSourceCatalog(fallbackCatalog);
    void revalidateCatalog(fallbackCatalog);
    return fallbackCatalog;
  }
  return revalidateCatalog(null);
};

export const startTrendsSourceCatalogRevalidation = () => {
  if (typeof window === "undefined") return () => {};
  const refresh = () => {
    void revalidateCatalog(cachedCatalog()?.catalog || null);
  };
  const timer = window.setInterval(refresh, REVALIDATE_MS);
  const onFocus = () => refresh();
  const onVisibility = () => {
    if (document.visibilityState === "visible") refresh();
  };
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
  };
};
