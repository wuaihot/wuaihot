<template>
 <nav v-if="scope !== ALL_SCOPE && visibleNodes.length > 1" class="ranking-category-scope" :aria-label="copy.scope">
  <div class="ranking-category-scope__links">
   <router-link v-for="(node,index) in visibleNodes" :key="node.scope" :to="categoryLocation(node.scope)" :aria-label="index===0 ? node.label + ': ' + copy.all : node.label" :title="index===0 ? node.label + ': ' + copy.all : node.label" :aria-current="scope === node.scope ? 'page' : undefined">{{ index===0 ? copy.all : node.label }}</router-link>
  </div>
 </nav>
</template>
<script setup>
import { computed } from 'vue';
import { useRankingNavigation } from '@/composables/useRankingNavigation';
import { ALL_SCOPE } from '@/utils/rankingNavigation';
const { tree, scope, locale, categoryLocation } = useRankingNavigation();
const labels = {'zh-CN':['分类范围','全部'],'zh-TW':['分類範圍','全部'],en:['Category scope','All'],ja:['分類範囲','すべて'],ko:['분류 범위','전체']};
const copy = computed(()=>({scope:(labels[locale.value]||labels.en)[0],all:(labels[locale.value]||labels.en)[1]}));
const categoryChildren = node=>(node.children||[]).filter(item=>item.kind==='category');
const pathTo = (nodes,id,path=[])=>{for(const node of nodes){if(node.kind!=='category')continue;const next=[...path,node];if(node.scope===id)return next;const found=pathTo(categoryChildren(node),id,next);if(found.length)return found;}return [];};
const visibleNodes = computed(()=>{
 if(scope.value===ALL_SCOPE)return [];
 const path=pathTo(tree.value,scope.value);
 const current=path.at(-1);
 if(!current)return [];
 const parent=categoryChildren(current).length ? current : path.at(-2) || current;
 return [parent,...categoryChildren(parent)];
});
</script>
<style scoped>
.ranking-category-scope { display:flex; align-items:center; justify-content:flex-end; min-width:0; font-size:12px; }
.ranking-category-scope__links { display:flex; align-items:center; gap:4px; min-width:0; max-width:100%; overflow:auto; scrollbar-width:thin; }
.ranking-category-scope a { display:flex; align-items:center; flex-shrink:0; padding:7px 10px; color:inherit; text-decoration:none; white-space:nowrap; border-radius:5px; }
.ranking-category-scope a[aria-current=page] { color:var(--n-primary-color,#ea444d); background:color-mix(in srgb,var(--n-primary-color,#ea444d) 10%,transparent); font-weight:600; }
.ranking-category-scope a:focus-visible { outline:2px solid var(--n-primary-color,#ea444d); outline-offset:-2px; }
@media(max-width:768px) {
 .ranking-category-scope { justify-content:flex-start; }
 .ranking-category-scope__links { width:100%; }
 .ranking-category-scope a { min-height:44px; box-sizing:border-box; }
}
</style>
