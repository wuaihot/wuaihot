<template>
  <n-popover
    v-if="visible"
    :trigger="triggerMode"
    placement="bottom-end"
    :show="menuOpen"
    :show-arrow="false"
    @update:show="setMenuOpen"
    @clickoutside="closeMenu"
  >
    <template #trigger>
      <button
        type="button"
        class="ranking-card-operations__trigger no-card-drag"
        :class="{ 'is-active': splitVariantsNormalized.length }"
        :title="triggerTitle"
        :aria-label="triggerTitle"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        data-no-card-drag
        @pointerenter="handleTriggerEnter"
        @pointerleave="handleTriggerLeave"
        @focus="handleTriggerFocus"
        @click.stop="handleTriggerClick"
        @keydown.esc.stop.prevent="closeMenu"
        @pointerdown.stop
      >
        <span>{{ triggerLabel }}</span>
        <span
          v-if="splitVariantsNormalized.length"
          class="ranking-card-operations__count"
        >
          {{ splitVariantsNormalized.length }}/{{ normalizedVariants.length }}
        </span>
        <svg class="ranking-card-operations__chevron" :class="{ 'is-open': menuOpen }" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 6 4 4 4-4" /></svg>
      </button>
    </template>

    <div
      class="ranking-card-operations__panel no-card-drag"
      role="group"
      :aria-label="triggerTitle"
      data-no-card-drag
      @mouseenter="cancelMenuClose"
      @mouseleave="scheduleMenuClose"
      @focusin="cancelMenuClose"
      @click.stop
      @pointerdown.stop
    >
      <section class="ranking-card-operations__section"><RankingTimeFilter :source-name="sourceName" :active-variant="activeVariant" @change="$emit('change-period', $event)" /></section>
      <section v-if="hasSortOperations" class="ranking-card-operations__section">
        <MarketRankDirectionControl
          v-if="showNativeOrderControl"
          menu
          inline-menu
          :direction="marketRankDirection"
          @change="$emit('change-direction', $event)"
        />
        <MarketListSortControl
          v-if="showMarketSortControl"
          menu
          inline-menu
          :source="sourceName"
        />
      </section>

      <section
        v-if="effectiveSplitControl"
        class="ranking-card-operations__section is-split"
      >
        <template v-if="isProjection">
          <button
            type="button"
            class="ranking-card-operations__action"
            @click.stop="mergeCurrent"
          >
            {{ t("hotList.mergeRanking") }}
          </button>
        </template>

        <template v-else-if="normalizedVariants.length === 2">
          <button
            type="button"
            class="ranking-card-operations__action"
            @click.stop="splitAll"
          >
            {{ t("hotList.splitRankings") }}
          </button>
        </template>

        <template v-else>
          <div class="ranking-card-operations__split-heading">
            <strong>{{ t("hotList.splitRankings") }}</strong>
            <span>{{ t("hotList.selectRankingVariants") }}</span>
          </div>

          <div
            class="ranking-card-operations__options"
            role="group"
            :aria-label="t('hotList.selectRankingVariants')"
          >
            <button
              v-for="option in variantOptions"
              :key="option.value"
              type="button"
              class="ranking-card-operations__option"
              :class="{ 'is-selected': draftVariants.includes(option.value) }"
              :aria-pressed="draftVariants.includes(option.value)"
              @click.stop="toggleDraft(option.value)"
            >
              <span class="ranking-card-operations__check" aria-hidden="true">
                {{ draftVariants.includes(option.value) ? "✓" : "" }}
              </span>
              <span>{{ option.label }}</span>
            </button>
          </div>

          <div class="ranking-card-operations__selection-actions">
            <button type="button" class="ranking-card-operations__selection-link" @click.stop="selectAll">
              {{ t("hotList.selectAllRankings") }}
            </button>
            <n-button
              size="tiny"
              type="primary"
              :disabled="sameSelection"
              @click.stop="applyDraft"
            >
              {{ t("hotList.applyRankingSelection") }}
            </n-button>
          </div>
        </template>

        <button
          v-if="canMergeAll"
          type="button"
          class="ranking-card-operations__action is-secondary"
          @click.stop="mergeAll"
        >
          {{ t("hotList.mergeAllRankings") }}
        </button>
      </section>

      <section v-if="hasExtraOperations" class="ranking-card-operations__section">
        <slot name="extra" />
      </section>
    </div>
  </n-popover>
