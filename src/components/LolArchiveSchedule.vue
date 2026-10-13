<template>
  <div class="lol-archive-schedule" @keydown.esc.stop="clear">
    <div class="schedule-guide"><span>{{ copy.hint }}</span><span role="status" aria-live="polite"><template v-if="activeTeam">{{ teamName(activeTeam) }} · {{ activeCount }} {{ copy.positions }} <button v-if="pinned" type="button" @click="clear">{{ copy.clear }}</button></template></span></div>
    <p v-if="bracket" class="schedule-scroll-hint">{{ copy.scroll }}</p>
    <div ref="scroller" class="schedule-scroll" :class="{ 'is-bracket': bracket }" :tabindex="bracket ? 0 : undefined" :aria-label="bracket ? copy.scroll : undefined">
      <div ref="canvas" class="schedule-canvas" :class="{ 'is-bracket': bracket, 'is-play-in': stage === 'play-in' }" :style="bracket ? {height:42 + graph.leafCount * step + 'px'} : undefined">
        <svg v-if="bracket" class="schedule-connections" aria-hidden="true" :width="geometry.width" :height="geometry.height">
          <path v-for="edge in geometry.edges" :key="edge.from + '-' + edge.to" :d="edge.path" :data-from="edge.from" :data-to="edge.to" :data-team="edge.team" :class="{ 'is-active': activeTeam === edge.team, 'is-muted': activeTeam && activeTeam !== edge.team }" />
        </svg>
        <section v-for="round in rounds" :key="round.round" class="schedule-round">
          <h2>{{ roundTitle(round.round) }}<span>{{ round.matches.length }}</span></h2>
          <template v-if="bracket">
            <div v-for="match in round.matches" :key="match.id" class="schedule-node" :style="{top:42 + (nodeSlot(match.id) + .5) * step + 'px'}">
              <slot name="match" v-bind="slotProps(match)" />
            </div>
          </template>
          <template v-else>
            <section v-for="group in groups(round)" :key="group.key" class="schedule-record-group">
              <h3 v-if="stage === 'swiss'">{{ group.key }} <span>{{ group.matches[0].bo }}</span></h3>
              <div class="schedule-matches"><slot v-for="match in group.matches" :key="match.id" name="match" v-bind="slotProps(match)" /></div>
            </section>
          </template>
        </section>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { knockoutGraph, swissRecords, swissGroups } from "@/utils/lolArchiveSchedule.mjs";
