<template>
 <div ref="root" class="quick-settings" :style="themeStyle" @keydown.esc.prevent.stop="close(true)" @focusout="leaveFocus">
  <button ref="trigger" type="button" class="quick-settings__trigger" :aria-label="copy.quick" :title="copy.quick" :aria-expanded="show" aria-controls="quick-settings-panel" @click="toggle" @keydown.down.prevent="focusPanel">
   <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 3-.6 2.2-2 .9-2-.7-2.4 4.2 1.6 1.5V13l-1.6 1.5 2.4 4.2 2-.7 2 .9.6 2.1h5l.6-2.1 2-.9 2 .7 2.4-4.2-1.6-1.5v-1.9l1.6-1.5-2.4-4.2-2 .7-2-.9L14.5 3Z"/><circle cx="12" cy="12" r="3"/></svg>
  </button>
  <section v-if="show" id="quick-settings-panel" class="quick-settings__panel" :aria-label="copy.quick">
   <strong class="quick-settings__title">{{ copy.quick }}</strong>
   <div class="quick-settings__section">
    <span>{{ t('settings.theme') }}</span>
    <div class="quick-settings__appearance" role="group" :aria-label="t('settings.theme')">
     <button v-for="mode in modes" :key="mode.value" type="button" :aria-pressed="appearance === mode.value" @click="store.setAppearanceMode(mode.value,osTheme)"><UiGlyph :name="mode.icon"/>{{ mode.label }}</button>
    </div>
   </div>
   <label class="quick-settings__language"><span>{{ copy.language }}</span><NativeSelectShell class="quick-settings__locale"><select :value="locale" :aria-label="copy.language" @change="switchLocale"><option v-for="item in languages" :key="item.code" :value="item.code">{{ item.label }}</option></select></NativeSelectShell></label>
   <div class="quick-settings__links">
    <button type="button" @click="openManager"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="12" y="3" width="5" height="5" rx="1"/><rect x="3" y="12" width="5" height="5" rx="1"/><rect x="12" y="12" width="5" height="5" rx="1"/></svg><span>{{ copy.manage }}</span><span aria-hidden="true">›</span></button>
    <button type="button" @click="openSettings"><UiGlyph name="monitor"/><span>{{ copy.settings }}</span><span aria-hidden="true">›</span></button>
   </div>
  </section>
 </div>
