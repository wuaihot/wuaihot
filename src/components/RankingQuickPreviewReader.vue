<template>
  <div ref="readerRoot" class="ranking-quick-reader">
    <div class="ranking-quick-reader__tools">
      <strong id="ranking-quick-title">{{ copy.preview }}</strong>
      <button type="button" :aria-label="copy.close" @click="emit('close')">×</button>
      <a :href="fullHref" @click="openFull">{{ copy.full }} ↗</a>
    </div>
    <label class="ranking-quick-reader__search">
      <span class="sr-only">{{ copy.search }}</span>
      <input type="search" :aria-label="copy.search" :placeholder="copy.search" :value="query" @input="updateQuery($event.target.value)" />
    </label>
    <List />
  </div>
</template>
<script setup>
import { computed, provide, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import List from "@/views/List.vue";
import { RANKING_READER_CONTEXT } from "@/composables/useRankingReaderContext";
import { createRankingPreviewContext } from "@/utils/rankingPreviewContext";
const props = defineProps({ target: { type: Object, required: true } });
const emit = defineEmits(["close"]);
const actualRouter = useRouter();
const context = createRankingPreviewContext(actualRouter, props.target);
provide(RANKING_READER_CONTEXT, context);
const readerRoot = ref(null);
watch(() => context.route.fullPath, () => {
  readerRoot.value?.closest(".n-scrollbar-container")?.scrollTo({ top:0, behavior:"instant" });
}, { flush:"post" });
const { locale } = useI18n({ useScope: "global" });
const copy = computed(() => ({
  "zh-CN": { preview:"榜单预览", full:"独立详情", close:"关闭预览", search:"搜索此榜单" },
  "zh-TW": { preview:"榜單預覽", full:"獨立詳情", close:"關閉預覽", search:"搜尋此榜單" },
  en: { preview:"Ranking preview", full:"Open full page", close:"Close preview", search:"Search this ranking" },
  ja: { preview:"ランキングプレビュー", full:"詳細ページ", close:"閉じる", search:"ランキング内検索" },
  ko: { preview:"랭킹 미리보기", full:"상세 페이지", close:"닫기", search:"랭킹 검색" },
})[locale.value] || { preview:"Ranking preview", full:"Open full page", close:"Close preview", search:"Search this ranking" });
const fullHref = computed(() => actualRouter.resolve({ path:context.route.path, query:context.route.query }).href);
const query = computed(() => String(context.route.query.q || ""));
const updateQuery = value => {
  const next = { ...context.route.query };
  if (value.trim()) next.q = value; else delete next.q;
  delete next.page;
  context.router.replace({ path:context.route.path, query:next });
};
const openFull = event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  emit("close");
  actualRouter.push({ path:context.route.path, query:context.route.query });
};
</script>
<style scoped>
.ranking-quick-reader { min-width:0; padding:0 18px 24px; }
.ranking-quick-reader__tools { display:flex; align-items:center; gap:16px; min-height:58px; position:sticky; top:0; z-index:4; background:var(--n-color); border-bottom:1px solid var(--n-border-color); }
.ranking-quick-reader__tools strong { flex:1; font-weight:600; font-size:14px; }
.ranking-quick-reader__tools a { order:1; color:inherit; font-size:13px; text-decoration:none; min-height:44px; display:flex; align-items:center; }
.ranking-quick-reader__tools button { order:2; display:grid; place-items:center; width:44px; height:44px; border:0; border-radius:5px; background:transparent; color:inherit; cursor:pointer; font-size:24px; }
.ranking-quick-reader__tools button:hover { background:var(--n-action-color); }
.ranking-quick-reader__search { display:block; margin:12px 0; }
.ranking-quick-reader__search input { width:100%; height:38px; box-sizing:border-box; border:1px solid var(--n-border-color); border-radius:5px; color:inherit; background:transparent; padding:0 10px; font:inherit; }
.ranking-quick-reader :deep(.category-stream__main) { max-width:none; }
.ranking-quick-reader :deep(.category-stream__context) { border-radius:0; border:0; padding:8px 0 12px; margin:0; }
.ranking-quick-reader :deep(.list .card) { background:transparent; border:0; }
.ranking-quick-reader :deep(.list .n-card-header) { padding:12px 0; }
.ranking-quick-reader :deep(.list .n-card__content) { padding:0; }
.sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }
@media(max-width:600px) { .ranking-quick-reader { padding:0 12px 20px; } .ranking-quick-reader__search input { height:44px; } }
</style>
