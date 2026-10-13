<template>
  <div class="ai-control-filter" :class="{'is-source':filter.key==='source'}">
    <span class="filter-label" :title="hint || undefined">{{ filter.label }}<button v-if="filter.value!==filter.defaultValue" type="button" class="filter-clear" :aria-label="clearLabel" :title="clearLabel" @click="$emit('change',{key:filter.key,value:filter.defaultValue})">×</button></span>
    <n-select v-if="filter.key === 'source'" :value="filter.value" :options="sourceOptions" :render-label="renderSource" :consistent-menu-width="false" :menu-props="{style:'width:min(360px,calc(100vw - 32px))'}" :aria-label="filter.label" :input-props="{'aria-label':filter.label}" filterable size="small" @update:value="$emit('change',{key:filter.key,value:$event ?? filter.defaultValue})" />
    <NativeSelectShell v-else class="ai-control-filter__native">
      <select :value="filter.value" :aria-label="filter.label" @change="$emit('change', { key: filter.key, value: typeof filter.value === 'number' ? Number($event.target.value) : $event.target.value })">
        <option v-for="option in filter.options" :key="option.value" :value="option.value">{{ option.label }}{{ filter.showCount !== false && option.count !== undefined ? ' · ' + option.count : '' }}</option>
      </select>
    </NativeSelectShell>
  </div>
</template>
<script setup>
import { computed, h } from 'vue';
import { getSourceLogo, getSourceLogoFallback } from '@/utils/sourceLogos';
import NativeSelectShell from '@/components/ui/NativeSelectShell.vue';
const props=defineProps({filter:{type:Object,required:true},hint:{type:String,default:''}});
defineEmits(['change']);
const clearLabel=computed(()=> (/[\u4e00-\u9fff]/.test(props.filter.label)?'清除 ':'Clear ')+props.filter.label);
const onLogoError=event=>{event.target.src=getSourceLogoFallback();};
const sourceOptions=computed(()=>props.filter.options.map(option=>({...option,label:option.label+(option.count!==undefined?' · '+option.count:'')})));
const renderSource=option=>h('span',{class:'ai-source-option',style:'display:flex;align-items:center;gap:6px;min-width:0;width:100%' },[
  option.value!=='all' ? h('img',{src:getSourceLogo(option.value),alt:'',style:'width:16px;height:16px;object-fit:contain;flex:none',onError:onLogoError}) : null,
  h('span',{style:'flex:1;min-width:0;white-space:normal;overflow-wrap:anywhere;line-height:1.5'},props.filter.options.find(item=>item.value===option.value)?.label || option.label),
  option.count!==undefined ? h('span',{style:'flex:none;font-size:11px;opacity:.7;font-variant-numeric:tabular-nums'},String(option.count)) : null,
]);
</script>
<style scoped>
.ai-control-filter{display:grid;align-items:center;gap:8px;grid-template-columns:minmax(40px,1fr) minmax(0,140px);min-width:0;min-height:36px}
.filter-label{display:flex;align-items:center;justify-content:space-between;gap:4px}.filter-clear{border:0;background:transparent;color:var(--reader-danger);font:inherit;font-size:18px;cursor:pointer;min-height:28px;min-width:28px;padding:0}.filter-clear:hover{background:var(--reader-hover);border-radius:5px}.filter-clear:focus-visible{outline:2px solid var(--reader-action);outline-offset:2px}.ai-control-filter>span{font-size:11px;color:var(--reader-muted);overflow-wrap:anywhere}
.ai-control-filter.is-source{grid-template-columns:minmax(0,1fr);gap:4px;padding-bottom:4px}
.is-source :deep(.n-base-selection-label){height:auto;min-height:36px;padding-block:4px}.is-source :deep(.n-base-selection-input){overflow:visible;white-space:normal}
.ai-control-filter__native{width:100%;min-width:0}
.ai-control-filter__native :deep(select){min-height:36px;border:1px solid var(--reader-border);border-radius:6px;padding-inline-start:5px;background:var(--reader-panel);color:var(--reader-text);font:inherit;cursor:pointer}
.ai-control-filter__native :deep(select:focus-visible){outline:2px solid var(--reader-action);outline-offset:2px}
:deep(.n-base-selection){min-height:36px}:deep(.n-base-selection-label){min-height:34px}
@media(max-width:680px){.filter-clear{min-height:44px;min-width:36px}.ai-control-filter__native :deep(select),:deep(.n-base-selection){min-height:44px}:deep(.n-base-selection-label){min-height:42px}}
</style>
