<template>
  <nav class="reader-navigation" :aria-label="copy.switcher" :style="themeStyle">
    <div class="reader-navigation__filters">
      <label><span class="sr-only">{{ copy.search }}</span><input ref="search" v-model="navigationQuery" type="search" :placeholder="copy.search" :aria-label="copy.search" /></label>
      <label><span class="sr-only">{{ copy.domain }}</span><NativeSelectShell class="reader-navigation__domain"><select v-model="readerDomain" :aria-label="copy.domain"><option v-for="domain in readerDomains" :key="domain.scope" :value="domain.scope">{{ domain.label }}</option></select></NativeSelectShell></label>
    </div>
    <div ref="viewport" class="reader-navigation__viewport">
      <ul v-if="candidates.length">
        <li v-for="node in candidates" :key="node.id" :data-current="isCurrent(node)">
          <router-link :to="nodeLocation(node)" :title="node.displayLabel" :aria-current="isCurrent(node) ? 'page' : undefined" @click="follow($event,node)">
            <img :src="getSourceLogo(node.sourceName)" alt="" @error="logoError" /><span>{{ node.displayLabel }}</span>
          </router-link>
          <button type="button" :aria-pressed="isFavorite(node.favoriteId || node.id)" :aria-label="(isFavorite(node.favoriteId || node.id) ? copy.unpin : copy.pin) + ' ' + node.displayLabel" @click="toggleFavorite(node.favoriteId || node.id)">{{ isFavorite(node.favoriteId || node.id) ? '★' : '☆' }}</button>
        </li>
      </ul>
      <p v-else>{{ copy.empty }}</p>
    </div>
    <div class="reader-navigation__footer">
      <router-link :to="categoryLocation(readerDomain)"><CatalogViewIcon />{{ copy.directory }}</router-link>
    </div>
  </nav>
