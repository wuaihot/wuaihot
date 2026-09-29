import assert from "node:assert/strict";
import {
  removeRedundantPreviewDescription,
  resolveRankingPreviewGovernance,
  resolveRankingPreviewMode,
} from "../src/utils/rankingPreviewGovernance.mjs";

const baseMeta = (metrics = [], context = []) => ({
  context,
  metrics,
  hasMetrics: metrics.length > 0,
  hasContent: metrics.length > 0 || context.length > 0,
});

{
  const governed = resolveRankingPreviewGovernance({
    item: { metric: { kind: "rank", label: "排名", value: 1 }, title: "节目" },
    rankingMeta: baseMeta([{ key: "display:rank", label: "排名", value: "1", numeric: 1 }]),
    sourceName: "apple-podcasts",
    description: "",
  });
  assert.equal(governed.rankingMeta.hasContent, false, "rank is already visible in the list and must not be repeated in hover");
  assert.equal(resolveRankingPreviewMode({ hasCover: true, description: governed.description, rankingMeta: governed.rankingMeta }), "media-only");
}

{
  const governed = resolveRankingPreviewGovernance({
    item: {
      title: "山风山风等等我",
      author: "万海东",
      metric: { kind: "rank", label: "排名", value: 1 },
    },
    rankingMeta: baseMeta(
      [{ key: "display:rank", label: "排名", value: "1", numeric: 1 }],
      [{ key: "author", label: "作者", value: "万海东" }],
    ),
    sourceName: "kuwo-music",
    description: "万海东-山风山风等等我",
    authorVisible: true,
  });
  assert.equal(governed.description, "", "author-title descriptions must not repeat the visible row content");
  assert.equal(governed.rankingMeta.hasContent, false, "visible music authors and rank must not repeat in hover");
}

{
  const governed = resolveRankingPreviewGovernance({
    item: { title: "新浪新闻", metric: { kind: "value", label: "指标", value: 58 } },
    rankingMeta: baseMeta([{ key: "display:value", label: "指标", value: "58", numeric: 58 }]),
    sourceName: "sina-news",
    description: "",
  });
  assert.equal(governed.rankingMeta.hasContent, false, "generic metric-only metadata is not valuable hover content");
  assert.equal(resolveRankingPreviewMode({ hasCover: false, description: governed.description, rankingMeta: governed.rankingMeta }), "hidden");
}

{
  const governed = resolveRankingPreviewGovernance({
    item: { title: "知乎热榜", metric: { kind: "value", label: "指标", value: 29_620_000 } },
    rankingMeta: baseMeta([{ key: "display:value", label: "指标", value: "2962万", numeric: 29_620_000 }]),
    sourceName: "zhihu",
    description: "",
  });
  assert.equal(governed.heat, 29_620_000, "Zhihu generic Display value should be presented as heat");
  assert.equal(governed.rankingMeta.hasContent, false, "heat should use the heat visual instead of a generic metric pill");
  assert.equal(resolveRankingPreviewMode({ hasCover: true, description: governed.description, rankingMeta: governed.rankingMeta }), "media-only");
}

{
  const governed = resolveRankingPreviewGovernance({
    item: { title: "平凡的世界", metric: { kind: "value", label: "借阅次数", value: 374 } },
    rankingMeta: baseMeta([{ key: "display:value", label: "借阅次数", value: "374", numeric: 374 }]),
    sourceName: "hotbook-discovery",
    description: "",
  });
  assert.equal(governed.rankingMeta.metrics.length, 1);
  assert.equal(resolveRankingPreviewMode({ hasCover: true, description: governed.description, rankingMeta: governed.rankingMeta }), "compact-detail");
}

{
  const governed = resolveRankingPreviewGovernance({
    item: { title: "星愿", metric: { kind: "value", label: "销量", value: 39_651 } },
    rankingMeta: baseMeta([{ key: "display:value", label: "销量", value: "3.97万", numeric: 39_651 }]),
    sourceName: "autohome-sales",
    description: "6.48-9.48万 · 4.52分",
  });
  assert.deepEqual(governed.inlineMetric, {
    key: "inline:value",
    label: "销量",
    numeric: 39_651,
    value: "4万",
  });
  assert.equal(governed.rankingMeta.hasContent, false, "inline sales must not repeat in hover");
  assert.equal(governed.description, "6.48-9.48万 · 4.52分");
}

assert.equal(
  removeRedundantPreviewDescription({
    sourceName: "weibo",
    description: "艺人领域 · 标签 热 · 热度 29万",
    title: "赵雷",
  }),
  "",
  "Weibo metadata must not occupy the summary slot",
);

console.log("Ranking preview governance audit passed.");
