import {normalizeRankingMetric} from './rankingMetricSemantics.js';
import { formatCompactMetric } from "./compactMetric.js";
import {calendarPublicationDate,formatCalendarPublicationDate} from './publicationDates.js';

const LABELS = {
  "zh-CN": { author: "作者", published: "发布", hot: "热度", views: "阅读", likes: "点赞", comments: "评论", collects: "收藏" },
  "zh-TW": { author: "作者", published: "發布", hot: "熱度", views: "閱讀", likes: "讚", comments: "評論", collects: "收藏" },
  en: { author: "Author", published: "Published", hot: "Heat", views: "Views", likes: "Likes", comments: "Comments", collects: "Saves" },
  ja: { author: "投稿者", published: "公開", hot: "注目度", views: "閲覧", likes: "いいね", comments: "コメント", collects: "保存" },
  ko: { author: "작성자", published: "게시", hot: "인기도", views: "조회", likes: "좋아요", comments: "댓글", collects: "저장" },
};

const PRIMARY_METRIC_PREFIXES = [
  ["read-", "views"],
  ["like-", "likes"],
  ["collect-", "collects"],
];

const HEAT_LABELS = new Set([
  "热度",
  "熱度",
  "heat",
  "注目度",
  "인기도",
]);

const normalizeLocale = (locale = "zh-CN") => {
  const value = String(locale || "").toLowerCase();
  if (value.startsWith("zh-tw")) return "zh-TW";
  if (value.startsWith("en")) return "en";
  if (value.startsWith("ja")) return "ja";
  if (value.startsWith("ko")) return "ko";
  return "zh-CN";
};

const normalizeMetric = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
};

const buildMetric = (key, numeric, labels, locale, isPrimary = false) => ({
  key,
  label: labels[key],
  value: formatCompactMetric(numeric, locale),
  numeric,
  isPrimary,
});

const buildDisplayMetric = (metric = {}, locale = "zh-CN", isPrimary = false) => {
  const numeric = normalizeMetric(metric?.value);
  if (numeric === null) return null;
  const kind = String(metric?.kind || "value").trim().toLowerCase() || "value";
  const label = String(metric?.label || "").trim();
  return {
    key: `display:${kind}`,
    label: label || kind,
    value: formatCompactMetric(numeric, locale),
    numeric,
    isPrimary,
  };
};


export const getRankingPrimaryMetricKey = (variant = "") => {
  const normalized = String(variant || "").trim().toLowerCase();
  return PRIMARY_METRIC_PREFIXES.find(([prefix]) => normalized.startsWith(prefix))?.[1] || "hot";
};

export const getRankingItemTimestamp = (item = {}, updateTime = "") =>
  item?.timestamp ||
  Date.parse(item?.publishedAt || "") ||
  Date.parse(updateTime || "") ||
  Date.now();
export const formatRankingPublishedAt = (value, locale = "zh-CN") => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !calendarPublicationDate(value)) return "";
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const normalized = normalizeLocale(locale);
  if (calendarPublicationDate(value)) return formatCalendarPublicationDate(value,normalized,{month:'short',day:'numeric',...(date.getUTCFullYear() !== new Date().getFullYear() ? {year:'numeric'} : {})});
  const options = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  if (date.getFullYear() !== new Date().getFullYear()) options.year = "numeric";
  try {
    return new Intl.DateTimeFormat(normalized, options).format(date);
  } catch {
    return date.toISOString();
  }
};

export const getRankingItemMeta = (item = {}, locale = "zh-CN", context = {}) => {
  item=normalizeRankingMetric(item,context.sourceName);
  const normalized = normalizeLocale(locale);
  const labels = LABELS[normalized];
  const metadataContext = [];
  const author = String(item?.author || "").trim();
  if (author && !context?.authorVisible) {
    metadataContext.push({ key: "author", label: labels.author, value: author });
  }
  const published = formatRankingPublishedAt(item?.publishedAt, normalized);
  if (published) metadataContext.push({ key: "published", label: labels.published, value: published });
  const metricOrder = ["views", "likes", "comments", "collects"];
  const promotePrimary = context?.promotePrimary !== false;
  const requestedPrimaryMetricKey = promotePrimary
    ? getRankingPrimaryMetricKey(context?.variant)
    : null;
  const displayMetricKind = String((item?.displayMetric || item?.metric)?.kind || "").trim().toLowerCase();
  const displayMetricLabel = String((item?.displayMetric || item?.metric)?.label || "").trim().toLowerCase();
  const displayMetricNumeric = normalizeMetric(item?.metric?.value);
  const displayMetricIsHeat =
    displayMetricNumeric !== null &&
    (displayMetricKind === "heat" ||
      (displayMetricKind === "value" && HEAT_LABELS.has(displayMetricLabel)));
  const displayMetricMatches = (key) =>
    displayMetricNumeric !== null &&
    (key === "hot" ? displayMetricIsHeat : displayMetricKind === key);
  const primaryNumeric =
    requestedPrimaryMetricKey === null
      ? null
      : normalizeMetric(
          requestedPrimaryMetricKey === "hot"
            ? item?.hot
            : item?.metrics?.[requestedPrimaryMetricKey],
        ) ??
        (displayMetricMatches(requestedPrimaryMetricKey)
          ? displayMetricNumeric
          : null);
  const fallbackNumeric =
    requestedPrimaryMetricKey && requestedPrimaryMetricKey !== "hot"
      ? normalizeMetric(item?.hot) ??
        (displayMetricMatches("heat") ? displayMetricNumeric : null)
      : null;
  const resolvedPrimaryNumeric = primaryNumeric ?? fallbackNumeric;
  const legacyPrimaryMetric =
    requestedPrimaryMetricKey && resolvedPrimaryNumeric !== null
      ? buildMetric(
          requestedPrimaryMetricKey,
          resolvedPrimaryNumeric,
          labels,
          normalized,
          true,
        )
      : null;
  const genericDisplayMetric =
    displayMetricNumeric !== null &&
    !displayMetricIsHeat &&
    !metricOrder.includes(displayMetricKind)
      ? buildDisplayMetric(item.metric, normalized, promotePrimary)
      : null;
  const primaryMetric = promotePrimary
    ? legacyPrimaryMetric ?? genericDisplayMetric
    : null;
  const primaryMetricKey = primaryMetric?.key ?? requestedPrimaryMetricKey;

  const metricValue = (key) =>
    normalizeMetric(item?.metrics?.[key]) ??
    (displayMetricMatches(key) ? displayMetricNumeric : null);

  const secondaryMetrics = metricOrder
    .filter((key) => key !== requestedPrimaryMetricKey)
    .flatMap((key) => {
      const numeric = metricValue(key);
      return numeric === null
        ? []
        : [buildMetric(key, numeric, labels, normalized)];
    });

  const metrics = promotePrimary
    ? [...(primaryMetric ? [primaryMetric] : []), ...secondaryMetrics]
    : [
        ...metricOrder.flatMap((key) => {
          const numeric = metricValue(key);
          return numeric === null
            ? []
            : [buildMetric(key, numeric, labels, normalized)];
        }),
        ...(genericDisplayMetric
          ? [{ ...genericDisplayMetric, isPrimary: false }]
          : []),
      ];


  return {
    context: metadataContext,
    primaryMetricKey,
    primaryMetric,
    metrics,
    hasMetrics: metrics.length > 0,
    hasContent: metadataContext.length > 0 || metrics.length > 0,
  };
};
