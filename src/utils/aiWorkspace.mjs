import { aiPrimarySource, aiSourceRole, AI_DISCUSSION_CHANNELS } from "./aiEvidence.mjs";
import { AI_BOARD_LANES } from "./aiCuration.mjs";
import { AI_PRECISION_LANES } from "./aiPrecisionBoard.mjs";
import { aiTimes } from "./aiTime.js";

// The reading feed has its own window; the intelligence board keeps its independent algorithm.
export const AI_READER_WINDOWS = Object.freeze(["24h", "72h", "7d", "all"]);
export const aiReadingInWindow = (item, window = "24h", now = Date.now()) => {
  if (window === "all") return true;
  const hours = { "24h": 24, "72h": 72, "7d": 168 }[window];
  if (!hours) return false;
  const published = aiTimes(item, now).published;
  return published !== null && now >= published && now - published <= hours * 3600000;
};

export const AI_LENSES = ["all", "official", "repositories", "models", "papers", "discussion"];
const LENS_SOURCES = {
  repositories: new Set(["github-ai-trending"]),
  models: new Set(["hf-models"]),
  papers: new Set(["hf-papers", "paperswithcode"]),
  discussion: new Set(AI_DISCUSSION_CHANNELS),
};
// A related official link never upgrades the primary channel's role.
export function aiMatchesLens(item, lens = "all") {
  const source = aiPrimarySource(item);
  if (lens === "discussion" && source === "tieba" && item.extra?.discovery?.variant !== "hot") return false;
  if (lens === "models" && item.extra?.modelRepository) return true;
  if (lens === "official") return aiSourceRole(source) === "official";
  return LENS_SOURCES[lens] ? LENS_SOURCES[lens].has(source) : true;
}
export const AI_READER_DEFAULTS = Object.freeze({
  summaries: true, images: false, original: false, compact: true,
});
export const AI_READER_STORAGE = "wuaihot-ai-reader-v1";
export function normalizeAiReader(value) {
  return Object.fromEntries(Object.entries(AI_READER_DEFAULTS).map(([key, fallback]) =>
    [key, typeof value?.[key] === "boolean" ? value[key] : fallback]));
}
const first = value => Array.isArray(value) ? value[0] : value;
const text = (value, fallback) => typeof first(value) === "string" && first(value) ? first(value) : fallback;
export function readAiQuery(query = {}) {
  const page = Number.parseInt(text(query.page, "1"), 10);
  const size = Number.parseInt(text(query.size, "30"), 10);
  const lens = text(query.lens, "all"), sort = text(query.sort, "smart");
  return {
    lens: AI_LENSES.includes(lens) ? lens : "all",
    category: text(query.category, "all"), source: text(query.source, "all"),
    board: [...AI_PRECISION_LANES,"technical"].includes(first(query.board)) ? first(query.board) : "all",
    time: AI_READER_WINDOWS.includes(first(query.time)) ? first(query.time) : "24h",
    sort: ["smart", "resonance", "latest"].includes(sort) ? sort : "smart",
    confirmed: first(query.confirmed) === "1",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    size: [20, 30, 50, 100].includes(size) ? size : 30,
  };
}
export function buildAiQuery(current = {}, patch = {}) {
  const state = { ...readAiQuery(current), ...patch };
  const result = { ...current };
  for (const key of ["lens", "category", "source", "board", "time", "sort", "confirmed", "page", "size"]) delete result[key];
  for (const key of ["lens", "category", "source", "board"]) if (state[key] !== "all") result[key] = state[key];
  if (state.time !== "24h") result.time = state.time;
  if (state.sort !== "smart") result.sort = state.sort;
  if (state.confirmed) result.confirmed = "1";
  if (state.page > 1) result.page = String(state.page);
  if (state.size !== 30) result.size = String(state.size);
  return result;
}
export function aiItemKey(item) {
  return String(item?.id ?? `${aiPrimarySource(item)}|${item?.url || ""}`);
}
export function aiRefreshChanges(current = [], incoming = []) {
  const before = new Map(current.map(item => [aiItemKey(item), item]));
  const after = new Map(incoming.map(item => [aiItemKey(item), item]));
  const added = [...after.keys()].filter(key => !before.has(key)).length;
  const removed = [...before.keys()].filter(key => !after.has(key)).length;
  const updated = [...after].filter(([key, item]) => before.has(key) &&
    JSON.stringify(before.get(key)) !== JSON.stringify(item)).length;
  const reordered = [...after.keys()].filter(key => before.has(key)).join("\n") !==
    [...before.keys()].filter(key => after.has(key)).join("\n");
  return { added, removed, updated, reordered, total: added + removed + updated };
}