const props=defineProps({rounds:{type:Array,required:true},allRounds:{type:Array,required:true},stage:{type:String,required:true},bracket:Boolean,roundTitle:{type:Function,required:true},teamName:{type:Function,required:true},locale:{type:String,default:"zh-CN"}});
const translations={
 "zh-CN":{trace:"追踪队伍",hint:"悬浮查看队伍路径，点击固定",positions:"处比赛",clear:"清除",scroll:"左右滚动查看完整晋级图 →",qualified:"晋级",eliminated:"淘汰",advance:"晋级瑞士轮"},
 "zh-TW":{trace:"追蹤隊伍",hint:"懸浮檢視隊伍路徑，點擊固定",positions:"處比賽",clear:"清除",scroll:"左右捲動檢視完整晉級圖 →",qualified:"晉級",eliminated:"淘汰",advance:"晉級瑞士輪"},
 en:{trace:"Track team",hint:"Hover or focus a team; click to pin",positions:"matches",clear:"Clear",scroll:"Scroll sideways for the full bracket →",qualified:"Qualified",eliminated:"Eliminated",advance:"Advances to Swiss"},
 ja:{trace:"チームを追跡",hint:"ホバー・フォーカスで経路表示、クリックで固定",positions:"試合",clear:"解除",scroll:"横にスクロールして全体を表示 →",qualified:"進出",eliminated:"敗退",advance:"スイスへ進出"},
 ko:{trace:"팀 경로 추적",hint:"호버·포커스로 경로 확인, 클릭으로 고정",positions:"경기",clear:"해제",scroll:"좌우로 스크롤해 전체 대진 보기 →",qualified:"진출",eliminated:"탈락",advance:"스위스 진출"},
};
const copy=computed(()=>translations[props.locale] || translations.en);
const hovered=ref(""),focused=ref(""),pinned=ref("");
const activeTeam=computed(()=>hovered.value || focused.value || pinned.value);
const activeCount=computed(()=>props.rounds.flatMap(r=>r.matches).filter(m=>m.teams.includes(activeTeam.value)).length);
const clear=()=>{hovered.value="";focused.value="";pinned.value="";};
const toggle=id=>{pinned.value=pinned.value === id ? "" : id;hovered.value="";focused.value="";};
const graph=computed(()=>knockoutGraph(props.rounds));
const records=computed(()=>swissRecords(props.allRounds));
const nodeSlot=id=>graph.value.nodes.find(n=>n.id===id)?.slot || 0;
const groups=round=>props.stage==="swiss" ? swissGroups(round.matches,records.value.before) : [{key:"all",matches:round.matches}];
const slotProps=match=>({
 match,activeTeam:activeTeam.value,pinnedTeam:pinned.value,traceLabel:copy.value.trace,
 hover:id=>{hovered.value=id;},leave:()=>{hovered.value="";},
 focus:id=>{focused.value=id;},blur:()=>{focused.value="";},toggle,
 outcome:index=>props.stage==="play-in" ? (match.winner===index+1 ? copy.value.advance : copy.value.eliminated) : props.stage==="swiss" ? copy.value[records.value.outcomes.get(match.id)?.[index]] || "" : "",
});
const canvas=ref(null),scroller=ref(null),step=ref(210);
const geometry=ref({width:0,height:0,edges:[]});
let observer,frame=0;
const measure=async()=>{
 if(!props.bracket || !canvas.value){geometry.value={width:0,height:0,edges:[]};return;}
 const root=canvas.value;
 const cards=[...root.querySelectorAll("[data-match-id]")];
 const nextStep=Math.max(174,...cards.map(el=>el.getBoundingClientRect().height))+24;
 if(Math.abs(step.value-nextStep)>.5){step.value=nextStep;await nextTick();}
 if(!canvas.value || !props.bracket)return;
 const origin=root.getBoundingClientRect(),rects=new Map(cards.map(el=>[el.dataset.matchId,el.getBoundingClientRect()]));
 geometry.value={width:root.clientWidth,height:root.clientHeight,edges:graph.value.edges.flatMap(edge=>{
   const from=rects.get(edge.from),to=rects.get(edge.to);
   if(!from || !to)return [];
   const x1=from.right-origin.left,x2=to.left-origin.left,y1=from.top+from.height/2-origin.top,y2=to.top+to.height/2-origin.top,join=(x1+x2)/2;
   return [{...edge,path:`M ${x1} ${y1} H ${join} V ${y2} H ${x2}`}];
 })};
};
const scheduleMeasure=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{void measure();});};
const observe=async()=>{
 await nextTick();
 observer?.disconnect();
 if(!canvas.value)return;
 observer?.observe(canvas.value);
 for(const el of canvas.value.querySelectorAll("[data-match-id]"))observer?.observe(el);
 scheduleMeasure();
};
onMounted(()=>{observer=new ResizeObserver(scheduleMeasure);void observe();});
watch(()=>[props.rounds,props.bracket,props.locale],()=>{hovered.value="";focused.value="";void observe();},{flush:"post"});
onBeforeUnmount(()=>{observer?.disconnect();cancelAnimationFrame(frame);});
</script>
<style scoped>
.schedule-guide { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:4px 16px; min-height:30px; margin-bottom:12px; font-size:12px; color:var(--archive-muted); }
.schedule-guide button { color:var(--archive-accent); border:0; background:transparent; padding:4px 8px; font:inherit; cursor:pointer; }
.schedule-guide button:focus-visible,.schedule-scroll:focus-visible { outline:2px solid var(--archive-accent); outline-offset:3px; }
.schedule-scroll { min-width:0; overflow:auto; padding:2px; }
.schedule-canvas { display:grid; gap:24px; }
.schedule-canvas.is-bracket { position:relative; grid-template-columns:repeat(3,minmax(0,1fr)); gap:48px; min-width:900px; }
.schedule-round { position:relative; min-width:0; }
.schedule-round h2 { display:flex; justify-content:space-between; gap:12px; font-size:14px; font-weight:650; margin:0 0 14px; line-height:24px; }
.schedule-round h2 span { font-size:12px; color:var(--archive-muted); font-weight:400; }
.schedule-node { position:absolute; left:0; right:0; transform:translateY(-50%); }
.schedule-connections { position:absolute; inset:0; overflow:visible; pointer-events:none; }
.schedule-connections path { fill:none; stroke:var(--archive-muted); stroke-width:1.5; stroke-opacity:.65; vector-effect:non-scaling-stroke; }
.schedule-connections path.is-active { stroke:var(--archive-trace,var(--archive-accent)); stroke-width:2.5; stroke-opacity:1; }
.schedule-connections path.is-muted { stroke-opacity:.18; }
.schedule-record-group { margin-bottom:16px; }
.schedule-record-group h3 { display:flex; align-items:center; gap:10px; border-left:3px solid var(--archive-accent); padding-left:10px; margin:0 0 10px; font-size:15px; font-variant-numeric:tabular-nums; }
.schedule-record-group h3 span { color:var(--archive-muted); font-weight:400; font-size:11px; }
.schedule-matches { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr)); gap:12px; }
.schedule-canvas.is-play-in { max-width:720px; margin:0 auto; }
.schedule-scroll-hint { display:none; font-size:12px; color:var(--archive-muted); margin:0 0 8px; }
@media(max-width:960px){ .schedule-scroll-hint { display:block; }.schedule-canvas.is-bracket { gap:40px; } }
</style>
