<template>
  <div class="reader-settings" :class="{ 'is-sidebar': sidebar }">
    <strong>{{ copy.browseSettings }}</strong>
    <div class="reader-settings__options">
      <n-checkbox :checked="showDescriptions" @update:checked="$emit('descriptions', $event)">{{ copy.summary }}</n-checkbox>
      <n-checkbox :checked="showImages" @update:checked="$emit('images', $event)">{{ copy.images }}</n-checkbox>
    </div>
    <p v-if="minimalMode">{{ copy.minimalHint }}</p>
    <PageWidthControl scope="ranking" />
    <label><span>{{ copy.perPage }}</span><n-select size="small" :show-checkmark="false" :value="pageSize" :options="pageSizeOptions" @update:value="$emit('page-size', $event)" /></label>
  </div>
</template>

<script setup>
import PageWidthControl from "./PageWidthControl.vue";
defineProps({
  copy: { type: Object, required: true },
  sidebar: Boolean,
  showDescriptions: Boolean,
  showImages: Boolean,
  minimalMode: Boolean,
  pageSize: { type: Number, required: true },
  pageSizeOptions: { type: Array, required: true },
});
defineEmits(["descriptions", "images", "page-size"]);
</script>

<style scoped>
.reader-settings { width: min(260px, calc(100vw - 56px)); display: grid; gap: 16px; padding: 4px; box-sizing: border-box; }
.reader-settings.is-sidebar { width: 100%; padding: 0; }
.reader-settings__options { display: flex; flex-wrap: wrap; gap: 10px 16px; }
.reader-settings > label { display: grid; grid-template-columns: minmax(0, 1fr) 88px; align-items: center; gap: 8px; }
.reader-settings > p { margin: 0; font-size: 12px; color: var(--n-text-color-3); }
</style>
