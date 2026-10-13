<template>
 <div ref="root" class="global-search" :style="themeStyle" @focusout="leaveFocus" @keydown.esc="escapeHandler">
  <form role="search" @submit.prevent="submit">
   <svg class="global-search__icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m12.5 12.5 4 4"/></svg>
   <input ref="input" v-model="draft" type="search" :placeholder="placeholder" :aria-label="copy.search" :aria-expanded="show" aria-controls="global-search-panel" autocomplete="off" @focus="open" @click="open" @input="queueUpdate" @compositionstart="composing=true" @compositionend="compositionEnd" @keydown.down.prevent="focusResults" />
   <button v-if="draft" type="button" class="global-search__clear" :aria-label="copy.clear" @click="clear"><span aria-hidden="true">×</span></button><kbd v-else aria-hidden="true">{{ shortcut }}</kbd>
  </form>
  <section v-if="show" id="global-search-panel" class="global-search__panel" :class="{ 'is-default': !draft.trim() }" :aria-label="copy.results">
   <div class="global-search__scopes" role="group" :aria-label="copy.scope">
    <button v-if="supportsCurrent" type="button" :aria-pressed="scope==='current'" @click="setScope('current')">{{ copy.current }}</button>
    <button type="button" :aria-pressed="scope==='site'" @click="setScope('site')">{{ copy.site }}</button>
   </div>
   <p class="global-search__hint">{{ scope==='current' ? currentHint : copy.siteHint }}</p>
   <button v-if="scope==='current' && draft.trim()" type="button" class="global-search__apply" @click="submit">{{ copy.apply.replace('{q}',draft.trim()) }}<span aria-hidden="true">↵</span></button>
   <RankingFavorites v-if="!draft.trim()" class="global-search__favorites" @navigate="close()" />
   <template v-for="group in groups" :key="group.kind">
    <div class="global-search__group-title"><strong>{{ group.label }}</strong><span>{{ group.items.length }}</span></div>
    <ul class="global-search__results">
     <li v-for="item in group.items" :key="item.id">
      <a v-if="item.externalUrl" :href="item.externalUrl" target="_blank" rel="noopener noreferrer" @click="close()"><img v-if="item.icon" :src="item.icon" alt="" @error="logoError" /><span><strong>{{ item.label }}</strong><small>{{ item.detail }}</small></span><span aria-hidden="true">↗</span></a>
      <router-link v-else :to="item.location" :title="item.label" @click="close()"><img v-if="item.icon" :src="item.icon" alt="" /><span v-else class="global-search__kind-icon" aria-hidden="true">{{ item.kind==='category'?'#':item.kind==='event'?'◷':'◇' }}</span><span><strong>{{ item.label }}</strong><small>{{ item.detail }}</small></span><span aria-hidden="true">›</span></router-link>
     </li>
    </ul>
   </template>
   <p v-if="!groups.length" class="global-search__empty">{{ scope==='current' ? currentHint : copy.empty }}</p>
  </section>
 </div>
