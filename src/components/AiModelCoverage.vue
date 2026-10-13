<template>
  <section v-if="groups.length" class="model-coverage" :aria-label="copy.title">
    <header><h2>{{ copy.title }} </h2><span>{{ payload.consensus?.length || 0 }} {{ copy.common }}</span></header>
    <p>{{ copy.note }}</p>
    <details v-if="groups.some(g=>g.items.length)"><summary>{{ copy.gaps }}</summary><div class="coverage-grid">
      <section v-for="group in groups" :key="group.key">
        <h3><router-link :to="withLocalePrefix(locale,'/rank/ai-model-board/'+group.key)">{{ group.label }} ↗</router-link><span>{{ group.total }} {{ copy.configs }}</span></h3>
        <ol v-if="group.items.length" class="notranslate" translate="no"><li v-for="row in group.items" :key="row.model"><span>#{{ row.rank }}</span><a :href="aiSafeUrl(row.url) || group.url" target="_blank" rel="noopener noreferrer">{{ row.model }}</a></li></ol>
        <p v-else>{{ copy.covered }}</p>
      </section>
    </div></details>
  </section>
</template>
<script setup>
import {computed} from 'vue';
import {modelCoverageGaps} from '@/utils/aiModels.js';
import {withLocalePrefix} from '@/utils/locale';
import {aiSafeUrl} from '@/utils/aiEvidence.mjs';
const props=defineProps({payload:{type:Object,required:true},locale:{type:String,default:'zh-CN'}});
const groups=computed(()=>modelCoverageGaps(props.payload.boards,props.payload.consensus));
const copy=computed(()=>props.locale.startsWith('zh')?{title:'跨榜综合 · 方法 v2',common:'个共同模型版本',note:'按模型版本归并，取各能力源排名最高的测试配置，平均共同模型内的相对位置。配置不同会明确标注，原始名称与原榜名次见每条“测试依据”。位置指数不等于能力分数；缺测模型不记零分，也不参与排序。',gaps:'原榜高位但尚未共同覆盖的模型',configs:'个测试配置',covered:'原榜前十已全部覆盖。'}:{title:'Cross-board composite · Method v2',common:'common model versions',note:'Group by model version, take the highest-ranked configuration per capability source, and average relative positions within the common cohort. Different settings are explicitly marked; test evidence retains exact names and original ranks. This position index is not a capability score. Missing tests are excluded, never scored as zero.',gaps:'Leading models outside the common coverage',configs:'test configurations',covered:'All original top ten models are covered.'});
</script>
<style scoped>
.model-coverage{padding:12px 14px;margin:8px 0 12px;border:1px solid var(--ai-border,var(--category-stream-border,#ddd));border-radius:7px;background:var(--ai-hover,transparent)}header{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}summary{font-size:12px;cursor:pointer;margin-bottom:8px}h2{font-size:14px;margin:0}header span,p,h3 span{font-size:11px;color:var(--ai-muted,var(--category-stream-text-3,#888))}p{line-height:1.6;margin:6px 0 10px}.coverage-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}h3{display:flex;justify-content:space-between;gap:8px;font-size:12px;margin:0 0 6px}a{color:inherit;text-decoration:none}h3 a{color:var(--ai-action,var(--category-stream-primary,inherit))}ol{list-style:none;margin:0;padding:0;max-height:170px;overflow:auto;scrollbar-width:thin}li{display:flex;gap:8px;align-items:baseline;padding:4px 0;font-size:12px;line-height:1.5}li span{min-width:24px;color:var(--ai-muted,var(--category-stream-text-3,#888));font-size:11px}li a{overflow-wrap:anywhere}a:hover{text-decoration:underline}a:focus-visible{outline:2px solid currentColor;outline-offset:2px}@media(max-width:680px){.coverage-grid{grid-template-columns:1fr}.model-coverage{padding:10px}ol{max-height:140px}}
</style>
