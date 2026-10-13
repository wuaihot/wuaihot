<template>
  <div class="ai-reader-controls" :style="themeStyle">
    <div class="ai-control-filters">
      <AiReaderFilter v-for="filter in filters" :key="filter.key" :filter="filter" :hint="filter.key === 'source' ? copy.filterHint : ''" @change="$emit('filter-change',$event)" />
    </div>
    <fieldset class="ai-display-options"><legend>{{ copy.display }}</legend><label v-for="key in ['summaries','images','compact','original']" :key="key"><input type="checkbox" :checked="modelValue[key]" @change="update(key,$event.target.checked)" /><span>{{ copy[key] }}</span></label></fieldset>
    <label v-if="associatedCount || associatedOnly" class="ai-associated-option"><input type="checkbox" :checked="associatedOnly" @change="$emit('update:associated-only',$event.target.checked)" /><span>{{ associatedLabel }} · {{ associatedCount }}</span></label>
    <PageWidthControl scope="topic" />
    <button type="button" class="ai-reset-reader" @click="$emit('update:modelValue',{...AI_READER_DEFAULTS})">{{ copy.resetReader }}</button>
    <nav class="ai-reader-pager" :aria-label="boardCopy.full">
      <button type="button" :disabled="page<=1" :aria-label="boardCopy.previousPage" @click="$emit('page-change',page-1)">‹</button><span>{{ page }} / {{ pageCount }}</span><button type="button" :disabled="page>=pageCount" :aria-label="boardCopy.nextPage" @click="$emit('page-change',page+1)">›</button>
    </nav>
  </div>
</template>
<script setup>
import { computed } from "vue";
import { useThemeVars } from "naive-ui";
import AiReaderFilter from "./AiReaderFilter.vue";
import PageWidthControl from "./PageWidthControl.vue";
import { AI_READER_DEFAULTS, normalizeAiReader } from "@/utils/aiWorkspace.mjs";
const props=defineProps({modelValue:{type:Object,required:true},copy:{type:Object,required:true},filters:{type:Array,default:()=>[]},boardCopy:{type:Object,required:true},associatedOnly:Boolean,associatedCount:{type:Number,default:0},associatedLabel:{type:String,default:''},page:{type:Number,default:1},pageCount:{type:Number,default:1}});
const emit=defineEmits(['update:modelValue','filter-change','update:associated-only','page-change']);
const theme=useThemeVars();
const themeStyle=computed(()=>({'--reader-text':theme.value.textColor2,'--reader-muted':theme.value.textColor3,'--reader-danger':theme.value.errorColor,'--reader-action':theme.value.primaryColor,'--reader-border':theme.value.borderColor,'--reader-hover':theme.value.hoverColor,'--reader-panel':theme.value.cardColor}));
const update=(key,value)=>emit('update:modelValue',normalizeAiReader({...props.modelValue,[key]:value}));
</script>
<style scoped>
.ai-reader-controls{display:grid;gap:10px;min-width:0;color:var(--reader-text);font-size:12px}.ai-control-scope{margin:0;color:var(--reader-muted);font-size:11px}.ai-control-filters{display:grid;gap:6px;min-width:0}
fieldset{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 8px;padding:8px 0 0;margin:0;border:0;border-top:1px solid var(--reader-border)}legend{padding:0;font-size:11px;color:var(--reader-muted)}label{display:flex;align-items:center;gap:6px;min-height:36px;cursor:pointer}input{width:15px;height:15px;margin:0;accent-color:var(--reader-action);flex:none}
.ai-reset-reader{width:fit-content;border-color:transparent;font-size:11px;color:var(--reader-muted)}
.ai-reader-pager{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:8px;border-top:1px solid var(--reader-border)}.ai-reader-pager span{font-variant-numeric:tabular-nums;color:var(--reader-muted)}button{min-width:36px;min-height:36px;border:1px solid var(--reader-border);padding:4px 6px;border-radius:6px;background:var(--reader-panel);color:var(--reader-text);font:inherit;cursor:pointer}button:hover:not(:disabled){background:var(--reader-hover)}button:disabled{opacity:.4;cursor:default}
:is(button,input):focus-visible{outline:2px solid var(--reader-action);outline-offset:3px}@media(max-width:680px){label,button{min-height:44px}}
</style>
