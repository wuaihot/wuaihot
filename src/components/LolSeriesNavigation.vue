<template>
  <nav class="lol-series-nav" :aria-label="copy.series">
    <router-link class="lol-series-nav__tab" :class="{ 'is-active': activeId === 'demacia-cup-2026' }" :to="path('/event/demacia-cup-2026')" :aria-current="activeId === 'demacia-cup-2026' ? 'page' : undefined"><img v-if="demaciaEvent?.hero?.logo" :src="demaciaEvent.hero.logo" alt="" width="20" height="20" />{{ demaciaLabel }}</router-link>
    <details ref="disclosure" class="lol-editions" :class="{ 'is-active': isWorlds }" :open="expanded" @toggle="expanded = $event.target.open" @mouseenter="hoverOpen" @mouseleave="hoverClose" @keydown.esc.prevent="closeAndFocus" @focusout="onFocusOut">
      <summary :aria-label="copy.choose"><img src="/assets/lol-series/worlds-official.png" alt="" width="20" height="20" />{{ worldsLabel }}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 4.5 3.5 3 3.5-3"/></svg></summary>
      <div ref="panel" class="lol-editions__panel" :style="{ transform: `translateX(${panelShift}px)` }">
        <router-link v-for="edition in editions" :key="edition.year" :to="path('/event/worlds-' + edition.year)" :aria-current="activeId === 'worlds-' + edition.year ? 'page' : undefined" @click="close">{{ edition.label }}<span>{{ edition.year === 2025 ? copy.archive : copy.current }}</span></router-link>
      </div>
    </details>
  </nav>
</template>
<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { buildEventPath, EVENT_REGISTRY, getEventLabel } from "@/config/events";
const props = defineProps({ activeId: {type:String,required:true}, locale: {type:String,default:"zh-CN"} });
const route = useRoute();
const disclosure = ref(null);
const expanded = ref(false);
const panel = ref(null);
const panelShift = ref(0);
let timer;
const messages = {
 "zh-CN":{series:"英雄联盟赛事",choose:"选择全球总决赛届次",current:"本届",archive:"历史归档",s16:"S16 全球总决赛",s15:"S15 全球总决赛"},
 "zh-TW":{series:"英雄聯盟賽事",choose:"選擇世界大賽屆次",current:"本屆",archive:"歷史紀錄",s16:"S16 世界大賽",s15:"S15 世界大賽"},
 en:{series:"League of Legends events",choose:"Choose Worlds edition",current:"Current",archive:"Archive",s16:"Worlds 2026",s15:"Worlds 2025"},
 ja:{series:"League of Legends 大会",choose:"Worldsの開催年を選択",current:"今季",archive:"アーカイブ",s16:"Worlds 2026",s15:"Worlds 2025"},
 ko:{series:"리그 오브 레전드 대회",choose:"월즈 연도 선택",current:"이번 시즌",archive:"지난 대회",s16:"월즈 2026",s15:"월즈 2025"}
};
const copy = computed(()=>messages[props.locale] || messages["zh-CN"]);
const demaciaEvent = computed(()=>EVENT_REGISTRY.find(x=>x.id==="demacia-cup-2026"));
const demaciaLabel = computed(()=>getEventLabel(demaciaEvent.value,props.locale));
const isWorlds = computed(()=>props.activeId.startsWith("worlds-"));
const worldsLabel = computed(()=>props.activeId==="worlds-2025" ? copy.value.s15 : copy.value.s16);
const editions = computed(()=>[{year:2026,label:copy.value.s16},{year:2025,label:copy.value.s15}]);
const path = value=>buildEventPath({path:value},props.locale);
const cancel = ()=>{clearTimeout(timer);timer=undefined;};
const close = ()=>{cancel();expanded.value=false;};
const hoverOpen = ()=>{if(!window.matchMedia("(hover:hover) and (pointer:fine)").matches)return;cancel();timer=setTimeout(()=>{expanded.value=true;},140);};
const hoverClose = ()=>{if(!window.matchMedia("(hover:hover) and (pointer:fine)").matches)return;cancel();timer=setTimeout(close,180);};
const closeAndFocus = ()=>{close();disclosure.value?.querySelector("summary")?.focus();};
const outside = event=>{if(!disclosure.value?.contains(event.target))close();};
const onFocusOut = event=>{if(!disclosure.value?.contains(event.relatedTarget))close();};
const fitPanel = async()=>{
 panelShift.value=0;
 await nextTick();
 if(!expanded.value || !panel.value)return;
 const bounds=panel.value.getBoundingClientRect();
 const hero=disclosure.value.closest(".lol-event-hero,.archive-hero,.event-hero")?.getBoundingClientRect();
 const left=Math.max(16,(hero?.left || 0)+8);
 const right=Math.min(window.innerWidth-16,(hero?.right || window.innerWidth)-8);
 panelShift.value=Math.min(0,right-bounds.right)+Math.max(0,left-bounds.left);
};
watch(expanded,value=>{if(value)fitPanel();});
watch(()=>route.fullPath,close);
onMounted(()=>{document.addEventListener("pointerdown",outside);window.addEventListener("resize",close);});
onBeforeUnmount(()=>{cancel();document.removeEventListener("pointerdown",outside);window.removeEventListener("resize",close);});
</script>
<style scoped>
.lol-series-nav { display:flex; align-items:center; gap:6px; min-width:0; flex-wrap:wrap; color:#d4e8ed; font-size:12px; }
.lol-series-nav__tab,.lol-editions summary { display:flex; align-items:center; gap:6px; min-height:34px; box-sizing:border-box; padding:6px 10px; color:inherit; border:1px solid #41606c; border-radius:6px; background:rgba(1,10,19,.6); font:inherit; text-decoration:none; cursor:pointer; }
.lol-series-nav__tab.is-active,.lol-editions.is-active summary { color:#f1ffff; border-color:#82b9c5; background:#17363f; }
.lol-editions { position:relative; }
.lol-editions summary { list-style:none; }
.lol-editions summary::-webkit-details-marker { display:none; }
.lol-series-nav__tab img,.lol-editions summary img { display:block; object-fit:contain; }
.lol-editions summary svg { width:12px; height:12px; fill:none; stroke:currentColor; stroke-width:1.5; flex:none; }
.lol-editions[open] summary svg { transform:rotate(180deg); }
.lol-editions__panel { position:absolute; top:calc(100% + 5px); left:0; z-index:20; min-width:210px; max-width:calc(100vw - 32px); box-sizing:border-box; padding:5px; border:1px solid #436775; border-radius:8px; background:#0c202b; box-shadow:0 8px 20px #0005; }
.lol-editions__panel a { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:10px; color:#e0f4f5; border-radius:4px; text-decoration:none; white-space:nowrap; }
.lol-editions__panel a[aria-current=page] { background:#234752; }
.lol-editions__panel a span { color:#b4ccd0; font-size:11px; }
.lol-series-nav a:hover,.lol-editions summary:hover { background:#234752; }
.lol-series-nav :is(a,summary):focus-visible { outline:2px solid #9cebf0; outline-offset:3px; }
@media(max-width:600px) { .lol-series-nav { font-size:11px; gap:5px; }.lol-series-nav__tab,.lol-editions summary { min-height:40px; padding:6px 8px; }.lol-editions__panel { left:0; right:auto; min-width:210px; } }
</style>
