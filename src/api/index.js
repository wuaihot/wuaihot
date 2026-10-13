import axios from "@/api/request";
import { hasIndependentRankingAdapter } from "@/config/independentRankingAdapters.mjs";
import { raceWithDelayedFallback } from "@/api/fallbackRace.mjs";
import { getAdminToken } from "@/utils/adminAuth";
import { getRankingItemTimestamp } from "@/utils/rankingItemMeta";
import {
  canFallbackTrendsCatalogVariant,
  getTrendsCatalogReadSurface,
  resolveTrendsCatalogVariant,
} from "@/utils/sourceSubtypes";

const DEFAULT_FALLBACK_DELAY_MS = 1200;
const API2_ONLY_SOURCES = new Set(["tianya"]);
const SAME_ORIGIN_API_SOURCES = new Set([
  "ai-x-updates", "ai-bluesky-updates", "ai-official-intake",
  "ai-model-board",
  "livebench",
  "lolesports-news",
  "artificialanalysis",
  "bilibili",
  "designarena",
  "ithome",
  "clawhub",
  "openrouter-rankings",
  "weibo",
  "wool-topic",
  "game-deals-topic",
  "chigua-topic",
  "ai-topic",
]);
const LOCAL_RANKING_ADAPTER_SOURCES = new Set([
  "anthropic-news",
  "openrouter-rankings",
  "bilibili",
]);

const DIRECT_PUBLIC_API_SOURCES = new Set([
  "super-deals",
  "0818tuan",
  "nodeloc-deals",
  "ithome-xijiayi",
  "epic-free-games",
  "xiaoheihe-deals",
  "ggdeals",
  "gog-deals",
  "xueqiu",
  "sse",
  "szse",
  "hkex",
  "nasdaq",
  "nyse",
  "twse",
  "nse",
  "asx",
  "global-indexes",
  "cls",
  "eastmoney-flash",
  "jin10",
  "tonghuashun",
  "wallstreetcn",
  "sina-finance-flash",
  "yicai-flash",
  "qbitai-ai",
  "paperswithcode",
  "bbc-world",
  "guardian-world",
  "techcrunch",
  "theverge",
  "arstechnica",
  "lobsters",
  "nhk-news",
  "hatena-hot",
  "google-trends",
  "devto",
  "aljazeera",
  "npr-news",
  "dw-news",
  "france24-fr",
  "lemonde",
  "elpais",
  "yonhap",
  "nasa-news",
  "nature-news",
  "arxiv-ai",
  "timesofindia",
  "marketwatch",
  "krebsonsecurity",
  "thehackernews",
  "google-security",
  "who-news",
  "sciencenews",
  "smashing",
  "dezeen",
  "github-blog",
  "stackoverflow-blog",
  "infoq",
  "eurogamer",
  "cbc-news",
  "abc-au-news",
  "rnz-news",
  "wired",
]);
const PUBLIC_API2_BASE = import.meta.env.VITE_GLOBAL_API2 || "/api";
const appApiBase = import.meta.env.VITE_GLOBAL_API;
const analyticsApiBases = import.meta.env.PROD
  ? ["/api", import.meta.env.VITE_GLOBAL_API].filter(Boolean)
  : [import.meta.env.VITE_GLOBAL_API2, import.meta.env.VITE_GLOBAL_API].filter(
      Boolean,
    );

const DEFAULT_TRENDS_SHADOW_SOURCES = import.meta.env.PROD
  ? "ithome,weibo,baidu,github,zhihu,bilibili,36kr,douyin,xiaohongshu,kuaishou,toutiao,qq-news,sina-news,netease-news,thepaper,tieba,hupu,smzdm,juejin,huxiu,sspai,geekpark,52pojie,51cto,csdn,dgtle,nodeseek,v2ex,hackernews,guokr,hellogithub,producthunt,newsmth,ngabbs,zhihu-daily,acfun,history,earthquake,weatheralarm,yystv,sina,douban-group,gameres,ithome-xijiayi,nytimes,google-trends"
  : "";