</template>
<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useOsTheme, useThemeVars } from 'naive-ui';
import UiGlyph from '@/components/ui/UiGlyph.vue';
import NativeSelectShell from '@/components/ui/NativeSelectShell.vue';
import { mainStore } from '@/store';
import { useRankingNavigation } from '@/composables/useRankingNavigation';
import { ALL_SCOPE } from '@/utils/rankingNavigation';
import { buildLocalePathFromRoute, getSupportedLocales, savePreferredLocale } from '@/utils/locale';
import { HOVER_MENU_OPEN_EVENT, announceHoverMenuOpen } from '@/utils/hoverMenu';
const emit = defineEmits(['open-settings','open-hotboard-manager']);
const store = mainStore(), route = useRoute(), router = useRouter(), nav = useRankingNavigation(), theme = useThemeVars(), osTheme = useOsTheme();
const { t,locale } = useI18n({useScope:'global'});
const root = ref(null), trigger = ref(null), show = ref(false);
const languageCopy = {'zh-CN':['快捷设置','语言','榜单管理','全局设置'],'zh-TW':['快捷設定','語言','榜單管理','全域設定'],en:['Quick settings','Language','Manage rankings','All settings'],ja:['クイック設定','言語','ランキング管理','すべての設定'],ko:['빠른 설정','언어','랭킹 관리','전체 설정']};
const copy = computed(()=>{const a=languageCopy[locale.value]||languageCopy.en;return {quick:a[0],language:a[1],manage:a[2],settings:a[3]};});
const languages = getSupportedLocales();
const appearance = computed(()=>store.siteThemeAuto?'auto':store.siteTheme);
const modes = computed(()=>[{value:'light',icon:'sun',label:t('settings.themeLight')},{value:'dark',icon:'moon',label:t('settings.themeDark')},{value:'auto',icon:'monitor',label:t('settings.themeAutoOption')}]);
const themeStyle = computed(()=>({'--quick-bg':theme.value.cardColor,'--quick-fg':theme.value.textColor1,'--quick-muted':theme.value.textColor3,'--quick-border':theme.value.borderColor,'--quick-hover':theme.value.hoverColor,'--quick-primary':theme.value.primaryColor}));
const close = (focus=false)=>{show.value=false;if(focus)trigger.value?.focus();};
const toggle = ()=>{show.value=!show.value;if(show.value)announceHoverMenuOpen('quick-settings');};
const focusPanel = async()=>{if(!show.value)toggle();await nextTick();root.value?.querySelector('#quick-settings-panel button')?.focus();};
const leaveFocus = event=>{if(!root.value?.contains(event.relatedTarget))close();};
const outside = event=>{if(!root.value?.contains(event.target))close();};
const foreignMenu = event=>{if(event.detail?.id!=='quick-settings')close();};
const openManager = ()=>{close();emit('open-hotboard-manager',nav.scope.value===ALL_SCOPE?null:nav.scope.value);};
const openSettings = ()=>{close();emit('open-settings');};
const switchLocale = event=>{const value=event.target.value;locale.value=value;savePreferredLocale(value);close();router.push(buildLocalePathFromRoute(route,value));};
watch(()=>route.path,()=>close());
onMounted(()=>{document.addEventListener('pointerdown',outside);window.addEventListener(HOVER_MENU_OPEN_EVENT,foreignMenu);});
onBeforeUnmount(()=>{document.removeEventListener('pointerdown',outside);window.removeEventListener(HOVER_MENU_OPEN_EVENT,foreignMenu);});
</script>
<style scoped>
.quick-settings { position:relative; flex-shrink:0; color:var(--quick-fg); }.quick-settings__trigger { display:grid; place-items:center; width:36px; height:36px; border:1px solid var(--quick-border); border-radius:6px; background:transparent; color:inherit; cursor:pointer; }
.quick-settings svg { display:block; width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
.quick-settings__panel { position:absolute; top:calc(100% + 8px); right:0; z-index:1300; width:300px; padding:18px; box-sizing:border-box; border:1px solid var(--quick-border); border-radius:8px; background:var(--quick-bg); box-shadow:0 14px 40px rgba(0,0,0,.14); }
.quick-settings__title { display:block; margin-bottom:18px; font-size:14px; font-weight:650; }
.quick-settings__section { display:grid; gap:8px; font-size:12px; }.quick-settings__section>span,.quick-settings__language>span { color:var(--quick-muted); }
.quick-settings__appearance { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); padding:3px; gap:3px; background:var(--quick-hover); border-radius:6px; }
.quick-settings__appearance button { display:flex; align-items:center; justify-content:center; gap:5px; min-height:36px; padding:0 3px; border:1px solid transparent; border-radius:4px; background:transparent; color:inherit; font:inherit; cursor:pointer; }
.quick-settings__appearance button[aria-pressed=true] { background:var(--quick-bg); border-color:var(--quick-border); color:var(--quick-primary); }.quick-settings__appearance .ui-glyph { width:15px; height:15px; }
.quick-settings__language { display:flex; align-items:center; justify-content:space-between; gap:14px; margin:16px 0; font-size:12px; }.quick-settings__locale { width:min(180px,100%); flex:0 1 180px; min-width:0; }.quick-settings__locale :deep(select) { padding-block:7px; padding-inline-start:9px; border:1px solid var(--quick-border); border-radius:4px; background:var(--quick-bg); color:inherit; font:inherit; }
.quick-settings__links { display:grid; padding-top:8px; border-top:1px solid var(--quick-border); }.quick-settings__links button { display:grid; grid-template-columns:18px 1fr auto; gap:10px; align-items:center; min-height:44px; border:0; border-radius:4px; padding:0 6px; background:transparent; color:inherit; text-align:left; font:inherit; font-size:13px; cursor:pointer; }
.quick-settings :is(button,select):hover { background:var(--quick-hover); }.quick-settings :is(button,select):focus-visible { outline:2px solid var(--quick-primary); outline-offset:2px; }
@media(max-width:768px) { .quick-settings__trigger { width:32px; height:36px; }.quick-settings__panel { position:fixed; top:var(--site-header-height,96px); left:10px; right:10px; width:auto; max-height:calc(100dvh - var(--site-header-height,96px) - 16px); overflow:auto; }.quick-settings__appearance button { min-height:44px; }.quick-settings select { min-height:44px; } }
</style>
