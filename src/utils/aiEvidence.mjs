import { aiTimes } from "./aiTime.js";
export { aiTime, aiTimes } from "./aiTime.js";
// Display evidence without upgrading aggregation associations into verification.
export const aiMeta = (item) => item?.extra?.aiSignal || {};
export const aiPrimarySource = (item) =>
  aiMeta(item).primarySource || aiMeta(item).confirmations?.[0]?.source || "";

export function aiSafeUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.href : "";
  } catch { return ""; }
}
function evidenceKey(value) {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key)) url.searchParams.delete(key);
  }
  return url.href;
}
export function aiEvidence(item) {
  const primary = aiPrimarySource(item);
  const entries = Array.isArray(aiMeta(item).confirmations) ? aiMeta(item).confirmations : [];
  const candidates = [...entries, {
    source: primary, sourceLabel: aiMeta(item).primarySourceLabel,
    title: item?.originalTitle || item?.title, url: item?.url, publishedAt:item?.publishedAt,originalRank:aiMeta(item).primaryRank || item?.rank,metric:item?.displayMetric || item?.metric,
  }];
  const seen = new Set();
  return candidates.flatMap((entry) => {
    const url = aiSafeUrl(entry?.url);
    if (!url || !String(entry?.title || "").trim()) return [];
    const key = evidenceKey(url);
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ source: String(entry.source || ""), sourceLabel: entry.sourceLabel || "",
      title: String(entry.title), url, publishedAt:entry.publishedAt,originalRank:entry.originalRank,metric:entry.metric,role: aiSourceRole(entry.source) }];
  }).sort((a, b) => Number(b.source === primary) - Number(a.source === primary));
}
export const aiAssociatedSourceCount = (item) =>
  new Set(aiEvidence(item).map((entry) => entry.source).filter(Boolean)).size;
const OFFICIAL_CHANNELS = new Set(["minimax-blog", "kimi-blog", "qwen-blog", "qwen-model-updates", "gemini-blog","openai-news", "openai-research", "anthropic-news",
  "deepmind-blog", "meta-ai-blog", "xai-news", "mistral-news", "cohere-blog", "codex-releases", "claude-code-releases",
  "openai", "cohere", "mistral", "meta-ai"]);
const NEWS_CHANNELS = new Set(["qbitai-ai", "sina-ai", "36kr-ai", "geekpark-ai", "ithome-ai"]);
export const AI_DISCUSSION_CHANNELS = Object.freeze(['tieba','hackernews-ai','hackernews','reddit-localllama','reddit-artificial','reddit-machinelearning','linuxdo','v2ex','nodeseek','52pojie','zhihu','lobsters','hatena-hot','stackoverflow','csdn','juejin','devto']);
export function aiSourceRole(source) {
  if (OFFICIAL_CHANNELS.has(source) || ['openai-devs-x','openai-x','anthropic-x'].includes(source) || /^ai-vendor-(qwen|deepseek|kimi|glm|minimax|mistral|google|nvidia)$/.test(source)) return "official";
  if (NEWS_CHANNELS.has(source)) return "news";
  if (["huggingface-blog", "ai-author-thsottiaux", "openai-x", "anthropic-x", "simon-blog", "lilian-blog", "chip-blog", "simon-bluesky", "eugene-bluesky"].includes(source)) return "author";
  if (["hf-models", "hf-papers", "paperswithcode", "producthunt-ai", "weibo"].includes(source)) return "index";
  if (AI_DISCUSSION_CHANNELS.includes(source)) return "discussion";
  if (source === "github-ai-trending") return "repository";
  return "unknown";
}
// An untyped hot scalar is intentionally not interpreted as votes, likes or stars.
export function aiMetric(item) {
  const metric = item?.displayMetric;
  if (!metric || !["stars-today", "points", "likes", "downloads", "comments", "views"].includes(metric.kind))
    return null;
  if (metric.value === null || metric.value === undefined || metric.value === "") return null;
  const value = Number(metric.value);
  return Number.isFinite(value) && value >= 0 ? { kind: metric.kind, value } : null;
}
export function aiFeedState(feed) {
  if (feed?.stale === true || feed?.status === "stale") return "stale";
  if (["failed", "error", "unavailable"].includes(feed?.status)) return "failed";
  if (feed?.status === "empty" || (feed?.status === "ok" && Number(feed.count) === 0)) return "empty";
  if (feed?.status === "ok" && Number(feed.count) > 0) return "ok";
  return "unknown";
}
export function aiCompare(a, b, sort = "smart") {
  const score = (item) => Number.isFinite(Number(aiMeta(item).score)) ? Number(aiMeta(item).score) : 0;
  if (sort === "latest") {
    const diff = (aiTimes(b).published || 0) - (aiTimes(a).published || 0);
    if (diff) return diff;
  }
  if (sort === "resonance") {
    const diff = aiAssociatedSourceCount(b) - aiAssociatedSourceCount(a);
    if (diff) return diff;
  }
  return score(b) - score(a);
}