</template>
<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useThemeVars } from 'naive-ui';
import RankingFavorites from '@/components/RankingFavorites.vue';
import { useRankingNavigation } from '@/composables/useRankingNavigation';
import { getSourceLogo, getSourceLogoFallback } from '@/utils/sourceLogos';
import { ALL_SCOPE, getRankingDestinationLabel, getRankingSearchNodes } from '@/utils/rankingNavigation';
import { matchNavigationEntries, contextSearchLocation } from '@/utils/navigationSearch';
import { HOVER_MENU_OPEN_EVENT, announceHoverMenuOpen } from '@/utils/hoverMenu';
const nav = useRankingNavigation(), route = useRoute(), router = useRouter(), theme = useThemeVars();
const root = ref(null), input = ref(null), show = ref(false), composing = ref(false), shortcut = ref('⌘K');
const queryText = value=>String(Array.isArray(value)?value[0]||'':value||'');
const pageKind = computed(()=>{const n=String(route.name||'');return ['home','home-locale','category','category-locale'].includes(n)?'catalog':n.startsWith('list')?'reader':n.includes('-topic')?'topic':n==='event'||n==='event-locale'?'event':'';});
const supportsCurrent = computed(()=>Boolean(pageKind.value));
const scope = ref(supportsCurrent.value?'current':'site'), draft = ref(queryText(route.query.q));
let timer, pendingQuery;
const COPY = {
 'zh-CN':{search:'搜索',clear:'清除搜索',results:'搜索结果',scope:'搜索范围',current:'当前页面',site:'全站入口',siteHint:'查找平台、分类、专题和赛事入口',catalog:'筛选当前页面的榜单',reader:'搜索此榜单内容',topic:'筛选当前专题内容',event:'筛选当前赛事内容',sitePlaceholder:'搜索平台、分类、专题…',apply:'在当前页面查找「{q}」',empty:'没有匹配的入口，试试平台名或领域名',source:'平台榜单',category:'分类',topicGroup:'专题',eventGroup:'赛事',favorites:'常用',browse:'推荐入口',sourceDetail:'打开独立榜单',categoryDetail:'浏览分类'},
 'zh-TW':{search:'搜尋',clear:'清除搜尋',results:'搜尋結果',scope:'搜尋範圍',current:'目前頁面',site:'全站入口',siteHint:'尋找平台、分類、專題和賽事入口',catalog:'篩選目前頁面的榜單',reader:'搜尋此榜單內容',topic:'篩選目前專題內容',event:'篩選目前賽事內容',sitePlaceholder:'搜尋平台、分類、專題…',apply:'在目前頁面尋找「{q}」',empty:'沒有符合的入口',source:'平台榜單',category:'分類',topicGroup:'專題',eventGroup:'賽事',favorites:'常用',browse:'推薦入口',sourceDetail:'開啟獨立榜單',categoryDetail:'瀏覽分類'},
 en:{search:'Search',clear:'Clear search',results:'Search results',scope:'Search scope',current:'This page',site:'Explore site',siteHint:'Find platforms, categories, topics and events',catalog:'Filter rankings on this page',reader:'Search this ranking',topic:'Filter this topic',event:'Filter this event',sitePlaceholder:'Search platforms, categories…',apply:'Find “{q}” on this page',empty:'No matching destinations',source:'Rankings',category:'Categories',topicGroup:'Topics',eventGroup:'Events',favorites:'Favorites',browse:'Explore',sourceDetail:'Open ranking',categoryDetail:'Browse category'},
 ja:{search:'検索',clear:'検索をクリア',results:'検索結果',scope:'検索範囲',current:'このページ',site:'サイト全体',siteHint:'プラットフォーム・分類・特集・大会を探す',catalog:'このページのランキングを絞り込み',reader:'このランキング内を検索',topic:'特集内を絞り込み',event:'大会内を絞り込み',sitePlaceholder:'プラットフォーム・分類を検索…',apply:'このページで「{q}」を検索',empty:'一致するページがありません',source:'ランキング',category:'分類',topicGroup:'特集',eventGroup:'大会',favorites:'お気に入り',browse:'おすすめ',sourceDetail:'ランキングを開く',categoryDetail:'分類を開く'},
 ko:{search:'검색',clear:'검색 지우기',results:'검색 결과',scope:'검색 범위',current:'현재 페이지',site:'사이트 탐색',siteHint:'플랫폼, 분류, 주제, 대회 찾기',catalog:'이 페이지의 랭킹 필터',reader:'이 랭킹 검색',topic:'현재 주제 필터',event:'현재 대회 필터',sitePlaceholder:'플랫폼, 분류 검색…',apply:'이 페이지에서 ‘{q}’ 찾기',empty:'일치하는 페이지가 없습니다',source:'랭킹',category:'분류',topicGroup:'주제',eventGroup:'대회',favorites:'즐겨찾기',browse:'추천',sourceDetail:'랭킹 열기',categoryDetail:'분류 탐색'}
};
const copy = computed(()=>COPY[nav.locale.value]||COPY.en);
const currentHint = computed(()=>copy.value[pageKind.value]||copy.value.siteHint);
const placeholder = computed(()=>scope.value==='current'?currentHint.value:copy.value.sitePlaceholder);
const themeStyle = computed(()=>({'--search-bg':theme.value.cardColor,'--search-fg':theme.value.textColor1,'--search-muted':theme.value.textColor3,'--search-border':theme.value.borderColor,'--search-hover':theme.value.hoverColor,'--search-primary':theme.value.primaryColor}));
const toEntry = node=>{
 const location = node.externalUrl?undefined:nav.nodeLocation(node);
 return {...node,label:node.kind==='source'?getRankingDestinationLabel(node,nav.locale.value):node.label,icon:node.kind==='source'?getSourceLogo(node.sourceName):undefined,location:location?{path:location.path,query:node.kind==='source'?{scope:ALL_SCOPE}:undefined}:undefined,detail:node.kind==='source'?copy.value.sourceDetail:node.kind==='category'?copy.value.categoryDetail:node.kind==='topic'?copy.value.topicGroup:copy.value.eventGroup,name:node.name||node.sourceName||node.scope||node.id};
};
const entries = computed(()=>{
 const result=[],seen=new Set();
 const visit=node=>{if(node.kind==='category'&&node.scope!==ALL_SCOPE&&!seen.has(node.id)){seen.add(node.id);result.push(toEntry(node));}node.children?.filter(child=>child.kind==='category').forEach(visit);};
 nav.tree.value.forEach(visit);
 for(const node of nav.tree.value.find(item=>item.scope===ALL_SCOPE)?.children||[]){if(node.kind!=='source'||seen.has(node.sourceName))continue;seen.add(node.sourceName);result.push(...getRankingSearchNodes(node,nav.locale.value).map(toEntry));}
 result.push(...nav.topicNodes.value.map(toEntry),...nav.eventNodes.value.map(toEntry));
 return result;
});
const groups = computed(()=>{
 const q=draft.value.trim();
 if(!q){
  const browse=[...nav.tree.value.filter(node=>node.kind==='category'&&node.scope!==ALL_SCOPE).slice(0,4),...nav.topicNodes.value,...nav.eventNodes.value].map(toEntry);
  return [{kind:'browse',label:copy.value.browse,items:browse}].filter(group=>group.items.length);
 }
 return [{kind:'source',label:copy.value.source,limit:8},{kind:'category',label:copy.value.category,limit:6},{kind:'topic',label:copy.value.topicGroup,limit:4},{kind:'event',label:copy.value.eventGroup,limit:4}].map(group=>({...group,items:matchNavigationEntries(entries.value.filter(item=>item.kind===group.kind),q,group.limit)})).filter(group=>group.items.length);
});
const logoError = event=>{event.target.src=getSourceLogoFallback();};
const cancelUpdate=()=>{clearTimeout(timer);timer=undefined;};
const applyCurrent = ()=>{
 cancelUpdate();if(scope.value!=='current'||composing.value)return;
 pendingQuery=draft.value.trim();
 router.replace(contextSearchLocation(route,draft.value));
};
const queueUpdate = ()=>{
 open();cancelUpdate();if(composing.value||scope.value!=='current')return;
 const path=route.path;
 timer=setTimeout(()=>{if(route.path===path)applyCurrent();},180);
};
const compositionEnd = ()=>{composing.value=false;queueUpdate();};
const open = ()=>{show.value=true;announceHoverMenuOpen('global-search');};
const close = (focus=false)=>{if(focus)input.value?.focus();show.value=false;};
const escapeHandler = event=>{if(event.isComposing||composing.value)return;event.preventDefault();event.stopPropagation();close(true);};
const setScope = value=>{cancelUpdate();scope.value=value;draft.value=value==='current'?queryText(route.query.q):'';};
const clear = ()=>{draft.value='';if(scope.value==='current')applyCurrent();input.value?.focus();};
const focusResults = async()=>{if(!show.value)open();await nextTick();root.value?.querySelector('.global-search__apply,.global-search__results a')?.focus();};
const submit = ()=>{if(composing.value)return;if(scope.value==='current'){applyCurrent();close();}else focusResults();};
const leaveFocus = event=>{if(!root.value?.contains(event.relatedTarget))close();};
const outside = event=>{if(!root.value?.contains(event.target))close();};
const foreignMenu = event=>{if(event.detail?.id!=='global-search')close();};
const shortcutHandler = event=>{
 if(event.isComposing)return;
 const editable=event.target?.closest?.('input,textarea,select,[contenteditable="true"]');
 if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'||!editable&&event.key==='/'&&!event.metaKey&&!event.ctrlKey){
  event.preventDefault();input.value?.focus();input.value?.select();open();
 }
};
watch(()=>route.query.q,value=>{const next=queryText(value);if(next===pendingQuery){pendingQuery=undefined;return;}if(scope.value==='current'&&!composing.value)draft.value=next;});
watch(()=>[route.path,pageKind.value],()=>{cancelUpdate();close();scope.value=supportsCurrent.value?'current':'site';draft.value=queryText(route.query.q);},{immediate:true});
onMounted(()=>{shortcut.value=/Mac|iPhone|iPad/i.test(navigator.platform||'')?'⌘K':'Ctrl K';document.addEventListener('pointerdown',outside);window.addEventListener('keydown',shortcutHandler);window.addEventListener(HOVER_MENU_OPEN_EVENT,foreignMenu);});
onBeforeUnmount(()=>{cancelUpdate();document.removeEventListener('pointerdown',outside);window.removeEventListener('keydown',shortcutHandler);window.removeEventListener(HOVER_MENU_OPEN_EVENT,foreignMenu);});
</script>
<style scoped>
.global-search { position:relative; min-width:100px; width:clamp(180px,21vw,310px); color:var(--search-fg); }.global-search form { display:flex; align-items:center; gap:7px; height:36px; padding:0 9px; border:1px solid var(--search-border); border-radius:6px; background:var(--search-hover); box-sizing:border-box; }
.global-search form:focus-within { border-color:var(--search-primary); outline:2px solid color-mix(in srgb,var(--search-primary) 18%,transparent); }.global-search__icon { flex:0 0 15px; width:15px; height:15px; fill:none; stroke:var(--search-muted); stroke-width:1.5; stroke-linecap:round; }.global-search input { flex:1; min-width:0; width:100%; padding:0; border:0; outline:0; background:transparent; color:inherit; font:inherit; font-size:12px; }.global-search input::-webkit-search-cancel-button { display:none; }.global-search input::placeholder { color:var(--search-muted); }.global-search kbd { font:inherit; font-size:10px; white-space:nowrap; color:var(--search-muted); }.global-search__clear { border:0; background:transparent; color:var(--search-muted); padding:0 3px; font-size:19px; cursor:pointer; }
.global-search__panel { position:absolute; right:0; top:calc(100% + 8px); z-index:1300; width:min(520px,calc(100vw - 32px)); max-height:calc(100dvh - var(--site-header-height,64px) - 28px); overflow:auto; box-sizing:border-box; padding:16px; border:1px solid var(--search-border); border-radius:8px; background:var(--search-bg); box-shadow:0 14px 40px rgba(0,0,0,.14); }
.global-search__scopes { display:flex; gap:4px; }.global-search__scopes button { min-height:34px; padding:0 12px; border:0; border-radius:4px; background:transparent; color:var(--search-muted); font:inherit; font-size:12px; cursor:pointer; }.global-search__scopes button[aria-pressed=true] { background:var(--search-hover); color:var(--search-primary); font-weight:600; }
.global-search__favorites { margin:14px 0 12px; }
.global-search__favorites :deep(.ranking-favorites__items) { max-height:180px; overflow:auto; padding:2px; box-sizing:border-box; }
.global-search__hint { margin:10px 2px 14px; font-size:12px; color:var(--search-muted); }.global-search__apply { display:flex; justify-content:space-between; gap:12px; width:100%; min-height:42px; padding:10px; margin-bottom:10px; border:0; border-radius:4px; background:var(--search-hover); color:inherit; text-align:left; font:inherit; cursor:pointer; }.global-search__apply span { color:var(--search-muted); }
.global-search__group-title { display:flex; justify-content:space-between; padding:10px 4px 4px; font-size:11px; color:var(--search-muted); }.global-search__group-title strong { font-weight:600; }.global-search__results { list-style:none; margin:0; padding:0; }.global-search__results a { display:grid; grid-template-columns:24px minmax(0,1fr) auto; gap:10px; align-items:center; min-height:50px; padding:7px 8px; border-radius:4px; color:inherit; text-decoration:none; box-sizing:border-box; }.global-search__results a:hover { background:var(--search-hover); }.global-search__results img { display:block; width:24px; height:24px; object-fit:contain; }.global-search__kind-icon { color:var(--search-muted); font-size:18px; text-align:center; }.global-search__results strong,.global-search__results small { display:block; }.global-search__results strong { font-size:13px; font-weight:550; }.global-search__results small { color:var(--search-muted); font-size:11px; margin-top:2px; }.global-search__results a>span:last-child { color:var(--search-muted); }.global-search__empty { padding:22px 4px; margin:0; font-size:13px; color:var(--search-muted); }
.global-search__panel.is-default .global-search__results { display:flex; flex-wrap:wrap; gap:6px; padding:5px 0 12px; }
.global-search__panel.is-default .global-search__results a { display:flex; gap:7px; min-height:36px; padding:6px 10px; border:1px solid var(--search-border); }
.global-search__panel.is-default .global-search__results :is(img,.global-search__kind-icon) { width:16px; height:16px; font-size:14px; }
.global-search__panel.is-default .global-search__results small,.global-search__panel.is-default .global-search__results a>span:last-child { display:none; }
.global-search :is(button,a):focus-visible { outline:2px solid var(--search-primary); outline-offset:1px; }
@media(max-width:1100px) { .global-search { width:clamp(160px,25vw,260px); } }
@media(max-width:768px) { .global-search { width:auto; flex:1; }.global-search kbd { display:none; }.global-search__panel { position:fixed; top:var(--site-header-height,96px); left:10px; right:10px; width:auto; max-height:calc(100dvh - var(--site-header-height,96px) - 16px); }.global-search__scopes button { min-height:44px; }.global-search__clear { min-width:24px; }.global-search input { font-size:16px; } }
</style>
