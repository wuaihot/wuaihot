<template>
 <nav ref="root" class="content-navigation" :aria-label="copy.navigation" :style="themeStyle" @keydown.esc.prevent.stop="close(true)" @focusout="leaveFocus">
  <router-link class="content-navigation__direct" :to="homeLocation" :aria-current="isHome ? 'page' : undefined">{{ copy.home }}</router-link>
  <router-link v-for="category in popular" :key="category.scope" class="content-navigation__direct" :class="{'is-secondary': ['entertainment','sports'].includes(category.slug)}" :to="cleanCategory(category.scope)" :aria-current="route.path === cleanCategory(category.scope).path ? 'page' : undefined">{{ category.label }}</router-link>
  <div v-for="section in sections" :key="section.id" class="content-navigation__disclosure" @mouseenter="scheduleOpen(section.id)" @mouseleave="scheduleClose">
   <button type="button" :aria-expanded="active === section.id" :aria-controls="'content-menu-'+section.id" @click="toggle(section.id)" @keydown.down.prevent="focusFirst(section.id)">
    {{ section.label }}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m3 4.5 3 3 3-3" /></svg>
   </button>
   <div v-if="active === section.id" :id="'content-menu-'+section.id" class="content-navigation__panel" :class="{ 'is-mega': section.id === 'more' }" @mouseenter="cancelTimers" @mouseleave="scheduleClose">
    <template v-if="section.id === 'more'">
     <div class="content-navigation__grid">
      <section v-for="category in moreCategories" :key="category.scope" class="content-navigation__category">
       <router-link class="content-navigation__main-link" :to="cleanCategory(category.scope)" @click="close()">{{ category.label }}<span aria-hidden="true">↗</span></router-link>
       <div class="content-navigation__children"><router-link v-for="child in category.children.filter(item=>item.kind === 'category')" :key="child.id" :to="cleanCategory(child.scope)" @click="close()">{{ child.label }}</router-link></div>
      </section>
     </div>
    </template>
    <template v-else><router-link v-for="node in section.nodes" :key="node.id" :to="nodeLocation(node)" @click="close()">{{ node.label }}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="m4.5 3 3 3-3 3" /></svg></router-link></template>
   </div>
  </div>
 </nav>
