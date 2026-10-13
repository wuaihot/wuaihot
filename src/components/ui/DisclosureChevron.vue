<template>
  <svg class="disclosure-chevron" :class="{ 'is-expanded': expanded }" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="m4 6 4 4 4-4" />
  </svg>
</template>

<script setup>
defineProps({ expanded: { type: Boolean, default: false } });
</script>

<style scoped>
.disclosure-chevron{
  display:block;
  width:12px;
  height:12px;
  flex:0 0 12px;
  align-self:center;
  fill:none;
  stroke:currentColor;
  stroke-width:1.6;
  stroke-linecap:round;
  stroke-linejoin:round;
  transform-origin:50% 50%;
  pointer-events:none;
  transition:transform .16s ease;
}
.disclosure-chevron.is-expanded{transform:rotate(180deg)}
@media(prefers-reduced-motion:reduce){.disclosure-chevron{transition:none}}
</style>
