<template>
  <label class="ranking-time-filter">
    <span>{{ zh ? '时间范围' : 'Time range' }}</span>
    <NativeSelectShell class="ranking-time-filter__select">
      <select :value="selected" :disabled="disabled" :aria-label="zh ? '时间范围' : 'Time range'" @change="$emit('change', $event.target.value)">
        <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.unavailable">{{ option.label }}</option>
      </select>
    </NativeSelectShell>
    <small v-if="!nativeOptions.length && !compact">{{ zh ? '来源未提供历史榜；显示最新快照' : 'Live ranking; no history provided' }}</small>
  </label>
</template>
<script setup>
import {computed} from 'vue';
import NativeSelectShell from '@/components/ui/NativeSelectShell.vue';
import {useI18n} from 'vue-i18n';
import {useTrendsCatalogRevision} from '@/composables/useTrendsCatalogRevision';
import {getSourcePeriodOptions} from '@/utils/sourceSubtypes';
import {rankingPeriodLabel} from '@/utils/rankingPeriods.mjs';
const props=defineProps({sourceName:{type:String,required:true},activeVariant:{type:String,default:''},disabled:Boolean,compact:Boolean});
defineEmits(['change']);
const {locale}=useI18n({useScope:'global'});
const revision=useTrendsCatalogRevision();
const zh=computed(()=>locale.value.startsWith('zh'));
const nativeOptions=computed(()=>{revision.value;return getSourcePeriodOptions(props.sourceName,props.activeVariant)});
const selected=computed(()=>nativeOptions.value.length?props.activeVariant:'live');
const options=computed(()=>{
 const supported=nativeOptions.value.map(o=>({value:o.value,label:rankingPeriodLabel(o.period,locale.value),period:o.period}));
 const defaults=supported.length?supported:[{value:'live',label:zh.value?'最新榜单':'Latest ranking',period:'latest'}];
 return [...defaults,...['today','yesterday','week','month'].filter(period=>!defaults.some(o=>o.period===period)).map(period=>({value:'unavailable-'+period,label:rankingPeriodLabel(period,locale.value)+(zh.value?' · 未提供':' · Unavailable'),unavailable:true}))];
});
</script>
<style scoped>
.ranking-time-filter{display:flex;align-items:center;flex-wrap:wrap;gap:8px;color:var(--category-stream-text-2,var(--n-text-color-2,inherit));font-size:12px;min-width:0}
.ranking-time-filter__select{max-width:100%;min-width:0;width:min(190px,100%);color:inherit}
.ranking-time-filter__select :deep(select){font:inherit;color:inherit;background:var(--category-stream-panel,var(--n-color,#fff));border:1px solid var(--category-stream-border,var(--n-border-color,#bbb));border-radius:6px;padding-block:4px;padding-inline-start:7px;cursor:pointer}
small{flex-basis:100%;font-size:11px;opacity:.7;line-height:1.5}.ranking-time-filter__select :deep(select:focus-visible){outline:2px solid var(--category-stream-primary,var(--n-primary-color,#ea444d));outline-offset:2px}
</style>
