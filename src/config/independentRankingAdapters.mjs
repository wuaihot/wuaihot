// Independent public ranking adapters. Catalog read surfaces retain their own admission rules.
// Each entry has an existing same-origin proxy and a separately verified read contract.
export const INDEPENDENT_RANKING_ADAPTERS = Object.freeze({
  "openrouter-rankings": { transport: "same-origin", staticVariants: true },
  "ai-x-updates": { transport: "same-origin", handler: "ai-social" },
  "anthropic-news": { transport: "same-origin", handler: "ai-publications" },
  "ai-official-intake": { transport: "same-origin", handler: "ai-intake" },
  "ai-model-board": { transport: "same-origin", handler: "ai-models" },
  livebench: { transport: "same-origin", handler: "ai-models" },
  "reddit-machinelearning": { transport: "same-origin" },
  "reddit-artificial": { transport: "same-origin" },
  "lolesports-news": { transport: "same-origin", handler: "lol-official" },
  "sina-ai": { transport: "same-origin" },
  coolapk: { transport: "same-origin" },
  github: { transport: "same-origin" },
  tianya: { transport: "same-origin" },
  "51cto": { transport: "same-origin" },
  jianshu: { transport: "same-origin" },
  "arena-ai": { transport: "same-origin" },
  designarena: { transport: "same-origin" },
  paperswithcode: { transport: "same-origin" },
  "reddit-localllama": { transport: "same-origin" },
});
export const hasIndependentRankingAdapter = (sourceName) =>
  Object.prototype.hasOwnProperty.call(INDEPENDENT_RANKING_ADAPTERS, String(sourceName || ""));
