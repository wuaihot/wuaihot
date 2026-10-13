<template>
  <label v-if="targets.length" class="projection-control">
    <n-checkbox :checked="fullySplit" :indeterminate="partlySplit" @update:checked="setSplit">{{ copy.label }}</n-checkbox>
    <span>{{ copy.hint }}</span>
  </label>
</template>

<script setup>
import { mainStore } from "@/store";
import { useI18n } from "vue-i18n";
import { getSourceContentOptions, getSourceContentVariant } from "@/utils/sourceSubtypes";
import { getCategoryScopedContentOptions } from "@/utils/categoryVariantScope";
import { useTrendsCatalogRevision } from "@/composables/useTrendsCatalogRevision";

const props = defineProps({ scope: { type: String, default: "__all__" } });
const store = mainStore();
const { locale } = useI18n({ useScope: "global" });
const revision = useTrendsCatalogRevision();
const COPY = {
  "zh-CN": { label: "显示独立子榜单", hint: "应用于左侧选中的分类；也可在平台卡片上单独调整" },
  "zh-TW": { label: "顯示獨立子榜單", hint: "套用至左側所選分類；亦可在平台卡片個別調整" },
  en: { label: "Show separate rankings", hint: "Applies to the selected category; platform cards can be adjusted individually" },
  ja: { label: "サブランキングを個別表示", hint: "選択したカテゴリに適用。各カードでも調整できます" },
  ko: { label: "하위 랭킹을 개별 표시", hint: "선택한 분류에 적용하며 플랫폼 카드에서도 개별 조정할 수 있습니다" },
};
const copy = computed(() => COPY[locale.value] || COPY["zh-CN"]);
const targets = computed(() => {
  revision.value;
  return store.newsArr.filter(source => source.show && !source.directoryOnly).flatMap(source => {
    const options = props.scope === "__all__"
      ? getSourceContentOptions(source.name)
      : getCategoryScopedContentOptions(source, props.scope, store.categories);
    const variants = [...new Set(options.map(option => String(option.value || "")).filter(Boolean))];
    return variants.length > 1 ? [{ sourceName: source.name, variants }] : [];
  });
});
const selectedFor = target => {
  const allowed = new Set(target.variants);
  const configured = store.getCategorySplitVariants(props.scope, target.sourceName).map(value=>getSourceContentVariant(target.sourceName,value)).filter(value => allowed.has(value));
  return configured.length ? configured : store.isCategorySourceSplit(props.scope, target.sourceName) ? target.variants : [];
};
const fullySplit = computed(() => targets.value.length > 0 && targets.value.every(target => selectedFor(target).length === target.variants.length));
const partlySplit = computed(() => !fullySplit.value && targets.value.some(target => selectedFor(target).length));
const setSplit = value => {
  for (const target of targets.value) store.setCategorySplitVariants(props.scope, target.sourceName, value ? target.variants : []);
};
</script>

<style scoped>
.projection-control { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; padding-top: 12px; }
.projection-control > span { color: var(--n-text-color-3); font-size: 12px; }
</style>
