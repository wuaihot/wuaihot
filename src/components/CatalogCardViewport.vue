<template>
  <div ref="root" class="catalog-card-viewport" :class="{ 'is-compact': compact }">
    <slot v-if="entered" />
    <div v-else class="catalog-card-placeholder" aria-hidden="true">
      <strong>{{ label }}</strong>
      <div class="catalog-card-placeholder__lines"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, onDeactivated, onBeforeUnmount } from "vue";
import { observeCatalogCard } from "@/utils/catalogViewport";
defineProps({ compact: Boolean, label: { type: String, default: "" } });
const root = ref(null);
const entered = ref(false);
let stop = null;
const observe = () => {
  if (entered.value || stop || !root.value) return;
  stop = observeCatalogCard(root.value, () => { entered.value = true; stop = null; });
};
const disconnect = () => { stop?.(); stop = null; };
onMounted(observe);
onActivated(observe);
onDeactivated(disconnect);
onBeforeUnmount(disconnect);
</script>

<style scoped>
.catalog-card-viewport { min-width:0; }
.catalog-card-placeholder { box-sizing:border-box; height:422px; border:1px solid var(--n-border-color); border-radius:12px; background:var(--n-color); padding:16px; color:var(--n-text-color-3); }
.is-compact .catalog-card-placeholder { height:376px; padding:10px 12px; }
.catalog-card-placeholder strong { display:block; font-size:14px; font-weight:500; margin-bottom:24px; }
.catalog-card-placeholder__lines { height:275px; opacity:.45; background:repeating-linear-gradient(to bottom,var(--n-action-color) 0,var(--n-action-color) 14px,transparent 14px,transparent 29px); }
</style>
