<template>
  <div class="page-width-control" :style="themeStyle">
    <div class="page-width-control__head">
      <label :for="controlId">{{ t(scope === 'topic' ? 'settings.topicContainerWidth' : 'settings.rankingContainerWidth') }}</label>
      <output :for="controlId">{{ width }} px</output>
    </div>
    <input :id="controlId" v-model.number="width" @change="commitWidth" type="range" :min="READING_WIDTH.min" :max="READING_WIDTH.max" :step="READING_WIDTH.step" />
    <div class="page-width-control__footer">
      <span>{{ t(scope === 'topic' ? 'settings.topicReadingWidthHint' : 'settings.readingWidthHint') }}</span>
      <button type="button" @click="resetWidth">{{ t('settings.resetReadingWidth') }}</button>
    </div>
  </div>
</template>
<script setup>
import { computed, ref, useId, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useThemeVars } from "naive-ui";
import { mainStore } from "@/store";
import { READING_WIDTH, clampReadingWidth, resolveReadingWidth } from "@/utils/readingWidth";
const props = defineProps({ scope: { type: String, default: "ranking", validator: value => ["ranking", "topic"].includes(value) } });
const store = mainStore();
const { t } = useI18n();
const theme = useThemeVars();
const themeStyle = computed(() => ({ "--width-text": theme.value.textColor2, "--width-muted": theme.value.textColor3, "--width-primary": theme.value.primaryColor, "--width-hover": theme.value.hoverColor }));
const controlId = `reading-width-${useId()}`;
// Keep the range in place while dragging; commit layout only after native change.
const savedWidth = computed(() => resolveReadingWidth(store, props.scope));
const width = ref(savedWidth.value);
watch(savedWidth, value => { width.value = value; });
const commitWidth = () => {
  store[props.scope === "topic" ? "topicContainerWidth" : "rankingContainerWidth"] = clampReadingWidth(width.value);
};
const resetWidth = () => { width.value = READING_WIDTH.default; commitWidth(); };
</script>
<style scoped>
.page-width-control { display: grid; gap: 8px; min-width: 0; color: var(--width-text); font-size: 12px; }
.page-width-control__head, .page-width-control__footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.page-width-control__head output { color: var(--width-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.page-width-control input { width: 100%; min-width: 0; height: 24px; margin: 0; accent-color: var(--width-primary); cursor: pointer; }
.page-width-control__footer { color: var(--width-muted); font-size: 11px; }
.page-width-control button { flex: 0 0 auto; min-height: 32px; border: 0; border-radius: 5px; padding: 4px 6px; background: transparent; color: var(--width-primary); font: inherit; cursor: pointer; }
.page-width-control button:hover { background: var(--width-hover); }
.page-width-control :is(input, button):focus-visible { outline: 2px solid var(--width-primary); outline-offset: 2px; }
@media(max-width:680px) { .page-width-control input { height: 44px; } .page-width-control button { min-height: 44px; } }
</style>
