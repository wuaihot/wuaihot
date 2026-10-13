<template>
  <header class="lol-event-hero" :class="{ 'is-demacia': demacia, 'is-worlds': activeId === 'worlds-2026', 'has-focus': !!$slots.focus }">
    <div class="lol-event-hero__backdrop" aria-hidden="true">
      <picture class="lol-event-hero__art">
        <source media="(max-width:600px)" :srcset="'/assets/lol-series/lol-champions-portrait-v1-640.webp 640w, /assets/lol-series/lol-champions-portrait-v1-960.webp 960w'" sizes="100vw" />
        <source media="(max-width:1024px)" srcset="/assets/lol-series/lol-champions-compact-v1-640.webp 640w, /assets/lol-series/lol-champions-compact-v1-1280.webp 1280w" sizes="100vw" />
        <img src="/assets/lol-series/lol-champions-hero-v2-1920.webp" alt="" decoding="async" fetchpriority="high" />
      </picture>
      <span class="lol-event-hero__wash"></span>
    </div>
    <div class="lol-event-hero__topbar">
      <LolSeriesNavigation :active-id="activeId" :locale="locale" />
      <div class="lol-event-hero__tools"><span v-if="statusLabel" class="lol-event-hero__status" :class="'is-' + status">{{ statusLabel }}</span><slot name="tools" /></div>
    </div>
    <div class="lol-event-hero__body">
      <div class="lol-event-hero__identity">
        <div class="lol-event-hero__identity-art" aria-hidden="true">
          <img v-if="logo && !logoFailed" class="lol-event-hero__watermark" :src="logo" alt="" width="200" height="200" decoding="async" @error="logoFailed = true" />
          <span v-else class="lol-event-hero__edition">{{ edition }}</span>
        </div>
        <p v-if="eyebrow" class="lol-event-hero__eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <ul class="lol-event-hero__meta"><li v-for="item in meta.filter(Boolean)" :key="item">{{ item }}</li></ul>
        <p v-if="description" class="lol-event-hero__description">{{ description }}</p>
      </div>
      <div v-if="$slots.focus" class="lol-event-hero__focus"><slot name="focus" /></div>
    </div>
    <nav v-if="links.length || $slots.watch" class="lol-event-hero__services" :aria-label="servicesLabel">
      <template v-for="link in links" :key="link.url">
        <div v-if="link.children?.length" class="lol-event-hero__source-group" @mouseenter="hoveredSource = link.url" @mouseleave="hoveredSource = ''" @keydown.esc.stop="pinnedSource = ''; hoveredSource = ''">
          <button type="button" class="lol-event-hero__source-trigger" :aria-expanded="sourceMenuOpen(link.url)" @click="pinnedSource = pinnedSource === link.url ? '' : link.url"><img v-if="link.logo || eventResourceLogo(link.url)" :src="link.logo || eventResourceLogo(link.url)" alt="" width="16" height="16" /><span>{{ link.label }}</span><DisclosureChevron :expanded="sourceMenuOpen(link.url)" /></button>
          <div v-show="sourceMenuOpen(link.url)" class="lol-event-hero__source-menu">
            <a v-for="child in link.children" :key="child.url" :href="child.url" target="_blank" rel="nofollow noopener noreferrer">{{ child.label }}<span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <a v-else :href="link.url" target="_blank" rel="nofollow noopener noreferrer"><img v-if="link.logo || eventResourceLogo(link.url)" :src="link.logo || eventResourceLogo(link.url)" alt="" width="16" height="16" />{{ link.label }}<span aria-hidden="true">↗</span></a>
      </template>
      <slot name="watch" />
    </nav>
  </header>