</template>
<script setup>
import { computed, onMounted, onBeforeUnmount, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { HOVER_MENU_OPEN_EVENT, announceHoverMenuOpen } from '@/utils/hoverMenu';
import { useThemeVars } from 'naive-ui';
import { mainStore } from '@/store';
import { getCategoryByRef } from '@/utils/categoryTree';
import { buildHomePath } from '@/utils/locale';
import { ALL_SCOPE } from '@/utils/rankingNavigation';
import { useRankingNavigation } from '@/composables/useRankingNavigation';
const { locale, tree, topicNodes, eventNodes, categoryLocation, nodeLocation } = useRankingNavigation();
const store = mainStore(), root = ref(null), active = ref(''), route = useRoute(), theme = useThemeVars();
let openTimer, closeTimer;
const viewportWidth = ref(typeof window === 'undefined' ? 1440 : window.innerWidth);
const updateViewport = () => { viewportWidth.value = window.innerWidth; };
const themeStyle = computed(()=>({'--menu-text':theme.value.textColor1,'--menu-muted':theme.value.textColor3,'--menu-bg':theme.value.cardColor,'--menu-border':theme.value.borderColor,'--menu-hover':theme.value.hoverColor,'--menu-primary':theme.value.primaryColor}));
const labels = {'zh-CN':['站点内容','首页','更多','专题','赛事'],'zh-TW':['網站內容','首頁','更多','專題','賽事'],en:['Site content','Home','More','Topics','Events'],ja:['サイト内容','ホーム','その他','特集','大会'],ko:['사이트 콘텐츠','홈','더 보기','주제','대회']};
const copy = computed(()=>{const a=labels[locale.value]||labels.en;return {navigation:a[0],home:a[1],more:a[2],topics:a[3],events:a[4]};});
const categories = computed(()=>tree.value.filter(node=>node.kind === 'category' && node.scope !== ALL_SCOPE).map(node=>({...node,slug:getCategoryByRef(store.categories,node.scope)?.slug || ''})));
const popular = computed(()=>['news','ai','tech','entertainment','sports'].map(slug=>categories.value.find(node=>node.slug === slug)).filter(Boolean));
const moreCategories = computed(()=>categories.value.filter(category=>!popular.value.some(item=>item.scope===category.scope) || (viewportWidth.value<=1200 && ['entertainment','sports'].includes(category.slug))));
const homeLocation = computed(()=>buildHomePath(locale.value));
const isHome = computed(()=>route.path === homeLocation.value);
const cleanCategory = scope=>({path:categoryLocation(scope).path});
const sections = computed(()=>[{id:'more',label:copy.value.more},{id:'topics',label:copy.value.topics,nodes:topicNodes.value},{id:'events',label:copy.value.events,nodes:eventNodes.value}]);
const cancelTimers = ()=>{clearTimeout(openTimer);clearTimeout(closeTimer);};
const open = id=>{cancelTimers();active.value=id;announceHoverMenuOpen('content:'+id);};
const scheduleOpen = id=>{if(!window.matchMedia('(hover:hover) and (pointer:fine)').matches)return;cancelTimers();openTimer=setTimeout(()=>open(id),160);};
const scheduleClose = ()=>{cancelTimers();closeTimer=setTimeout(()=>{if(!root.value?.contains(document.activeElement))active.value='';},200);};
const toggle = id=>{if(active.value===id)close();else open(id);};
const close = (focus=false)=>{cancelTimers();const trigger=focus?root.value?.querySelector('button[aria-expanded="true"]'):null;active.value='';trigger?.focus();};
const focusFirst = async id=>{open(id);await nextTick();root.value?.querySelector('#content-menu-'+id+' a')?.focus();};
const leaveFocus = event=>{if(!root.value?.contains(event.relatedTarget))close();};
const outside = event=>{if(!root.value?.contains(event.target))close();};
const foreignMenu = event=>{if(event.detail?.id !== 'content:'+active.value)close();};
watch(()=>route.path,()=>close());
onMounted(()=>{window.addEventListener('resize',updateViewport);document.addEventListener('pointerdown',outside);window.addEventListener(HOVER_MENU_OPEN_EVENT,foreignMenu);});
onBeforeUnmount(()=>{cancelTimers();window.removeEventListener('resize',updateViewport);document.removeEventListener('pointerdown',outside);window.removeEventListener(HOVER_MENU_OPEN_EVENT,foreignMenu);});
</script>
<style scoped>
.content-navigation { display:flex; align-items:center; justify-content:center; gap:2px; color:var(--menu-text); font-size:13px; min-width:0; }
.content-navigation__direct,.content-navigation button { display:inline-flex; align-items:center; justify-content:center; gap:5px; min-height:40px; padding:0 9px; border:0; border-radius:5px; background:transparent; color:inherit; text-decoration:none; font:inherit; white-space:nowrap; cursor:pointer; }
.content-navigation button svg,.content-navigation__panel>a svg { width:12px; height:12px; flex:0 0 12px; fill:none; stroke:currentColor; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
.content-navigation button[aria-expanded=true],.content-navigation a[aria-current=page] { color:var(--menu-primary); background:var(--menu-hover); }
.content-navigation__disclosure { position:relative; }
.content-navigation__panel { position:absolute; top:100%; right:0; z-index:1300; display:grid; min-width:220px; max-height:calc(100dvh - 100px); overflow:auto; padding:8px; border:1px solid var(--menu-border); border-radius:8px; background:var(--menu-bg); box-shadow:0 14px 40px rgba(0,0,0,.14); }
.content-navigation__panel>a { display:flex; align-items:center; justify-content:space-between; gap:18px; min-height:42px; padding:0 12px; border-radius:4px; color:inherit; text-decoration:none; }
.content-navigation__panel.is-mega { position:fixed; top:var(--site-header-height,64px); left:50%; right:auto; transform:translateX(-50%); width:min(880px,calc(100vw - 48px)); min-width:0; padding:24px; box-sizing:border-box; }
.content-navigation__grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:24px; }
.content-navigation__category { min-width:0; }
.content-navigation__main-link { display:flex; justify-content:space-between; align-items:center; padding:0 0 7px; color:var(--menu-text); text-decoration:none; font-weight:650; font-size:14px; }
.content-navigation__main-link span { color:var(--menu-muted); font-size:12px; }.content-navigation__children { display:grid; gap:2px; padding-top:8px; border-top:1px solid var(--menu-border); }
.content-navigation__children a { display:flex; align-items:center; min-height:32px; padding:3px 6px; border-radius:4px; color:var(--menu-muted); text-decoration:none; line-height:1.5; font-size:12px; }
.content-navigation :is(a,button):hover { color:var(--menu-primary); }.content-navigation :is(button,.content-navigation__direct):hover { background:var(--menu-hover); }
.content-navigation :is(a,button):focus-visible { outline:2px solid var(--menu-primary); outline-offset:2px; }
@media(max-width:1200px) { .content-navigation__direct.is-secondary { display:none; } .content-navigation__grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
@media(max-width:768px) {
 .content-navigation { overflow-x:auto; scrollbar-width:none; justify-content:flex-start; gap:0; font-size:12px; }.content-navigation__direct,.content-navigation button { padding-inline:9px; min-height:44px; }
 .content-navigation__panel,.content-navigation__panel.is-mega { position:fixed; top:var(--site-header-height,96px); left:10px; right:10px; width:auto; transform:none; max-height:calc(100dvh - var(--site-header-height,96px) - 16px); }
 .content-navigation__panel.is-mega { padding:18px; }
 .content-navigation__grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px 18px; }.content-navigation__children a { min-height:44px; display:flex; align-items:center; }
}
</style>