const TRENDS_DIRECTORY_API = String(
  import.meta.env.VITE_TRENDS_DIRECTORY_API || "",
).replace(/\/$/, "");
const TRENDS_PUBLIC_API = String(
  import.meta.env.VITE_TRENDS_PUBLIC_API || "",
).replace(/\/$/, "");
const TRENDS_DISPLAY_API = String(
  import.meta.env.VITE_TRENDS_DISPLAY_API ||
    (/\/public\/v1$/.test(TRENDS_PUBLIC_API)
      ? TRENDS_PUBLIC_API.replace(/\/public\/v1$/, "/display/v1")
      : TRENDS_DIRECTORY_API
        ? TRENDS_DIRECTORY_API + "/display/v1"
        : ""),
).replace(/\/$/, "");
const TRENDS_SHADOW_SOURCES = new Set(
  String(
    import.meta.env.VITE_TRENDS_SHADOW_SOURCES ||
      DEFAULT_TRENDS_SHADOW_SOURCES,
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const DEFAULT_TRENDS_READ_SOURCES = import.meta.env.PROD ? "github,36kr,baidu,zhihu,weibo,ithome,douyin,xiaohongshu,kuaishou,toutiao,qq-news,sina-news,thepaper,netease-news,tieba,smzdm,juejin,huxiu,sspai,geekpark,ifanr,52pojie,51cto,csdn,dgtle,v2ex,nodeseek,hackernews,guokr,hellogithub,newsmth,ngabbs,zhihu-daily,producthunt,history,earthquake,weatheralarm,yystv,sina,douban-group,gameres,ithome-xijiayi,nytimes,acfun,google-trends" : "";
const TRENDS_READ_SOURCES = new Set(
  String(import.meta.env.VITE_TRENDS_READ_SOURCES || DEFAULT_TRENDS_READ_SOURCES)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const TRENDS_READ_SURFACE_CONTRACT = "catalog-first-v1";
const TRENDS_DISPLAY_LEGACY_FALLBACK_VARIANTS = new Map([
  ["openrouter-rankings", new Set(["models-week"])],
]);
const canUseDisplayLegacyFallback = (source, params = {}) => {
  if (!SAME_ORIGIN_API_SOURCES.has(source)) return false;
  const allowedVariants = TRENDS_DISPLAY_LEGACY_FALLBACK_VARIANTS.get(source);
  if (!allowedVariants) return false;
  const requestedVariant = String(params?.variant ?? params?.type ?? "").trim();
  return allowedVariants.has(requestedVariant);
};
const TRENDS_SHADOW_DEFAULT_VARIANTS = {
  douyin: {
    param: "type",
    legacyDefault: "hot",
    passthroughVariants: ["hot", "seeding", "entertainment", "society", "challenge"],
  },
  "qq-news": {
    param: "type",
    legacyDefault: "hot",
    passthroughVariants: ["hot", "entertainment", "sports"],
  },
  ithome: ["day", "day"],
  baidu: ["realtime", "realtime"],
  github: ["daily", "day"],
  bilibili: ["all", "popular"],
  "sina-news": ["1", "all"],
  hupu: ["1", "main"],
  "52pojie": ["digest", "digest"],
  hostloc: ["new", "new"],
  v2ex: ["hot", "hot"],
  smzdm: ["1", "day"],
  juejin: ["1", ""],
  hellogithub: { param: "sort", legacyDefault: "featured", trendsVariant: "featured" },
  sina: ["all", "all"],
  nytimes: ["china", "china"],
  acfun: { legacyParams: { type: "-1", range: "DAY" }, trendsVariant: "all-day" },
  "36kr": ["hot", "hot"],
};
const trendsShadowSeen = new Set();

const normalizeShadowText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const countOrderedShadowOverlap = (leftItems, rightItems, selector) => {
  const left = leftItems.map(selector).filter(Boolean);
  const right = rightItems.map(selector).filter(Boolean);
  const dp = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      dp[i][j] = left[i - 1] === right[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[left.length][right.length];
};

const getTrendsShadowVariant = (source, params = {}) => {
  const catalogVariant = resolveTrendsCatalogVariant(source, params);
  if (catalogVariant !== undefined) return catalogVariant;
  const mapping = TRENDS_SHADOW_DEFAULT_VARIANTS[source];
  if (!mapping) return params?.type ? null : undefined;
  if (Array.isArray(mapping)) {
    const [legacyDefault, trendsVariant] = mapping;
    const legacyVariant = String(params?.type || legacyDefault);
    return legacyVariant === legacyDefault ? trendsVariant : null;
  }
  if (mapping.passthroughVariants) {
    const { param = "type", legacyDefault, passthroughVariants } = mapping;
    const requestedVariant = String(params?.[param] ?? legacyDefault);
    return passthroughVariants.includes(requestedVariant) ? requestedVariant : null;
  }
  if (mapping.legacyParams) {
    const matchesDefaultParams = Object.entries(mapping.legacyParams).every(
      ([param, legacyDefault]) => String(params?.[param] ?? legacyDefault) === String(legacyDefault),
    );
    return matchesDefaultParams ? mapping.trendsVariant : null;
  }
  const { param = "type", legacyDefault, trendsVariant } = mapping;
  const legacyVariant = String(params?.[param] ?? legacyDefault);
  return legacyVariant === legacyDefault ? trendsVariant : null;
};

const TRENDS_CANONICAL_METRIC_KEYS = new Set(["views", "likes", "comments", "collects"]);

const normalizeTrendsDisplayMetric = (item = {}) => {
  const metric = item?.metric;
  const numeric = Number(metric?.value);
  if (!metric || !Number.isFinite(numeric) || numeric < 0) return item;
  const kind = String(metric?.kind || "").trim().toLowerCase();
  if (!kind) return item;

  if (kind === "heat") {
    return {
      ...item,
      hot:
        item?.hot === null || item?.hot === undefined || item?.hot === ""
          ? numeric
          : item.hot,
    };
  }

  if (TRENDS_CANONICAL_METRIC_KEYS.has(kind)) {
    const currentMetrics =
      item?.metrics && typeof item.metrics === "object" ? item.metrics : {};
    return {
      ...item,
      metrics: {
        ...currentMetrics,
        [kind]:
          currentMetrics[kind] === null ||
          currentMetrics[kind] === undefined ||
          currentMetrics[kind] === ""
            ? numeric
            : currentMetrics[kind],
      },
    };
  }

  return item;
};

const normalizeTrendsRankingItem = (item, index, sourceKey, updateTime) => {
  const normalizedItem = normalizeTrendsDisplayMetric(item);
  return {
    ...normalizedItem,
    id:
      normalizedItem?.id ||
      normalizedItem?.url ||
      [sourceKey || "item", index + 1].join("-"),
    desc: normalizedItem?.desc || normalizedItem?.summary || "",
    timestamp: getRankingItemTimestamp(normalizedItem, updateTime),
  };
};

const normalizeTrendsRankingResult = (payload, readSurface = "public") => {
  const feed = payload?.data || {};
  const source = feed?.source || {};
  const items = Array.isArray(feed?.items) ? feed.items : [];
  const updateTime =
    feed?.updatedAt ||
    payload?.observation?.observedAt ||
    new Date().toISOString();
  return {
    code: 200,
    name: source?.key || "",
    title: source?.name || source?.key || "",
    type: feed?.rankingLabel || source?.rankingLabel || "",
    subtitle: feed?.rankingLabel || source?.rankingLabel || "",
    total: items.length,
    fromCache: true,
    updateTime,
    variant: feed?.variant || "",
    centralized: true,
    refreshFallback: payload?.refreshFallback === true,
    readSurface,
    observationId: payload?.observation?.id || null,
    data: items.map((item, index) =>
      normalizeTrendsRankingItem(item, index, source?.key, updateTime),
    ),
  };
};

export const getTrendResonance = async ({
  minSources = 2,
  limit = 100,
  maxRank = 100,
} = {}) =>
  axios({
    method: "GET",
    url: "/trends-resonance",
    baseURL: "/api",
    params: {
      min_sources: minSources,
      limit,
      max_rank: maxRank,
    },
    timeout: 15000,
    silent: true,
  });

export const getTopicFeed = async (
  topic,
  { limit = 160, maxRank = 80, minSources = 1, force = false } = {},
) => {
  if (!TRENDS_PUBLIC_API) throw new Error("trends_public_api_unavailable");
  const url = new URL(`${TRENDS_PUBLIC_API}/topics/${encodeURIComponent(topic)}`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("max_rank", String(maxRank));
  url.searchParams.set("min_sources", String(minSources));
  if (force) url.searchParams.set("_", String(Date.now()));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "omit",
      headers: { Accept: "application/json" },
      ...(force ? { cache: "no-store" } : {}),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`trends_topic_http_${response.status}`);
    const payload = await response.json();
    if (payload?.data?.schema !== "topic-feed-v1" || !Array.isArray(payload?.data?.events)) {
      throw new Error("trends_topic_invalid_payload");
    }
    return payload.data;
  } finally {
    clearTimeout(timer);
  }
};

export const getTopicArchive = async (topic, { limit = 60, force = false } = {}) => {
  if (!TRENDS_PUBLIC_API) throw new Error("trends_public_api_unavailable");
  const url = new URL(`${TRENDS_PUBLIC_API}/topics/${encodeURIComponent(topic)}/archive`);
  url.searchParams.set("limit", String(Math.max(1, Math.min(100, Math.trunc(limit)))));
  if (force) url.searchParams.set("_", String(Date.now()));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      method: "GET", credentials: "omit", headers: { Accept: "application/json" },
      ...(force ? { cache: "no-store" } : {}), signal: controller.signal,
    });
    if (!response.ok) throw new Error(`trends_topic_archive_http_${response.status}`);
    const payload = await response.json();
    const data = payload?.data;
    if (data?.schema !== "topic-archive-v1"
      || data?.topic !== topic
      || !Array.isArray(data.events)
      || !data.window?.from || !data.window?.toExclusive
      || data.coverage?.sample !== "latest-complete-nonstale-snapshot-per-source-hour") {
      throw new Error("trends_topic_archive_invalid_payload");
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
};

const requestEventHub = async (
  path,
  params = {},
  { force = false, timeout = 8000 } = {},
) => {
  if (!TRENDS_DISPLAY_API) throw new Error("trends_display_api_unavailable");
  const url = new URL(`${TRENDS_DISPLAY_API}${path}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    url.searchParams.set(key, String(value));
  });
  if (force) url.searchParams.set("_", String(Date.now()));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "omit",
      headers: {
        Accept: "application/json",
      },
      ...(force ? { cache: "no-store" } : {}),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(
        payload?.error?.message || `event_hub_http_${response.status}`,
      );
      error.code = payload?.error?.code || `event_hub_http_${response.status}`;
      error.status = response.status;
      throw error;
    }
    if (!payload?.data) throw new Error("event_hub_invalid_payload");
    return payload.data;
  } finally {
    clearTimeout(timer);
  }
};

export const getEventCatalog = ({ force = false } = {}) =>
  requestEventHub("/events", {}, { force });

export const getEventOverview = (
  event,
  {
    date,
    discipline,
    locale,
    medalLimit = 15,
    scheduleLimit = 36,
    newsLimit = 10,
    force = false,
  } = {},
) =>
  requestEventHub(
    `/events/${encodeURIComponent(event)}`,
    {
      date,
      discipline,
      locale,
      medal_limit: medalLimit,
      schedule_limit: scheduleLimit,
      news_limit: newsLimit,
    },
    { force, timeout: 12000 },
  );

export const getEventMedals = (
  event,
  { limit = 20, force = false } = {},
) =>
  requestEventHub(
    `/events/${encodeURIComponent(event)}/medals`,
    { limit },
    { force, timeout: 10000 },
  );

export const getEventSchedule = (
  event,
  { date, discipline, locale, limit = 60, force = false } = {},
) =>
  requestEventHub(
    `/events/${encodeURIComponent(event)}/schedule`,
    { date, discipline, locale, limit },
    { force, timeout: 12000 },
  );

const eventDateRange = (from, to) => {
  const start = String(from || "").slice(0, 10);
  const end = String(to || "").slice(0, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    start > end
  ) {
    return [];
  }
  const cursor = new Date(`${start}T12:00:00Z`);
  const last = new Date(`${end}T12:00:00Z`);
  const dates = [];
  while (cursor <= last && dates.length < 32) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

export const getEventScheduleRange = async (
  event,
  {
    from,
    to,
    discipline,
    locale,
    limitPerDay = 0,
    force = false,
    concurrency = 3,
  } = {},
) => {
  const dates = eventDateRange(from, to);
  if (!dates.length) throw new Error("event_schedule_invalid_range");

  const results = [];
  const width = Math.max(1, Math.min(4, Number(concurrency) || 3));
  for (let offset = 0; offset < dates.length; offset += width) {
    const batch = dates.slice(offset, offset + width);
    const settled = await Promise.allSettled(
      batch.map((date) =>
        getEventSchedule(event, {
          date,
          discipline,
          locale,
          limit: limitPerDay,
          force,
        }),
      ),
    );
    settled.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push({ date: batch[index], data: result.value });
      }
    });
  }
  if (!results.length) throw new Error("event_schedule_range_unavailable");

  results.sort((left, right) => left.date.localeCompare(right.date));
  const disciplineMap = new Map();
  for (const { data } of results) {
    for (const item of data?.disciplines || []) {
      const current = disciplineMap.get(item.key) || {
        key: item.key,
        name: item.name || item.key,
        count: 0,
      };
      current.count += Number(item.count || 0);
      disciplineMap.set(item.key, current);
    }
  }

  const items = results
    .flatMap(({ data }) => (Array.isArray(data?.items) ? data.items : []))
    .sort((left, right) =>
      String(left?.startAt || "").localeCompare(String(right?.startAt || "")),
    );

  return {
    date: dates.length === 1 ? dates[0] : `${dates[0]}..${dates.at(-1)}`,
    dateFrom: dates[0],
    dateTo: dates.at(-1),
    timezone: results[0]?.data?.timezone || "Asia/Tokyo",
    total: results.reduce((sum, { data }) => sum + Number(data?.total || 0), 0),
    liveCount: results.reduce(
      (sum, { data }) => sum + Number(data?.liveCount || 0),
      0,
    ),
    completedCount: results.reduce(
      (sum, { data }) => sum + Number(data?.completedCount || 0),
      0,
    ),
    upcomingCount: results.reduce(
      (sum, { data }) => sum + Number(data?.upcomingCount || 0),
      0,
    ),
    disciplines: [...disciplineMap.values()].sort((left, right) =>
      String(left.name || left.key).localeCompare(
        String(right.name || right.key),
      ),
    ),
    items,
  };
};

export const getEventDisciplineCatalog = async (
  event,
  { from, to, locale, force = false } = {},
) => {
  const range = await getEventScheduleRange(event, {
    from,
    to,
    locale,
    limitPerDay: 0,
    force,
    concurrency: 4,
  });
  return range.disciplines || [];
};

export const getEventNews = (
  event,
  { locale, limit = 12, force = false } = {},
) =>
  requestEventHub(
    `/events/${encodeURIComponent(event)}/news`,
    { locale, limit },
    { force, timeout: 10000 },
  );

export const getEventRegionalNews = (
  event,
  { region = 'lpl', locale, limit = 16, force = false } = {},
) =>
  requestEventHub(
    `/events/${encodeURIComponent(event)}/regional-news`,
    { region, locale, limit },
    { force, timeout: 12000 },
  );

export const getEventBriefs = (
  event,
  { locale, limit = 8, force = false } = {},
) =>
  requestEventHub(
    `/events/${encodeURIComponent(event)}/briefs`,
    { locale, limit },
    { force, timeout: 10000 },
  );

const SAME_ORIGIN_TRENDS_ORIGIN = import.meta.env.PROD && typeof window !== "undefined"
  ? window.location.origin : "";

const requestTrendsRanking = async (
  source,
  params = {},
  readSurface = "public",
  options = {},
) => {
  const apiBase =
    readSurface === "display" ? TRENDS_DISPLAY_API : TRENDS_PUBLIC_API;
  if (!apiBase) throw new Error(`trends_${readSurface}_api_unavailable`);
  const variant = getTrendsShadowVariant(source, params);
  if (variant === null) throw new Error("trends_variant_not_enabled");
  const sameOrigin = Boolean(SAME_ORIGIN_TRENDS_ORIGIN);
  const url = new URL(
    sameOrigin ? `/api/trends-ranking/${encodeURIComponent(source)}` : `${apiBase}/rankings/${encodeURIComponent(source)}`,
    SAME_ORIGIN_TRENDS_ORIGIN || undefined,
  );
  if (sameOrigin) url.searchParams.set("surface", readSurface);
  if (options.forceNoCache) url.searchParams.set("force", "1");
  const requestedLimit = Number(options.rankingLimit);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(100, Math.max(1, Math.floor(requestedLimit)))
    : readSurface === "display" ? 20 : 100;
  url.searchParams.set("limit", String(limit));
  if (variant) url.searchParams.set("variant", variant);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), sameOrigin ? 9500 : 5000);
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: sameOrigin ? "same-origin" : "omit",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`trends_${readSurface}_http_${response.status}`);
    const payload = await response.json();
    if (!payload?.data?.source || !Array.isArray(payload?.data?.items)) {
      throw new Error(`trends_${readSurface}_invalid_payload`);
    }
    return normalizeTrendsRankingResult(payload, readSurface);
  } finally {
    clearTimeout(timer);
  }
};

const compareTrendsShadow = (legacyResult, trendsPayload) => {
  const legacyItems = Array.isArray(legacyResult?.data) ? legacyResult.data : [];
  const trendsItems = Array.isArray(trendsPayload?.data?.items) ? trendsPayload.data.items : [];
  const topN = Math.min(10, legacyItems.length, trendsItems.length);
  const legacyTop = legacyItems.slice(0, topN);
  const trendsTop = trendsItems.slice(0, topN);
  let positionalTitleMatches = 0;
  let positionalUrlMatches = 0;
  for (let index = 0; index < topN; index += 1) {
    if (normalizeShadowText(legacyTop[index]?.title) === normalizeShadowText(trendsTop[index]?.title)) {
      positionalTitleMatches += 1;
    }
    if (String(legacyTop[index]?.url || "") === String(trendsTop[index]?.url || "")) {
      positionalUrlMatches += 1;
    }
  }
  const legacyTitles = new Set(legacyTop.map((item) => normalizeShadowText(item?.title)).filter(Boolean));
  const trendsTitles = new Set(trendsTop.map((item) => normalizeShadowText(item?.title)).filter(Boolean));
  const titleSetOverlap = [...legacyTitles].filter((title) => trendsTitles.has(title)).length;
  const legacyUrls = new Set(legacyTop.map((item) => String(item?.url || "")).filter(Boolean));
  const trendsUrls = new Set(trendsTop.map((item) => String(item?.url || "")).filter(Boolean));
  const urlSetOverlap = [...legacyUrls].filter((url) => trendsUrls.has(url)).length;
  const legacyUpdatedAt = Date.parse(legacyResult?.updateTime || "");
  const trendsObservedAt = Date.parse(trendsPayload?.observation?.observedAt || "");
  return {
    legacyCount: legacyItems.length,
    trendsCount: trendsItems.length,
    topN,
    positionalTitleMatches,
    positionalUrlMatches,
    titleSetOverlap,
    urlSetOverlap,
    orderedTitleOverlap: countOrderedShadowOverlap(
      legacyTop,
      trendsTop,
      (item) => normalizeShadowText(item?.title),
    ),
    orderedUrlOverlap: countOrderedShadowOverlap(
      legacyTop,
      trendsTop,
      (item) => String(item?.url || ""),
    ),
    observationId: trendsPayload?.observation?.id || null,
    freshnessDeltaMs:
      Number.isFinite(legacyUpdatedAt) && Number.isFinite(trendsObservedAt)
        ? trendsObservedAt - legacyUpdatedAt
        : null,
  };
};

const runTrendsShadowRead = async (source, params, legacyResult) => {
  if (!TRENDS_PUBLIC_API || !TRENDS_SHADOW_SOURCES.has(source)) return;
  const variant = getTrendsShadowVariant(source, params);
  if (variant === null) return;
  const dedupeKey = `${source}:${variant || "default"}:${legacyResult?.updateTime || ""}`;
  if (trendsShadowSeen.has(dedupeKey)) return;
  trendsShadowSeen.add(dedupeKey);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  const startedAt = performance.now();
  try {
    const url = new URL(`${TRENDS_PUBLIC_API}/rankings/${encodeURIComponent(source)}`);
    const legacyCount = Array.isArray(legacyResult?.data) ? legacyResult.data.length : 0;
    url.searchParams.set("limit", String(Math.min(100, Math.max(50, legacyCount))));
    if (variant) url.searchParams.set("variant", variant);
    const response = await fetch(url, {
      method: "GET",
      credentials: "omit",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`trends_http_${response.status}`);
    const payload = await response.json();
    const comparison = compareTrendsShadow(legacyResult, payload);
    void requestAnalytics({
      method: "POST",
      url: "/analytics",
      data: {
        event: "trends_shadow_compare",
        source,
        meta: {
          ...comparison,
          variant: variant || "",
          latencyMs: Math.round(performance.now() - startedAt),
        },
      },
    }).catch(() => {});
  } catch (error) {
    await requestAnalytics({
      method: "POST",
      url: "/analytics",
      data: {
        event: "trends_shadow_error",
        source,
        meta: {
          variant: variant || "",
          kind: error?.name === "AbortError" ? "timeout" : "request_failed",
        },
      },
    }).catch(() => {});
  } finally {
    clearTimeout(timer);
  }
};

const withTrendsShadow = (source, params, payload) => {
  if (payload?.result?.code === 200) {
    void runTrendsShadowRead(source, params, payload.result);
  }
  return payload;
};

const requestAnalytics = async (config) => {
  let lastError;
  for (const baseURL of analyticsApiBases) {
    try {
      return await axios({
        ...config,
        baseURL,
        silent: true,
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

/**
 * 获取热榜分类数据
 * @param {string} type 热榜分类名称
 * @param {boolean} isNew 是否拉取最新数据
 * @param {object} params 请求参数
 * @param {object} options 额外选项
 * @returns
 */
export const getHotLists = (type, isNew = false, params, options = {}) => {
  const forceSameOrigin = Boolean(options?.forceSameOrigin) || hasIndependentRankingAdapter(type);
  const useDirectPublicApi =
    DIRECT_PUBLIC_API_SOURCES.has(type) && !forceSameOrigin;
  const useSameOriginApi = forceSameOrigin || SAME_ORIGIN_API_SOURCES.has(type);
  const useApi2 =
    useDirectPublicApi ||
    (!useSameOriginApi && (options?.useApi2 || API2_ONLY_SOURCES.has(type)));
  const apiBase = appApiBase;
  const apiBase2 = useDirectPublicApi
    ? PUBLIC_API2_BASE
    : import.meta.env.VITE_GLOBAL_API2;
  const timeout = options?.timeout;
  const forceNoCache = Boolean(options?.forceNoCache);
  const silent = Boolean(options?.silent);
  return axios({
    method: "GET",
    url: `/${type}`,
    baseURL: useSameOriginApi
      ? "/api"
      : useApi2
        ? apiBase2 || apiBase
        : undefined,
    params: {
      cache: forceNoCache ? false : !isNew,
      ...params,
    },
    ...(timeout ? { timeout } : {}),
    ...(silent ? { silent: true } : {}),
  });
};

export const sendAnalyticsEvent = (payload) =>
  requestAnalytics({
    method: "POST",
    url: "/analytics",
    data: payload,
  });

export const getAnalyticsDashboard = (days = 30) =>
  requestAnalytics({
    method: "GET",
    url: "/analytics",
    params: { days },
    headers: getAdminToken()
      ? {
          Authorization: `Bearer ${getAdminToken()}`,
        }
      : {},
  });

export const getReadableTranslations = async (texts = [], locale = "zh-CN", {rawFallback=false}={}) => {
  const apiBases = rawFallback ? ["/api"] : import.meta.env.PROD
    ? Array.from(new Set([PUBLIC_API2_BASE, "/api"].filter(Boolean)))
    : [undefined];
  let lastError;
  for (const baseURL of apiBases) {
    try {
      return await axios({
        method: "POST",
        url: "/readable-translate",
        ...(rawFallback ? {headers:{"X-Readable-Raw-Fallback":"1"}} : {}),
        ...(baseURL ? { baseURL } : {}),
        params: {
          cache: false,
        },
        data: {
          texts,
          locale,
        },
        silent: true,
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

/**
 * 获取热榜数据（主 API 失败时自动尝试备用 API）
 * @param {string} type 热榜分类名称
 * @param {boolean} isNew 是否拉取最新数据
 * @param {object} params 请求参数
 * @param {object} options 额外选项
 * @returns {Promise<{result: any, usedApi2: boolean, usedFallback: boolean, fallbackSuccess?: boolean}>}
 */
export const getHotListsWithFallback = async (
  type,
  isNew = false,
  params,
  options = {},
) => {
  const useLocalRankingAdapter = LOCAL_RANKING_ADAPTER_SOURCES.has(type);
  const catalogReadSurface = useLocalRankingAdapter
    ? null
    : getTrendsCatalogReadSurface(type);
  const readSurface = useLocalRankingAdapter
    ? null
    : catalogReadSurface || (!hasIndependentRankingAdapter(type) && TRENDS_READ_SOURCES.has(type) ? "public" : null);
  if (readSurface) {
    const startedAt = performance.now();
    try {
      const result = await requestTrendsRanking(type, params, readSurface, options);
      void requestAnalytics({
        method: "POST",
        url: "/analytics",
        data: {
          event: "trends_read_success",
          source: type,
          meta: {
            contract: TRENDS_READ_SURFACE_CONTRACT,
            surface: readSurface,
            observationId: result.observationId,
            itemCount: result.total,
            latencyMs: Math.round(performance.now() - startedAt),
          },
        },
      }).catch(() => {});
      return {
        result,
        usedApi2: false,
        usedFallback: false,
        fallbackSuccess: false,
        usedTrends: true,
        trendsSurface: readSurface,
      };
    } catch (error) {
      const catalogVariant = resolveTrendsCatalogVariant(type, params);
      void requestAnalytics({
        method: "POST",
        url: "/analytics",
        data: {
          event: "trends_read_fallback",
          source: type,
          meta: {
            contract: TRENDS_READ_SURFACE_CONTRACT,
            surface: readSurface,
            kind: error?.message || "request_failed",
            latencyMs: Math.round(performance.now() - startedAt),
          },
        },
      }).catch(() => {});
      const allowDisplayLegacyFallback =
        readSurface === "display" &&
        canUseDisplayLegacyFallback(type, params);
      if (
        !allowDisplayLegacyFallback &&
        (readSurface === "display" ||
          catalogVariant === null ||
          (catalogVariant !== undefined &&
            !canFallbackTrendsCatalogVariant(type, catalogVariant)))
      ) {
        throw error;
      }
    }
  }
  const useDirectPublicApi = DIRECT_PUBLIC_API_SOURCES.has(type) && !hasIndependentRankingAdapter(type);
  const useSameOriginApi = SAME_ORIGIN_API_SOURCES.has(type) || hasIndependentRankingAdapter(type);

  if (useDirectPublicApi) {
    try {
      const result = await getHotLists(type, isNew, params, {
        timeout: options?.timeout,
        forceNoCache: Boolean(options?.forceNoCache),
        silent: true,
      });
      return withTrendsShadow(type, params, {
        result,
        usedApi2: true,
        usedFallback: false,
        fallbackSuccess: false,
      });
    } catch (primaryError) {
      try {
        const result = await getHotLists(type, isNew, params, {
          timeout: options?.timeout,
          forceNoCache: Boolean(options?.forceNoCache),
          forceSameOrigin: true,
          silent: true,
        });
        return withTrendsShadow(type, params, {
          result,
          usedApi2: false,
          usedFallback: true,
          fallbackSuccess: true,
        });
      } catch {
        throw primaryError;
      }
    }
  }

  const hasApi2 =
    Boolean(import.meta.env.VITE_GLOBAL_API2) && !useSameOriginApi;
  const preferApi2 = Boolean(
    !useSameOriginApi && (options?.useApi2 || API2_ONLY_SOURCES.has(type)),
  );
  const disableFallback = Boolean(options?.disableFallback || useSameOriginApi);
  const timeout = options?.timeout;
  const forceNoCache = Boolean(options?.forceNoCache);
  const fallbackDelay = options?.fallbackDelay ?? DEFAULT_FALLBACK_DELAY_MS;
  const run = (useApi2, runOptions = {}) =>
    getHotLists(type, isNew, params, {
      useApi2,
      timeout,
      forceNoCache,
      ...runOptions,
    });

  if (preferApi2 || !hasApi2 || disableFallback) {
    const useApi2 = preferApi2 && !disableFallback;
    const result = await run(useApi2);
    return withTrendsShadow(type, params, { result, usedApi2: useApi2, usedFallback: false });
  }

  const createAttempt = async (useApi2) => {
    try {
      const result = await run(useApi2, { silent: true });
      if (result?.code === 200) {
        return { result, usedApi2: useApi2 };
      }
      const error = new Error(result?.message || "request failed");
      error.result = result;
      throw error;
    } catch (error) {
      error.usedApi2 = useApi2;
      throw error;
    }
  };

  const buildFailure = (primaryError, fallbackError) => {
    const chosenError = primaryError || fallbackError || {};
    const result = chosenError.result || {
      code: 500,
      title: "请求失败",
      message: "请稍后再试",
    };
    return {
      result,
      usedApi2: Boolean(fallbackError),
      usedFallback: true,
      fallbackSuccess: false,
    };
  };

  try {
    const { source, value: success } = await raceWithDelayedFallback({
      primary: () => createAttempt(false),
      fallback: () => createAttempt(true),
      delayMs: fallbackDelay,
    });
    const usedFallback = source === "fallback";
    return withTrendsShadow(type, params, {
      result: success.result,
      usedApi2: success.usedApi2,
      usedFallback,
      fallbackSuccess: usedFallback,
    });
  } catch (error) {
    const errors = Array.isArray(error?.errors) ? error.errors : [error];
    const primaryError = errors.find((item) => item?.usedApi2 === false);
    const fallbackError = errors.find((item) => item?.usedApi2 === true);
    return withTrendsShadow(
      type,
      params,
      buildFailure(primaryError, fallbackError),
    );
  }
};