</template>

<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { mainStore } from "@/store";
import MarketListSortControl from "@/components/MarketListSortControl.vue";
import MarketRankDirectionControl from "@/components/MarketRankDirectionControl.vue";
import RankingTimeFilter from "./RankingTimeFilter.vue";
import { rankingPeriodLabel } from "@/utils/rankingPeriods.mjs";
import { getSourcePeriodOptions, getSourceContentOptions as getSourceVariantOptions } from "@/utils/sourceSubtypes";
import { getSubtypeLabel } from "@/utils/sourceLabels";
import { normalizeLocale } from "@/utils/locale";
import { HOVER_MENU_OPEN_EVENT, announceHoverMenuOpen } from "@/utils/hoverMenu";

defineEmits(["change-direction", "change-period"]);

const props = defineProps({
  sourceName: { type: String, required: true },
  activeVariant: { type: String, default: "" },
  showNativeOrderControl: { type: Boolean, default: false },
  showMarketSortControl: { type: Boolean, default: false },
  marketRankDirection: { type: String, default: "normal" },
  showSplitControl: { type: Boolean, default: false },
  categoryRef: { type: [String, Number], default: "" },
  variants: { type: Array, default: () => [] },
  splitVariants: { type: Array, default: () => [] },
  projectionVariant: { type: String, default: "" },
  showMergeAll: { type: Boolean, default: false },
  hasExtraOperations: { type: Boolean, default: false },
});

const store = mainStore();
const { t, locale: i18nLocale } = useI18n({ useScope: "global" });
const locale = computed(() => normalizeLocale(i18nLocale.value));
const menuOpen = ref(false);
const draftVariants = ref([]);
const hoverCapable = ref(false);
const menuId = `ranking-card-operations:${getCurrentInstance()?.uid ?? Math.random().toString(36).slice(2)}`;
let hoverMediaQuery;
let closeTimer;
let enterTimer;
const cancelMenuEnter = () => { clearTimeout(enterTimer); enterTimer = undefined; };

const hasSortOperations = computed(
  () => props.showNativeOrderControl || props.showMarketSortControl,
);
const normalizedVariants = computed(() =>
  [...new Set(
    (Array.isArray(props.variants) ? props.variants : [])
      .map((value) => String(value || "").trim())
      .filter(Boolean),
  )],
);
const allowedVariants = computed(() => new Set(normalizedVariants.value));
const splitVariantsNormalized = computed(() =>
  [...new Set(
    (Array.isArray(props.splitVariants) ? props.splitVariants : [])
      .map((value) => String(value || "").trim())
      .filter((value) => allowedVariants.value.has(value)),
  )],
);
const projectionVariant = computed(() => String(props.projectionVariant || "").trim());
const isProjection = computed(
  () =>
    Boolean(projectionVariant.value) &&
    splitVariantsNormalized.value.includes(projectionVariant.value),
);
const effectiveSplitControl = computed(
  () => props.showSplitControl && normalizedVariants.value.length > 1,
);
const visible = computed(
  () => Boolean(props.sourceName) ||
    hasSortOperations.value ||
    effectiveSplitControl.value ||
    props.hasExtraOperations,
);
const triggerTitle = computed(() => t("hotList.rankOperations"));
const triggerLabel = computed(() => {
  const period = getSourcePeriodOptions(props.sourceName,props.activeVariant).find(o=>o.value===props.activeVariant)?.period;
  return period ? rankingPeriodLabel(period,locale.value) : triggerTitle.value;
});
const canMergeAll = computed(
  () =>
    effectiveSplitControl.value &&
    splitVariantsNormalized.value.length > 0 &&
    (!isProjection.value || props.showMergeAll),
);