</template>
<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { mainStore } from '@/store';
import { useThemeVars } from 'naive-ui';
import { useRankingNavigation } from '@/composables/useRankingNavigation';
import { ALL_SCOPE, getNavigationVariantOptions, getRankingDestinationLabel, getRankingSearchNodes } from '@/utils/rankingNavigation';
import { readSourceSubtype } from '@/utils/sourceSubtypes';
import { matchNavigationEntries } from '@/utils/navigationSearch';
import { getSourceLogo, getSourceLogoFallback } from '@/utils/sourceLogos';
import CatalogViewIcon from '@/components/CatalogViewIcon.vue';
import NativeSelectShell from '@/components/ui/NativeSelectShell.vue';
const props = defineProps({ drawer: Boolean });
const store = mainStore();
const { locale, readerDomains, readerDomain, navigationQuery, sourceName, variant, nodeLocation, navigate, isFavorite, toggleFavorite, categoryLocation } = useRankingNavigation();
const viewport = ref(null), search = ref(null);
const theme = useThemeVars();
const themeStyle = computed(() => ({ '--reader-text': theme.value.textColor2, '--reader-muted': theme.value.textColor3, '--reader-border': theme.value.borderColor, '--reader-hover': theme.value.hoverColor, '--reader-primary': theme.value.primaryColor, '--reader-bg': theme.value.cardColor }));
const labels = {
 'zh-CN': ['切换榜单','搜索平台、榜单','领域','加入常用','取消收藏','没有匹配的榜单','查看分类目录'],
 'zh-TW': ['切換榜單','搜尋平台、榜單','領域','加入常用','取消收藏','沒有符合的榜單','查看分類目錄'],
 en: ['Switch ranking','Find source or ranking','Domain','Save','Unsave','No matching rankings','Open category directory'],
 ja: ['ランキングを切替','情報源・ランキングを検索','分野','保存','保存を解除','一致するランキングなし','分類一覧へ'],
 ko: ['랭킹 전환','출처·랭킹 검색','분야','저장','저장 해제','일치하는 랭킹 없음','분류 목록 열기'],
};
const copy = computed(() => Object.fromEntries(['switcher','search','domain','pin','unpin','empty','directory'].map((key,i)=>[key,(labels[locale.value]||labels.en)[i]])));
const candidates = computed(() => {
 const q = navigationQuery.value.trim();
 const domain = readerDomains.value.find(item=>item.scope === (q ? ALL_SCOPE : readerDomain.value));
 return (domain?.children || []).flatMap(node => {
   const source = store.newsArr.find(item=>item.name === node.sourceName);
   const options = getNavigationVariantOptions(source, node.scope, store.categories);
   if (q) return matchNavigationEntries(getRankingSearchNodes(node, locale.value, options), q, options.length).map(item=>({ ...item, displayLabel:item.label }));
   const preferred = node.sourceName === sourceName.value ? variant.value : readSourceSubtype(node.sourceName);
   const selected = options.find(item=>String(item.value||'') === String(preferred||'')) || options.find(item=>String(item.value||'') === String(node.variant||'')) || options[0];
   const target = { ...node, variant: selected?.value || '' };
   return [{ ...target, displayLabel:getRankingDestinationLabel(target,locale.value) }];
 });
});
const isCurrent = node => node.sourceName === sourceName.value && String(node.variant||'') === String(variant.value||'');
const follow = (event,node) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); navigate(node); };
const logoError = event => { event.target.src = getSourceLogoFallback(); };
const ensureVisible = async () => {
 await nextTick();
 const el = viewport.value?.querySelector('[data-current="true"]');
 if (!el || !viewport.value) return;
 const bounds = viewport.value.getBoundingClientRect(), rect = el.getBoundingClientRect();
 if (rect.top < bounds.top || rect.bottom > bounds.bottom) viewport.value.scrollTop += rect.top - bounds.top - 60;
};
watch(()=>[sourceName.value,variant.value,readerDomain.value],ensureVisible,{flush:'post'});
onMounted(()=>{ if (props.drawer) search.value?.focus(); void ensureVisible(); });
</script>
<style scoped>
.reader-navigation { display:flex; flex-direction:column; min-width:0; height:100%; color:var(--reader-text); font-size:13px; }
.reader-navigation button, .reader-navigation input, .reader-navigation select { font:inherit; color:inherit; }
.reader-navigation button { cursor:pointer; background:transparent; border:0; border-radius:5px; }
.reader-navigation__filters { padding:8px 10px 10px; display:grid; grid-template-columns:minmax(0,1fr) 78px; gap:6px; }
.reader-navigation__filters label { min-width:0; }
.reader-navigation__filters input, .reader-navigation__filters select { width:100%; min-width:0; box-sizing:border-box; border:1px solid var(--reader-border); border-radius:5px; background:var(--reader-bg); min-height:36px; padding-block:6px; padding-inline-start:8px; font-size:12px; }
.reader-navigation__domain { width:100%; min-width:0; }
.reader-navigation__viewport { flex:1; min-height:0; overflow:auto; scrollbar-width:thin; overscroll-behavior:contain; padding:0 6px 12px; }
.reader-navigation__viewport ul { list-style:none; padding:0; margin:0; }
.reader-navigation__viewport li { display:flex; align-items:center; min-height:36px; border-radius:5px; }
.reader-navigation__viewport a { display:flex; align-items:center; gap:8px; flex:1; min-width:0; padding:7px 8px; text-decoration:none; color:inherit; }
.reader-navigation__viewport a span { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.reader-navigation__viewport img { width:17px; height:17px; object-fit:contain; border-radius:3px; flex-shrink:0; }
.reader-navigation__viewport button { width:32px; flex-shrink:0; align-self:stretch; color:var(--reader-muted); }
.reader-navigation__viewport button[aria-pressed=true] { color:var(--reader-primary); }
.reader-navigation__viewport li[data-current=true] { color:var(--reader-primary); background:var(--reader-hover); font-weight:600; }
.reader-navigation__viewport p { padding:12px; color:var(--reader-muted); }
.reader-navigation__footer { display:flex; gap:5px; padding:8px; border-top:1px solid var(--reader-border); font-size:11px; }
.reader-navigation__footer a { display:inline-flex; align-items:center; gap:6px; color:var(--reader-muted); padding:8px 4px; text-decoration:none; }
.reader-navigation a:hover, .reader-navigation button:hover { background:var(--reader-hover); }
.reader-navigation :is(a,button,input,select):focus-visible { outline:2px solid var(--reader-primary); outline-offset:-2px; }
.sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; }
@media (max-width:1099px), (pointer:coarse) {
 .reader-navigation__filters { grid-template-columns:minmax(0,1fr) 88px; }
 .reader-navigation__filters input, .reader-navigation__filters select { min-height:44px; font-size:16px; }
 .reader-navigation__viewport li, .reader-navigation__viewport button, .reader-navigation__footer a { min-height:44px; }
 .reader-navigation__viewport button { width:44px; }
}
</style>
