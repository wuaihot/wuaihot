import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRouter, createMemoryHistory } from "vue-router";
import { createRankingPreviewContext } from "../src/utils/rankingPreviewContext.js";
const router = createRouter({ history:createMemoryHistory(), routes:[
  { path:"/", name:"home", component:{} },
  { path:"/category/:slug", name:"category", component:{} },
  { path:"/rank/:sourceSlug/:subtypeSlug?", name:"list", component:{} },
] });
await router.push("/?q=catalog");
const background = router.currentRoute.value.fullPath;
const reader = createRankingPreviewContext(router, { path:"/rank/douyin/hot", query:{ scope:"__all__" } });
await reader.router.replace({ path:reader.route.path, query:{ scope:"__all__", q:"AI", page:"2" } });
assert.equal(reader.route.query.page, "2");
assert.equal(reader.router.currentRoute.value.params.sourceSlug, "douyin");
assert.equal(router.currentRoute.value.fullPath, background);
await reader.router.push({ path:"/rank/douyin/society", query:{ scope:"__all__" } });
assert.equal(reader.route.params.subtypeSlug, "society");
assert.equal(reader.route.query.page, undefined);
assert.equal(reader.route.query.q, undefined);
assert.equal(router.currentRoute.value.fullPath, background);
assert.equal(reader.router.resolve({ path:reader.route.path, query:reader.route.query }).href, "/rank/douyin/society?scope=__all__");
await assert.rejects(reader.router.push("/category/ai"), /stay in the ranking reader/);
assert.equal(reader.route.params.subtypeSlug, "society");
assert.equal(router.currentRoute.value.fullPath, background);
assert.throws(() => createRankingPreviewContext(router, "/category/ai"), /ranking route/);
const list=readFileSync("src/views/List.vue","utf8");
const stream=readFileSync("src/components/CategoryStream.vue","utf8");
assert.match(list,/if \(!isQuickPreview\) persistSourceSubtype/);
assert.match(list,/if \(!isQuickPreview\) document.querySelector/);
assert.match(stream,/if \(!isQuickPreview && resolved\) persistSourceSubtype/);
assert.match(stream,/event\.metaKey \|\| event\.ctrlKey/);
console.log("RANKING_QUICK_PREVIEW_OK: isolated source, variant, query and pagination; real detail href; no catalog navigation");