const variantOptions = computed(() => {
  const byValue = new Map(
    getSourceVariantOptions(props.sourceName).map((item) => [
      String(item?.value || ""),
      item,
    ]),
  );
  return normalizedVariants.value.map((value) => {
    const option = byValue.get(value) || { value, label: value };
    return {
      value,
      label: getSubtypeLabel(option, locale.value) || option.label || value,
    };
  });
});
const sameSelection = computed(() => {
  const current = splitVariantsNormalized.value.slice().sort().join("|");
  const draft = [...new Set(draftVariants.value)].sort().join("|");
  return current === draft;
});

const persist = (variants) =>
  store.setCategorySplitVariants(
    props.categoryRef,
    props.sourceName,
    variants,
  );

const syncDraft = () => {
  draftVariants.value = splitVariantsNormalized.value.slice();
};
const updateHoverCapability = (event) => {
  hoverCapable.value = Boolean(event?.matches ?? hoverMediaQuery?.matches);
  if (!hoverCapable.value) cancelMenuEnter();
};
const cancelMenuClose = () => {
  clearTimeout(closeTimer);
  closeTimer = undefined;
};
const closeMenu = () => {
  cancelMenuEnter();
  cancelMenuClose();
  menuOpen.value = false;
};
const openMenu = () => {
  cancelMenuEnter();
  cancelMenuClose();
  if (!menuOpen.value) syncDraft();
  menuOpen.value = true;
  announceHoverMenuOpen(menuId);
};
const scheduleMenuClose = () => {
  if (!hoverCapable.value) return;
  cancelMenuClose();
  closeTimer = setTimeout(closeMenu, 170);
};
const handleTriggerEnter = (event) => {
  if (!hoverCapable.value || event.pointerType !== 'mouse') return;
  cancelMenuClose();
  cancelMenuEnter();
  if (!menuOpen.value) enterTimer = setTimeout(openMenu, 130);
};
const handleTriggerLeave = (event) => {
  if (!hoverCapable.value || event.pointerType !== 'mouse') return;
  cancelMenuEnter();
  if (menuOpen.value) scheduleMenuClose();
};
const handleTriggerFocus = () => {
  if (hoverCapable.value) openMenu();
};
const handleTriggerClick = () => {
  if (!hoverCapable.value) return;
  if (menuOpen.value) closeMenu();
  else openMenu();
};
const handleForeignMenuOpen = (event) => {
  if (event?.detail?.id !== menuId) closeMenu();
};
const triggerMode = computed(() => (hoverCapable.value ? "manual" : "click"));
const setMenuOpen = (show) => {
  if (hoverCapable.value) return;
  menuOpen.value = Boolean(show);
  if (menuOpen.value) {
    syncDraft();
    announceHoverMenuOpen(menuId);
  }
};
onMounted(() => {
  hoverMediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  updateHoverCapability(hoverMediaQuery);
  hoverMediaQuery.addEventListener?.("change", updateHoverCapability);
  window.addEventListener(HOVER_MENU_OPEN_EVENT, handleForeignMenuOpen);
});
onBeforeUnmount(() => {
  cancelMenuEnter();
  cancelMenuClose();
  hoverMediaQuery?.removeEventListener?.("change", updateHoverCapability);
  window.removeEventListener(HOVER_MENU_OPEN_EVENT, handleForeignMenuOpen);
});
const toggleDraft = (variant) => {
  const value = String(variant || "").trim();
  if (!allowedVariants.value.has(value)) return;
  const next = new Set(draftVariants.value);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  draftVariants.value = normalizedVariants.value.filter((item) => next.has(item));
};
const selectAll = () => {
  draftVariants.value = normalizedVariants.value.slice();
};
const applyDraft = () => {
  persist(draftVariants.value);
  menuOpen.value = false;
};

const splitAll = () => {
  persist(normalizedVariants.value);
  menuOpen.value = false;
};