</template>
<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import DisclosureChevron from "./ui/DisclosureChevron.vue";
import LolSeriesNavigation from "./LolSeriesNavigation.vue";
import { eventResourceLogo } from "@/utils/eventResourceLinks";
const props = defineProps({
  activeId:{type:String,required:true}, locale:{type:String,default:"zh-CN"},
  title:{type:String,required:true}, eyebrow:{type:String,default:""},
  status:{type:String,default:"upcoming"}, statusLabel:{type:String,default:""},
  logo:{type:String,default:""}, edition:{type:String,default:""}, demacia:Boolean,
  meta:{type:Array,default:()=>[]}, description:{type:String,default:""},
  links:{type:Array,default:()=>[]}, servicesLabel:{type:String,required:true},
});
const logoFailed = ref(false);
const hoveredSource = ref("");
const pinnedSource = ref("");
const sourceMenuOpen = (url) => hoveredSource.value === url || pinnedSource.value === url;
const closeOnOutside = (event) => {
  if (!event.target.closest?.(".lol-event-hero__source-group")) { pinnedSource.value = ""; hoveredSource.value = ""; }
};
onMounted(() => document.addEventListener("pointerdown", closeOnOutside));
onBeforeUnmount(() => document.removeEventListener("pointerdown", closeOnOutside));
watch(()=>props.logo,()=>{logoFailed.value=false;});
</script>
<style scoped>
.lol-event-hero {
  --hero-ink:#010a13; --hero-text:#f2ffff; --hero-muted:#c5d8e0; --hero-accent:#0ac8b9;
  --hero-border:#517c894d; --hero-pad:24px; --hero-gap:24px; --hero-radius:12px;
  --hero-watermark-opacity:.065; --hero-focus-size:310px;
  position:relative; isolation:isolate; overflow:visible; border:1px solid var(--hero-border);
  border-top:3px solid var(--hero-accent); border-radius:var(--hero-radius);
  background:var(--hero-ink); color:var(--hero-text); color-scheme:dark;
  padding:16px var(--hero-pad) 0; min-width:0; box-sizing:border-box;
}
.lol-event-hero.is-demacia { --hero-accent:#29329e; --hero-border:#6370b366; }
.lol-event-hero.is-worlds { z-index:4; }
.lol-event-hero__backdrop { position:absolute; inset:0; z-index:0; pointer-events:none; overflow:hidden; border-radius:inherit; }
.lol-event-hero__art,.lol-event-hero__wash { position:absolute; inset:0; }
.lol-event-hero__art img { display:block; width:100%; height:100%; object-fit:cover; object-position:center; opacity:.78; }
.lol-event-hero__wash { background:linear-gradient(90deg,#010a13f7 0%,#010a13d9 36%,#010a1380 68%,#010a1399 100%); }
 .lol-event-hero__identity-art { position:absolute; inset:-24px 0; overflow:visible; pointer-events:none; z-index:-1; }
.lol-event-hero__watermark { position:absolute; left:4%; top:50%; transform:translateY(-50%); width:clamp(350px,36vw,480px); height:clamp(350px,36vw,480px); max-height:none; object-fit:contain; opacity:var(--hero-watermark-opacity); }
.lol-event-hero__edition { position:absolute; left:6%; top:50%; transform:translateY(-50%); font:900 clamp(180px,28vw,320px)/1 Impact,sans-serif; opacity:var(--hero-watermark-opacity); }
.lol-event-hero__topbar { position:relative; z-index:3; display:flex; align-items:center; justify-content:space-between; gap:12px; min-width:0; padding-bottom:12px; border-bottom:1px solid var(--hero-border); }
.lol-event-hero__tools { display:flex; align-items:center; gap:10px; flex:none; }
.lol-event-hero__status { color:var(--hero-muted); font-size:12px; white-space:nowrap; }
.lol-event-hero__status.is-active { color:var(--hero-text); }
.lol-event-hero__body { position:relative; z-index:1; display:grid; grid-template-columns:minmax(0,1fr); align-items:center; gap:var(--hero-gap); min-height:210px; padding:24px 0; box-sizing:border-box; }
.has-focus .lol-event-hero__body { grid-template-columns:minmax(0,1fr) var(--hero-focus-size); }
.lol-event-hero__identity { min-width:0; position:relative; isolation:isolate; }
.lol-event-hero__eyebrow { font-size:11px; line-height:1.5; letter-spacing:.1em; color:var(--hero-muted); margin:0 0 10px; overflow-wrap:anywhere; }
.lol-event-hero h1 { margin:0; color:var(--hero-text); font-size:clamp(24px,2.5vw,36px); line-height:1.3; font-weight:750; overflow-wrap:anywhere; }
.lol-event-hero__meta { display:flex; flex-wrap:wrap; align-items:center; gap:6px 18px; margin:14px 0 0; padding:0; list-style:none; color:var(--hero-muted); font-size:13px; line-height:1.6; }
.lol-event-hero__description { max-width:720px; margin:12px 0 0; font-size:13px; line-height:1.7; color:var(--hero-muted); }
.lol-event-hero__focus { min-width:0; padding-left:24px; border-left:1px solid var(--hero-border); }
.lol-event-hero__services { position:relative; z-index:1; display:flex; align-items:center; flex-wrap:wrap; gap:0 20px; padding:10px 0; border-top:1px solid var(--hero-border); font-size:12px; color:var(--hero-text); }
.lol-event-hero__services>a { display:inline-flex; align-items:center; gap:5px; min-height:32px; color:inherit; text-decoration:none; border-radius:4px; }
.lol-event-hero.is-worlds .lol-event-hero__services { gap:8px; padding:12px 0; }
.lol-event-hero.is-worlds .lol-event-hero__services>a { min-height:38px; padding:0 10px; border:1px solid var(--hero-border); border-radius:8px; background:#0a1825a6; font-size:12px; font-weight:650; }
.lol-event-hero.is-worlds .lol-event-hero__services>a:hover { border-color:#bda064; background:#36434b; text-decoration:none; }
.lol-event-hero__services img { display:block; object-fit:contain; }
.lol-event-hero__services>a:hover { text-decoration:underline; text-underline-offset:3px; }
.lol-event-hero__services>a:focus-visible { outline:2px solid var(--hero-accent); outline-offset:3px; }
.lol-event-hero__source-group { position:relative; flex:none; z-index:20; }
.lol-event-hero__source-group>.lol-event-hero__source-trigger { font-family:inherit; display:inline-flex; align-items:center; gap:6px; min-height:38px; padding:0 10px; border:1px solid var(--hero-border); border-radius:8px; background:#0a1825a6; color:var(--hero-text); font-size:12px; font-weight:650; cursor:pointer; list-style:none; }

.lol-event-hero__source-group>.lol-event-hero__source-trigger:hover,.lol-event-hero__source-trigger[aria-expanded="true"] { border-color:#bda064; background:#36434b; }
.lol-event-hero__source-trigger:focus-visible,.lol-event-hero__source-menu a:focus-visible { outline:2px solid var(--hero-accent); outline-offset:3px; }
.lol-event-hero__source-menu { display:grid; position:absolute; top:100%; left:0; z-index:30; width:max-content; min-width:212px; max-width:min(320px,90vw); padding:7px; border:1px solid #52616d; border-radius:10px; background:#101b28; }
.lol-event-hero__source-menu { gap:3px; }
.lol-event-hero__source-menu a { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:9px 10px; border-radius:6px; color:#eaf3f5; text-decoration:none; font-size:12px; }
.lol-event-hero__source-menu a:hover { background:#52616d55; }

@media(max-width:1024px) { .lol-event-hero__art img { object-position:70% center; }.lol-event-hero { --hero-focus-size:270px; } }
@media(max-width:820px) {
 .lol-event-hero { --hero-pad:18px; --hero-gap:18px; --hero-watermark-opacity:.055; }
 .lol-event-hero__topbar { align-items:flex-start; flex-wrap:wrap; }.lol-event-hero__tools { margin-left:auto; }
 .has-focus .lol-event-hero__body { grid-template-columns:minmax(0,1fr); }
 .lol-event-hero__body { min-height:0; padding:20px 0; }
 .lol-event-hero__focus { padding:14px 0 0; border-left:0; border-top:1px solid var(--hero-border); }
 .lol-event-hero__watermark { width:clamp(280px,40vw,390px); height:clamp(280px,40vw,390px); }
}
@media(max-width:600px) {
 .lol-event-hero { --hero-pad:16px; }
 .lol-event-hero__art { top:100px; bottom:auto; height:450px; }
 .lol-event-hero__art img { object-position:center 58%; opacity:.9; }
 .lol-event-hero__wash { background:linear-gradient(180deg,#010a13 0%,#010a13ed 18%,#010a13b8 38%,#010a131f 62%,#010a13a6 78%,#010a13 95%); }
 .lol-event-hero__identity { padding-bottom:136px; }
 .lol-event-hero__identity-art { inset:-20px 0 136px; }
 .lol-event-hero__focus { position:relative; background:#010a13bd; }
 .lol-event-hero__services { background:#010a13e8; }
 .lol-event-hero__eyebrow { font-size:10px; letter-spacing:.07em; }
 .lol-event-hero__meta { gap:4px 12px; font-size:12px; }.lol-event-hero__status { font-size:11px; }
 .lol-event-hero__services { gap:0 14px; }.lol-event-hero__services>a { min-height:44px; }
}
</style>
