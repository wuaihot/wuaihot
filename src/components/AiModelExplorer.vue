<template>
  <section class="model-boards" :aria-label="zh?'AI 模型与榜单看板':'AI benchmark boards'">
    <span class="model-board-announcement" role="status">{{ announcement }}</span>
    <draggable class="model-board-grid" :model-value="selections" :item-key="key => key" :animation="reducedMotion ? 0 : 180"
      handle=".model-board-drag-handle" :fallback-tolerance="8" :touch-start-threshold="8"
      ghost-class="model-board-ghost" chosen-class="model-board-chosen" @update:model-value="reorder">
      <template #item="{ element: key, index }">
      <section :key="key" class="model-board-card" :data-model-board="key" :title="caption(key)+(board(key)?.version?' · '+board(key).version:'')">
        <header>
          <button type="button" class="model-board-drag-handle" :aria-label="(zh?'调整榜单顺序：':'Reorder board: ')+label(key)"
            :title="zh?'拖动排序；键盘左右方向键调整':'Drag to reorder; use left and right arrow keys'"
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
            @keydown.left.prevent="move(key,-1)" @keydown.up.prevent="move(key,-1)"
            @keydown.right.prevent="move(key,1)" @keydown.down.prevent="move(key,1)">
            <svg viewBox="0 0 16 16" aria-hidden="true"><circle v-for="point in [[5,3],[11,3],[5,8],[11,8],[5,13],[11,13]]" :key="point.join()" :cx="point[0]" :cy="point[1]" r="1" /></svg>
          </button>
          <HoverMenuSelect :model-value="key" :options="optionsFor(key)" :aria-label="zh?'选择第 '+(index+1)+' 栏榜单':'Select board '+(index+1)" :theme-style="themeStyle" variant="model" @update:model-value="choose(index,$event)" />
          <router-link class="model-board-open" :to="path(key)" :aria-label="(zh?'完整榜单：':'Full board: ')+label(key)">↗</router-link>
        </header>
        <div class="model-board-scroll" tabindex="0" :aria-label="label(key)" @keydown="scrollByKey"><n-scrollbar trigger="hover" @scroll="position=>onBoardScroll(key,position)"><ol>
          <li v-for="(row,position) in rows(key)" :key="row.id || row.model || row.url || position"><span class="model-number">{{ row.rank || position+1 }}</span><div><a :href="row.url || board(key)?.url || ''" target="_blank" rel="noopener noreferrer" class="notranslate" translate="no">{{ row.model || row.originalTitle || row.title }}</a><div class="model-row-meta"><span>{{ rowMetric(row,key) }}</span><button v-if="row.evidence" type="button" :aria-expanded="open===key+position" @click="open=open===key+position?'':key+position">{{ zh?'依据':'Evidence' }} <DisclosureChevron :expanded="open===key+position" /></button></div><ul v-if="open===key+position" class="model-evidence"><li v-for="e in row.evidence" :key="e.source"><a :href="e.url" target="_blank" rel="noopener noreferrer">{{ e.label }} · #{{ e.originalRank }} · {{ e.model }}</a></li></ul></div></li>
          <li v-if="hasMore(key)" class="model-load-more"><button type="button" :disabled="Boolean(pageBusy[key])" @click="loadMore(key)">{{ pageBusy[key] ? (zh?'加载中…':'Loading…') : pageError[key] ? (zh?'重试加载':'Retry more') : (zh?'滚动加载更多':'Scroll for more') }}</button></li>
          <li v-if="!rows(key).length" class="model-empty">{{ loading || pending[key] ? (zh?'读取中…':'Loading…') : errors[key] || error || board(key)?.status==='failed' || key==='consensus' && payload && !payload.consensus?.length ? (zh?'暂时不可用，可重试':'Unavailable. Retry.') : (zh?'暂无匹配数据':'No matching data') }}</li>
        </ol></n-scrollbar></div>
        <button v-if="errors[key] || error || board(key)?.status==='failed'" class="model-retry" type="button" @click="refresh">{{ zh?'重试':'Retry' }}</button>
      </section>
      </template>
    </draggable>
   </section>
