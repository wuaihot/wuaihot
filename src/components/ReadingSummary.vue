<template>
  <div ref="root" class="reading-summary">
    <span ref="probe" class="summary-probe" :style="clampStyle" aria-hidden="true">{{ text }}</span>
    <p :id="contentId" class="summary-text" :class="{ 'is-expanded': expanded, 'has-toggle': overflowing }" :style="expanded ? undefined : clampStyle">{{ text }}</p>
    <button v-if="overflowing" type="button" :aria-expanded="expanded" :aria-controls="contentId" :aria-label="expanded ? collapseLabel : expandLabel" :title="expanded ? collapseLabel : expandLabel" @click="expanded=!expanded"><DisclosureChevron :expanded="expanded" /></button>
  </div>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import DisclosureChevron from '@/components/ui/DisclosureChevron.vue';
const props=defineProps({text:{type:String,required:true},lines:{type:Number,default:2},expandLabel:{type:String,required:true},collapseLabel:{type:String,required:true}});
const root=ref(null),probe=ref(null),overflowing=ref(false),expanded=ref(false);
const contentId='reading-summary-'+useId();
const clampStyle=computed(()=>({'-webkit-line-clamp':props.lines}));
let observer,active=true,frame;
const measure=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(active && probe.value)overflowing.value=probe.value.scrollHeight>probe.value.clientHeight+1;});};
watch(()=>[props.text,props.lines],async()=>{expanded.value=false;await nextTick();measure();});
onMounted(()=>{observer=new ResizeObserver(measure);observer.observe(root.value);measure();document.fonts?.ready.then(()=>{if(active)measure();});});
onBeforeUnmount(()=>{active=false;observer?.disconnect();cancelAnimationFrame(frame);});
</script>
<style scoped>
.reading-summary{position:relative;margin-top:4px;color:var(--ai-muted);font-size:12px;line-height:1.6;min-width:0}
.summary-text,.summary-probe{margin:0;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
.summary-probe{position:absolute;top:0;left:0;width:100%;visibility:hidden;pointer-events:none}
.summary-text.has-toggle{padding-right:24px}.summary-text.is-expanded{display:block}
button{position:absolute;right:0;top:-3px;width:24px;min-height:26px;display:grid;place-items:center;padding:0;border:0;border-radius:4px;background:transparent;color:inherit;font:inherit;cursor:pointer}
button:hover{color:var(--ai-action)}button:focus-visible{outline:2px solid var(--ai-action);outline-offset:2px}
@media(max-width:680px){button{top:-12px;right:-6px;width:36px;min-height:44px}.summary-text.has-toggle{padding-right:30px}}
</style>
