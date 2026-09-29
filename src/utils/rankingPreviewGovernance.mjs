import { formatCompactMetric } from "./compactMetric.js";

const HEAT_LIKE_VALUE_SOURCES = new Set(["qq-news", "zhihu"]);
const INLINE_METRIC_SOURCES = new Set(["autohome-sales"]);
const GENERIC_METRIC_LABELS = new Set([
  "指标",
  "指標",
  "metric",
  "value",
  "値",
  "지표",
]);
const RANK_METRIC_LABELS = new Set([
  "排名",
  "名次",
  "排行",
  "rank",
  "ranking",
  "順位",
  "순위",
]);

const normalizeComparableText = (value = "") =>
  String(value || "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLowerCase()
    .trim();

const normalizeNumeric = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
};

const normalizeLabel = (value = "") => String(value || "").trim().toLowerCase();

const isRankMetric = (metric = {}) => {
  const key = String(metric?.key || "").trim().toLowerCase();
  const label = normalizeLabel(metric?.label);
  return key === "display:rank" || RANK_METRIC_LABELS.has(label);
};

const isGenericMetric = (metric = {}) => {
  const key = String(metric?.key || "").trim().toLowerCase();
  const label = normalizeLabel(metric?.label);
  return key === "display:value" && GENERIC_METRIC_LABELS.has(label);
};

const isWeiboMetadataSummary = (sourceName, description = "") =>
  sourceName === "weibo" &&
  /(?:^| · )(?:[^·]+领域|标签\s*[^·]+|热度\s*[^·]+)(?: · |$)/.test(description) &&
  /热度\s*[^·]+/.test(description);

export const removeRedundantPreviewDescription = ({
  sourceName = "",
  description = "",
  title = "",
  author = "",
} = {}) => {
  const value = String(description || "").trim();
  if (!value) return "";
  if (isWeiboMetadataSummary(String(sourceName || "").trim(), value)) return "";

  const normalizedDescription = normalizeComparableText(value);
  const normalizedTitle = normalizeComparableText(title);
  const normalizedAuthor = normalizeComparableText(author);
  if (
    normalizedDescription &&
    normalizedTitle &&
    normalizedAuthor &&
    (normalizedDescription === normalizedAuthor + normalizedTitle ||
      normalizedDescription === normalizedTitle + normalizedAuthor)
  ) {
    return "";
  }
  return value;
};

const resolvePreviewHeat = (item = {}, sourceName = "") => {
  const legacyHot = normalizeNumeric(item?.hot);
  if (legacyHot !== null) return legacyHot;

  const metricKind = String(item?.metric?.kind || "").trim().toLowerCase();
  const metricValue = normalizeNumeric(item?.metric?.value);
  if (metricValue === null) return null;
  if (metricKind === "heat") return metricValue;
  if (metricKind === "value" && HEAT_LIKE_VALUE_SOURCES.has(sourceName)) {
    return metricValue;
  }
  return null;
};

const resolveInlineMetric = (item = {}, sourceName = "", locale = "zh-CN") => {
  if (!INLINE_METRIC_SOURCES.has(sourceName)) return null;
  const numeric = normalizeNumeric(item?.metric?.value);
  const label = String(item?.metric?.label || "").trim();
  if (numeric === null || !label) return null;
  return {
    key: `inline:${String(item?.metric?.kind || "value").trim().toLowerCase() || "value"}`,
    label,
    numeric,
    value: formatCompactMetric(numeric, locale),
  };
};

export const resolveRankingPreviewGovernance = ({
  item = {},
  rankingMeta = {},
  sourceName = "",
  locale = "zh-CN",
  description = "",
  authorVisible = false,
} = {}) => {
  const normalizedSource = String(sourceName || "").trim();
  const inlineMetric = resolveInlineMetric(item, normalizedSource, locale);
  const heat = resolvePreviewHeat(item, normalizedSource);
  const nextDescription = removeRedundantPreviewDescription({
    sourceName: normalizedSource,
    description,
    title: item?.displayTitle || item?.title || item?.originalTitle || "",
    author: item?.author || "",
  });

  const context = (Array.isArray(rankingMeta?.context) ? rankingMeta.context : [])
    .filter((meta) => !(authorVisible && meta?.key === "author"));

  const metrics = (Array.isArray(rankingMeta?.metrics) ? rankingMeta.metrics : [])
    .filter((metric) => {
      if (isRankMetric(metric)) return false;
      if (inlineMetric && metric?.label === inlineMetric.label) return false;
      if (
        heat !== null &&
        String(metric?.key || "").toLowerCase() === "display:value" &&
        HEAT_LIKE_VALUE_SOURCES.has(normalizedSource)
      ) {
        return false;
      }
      if (isGenericMetric(metric)) return false;
      return true;
    });

  const nextRankingMeta = {
    ...rankingMeta,
    context,
    metrics,
    hasMetrics: metrics.length > 0,
    hasContent: context.length > 0 || metrics.length > 0,
  };

  return {
    description: nextDescription,
    rankingMeta: nextRankingMeta,
    heat,
    inlineMetric,
  };
};

export const resolveRankingPreviewMode = ({
  hasCover = false,
  description = "",
  rankingMeta = {},
} = {}) => {
  const contextCount = Array.isArray(rankingMeta?.context)
    ? rankingMeta.context.length
    : 0;
  const metricCount = Array.isArray(rankingMeta?.metrics)
    ? rankingMeta.metrics.length
    : 0;
  const metaCount = contextCount + metricCount;
  const hasDescription = Boolean(String(description || "").trim());

  if (!hasDescription && metaCount === 0) {
    return hasCover ? "media-only" : "hidden";
  }
  if (!hasDescription && metaCount === 1) {
    return hasCover ? "compact-detail" : "compact-text";
  }
  return "detail";
};
