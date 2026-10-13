<template>
  <span ref="media" class="reading-cover expandable-cover" @mouseenter="syncGeometry">
    <n-image class="expandable-cover__image" :src="getCoverDisplaySrc(src)" :preview-src="getCoverFullSrc(src)"
      :alt="previewLabel" lazy object-fit="contain" :show-toolbar="true"
      :img-props="{tabindex:0,role:'button',referrerpolicy:COVER_REFERRER_POLICY,onLoad:syncGeometry,onKeydown:openWithKeyboard,onError:reportError}" @error="reportError" />
  </span>
</template>
<script setup>
import "@/styles/expandable-cover.css";
import {computed,ref} from 'vue';
import {applyExpandableCoverGeometry} from '@/utils/expandableCoverGeometry';
import {COVER_REFERRER_POLICY,getCoverDisplaySrc,getCoverFullSrc} from '@/utils/imageProxy';
const props=defineProps({src:{type:String,required:true},title:{type:String,default:''},locale:{type:String,default:'zh-CN'}});
const emit=defineEmits(['error']),media=ref(null);
const previewLabel=computed(()=>(props.locale.startsWith('zh')?'查看原图':'View image')+'：'+props.title);
const syncGeometry=()=>{
  const root=media.value,image=root?.querySelector('img'),preview=root?.querySelector('.n-image');
  applyExpandableCoverGeometry({image,media:root,preview,row:root?.closest('.event-item'),isMixed:false});
};
const openWithKeyboard=event=>{if(!['Enter',' '].includes(event.key))return;event.preventDefault();event.currentTarget.click();};
const reportError=event=>emit('error',event);
</script>

<style scoped>
.reading-cover{display:block;flex:none;--cover-action:var(--ai-action);--cover-radius:6px}
</style>
