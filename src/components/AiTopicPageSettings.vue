<template>
  <div class="ai-page-options">
    <div class="ai-page-quick"><label :title="copy.refinedHint"><input type="checkbox" :checked="refined" @change="$emit('update:refined',$event.target.checked)" /><span>{{ copy.refined }}</span></label><button type="button" @click="$emit('reset-order')">{{ copy.resetOrder }}</button></div>
    <p>{{ copy.sourceScope }}</p>
    <fieldset><legend>{{ copy.manage }}<small v-if="excluded.length"> · {{ copy.hidden }} {{ excluded.length }}</small></legend>
      <div class="ai-page-source-list"><label v-for="source in sources" :key="source.value"><input type="checkbox" :checked="!excluded.includes(source.value)" @change="$emit('exclude-source',source.value)" /><img :src="source.logo" alt="" @error="onLogoError" /><span>{{ source.label }}</span><small>{{ source.count }}</small></label></div>
      <button type="button" @click="$emit('restore-sources')">{{ copy.restore }}</button>
    </fieldset>
    <fieldset><legend>{{ copy.navigation }}</legend><nav class="ai-page-ranking-links"><router-link v-for="link in rankings" :key="link.path" :to="link.path"><img :src="link.logo" alt="" @error="onLogoError" /><span>{{ link.label }}</span></router-link></nav></fieldset>
    <details><summary>{{ copy.standards }}</summary><p>{{ copy.standardsText }}</p><p>{{ copy.orderHint }}</p></details>
    <details><summary>{{ copy.diagnostics }}</summary><slot name="diagnostics" /></details>
  </div>
</template>
<script setup>
import {getSourceLogoFallback} from '@/utils/sourceLogos';
defineProps({copy:{type:Object,required:true},sources:{type:Array,default:()=>[]},excluded:{type:Array,default:()=>[]},refined:Boolean,rankings:{type:Array,default:()=>[]}});
defineEmits(['exclude-source','restore-sources','reset-order','update:refined']);
const onLogoError=event=>{event.target.src=getSourceLogoFallback();};
</script>
<style scoped>
.ai-page-options{display:grid;gap:12px;font-size:12px;color:var(--ai-secondary);min-width:0}.ai-page-quick{display:flex;align-items:center;justify-content:space-between;gap:12px}
p{margin:0;color:var(--ai-muted);line-height:1.6}fieldset{margin:0;padding:8px 0 0;border:0;border-top:1px solid var(--ai-border);display:grid;gap:8px}legend{font-weight:600;color:var(--ai-text)}small{color:var(--ai-muted);font-size:11px}
.ai-page-source-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 14px;max-height:210px;overflow:auto;overscroll-behavior:contain}
label{display:flex;align-items:center;gap:6px;min-height:32px;cursor:pointer;min-width:0}label span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}img{width:16px;height:16px;object-fit:contain;flex:none}input{accent-color:var(--ai-action);flex:none}
button{width:fit-content;min-height:32px;border:1px solid var(--ai-border);border-radius:6px;background:transparent;color:var(--ai-action);padding:4px 8px;font:inherit;cursor:pointer;flex:none}
summary{cursor:pointer;min-height:32px;line-height:32px}details{border-top:1px solid var(--ai-border)}details p{padding:4px 0}.ai-page-ranking-links{display:flex;flex-wrap:wrap;gap:4px 14px}.ai-page-ranking-links a{display:inline-flex;align-items:center;gap:6px;min-height:32px;color:var(--ai-secondary);text-decoration:none}.ai-page-ranking-links a:hover{color:var(--ai-action)}
:is(button,summary,input,a):focus-visible{outline:2px solid var(--ai-action);outline-offset:3px}
:global(html[data-dailyhot-theme="dark"] :is(.ai-page-source-list,.ai-page-ranking-links) img:is([src*="/logo/ai/openai"],[src*="/logo/ai/anthropic"])){filter:invert(1)}
@media(max-width:680px){label,button,summary,.ai-page-ranking-links a{min-height:44px}.ai-page-source-list{grid-template-columns:1fr}.ai-page-quick{align-items:flex-start;flex-wrap:wrap}}
</style>
