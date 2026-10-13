<template><span class="ai-signal-badge" :data-kind="kind">{{ label }}</span></template>
<script setup>
defineProps({kind:{type:String,default:'new'},label:{type:String,required:true}});
</script>
<style scoped>
/* Match the global RankingBadgeGroup suffix hierarchy instead of pale text pills. */
.ai-signal-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;box-sizing:border-box;vertical-align:middle;margin-left:6px;padding:0 5px;border-radius:4px;font-size:11px;font-weight:700;line-height:18px;white-space:nowrap;color:#fff;background:#ff3852}
.ai-signal-badge[data-kind=official]{background:linear-gradient(135deg,#4d7cff,#6d5ce7)}
.ai-signal-badge[data-kind=quota]{background:#ff9406}
:global(html[data-dailyhot-theme=dark] .ai-topic .ai-signal-badge){color:#fff}
</style>