</template>
<script setup>
import {computed,ref,nextTick,onMounted,onBeforeUnmount,watch} from 'vue';
import draggable from 'vuedraggable';
import {mainStore} from '@/store';
import HoverMenuSelect from './HoverMenuSelect.vue';
import DisclosureChevron from '@/components/ui/DisclosureChevron.vue';
import {DEFAULT_MODEL_BOARD_KEYS,normalizeModelBoardSelections,reorderModelBoardSelections,moveModelBoardSelection} from '@/utils/aiModelBoardOrder.mjs';
import {getHotListsWithFallback} from '@/api';
import {getSourceVariantOptions} from '@/utils/sourceSubtypes';
import {getSourceLabel} from '@/utils/sourceLabels';
import {getSourceLogo} from '@/utils/sourceLogos';
import {withLocalePrefix} from '@/utils/locale';
import {normalizeRankingMetric} from '@/utils/rankingMetricSemantics.js';
import {formatCompactMetric} from '@/utils/compactMetric.js';
import {AI_MODEL_OPTIONS} from '@/config/ai-intake.js';
import {MODEL_BOARD_INITIAL_ROWS,MODEL_BOARD_PAGE_SIZE} from '@/utils/aiModelBoardPaging.js';
const props=defineProps({locale:{type:String,default:'zh-CN'},themeStyle:{type:Object,default:()=>({})}});
const defaults=DEFAULT_MODEL_BOARD_KEYS,storage='wuaihot-ai-model-cards-v1';
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const announcement=ref('');
const zh=computed(()=>props.locale.startsWith('zh')),store=mainStore(),payload=ref(null),loading=ref(false),error=ref(false),extra=ref({}),pending=ref({}),errors=ref({}),open=ref(''),visibleLimits=ref({}),pageBusy=ref({}),pageError=ref({});let controller,generation=0;
const options=computed(()=>[
 ...AI_MODEL_OPTIONS.map(o=>({...o,icon:getSourceLogo(o.value==='consensus'?'ai-model-board':o.value==='aa'?'artificialanalysis':o.value==='arena'?'arena-ai':['coding','reasoning','analysis'].includes(o.value)?'livebench':o.value),label:zh.value?o.label:({consensus:'Cross-board position',livebench:'LiveBench overall',coding:'LiveBench coding',reasoning:'LiveBench reasoning',analysis:'LiveBench analysis',aa:'Artificial Analysis',arena:'Arena preference'}[o.value])})),
 ...store.defaultNewsArr.filter(s=>(s.category==='AI' || s.category==='ai' || s.categoryIds?.some(id=>id==='ai' || id.startsWith('ai-'))) && !['ai-model-board','livebench','artificialanalysis','arena-ai'].includes(s.name)).flatMap(s=>{const variants=getSourceVariantOptions(s.name);return (variants.length?variants:[{value:'',label:''}]).map(v=>({value:s.name+'|'+v.value,icon:getSourceLogo(s.name),label:getSourceLabel(s.name,props.locale,s.label)+(v.label?' · '+v.label:'')}));})
]);
const selections=ref((()=>{try{const saved=JSON.parse(localStorage.getItem(storage));return Array.isArray(saved)&&saved.length===4&&saved.every(key=>typeof key==='string')&&new Set(saved).size===4?saved:defaults.slice();}catch{return defaults.slice();}})());
const optionsFor=key=>options.value.map(option=>({...option,disabled:option.value!==key&&selections.value.includes(option.value)}));
const label=key=>options.value.find(o=>o.value===key)?.label || key;
const path=key=>{const [source,variant]=key.includes('|')?key.split('|'):['ai-model-board',key];return withLocalePrefix(props.locale,'/rank/'+encodeURIComponent(source)+(variant?'/'+encodeURIComponent(variant):'')+'?scope=ai');};
const board=key=>key.includes('|')?extra.value[key]:payload.value?.boards?.find(b=>b.key===key);
const rows=key=>{const items=(key==='consensus'?payload.value?.consensus:board(key)?.items || board(key)?.data)||[];return key.includes('|')?items.slice(0,visibleLimits.value[key] || MODEL_BOARD_INITIAL_ROWS):items;};
const rowTotal=key=>key.includes('|')?((board(key)?.items || board(key)?.data)?.length||0):key==='consensus'?(payload.value?.consensusTotal||0):(board(key)?.total||0);
const hasMore=key=>rows(key).length<rowTotal(key);
const loadMore=async key=>{
  if(pageBusy.value[key] || !hasMore(key))return;
  if(key.includes('|')){visibleLimits.value={...visibleLimits.value,[key]:(visibleLimits.value[key]||MODEL_BOARD_INITIAL_ROWS)+MODEL_BOARD_PAGE_SIZE};return;}
  const gen=generation,offset=rows(key).length;
  pageBusy.value={...pageBusy.value,[key]:true};pageError.value={...pageError.value,[key]:false};
  try{
    const request=await fetch('/api/ai-model-board?view=page&type='+encodeURIComponent(key)+'&offset='+offset+'&limit='+MODEL_BOARD_PAGE_SIZE,{signal:controller?.signal});
    const data=await request.json();if(!request.ok||data.code!==200||!Array.isArray(data.items)||data.offset!==offset||data.type!==key)throw Error('invalid_model_page');
    if(gen!==generation||!payload.value)return;
    const existing=rows(key),seen=new Set(existing.map(row=>row.model));const next=data.items.filter(row=>!seen.has(row.model));
    if(key==='consensus')payload.value={...payload.value,consensus:[...existing,...next],consensusTotal:data.total};
    else payload.value={...payload.value,boards:payload.value.boards.map(item=>item.key===key?{...item,items:[...existing,...next],total:data.total}:item)};
  }catch(err){if(gen===generation && err.name!=='AbortError')pageError.value={...pageError.value,[key]:true};}
  finally{if(gen===generation)pageBusy.value={...pageBusy.value,[key]:false};}
};
const onBoardScroll=(key,position)=>{
  const root=[...document.querySelectorAll('.model-board-card')].find(element=>element.dataset.modelBoard===key);
  const area=root?.querySelector('.n-scrollbar-container');if(!area)return;
  const top=Number.isFinite(position?.scrollTop)?position.scrollTop:area.scrollTop;
  if(top+area.clientHeight>=area.scrollHeight-72)void loadMore(key);
};
const caption=key=>key==='consensus'?(zh.value?'同版本 · 各站最佳配置 · 位置指数':'Model versions · best settings · position index'):key==='arena'?(zh.value?'用户偏好 · 原榜顺序':'User preference · source order'):key==='aa'?(zh.value?'能力测试 · 原榜顺序':'Capability test · source order'):['livebench','coding','reasoning','analysis'].includes(key)?(zh.value?'独立能力测试 · 原始分数':'Independent capability test · original score'):(zh.value?'原始榜单 · 指标以来源为准':'Original ranking · source-defined metrics');
const rowMetric=(row,key)=>{if(row.score!==null&&row.score!==undefined)return (key==='consensus'?(zh.value?'位置分 ':'Position '):(zh.value?'得分 ':'Score '))+Number(row.score).toFixed(1);const item=normalizeRankingMetric(row,key.split('|')[0]),metric=item.metric || item.displayMetric;return metric?.value!==undefined?formatCompactMetric(metric.value,props.locale)+' '+(metric.label || metric.kind):'';};
const save=()=>{try{localStorage.setItem(storage,JSON.stringify(selections.value));}catch{/* Session-only preference. */}};
const loadExtras=async()=>{const gen=generation;await Promise.all([...new Set(selections.value.filter(k=>k.includes('|')))].map(async key=>{if(extra.value[key] || pending.value[key])return;pending.value[key]=true;errors.value[key]=false;const [source,type]=key.split('|');try{const {result}=await getHotListsWithFallback(source,false,{type,locale:props.locale,translate_limit:0},{timeout:10000,silent:true});if(gen===generation){if(result?.code!==200 || !Array.isArray(result.data))throw Error();extra.value={...extra.value,[key]:result};}}catch{if(gen===generation)errors.value[key]=true;}finally{if(gen===generation)pending.value[key]=false;}}));};
const choose=(index,key)=>{if(!options.value.some(o=>o.value===key)||selections.value.some((value,i)=>i!==index&&value===key))return;selections.value=selections.value.map((s,i)=>i===index?key:s);open.value='';save();void loadExtras();};
const reorder=ordered=>{const updated=reorderModelBoardSelections(selections.value,ordered);if(!updated)return;selections.value=updated;open.value='';save();announcement.value=zh.value?'已调整榜单顺序':'Board order updated';};
const move=async(key,delta)=>{const ordered=moveModelBoardSelection(selections.value,key,delta);if(!ordered)return;reorder(ordered);await nextTick();[...document.querySelectorAll('.model-board-card')].find(el=>el.dataset.modelBoard===key)?.querySelector('.model-board-drag-handle')?.focus({preventScroll:true});};
const reset=()=>{selections.value=defaults.slice();visibleLimits.value={};announcement.value=zh.value?'已恢复默认四栏':'Default boards restored';open.value='';save();};
const refresh=async()=>{controller?.abort();controller=new AbortController();const gen=++generation;loading.value=true;error.value=false;extra.value={};pending.value={};errors.value={};pageBusy.value={};pageError.value={};visibleLimits.value={};void loadExtras();try{const response=await fetch('/api/ai-model-board?view=summary',{signal:controller.signal});const data=await response.json();if(!response.ok || data.code!==200 || !Array.isArray(data.boards))throw Error();if(gen===generation)payload.value=data;}catch(e){if(e.name!=='AbortError' && gen===generation)error.value=true;}finally{if(gen===generation)loading.value=false;}};
const scrollByKey=event=>{if(event.target!==event.currentTarget)return;const box=event.currentTarget.querySelector('.n-scrollbar-container'),amount={ArrowDown:40,ArrowUp:-40,PageDown:box?.clientHeight,PageUp:-box?.clientHeight,Home:-box?.scrollHeight,End:box?.scrollHeight}[event.key];if(box && amount!==undefined){event.preventDefault();box.scrollBy({top:amount,behavior:'instant'});}};
onMounted(()=>{selections.value=normalizeModelBoardSelections(selections.value,options.value.map(option=>option.value));save();void refresh();});watch(()=>props.locale,refresh);onBeforeUnmount(()=>{generation++;controller?.abort();});defineExpose({refresh,loading,reset});
</script>
<style scoped>
.model-boards{container-type:inline-size;container-name:model-boards;min-width:0;margin:0}
.model-board-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;align-items:stretch}
.model-board-card{display:flex;flex-direction:column;box-sizing:border-box;min-width:0;min-height:0;height:300px;padding:0 10px;background:color-mix(in srgb,var(--ai-panel) 94%,var(--ai-hover));border:1px solid var(--ai-border);border-radius:10px;transition:border-color .16s ease}
.model-board-card:hover{border-color:color-mix(in srgb,var(--ai-action) 24%,var(--ai-border))}
.model-board-card header{display:flex;align-items:center;gap:5px;min-height:41px;border-bottom:1px solid var(--ai-border)}
.model-board-card header :deep(.hover-menu-select){min-width:0;max-width:calc(100% - 55px);font-size:12px;font-weight:750;color:var(--ai-text)}
.model-board-drag-handle{display:grid;place-items:center;box-sizing:border-box;width:21px;min-width:21px;min-height:36px;margin-left:-4px;padding:0;border:0;background:transparent;color:var(--ai-muted);opacity:.46;cursor:grab;touch-action:none;transition:opacity .16s ease}
.model-board-drag-handle svg{display:block;width:13px;height:13px;fill:currentColor}
.model-board-card:hover .model-board-drag-handle,.model-board-drag-handle:focus-visible{opacity:1}
.model-board-drag-handle:active{cursor:grabbing}
.model-board-open{display:grid;place-items:center;flex:none;width:25px;height:30px;margin-left:auto;color:var(--ai-muted);font-size:13px;text-decoration:none}
a{color:inherit;text-decoration:none}a:hover,.model-board-open:hover{color:var(--ai-action)}
.model-retry{flex:none;align-self:flex-end;min-height:28px;margin:3px 0;color:var(--ai-action);font-size:11px}
.model-board-scroll{flex:1;min-height:0;overflow:hidden;margin-right:-5px;padding-right:1px}
.model-board-scroll :deep(.n-scrollbar-container){overscroll-behavior:contain}
.model-board-scroll :deep(.n-scrollbar-content){padding-right:5px}
ol{list-style:none;padding:0;margin:0}
ol>li{display:flex;gap:7px;min-width:0;padding:6px 0;border-bottom:1px solid color-mix(in srgb,var(--ai-border) 72%,transparent)}
ol>li:last-child{border-bottom:0}
ol>li>div{flex:1;min-width:0}
ol>li a{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;overflow-wrap:anywhere;color:var(--ai-text);font-size:13px;line-height:1.42;font-weight:550}
ol>li a:hover{color:var(--ai-action)}
.model-number{display:block;width:18px;flex:0 0 18px;padding-top:1px;color:var(--ai-muted);font-size:12px;line-height:1.45;font-variant-numeric:tabular-nums}
ol>li:nth-child(1)>.model-number{color:#df4a43;font-weight:750}
ol>li:nth-child(2)>.model-number{color:#d87831;font-weight:700}
ol>li:nth-child(3)>.model-number{color:#ac8735;font-weight:700}
.model-row-meta{display:flex;align-items:center;justify-content:space-between;gap:6px;min-width:0;margin-top:3px;color:var(--ai-muted);font-size:10px;line-height:1.5}
.model-row-meta>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.model-row-meta button{display:inline-flex;align-items:center;gap:4px;flex:none}
button{font:inherit;color:var(--ai-action);border:0;background:transparent;padding:0;cursor:pointer}
.model-evidence{list-style:none;padding:5px 0 1px;margin:0;color:var(--ai-muted)}
.model-evidence li{padding:3px 0}
.model-evidence a{display:block;font-size:11px;font-weight:400}
.model-empty{padding:10px 0;color:var(--ai-muted);font-size:12px;line-height:1.6}
.model-load-more{justify-content:center;min-height:32px;padding:3px 0}
.model-load-more button{font-size:11px;min-height:30px;color:var(--ai-muted);cursor:pointer}
.model-board-announcement{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
.model-board-ghost{opacity:.42}.model-board-chosen{z-index:2}
:is(button,a,.model-board-scroll):focus-visible{outline:2px solid var(--ai-action);outline-offset:2px;border-radius:3px}
@container model-boards (max-width:1050px){
  .model-board-grid{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:thin;padding-bottom:8px}
  .model-board-card{flex:0 0 min(86cqw,320px);scroll-snap-align:start}
}
@media(max-width:680px){
  .model-board-drag-handle{width:28px;min-width:28px;min-height:44px;margin-left:-5px;opacity:.7}
  .model-board-open{min-height:44px}
}
@media(prefers-reduced-motion:reduce){
  .model-board-card,.model-board-drag-handle{transition:none}
  .model-board-grid{scroll-behavior:auto}
}
</style>
