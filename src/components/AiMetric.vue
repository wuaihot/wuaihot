<template>
  <span v-if="metric" class="ai-metric" :title="metric.label" :aria-label="metric.text + ' ' + metric.label">
    <n-icon v-if="metric.heat" :component="Fire" aria-hidden="true" />
    <span>{{ metric.text }}<template v-if="!metric.heat"> {{ metric.label }}</template></span>
  </span>
</template>
<script setup>
import { Fire } from '@icon-park/vue-next';
defineProps({ metric: { type: Object, default: null } });
</script>
<style scoped>
.ai-metric{display:inline-flex;align-items:center;gap:3px;white-space:nowrap;font:inherit;color:inherit}
.ai-metric .n-icon{font-size:12px;flex:none}
</style>
