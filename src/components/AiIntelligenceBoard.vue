<template>
  <section class="ai-board" :aria-label="copy.board">
    <span class="board-announcement" role="status">{{ announcement }}</span>
    <div v-if="loading" class="ai-board-grid ai-board-loading" aria-busy="true"><section v-for="key in 4" :key="key" class="ai-board-lane"><header><span class="board-skeleton board-skeleton-title" /></header><div v-for="row in 5" :key="row" class="board-skeleton-row"><span class="board-skeleton" /><span class="board-skeleton board-skeleton-meta" /></div></section></div>
    <draggable v-else-if="lanes.length" class="ai-board-grid" :model-value="lanes" item-key="key"
      handle=".board-drag-handle" :animation="reducedMotion ? 0 : 150" :fallback-tolerance="8" :touch-start-threshold="8"
      ghost-class="board-drag-ghost" @update:model-value="reorder">
      <template #item="{element: lane}">
      <section class="ai-board-lane" :data-lane="lane.key">
        <header><button type="button" class="board-drag-handle" :aria-label="copy.dragLane+'：'+lane.label" :title="copy.orderHint"
          aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown" @keydown.left.prevent="move(lane,-1)" @keydown.up.prevent="move(lane,-1)" @keydown.right.prevent="move(lane,1)" @keydown.down.prevent="move(lane,1)">
          <svg viewBox="0 0 16 16" aria-hidden="true"><circle v-for="point in [[5,3],[11,3],[5,8],[11,8],[5,13],[11,13]]" :key="point.join()" :cx="point[0]" :cy="point[1]" r="1" /></svg>
        </button><h3 :title="lane.subtitle"><HoverMenuSelect :model-value="lane.key" :options="laneOptions(lane)" :aria-label="(copy.switchLane || 'Switch category')+'：'+lane.label" :theme-style="themeStyle" variant="lane" @update:model-value="$emit('replace-lane',{previous:lane.key,next:$event})" /></h3><span class="board-count">{{ lane.count }}</span><button type="button" class="board-view-all" :aria-label="copy.viewAll+'：'+lane.label" @click="$emit('select',lane.key)">{{ copy.viewAll }}</button></header>
        <div class="board-scroll" tabindex="0" role="region" :aria-label="lane.label+' · '+copy.scrollMore" @keydown="scrollByKey"><n-scrollbar trigger="hover" @scroll="trackVisible"><ol>
          <li v-if="!lane.items.length" class="board-empty">{{ copy.emptyLane }}</li>
          <li v-for="(item,index) in lane.items" :key="item.key" :data-ai-item="item.key" data-ai-area="board" :class="{'is-priority':item.emphasis}">
            <span class="board-row-number" :data-rank="index+1" aria-hidden="true">{{ index+1 }}</span><a :href="item.url" target="_blank" rel="noopener noreferrer" :title="item.originalTitle">{{ item.title }}<AiSignalBadge v-if="item.emphasis" :kind="item.badgeKind" :label="item.emphasisLabel || copy.quotaMark" /><AiSignalBadge v-else-if="item.new" kind="new" :label="copy.freshMark" /><span aria-hidden="true"> ↗</span></a>
            <div class="board-meta">
              <router-link v-if="item.rankingUrl" class="board-source" :to="item.rankingUrl" :title="item.sourceLabel">{{ item.sourceLabel }}</router-link><span v-else class="board-source" :title="item.sourceLabel">{{ item.sourceLabel }}</span>
              <span v-if="item.sourceAssociationLabel" class="board-source-association">{{ item.sourceAssociationLabel }}</span><AiMetric v-if="item.reasonCode !== 'growth'" :metric="item.metric" />
              <button type="button" class="board-reason" :aria-label="copy.why+'：'+item.reason" :aria-expanded="Boolean(openProof[item.key])" :aria-controls="'board-proof-'+encodeURIComponent(item.key)" @click="openProof[item.key]=!openProof[item.key]"><span class="board-reason-label">{{ item.reason }}</span><DisclosureChevron :expanded="Boolean(openProof[item.key])" /></button>
            </div>
            <div v-if="openProof[item.key]" :id="'board-proof-'+encodeURIComponent(item.key)" class="board-proof">
              <button v-if="item.translatable" type="button" class="board-language" :aria-pressed="item.isOriginal" @click="$emit('toggle-language',item.raw)">{{ item.isOriginal ? (copy.original==='Original'?'Translated':'译文') : copy.original }}</button><p class="board-full-title">{{ item.title }}</p>
              <p v-if="item.summary">{{ item.summary }}</p><p v-if="item.editorial">{{ copy.editorial }}</p>
              <p v-if="item.published">{{ copy.published }} · {{ item.fullDate }}</p>
              <p v-if="item.updated">{{ copy.updatedReason }} · {{ item.updated }}</p>
              <p v-if="item.ranking && !item.crossPlatformEvidence?.length"><router-link :to="item.rankingUrl">{{ item.ranking }}</router-link></p>
              <p v-for="source in item.crossPlatformEvidence" :key="source.source" class="board-ranked-proof"><router-link :to="source.rankingUrl">{{ source.label }} · #{{ source.rank }}</router-link><span v-if="source.metricText"> · {{ source.metricText }}</span> · <a :href="source.url" target="_blank" rel="nofollow noopener noreferrer">{{ copy.original }} ↗</a></p>
              <p v-if="item.crossPlatformEvidence?.length" class="board-ranked-proof-note">{{ item.crossPlatformNote }}</p>
              <p v-if="item.snapshot">{{ copy.snapshot }} · {{ item.snapshot }}</p>
              <a v-if="!item.crossPlatformEvidence?.length" :href="item.url" target="_blank" rel="noopener noreferrer">{{ copy.original }} ↗</a><a v-if="item.officialReference" :href="item.officialReference.url" target="_blank" rel="noopener noreferrer">{{ copy.official }} · {{ item.officialReference.publisher }} ↗</a><a v-if="item.relatedUrl" :href="item.relatedUrl" target="_blank" rel="noopener noreferrer">{{ copy.related }} ↗</a>
            </div>
          </li>
        </ol></n-scrollbar></div>
      </section>
      </template>
    </draggable>
    <p v-else class="board-empty">{{ copy.emptyBoard }}</p>
  </section>
