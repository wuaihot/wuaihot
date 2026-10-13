<template>
  <n-popover trigger="click" placement="bottom-end" :show-arrow="false">
    <template #trigger><button type="button" class="page-width-menu" :style="themeStyle">{{ t('settings.browseSettings') }}</button></template>
    <div class="page-width-menu__panel"><PageWidthControl :scope="scope" /></div>
  </n-popover>
</template>
<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useThemeVars } from "naive-ui";
import PageWidthControl from "./PageWidthControl.vue";
defineProps({ scope: { type: String, default: "ranking" } });
const { t } = useI18n();
const theme = useThemeVars();
const themeStyle = computed(() => ({ "--width-text": theme.value.textColor2, "--width-border": theme.value.borderColor, "--width-primary": theme.value.primaryColor, "--width-hover": theme.value.hoverColor }));
</script>
<style scoped>
.page-width-menu { display: inline-flex; align-items: center; justify-content: center; min-height: 32px; padding: 4px 10px; border: 1px solid var(--width-border); border-radius: 7px; background: transparent; color: var(--width-text); font: inherit; font-size: 12px; cursor: pointer; white-space: nowrap; }
.page-width-menu:hover { background: var(--width-hover); }
.page-width-menu:focus-visible { outline: 2px solid var(--width-primary); outline-offset: 2px; }
.page-width-menu__panel { width: min(280px, calc(100vw - 56px)); padding: 4px; }
@media(max-width:680px) { .page-width-menu { min-height: 44px; } }
</style>
