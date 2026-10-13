<template>
  <n-drawer role="dialog" aria-modal="true" aria-labelledby="ranking-quick-title" :show="controller.show.value" :width="drawerWidth" placement="right" :auto-focus="true" :trap-focus="true" :close-on-esc="false" @update:show="value => { if (!value) controller.close(); }" @after-leave="controller.finishClose">
    <n-drawer-content :native-scrollbar="false" :body-content-style="{ padding:0 }">
      <RankingQuickPreviewReader v-if="controller.target.value" :key="controller.generation.value" :target="controller.target.value" @close="controller.close" />
    </n-drawer-content>
  </n-drawer>
</template>
<script setup>
import { computed, onMounted, onBeforeUnmount } from "vue";
import RankingQuickPreviewReader from "./RankingQuickPreviewReader.vue";
const props = defineProps({ controller: { type:Object, required:true }, viewportWidth: { type:Number, default:1280 } });
const drawerWidth = computed(() => props.viewportWidth <= 600 ? props.viewportWidth : Math.min(820, props.viewportWidth - 48));
// NImage owns its Escape handler. Leave that event to the upper image layer.
const handleEscape = event => {
  if (event.key !== "Escape" || event.isComposing || !props.controller.show.value) return;
  if (document.querySelector(".n-image-preview-container")) return;
  props.controller.close();
};
onMounted(() => window.addEventListener("keydown", handleEscape, true));
onBeforeUnmount(() => window.removeEventListener("keydown", handleEscape, true));
</script>