</template>
<script setup>
import { nextTick, ref } from 'vue';
import draggable from 'vuedraggable';
import AiMetric from './AiMetric.vue';
import AiSignalBadge from './AiSignalBadge.vue';
import HoverMenuSelect from './HoverMenuSelect.vue';
import DisclosureChevron from '@/components/ui/DisclosureChevron.vue';
const props=defineProps({lanes:{type:Array,required:true},availableLanes:{type:Array,default:()=>[]},copy:{type:Object,required:true},themeStyle:{type:Object,default:()=>({})},loading:Boolean});
const emit=defineEmits(['reorder','replace-lane','select','browse','toggle-language']);
const announcement=ref(''),openProof=ref({});
const laneOptions = current => props.availableLanes.map(choice => ({ value: choice.key, label: choice.label, disabled: choice.key !== current.key && props.lanes.some(lane => lane.key === choice.key) }));
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reorder=lanes=>{emit('reorder',lanes.map(lane=>lane.key));announcement.value=props.copy.moved;};
const move=async(lane,delta)=>{
  const lanes=[...props.lanes],index=lanes.findIndex(item=>item.key===lane.key),target=index+delta;
  if(target<0 || target>=lanes.length)return;
  [lanes[index],lanes[target]]=[lanes[target],lanes[index]];reorder(lanes);
  await nextTick();document.querySelector('[data-lane="'+lane.key+'"] .board-drag-handle')?.focus({preventScroll:true});
};
const trackVisible=event=>{
  const board=event.target.closest('.ai-board');
  if(!board)return;
  const keys=[];
  for(const list of board.querySelectorAll('.board-scroll .n-scrollbar-container')) {
    const box=list.getBoundingClientRect();
    for(const row of list.querySelectorAll('[data-ai-item]')) {
      const bounds=row.getBoundingClientRect();
      if(bounds.bottom>box.top && bounds.top<box.bottom)keys.push(row.dataset.aiItem);
    }
  }
  emit('browse',keys);
};
const scrollByKey=event=>{
  if(event.target!==event.currentTarget)return;
  const box=event.currentTarget.querySelector('.n-scrollbar-container');
  const amount={ArrowDown:40,ArrowUp:-40,PageDown:box?.clientHeight,PageUp:-box?.clientHeight,Home:-box?.scrollHeight,End:box?.scrollHeight}[event.key];
  if(!box || amount===undefined)return;event.preventDefault();box.scrollBy({top:amount,behavior:'instant'});
};
</script>
<style scoped>
.ai-board{--board-gap:10px;--board-pad:12px;--board-title-size:14px;--board-muted:#6b7076;--lane-color:#3776ed;--board-meta-size:11px;container-type:inline-size;container-name:ai-board;min-width:0;margin:8px 0 12px}
.ai-board-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--board-gap);align-items:stretch}
.ai-board-lane{display:flex;flex-direction:column;min-width:0;min-height:0;height:300px;box-sizing:border-box;border:1px solid var(--ai-border);border-radius:var(--ai-radius);background:var(--ai-panel);padding:0 var(--board-pad)}
.ai-board-lane header{display:flex;align-items:center;gap:7px;height:43px;min-height:43px;flex:none;border-bottom:1px solid var(--ai-border)}
.ai-board-lane h3{color:var(--lane-color);font-size:13px;line-height:1.35;margin:0 auto 0 0;flex:1;min-width:0}
.ai-board-lane h3 :deep(.hover-menu-select){max-width:100%;color:var(--lane-color);font-size:13px;font-weight:700;padding-inline:4px}
.board-count{color:var(--board-muted);font-size:11px;font-weight:500;font-variant-numeric:tabular-nums;flex:none}.board-view-all{border:0;background:transparent;color:var(--board-muted);padding:6px 0 6px 2px;font:inherit;font-size:11px;white-space:nowrap;cursor:pointer;flex:none}.board-view-all:hover{color:var(--ai-action)}
.board-scroll{flex:1;min-height:0;overflow:hidden;margin-right:-6px;padding-right:2px}.board-scroll :deep(.n-scrollbar-container){overscroll-behavior:contain}.board-scroll :deep(.n-scrollbar-content){padding-right:4px}ol{margin:0;padding:0;list-style:none}li{min-width:0;padding:4px 0;border-bottom:1px solid color-mix(in srgb,var(--ai-border) 65%,transparent)}li:last-child{border-bottom:0}
li{position:relative;padding-left:20px}.board-row-number{position:absolute;left:0;top:5px;font-size:13px;line-height:1.4;font-variant-numeric:tabular-nums;color:var(--board-muted)}
li>a{font-size:var(--board-title-size);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere;color:var(--ai-text);text-decoration:none;font-weight:550}
li>a:hover{color:var(--ai-action)}li>a>span[aria-hidden]{font-size:10px;color:var(--ai-muted)}
.board-new{display:inline-block;font-size:10px;line-height:1.6;border-radius:3px;padding:0 3px;margin-right:5px;background:color-mix(in srgb,var(--ai-action) 10%,transparent);color:var(--ai-action);vertical-align:1px;white-space:nowrap}
.board-meta{display:flex;flex-wrap:nowrap;align-items:center;gap:2px 5px;min-width:0;font-size:var(--board-meta-size);line-height:1.3;color:var(--board-muted);margin-top:2px}
.board-source{max-width:50%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:1;color:inherit;text-decoration:none}.board-source:hover{color:var(--ai-action)}
.ai-board-lane[data-lane="launches"]{--lane-color:#079a80}.ai-board-lane[data-lane="building"],.ai-board-lane[data-lane="research"]{--lane-color:#7652d9}.ai-board-lane[data-lane="industry"]{--lane-color:#cc7900}.ai-board-lane[data-lane="discussion"]{--lane-color:#d47b18}
:global(html[data-dailyhot-theme="dark"] .ai-board){--board-muted:#9699a1;--lane-color:#80b4ff}
:global(html[data-dailyhot-theme="dark"] .ai-board-lane[data-lane="launches"]){--lane-color:#78cba5}
:global(html[data-dailyhot-theme="dark"] .ai-board-lane:is([data-lane="building"],[data-lane="research"])){--lane-color:#bea2f4}
:global(html[data-dailyhot-theme="dark"] .ai-board-lane[data-lane="industry"]){--lane-color:#f0b75e}
:global(html[data-dailyhot-theme="dark"] .ai-board-lane[data-lane="discussion"]){--lane-color:#ffba70}
.is-priority{background:color-mix(in srgb,var(--ai-action) 3%,transparent);border-radius:4px}.is-priority>a{font-weight:600}
.board-row-number[data-rank="1"]{color:#ea444d;font-weight:650}.board-row-number[data-rank="2"]{color:#ed702d;font-weight:650}.board-row-number[data-rank="3"]{color:#c69022;font-weight:650}
.board-meta time{white-space:nowrap;font-variant-numeric:tabular-nums}.board-drag-handle{display:flex;align-items:center;justify-content:center;width:16px;min-height:30px;margin-left:-7px;padding:0;border:0;background:transparent;color:var(--board-muted);opacity:.3;cursor:grab;touch-action:none;flex:none;transition:opacity .15s ease}.ai-board-lane:hover .board-drag-handle,.board-drag-handle:focus-visible{opacity:1}.board-drag-handle:active{cursor:grabbing}.board-drag-handle svg{width:13px;height:13px;fill:currentColor}.board-drag-ghost{opacity:.4}.board-announcement{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
.board-reason{display:inline-flex;align-items:center;gap:4px;font:inherit;font-size:inherit;min-width:0;color:inherit;flex:0 1 auto;padding:0;border:0;background:transparent;cursor:pointer;white-space:nowrap;overflow:hidden;text-align:left}.board-reason-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.board-reason::before{content:"·";margin-right:5px}.board-reason:hover{color:var(--ai-action)}.board-full-title{font-weight:600;color:var(--ai-text)}.board-proof{padding:8px 0;color:var(--ai-secondary);font-size:12px;line-height:1.6;overflow-wrap:anywhere}.board-proof p{margin:0 0 4px}.board-proof a{color:var(--ai-action);margin-right:10px}
.board-language{font:inherit;font-size:11px;color:var(--ai-action);background:transparent;border:0;padding:0 0 4px;cursor:pointer}.board-empty{color:var(--ai-muted);font-size:12px;line-height:1.7;padding:8px 0}
.ai-board-loading .ai-board-lane{height:300px}.board-skeleton{display:block;height:14px;width:95%;border-radius:3px;background:var(--ai-hover)}.board-skeleton-title{width:90px}.board-skeleton-row{padding:14px 0;border-bottom:1px solid var(--ai-border)}.board-skeleton-meta{width:65%;height:10px;margin-top:8px}
:is(a,button,.board-scroll):focus-visible{outline:2px solid var(--ai-action);outline-offset:3px;border-radius:3px}
@container ai-board (max-width:1050px){.ai-board-grid{display:flex;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:thin;padding-bottom:8px}.ai-board-lane{flex:0 0 min(88cqw,340px);height:300px;box-sizing:border-box;scroll-snap-align:start}}
@container ai-board (max-width:680px){.board-drag-handle{width:24px;min-height:44px;margin-left:-7px;opacity:.55}.board-view-all{min-height:44px}li{position:relative;padding-left:20px}.board-row-number{position:absolute;left:0;top:5px;font-size:13px;line-height:1.4;font-variant-numeric:tabular-nums;color:var(--board-muted)}
li>a{font-size:14px}.board-meta{font-size:12px}.board-reason{min-height:32px;padding:4px 0}}
@media(prefers-reduced-motion:reduce){.ai-board-grid{scroll-behavior:auto}}
</style>