const mergeCurrent = () => {
  if (!projectionVariant.value) return;
  persist(
    splitVariantsNormalized.value.filter(
      (variant) => variant !== projectionVariant.value,
    ),
  );
  menuOpen.value = false;
};

const mergeAll = () => {
  persist([]);
  draftVariants.value = [];
  menuOpen.value = false;
};


watch(
  splitVariantsNormalized,
  () => {
    if (!menuOpen.value) syncDraft();
  },
  { immediate: true },
);
</script>

<style scoped>
.ranking-card-operations__trigger,
.ranking-card-operations__action,
.ranking-card-operations__option,
.ranking-card-operations__selection-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 4px 7px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--n-text-color-2, var(--n-text-color));
  font: inherit;
  font-size: 12px;
  line-height: 1.15;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.14s ease, background 0.14s ease;
}

.ranking-card-operations__trigger {
  gap: 5px;
}

.ranking-card-operations__trigger:hover,
.ranking-card-operations__trigger:focus-visible,
.ranking-card-operations__trigger.is-active,
.ranking-card-operations__action:hover,
.ranking-card-operations__action:focus-visible,
.ranking-card-operations__option:hover,
.ranking-card-operations__option:focus-visible,
.ranking-card-operations__option.is-selected,
.ranking-card-operations__selection-link:hover,
.ranking-card-operations__selection-link:focus-visible {
  color: var(--n-primary-color, #ea444d);
  background: rgba(127, 127, 127, 0.06);
}

.ranking-card-operations__trigger:focus-visible,
.ranking-card-operations__action:focus-visible,
.ranking-card-operations__option:focus-visible,
.ranking-card-operations__selection-link:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--n-primary-color, #ea444d) 35%, transparent);
  outline-offset: 1px;
}

.ranking-card-operations__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: rgba(127, 127, 127, 0.1);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.ranking-card-operations__chevron {
  display: block;
  width: 12px;
  height: 12px;
  flex: 0 0 12px;
  align-self: center;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform-origin: 50% 50%;
  transition: transform .16s ease;
}
.ranking-card-operations__chevron.is-open { transform: rotate(180deg); }
@media (prefers-reduced-motion: reduce) {
  .ranking-card-operations__chevron { transition: none; }
}

.ranking-card-operations__panel {
  display: grid;
  width: min(360px, calc(100vw - 32px));
  gap: 7px;
  padding: 3px;
  font-size: 12px;
}

.ranking-card-operations__section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;
  min-width: 0;
}

.ranking-card-operations__section.is-split {
  align-items: stretch;
}

.ranking-card-operations__section + .ranking-card-operations__section {
  padding-top: 6px;
  border-top: 1px solid var(--n-border-color);
}

.ranking-card-operations__action {
  min-height: 25px;
  padding-inline: 6px;
}

.ranking-card-operations__action.is-secondary {
  color: var(--n-text-color-3, var(--n-text-color-2));
}

.ranking-card-operations__split-heading {
  display: flex;
  width: 100%;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  color: var(--n-text-color-2, var(--n-text-color));
}

.ranking-card-operations__split-heading span {
  color: var(--n-text-color-3, var(--n-text-color-2));
  font-size: 11px;
}

.ranking-card-operations__options {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 3px;
}

.ranking-card-operations__option {
  justify-content: flex-start;
  min-width: 0;
  text-align: left;
  white-space: normal;
}

.ranking-card-operations__check {
  display: inline-flex;
  width: 14px;
  flex: 0 0 14px;
  justify-content: center;
  font-size: 11px;
}

.ranking-card-operations__selection-actions {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 2px;
}

@media (max-width: 680px) {
  .ranking-card-operations__trigger,
  .ranking-card-operations__action,
  .ranking-card-operations__option,
  .ranking-card-operations__selection-link {
    min-height: 24px;
    padding-inline: 6px;
    font-size: 11px;
  }

  .ranking-card-operations__panel {
    width: min(330px, calc(100vw - 20px));
  }
}
</style>
