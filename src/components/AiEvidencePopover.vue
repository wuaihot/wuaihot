<template>
  <n-popover :show="show && !narrow" trigger="manual" placement="bottom-start" :show-arrow="false" :style="{...themeStyle,maxWidth:'min(480px,calc(100vw - 24px))'}" @clickoutside="close()">
    <template #trigger><button ref="triggerRef" type="button" class="event-evidence-trigger" :aria-expanded="show" :aria-controls="id" @pointerenter="enterTrigger" @pointerleave="leave" @focus="onFocus" @blur="onBlur" @click="pin">{{ label }}<DisclosureChevron :expanded="show" /></button></template>
    <div :id="id" class="ai-evidence-popover" role="region" :aria-label="label" @pointerenter="enterContent" @pointerleave="leave" @focusin="enterContent" @focusout="onBlur"><header><span>{{ pinned?copy.pinned:copy.hint }}</span><button type="button" :aria-label="copy.close" @click="close(true)">×</button></header><slot /></div>
  </n-popover>
  <n-modal :show="show && narrow" @update:show="value=>{if(!value)close(true)}">
    <div class="ai-evidence-mobile" :style="themeStyle" role="dialog" aria-modal="true" :aria-label="label"><div :id="narrow?id:undefined" class="ai-evidence-popover" role="region" :aria-label="label"><header><span>{{ label }}</span><button type="button" :aria-label="copy.close" @click="close(true)">×</button></header><slot /></div></div>
  </n-modal>
</template>
<script setup>
import {ref,computed,onMounted,onBeforeUnmount} from 'vue';
import DisclosureChevron from '@/components/ui/DisclosureChevron.vue';
const props=defineProps({id:{type:String,required:true},label:{type:String,required:true},locale:{type:String,default:'zh-CN'},themeStyle:{type:Object,default:()=>({})}});
const show=ref(false),pinned=ref(false),triggerRef=ref(null),narrow=ref(false);let timer,suppressFocus=false;
const copy=computed(()=>props.locale.startsWith('zh')?{pinned:'已固定 · Esc 关闭',hint:'点击来源按钮可固定',close:'关闭来源与原文'}:{pinned:'Pinned · Esc to close',hint:'Click the source button to pin',close:'Close source evidence'});
const clear=()=>{clearTimeout(timer);timer=null;};
const enterTrigger=event=>{if(event.pointerType!=='mouse'||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;clear();timer=setTimeout(()=>{show.value=true;},250);};
const enterContent=()=>clear();
const leave=()=>{clear();if(!pinned.value)timer=setTimeout(()=>{show.value=false;},180);};
const onFocus=()=>{if(suppressFocus){suppressFocus=false;return;}if(triggerRef.value?.matches(':focus-visible')){clear();show.value=true;}};
const onBlur=event=>{if(event.relatedTarget?.closest('.ai-evidence-popover')||event.relatedTarget===triggerRef.value)return;leave();};
const pin=()=>{clear();if(pinned.value){close();return;}pinned.value=true;show.value=true;};
const close=(restore=false)=>{clear();show.value=false;pinned.value=false;if(restore){suppressFocus=true;triggerRef.value?.focus({preventScroll:true});setTimeout(()=>{suppressFocus=false;},50);}};
const escape=event=>{if(event.key==='Escape'&&show.value){event.stopPropagation();close(true);}};
const updateViewport=()=>{narrow.value=matchMedia('(max-width:680px)').matches;};
onMounted(()=>{updateViewport();window.addEventListener('resize',updateViewport);window.addEventListener('keydown',escape);});onBeforeUnmount(()=>{clear();window.removeEventListener('resize',updateViewport);window.removeEventListener('keydown',escape);});
</script>
<style scoped>
.event-evidence-trigger{display:inline-flex;align-items:center;gap:5px;padding:0;border:0;background:transparent;color:var(--ai-muted,inherit);font:inherit;cursor:pointer}.event-evidence-trigger:hover{color:var(--ai-action,inherit)}.event-evidence-trigger:focus-visible{outline:2px solid currentColor;outline-offset:3px}.ai-evidence-mobile{box-sizing:border-box;width:calc(100vw - 24px);max-width:480px;padding:16px;background:var(--ai-panel,#fff);color:var(--ai-text,#222);border:1px solid var(--ai-border,#ddd);border-radius:10px;box-shadow:0 16px 48px #0003}.ai-evidence-mobile .ai-evidence-popover{width:100%;max-height:75dvh}.ai-evidence-popover{max-height:min(calc(50dvh - 48px),400px);overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;font-size:12px;line-height:1.6;width:min(450px,calc(100vw - 56px));overflow-wrap:anywhere}.ai-evidence-popover header{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;opacity:.75}.ai-evidence-popover header button{background:transparent;border:0;color:inherit;min-width:30px;min-height:30px;font-size:20px;cursor:pointer}@media(max-width:680px){.event-evidence-trigger{min-height:32px}.ai-evidence-popover header button{min-height:44px;min-width:44px}}
</style>
