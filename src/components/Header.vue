<template>
 <n-card :bordered="false" class="app-header unified-header" content-style="padding:0" @mouseenter="emit('mouseenter',$event)" @mouseleave="emit('mouseleave',$event)" @click="emit('click',$event)">
  <section class="header-layout">
   <div class="header-brand">
    <button v-if="showRankingNavigation" type="button" class="navigation-toggle" :aria-label="navigationButtonLabel" :aria-expanded="navigationOpen" aria-controls="ranking-navigation-panel" @click="emit('open-navigation')"><UiGlyph name="menu" /></button>
    <router-link class="logo" :to="buildHomePath(locale)" :aria-label="t('common.siteName')"><img :src="siteLogoUrl" alt="" /><strong>{{ t("common.siteName") }}</strong></router-link>
   </div>
   <ContentNavigation />
   <div class="header-tools">
    <GlobalSearch />
          <n-popover
            v-if="showRefresh"
            v-model:show="refreshPanelOpen"
            trigger="click"
            placement="bottom-end"
            :show-arrow="false"
            content-class="header-refresh-popover"
            :content-style="{ padding: '5px' }"
            style="max-width: 360px; padding: 0"
          >
            <template #trigger>
              <div class="control-hit-area" @click.stop>
                <n-button
                  class="header-control-btn refresh-control-btn"
                  :class="{ 'has-countdown': showHeaderCountdown }"
                  secondary
                  strong
                  round
                  :aria-label="refreshButtonLabel"
                  :title="refreshButtonLabel"
                >
                  <span class="header-control-content">
                    <n-icon class="header-glyph" :component="Refresh" />
                    <span v-if="showHeaderCountdown" class="countdown">
                      {{ countdownText }}
                    </span>
                  </span>
                </n-button>
              </div>
            </template>
            <div class="refresh-panel" @click.stop>
              <div class="refresh-panel__hero">
                <span class="refresh-panel__icon" aria-hidden="true">
                  <n-icon class="header-glyph" :component="Refresh" />
                </span>
                <div class="refresh-panel__heading">
                  <strong>{{ t("header.refreshControl") }}</strong>
                  <span>{{ t("header.nextRefresh") }}</span>
                </div>
                <span
                  class="refresh-panel__countdown"
                  :class="{ paused: store.autoRefreshPaused }"
                >
                  {{ countdownText || "—" }}
                </span>
              </div>

              <n-button
                block
                class="refresh-panel__now"
                type="primary"
                secondary
                strong
                :disabled="!canManualRefresh"
                @click="manualRefresh"
              >
                <template #icon>
                  <n-icon class="header-glyph" :component="Refresh" />
                </template>
                {{ t("header.refreshNow") }}
              </n-button>

              <div class="refresh-panel__section">
                <div class="refresh-panel__auto-head">
                  <div>
                    <strong>{{ t("header.autoRefresh") }}</strong>
                    <n-text depth="3" class="refresh-panel__auto-tip">
                      {{ t("header.refreshTip") }}
                    </n-text>
                  </div>
                  <div class="refresh-panel__auto-actions">
                    <n-button
                      size="tiny"
                      quaternary
                      :disabled="!store.autoRefreshEnabled"
                      @click="togglePause"
                    >
                      {{
                        store.autoRefreshPaused
                          ? t("header.resume")
                          : t("header.pause")
                      }}
                    </n-button>
                    <n-switch
                      size="small"
                      v-model:value="autoEnabled"
                      @update:value="toggleAutoRefresh"
                    />
                  </div>
                </div>

                <div class="time-inputs">
                  <div class="time-item">
                    <span class="unit">{{ t("header.hour") }}</span>
                    <div class="time-number-control">
                      <n-input-number
                        size="small"
                        v-model:value="timeForm.hour"
                        :min="0"
                        :max="23"
                        :show-button="false"
                        :keyboard="{ ArrowUp: true, ArrowDown: true }"
                        :input-props="{ 'aria-label': t('header.hour') }"
                        @wheel.prevent="handleIntervalWheel('hour', $event)"
                        @update:value="applyAutoInterval"
                      />
                      <div class="time-stepper" role="group">
                        <button
                          type="button"
                          :aria-label="t('header.decreaseTimeUnit', { unit: t('header.hour') })"
                          :disabled="timeForm.hour <= 0"
                          @click="adjustTimeUnit('hour', -1)"
                        >
                          <span aria-hidden="true">−</span>
                        </button>
                        <button
                          type="button"
                          :aria-label="t('header.increaseTimeUnit', { unit: t('header.hour') })"
                          :disabled="timeForm.hour >= 23"
                          @click="adjustTimeUnit('hour', 1)"
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="time-item">
                    <span class="unit">{{ t("header.minute") }}</span>
                    <div class="time-number-control">
                      <n-input-number
                        size="small"
                        v-model:value="timeForm.minute"
                        :min="0"
                        :max="59"
                        :show-button="false"
                        :keyboard="{ ArrowUp: true, ArrowDown: true }"
                        :input-props="{ 'aria-label': t('header.minute') }"
                        @wheel.prevent="handleIntervalWheel('minute', $event)"
                        @update:value="applyAutoInterval"
                      />
                      <div class="time-stepper" role="group">
                        <button
                          type="button"
                          :aria-label="t('header.decreaseTimeUnit', { unit: t('header.minute') })"
                          :disabled="timeForm.minute <= 0"
                          @click="adjustTimeUnit('minute', -1)"
                        >
                          <span aria-hidden="true">−</span>
                        </button>
                        <button
                          type="button"
                          :aria-label="t('header.increaseTimeUnit', { unit: t('header.minute') })"
                          :disabled="timeForm.minute >= 59"
                          @click="adjustTimeUnit('minute', 1)"
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="time-item">
                    <span class="unit">{{ t("header.second") }}</span>
                    <div class="time-number-control">
                      <n-input-number
                        size="small"
                        v-model:value="timeForm.second"
                        :min="0"
                        :max="59"
                        :show-button="false"
                        :keyboard="{ ArrowUp: true, ArrowDown: true }"
                        :input-props="{ 'aria-label': t('header.second') }"
                        @wheel.prevent="handleIntervalWheel('second', $event)"
                        @update:value="applyAutoInterval"
                      />
                      <div class="time-stepper" role="group">
                        <button
                          type="button"
                          :aria-label="t('header.decreaseTimeUnit', { unit: t('header.second') })"
                          :disabled="timeForm.second <= 0"
                          @click="adjustTimeUnit('second', -1)"
                        >
                          <span aria-hidden="true">−</span>
                        </button>
                        <button
                          type="button"
                          :aria-label="t('header.increaseTimeUnit', { unit: t('header.second') })"
                          :disabled="timeForm.second >= 59"
                          @click="adjustTimeUnit('second', 1)"
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </n-popover>

    <QuickSettings @open-settings="emit('open-settings')" @open-hotboard-manager="emit('open-hotboard-manager',$event)" />
   </div>
  </section>
 </n-card>
</template>
<script setup>
import { Refresh } from "@icon-park/vue-next";
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from "vue";
import UiGlyph from "@/components/ui/UiGlyph.vue";
import ContentNavigation from "@/components/ContentNavigation.vue";
import GlobalSearch from "@/components/GlobalSearch.vue";
import QuickSettings from "@/components/QuickSettings.vue";
import { getCurrentTime } from "@/utils/getTime.js";
import { getPublicAssetUrl } from "@/utils/publicAssets";
import { requestDataRefresh } from "@/utils/dataRefresh";
import { HOVER_MENU_OPEN_EVENT, announceHoverMenuOpen } from "@/utils/hoverMenu";
import { mainStore } from "@/store";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { buildHomePath, getLocaleFromRoute } from "@/utils/locale";
defineProps({ navigationOpen: Boolean, showRankingNavigation: Boolean });
const emit = defineEmits(["open-navigation","mouseenter","mouseleave","click","open-settings","open-hotboard-manager"]);
const router = useRouter();
const store = mainStore();
const { t, locale } = useI18n({ useScope:"global" });
const navigationButtonLabel = computed(()=>({'zh-CN':'切换榜单','zh-TW':'切換榜單',en:'Switch ranking',ja:'ランキングを切替',ko:'랭킹 전환'})[locale.value]||'Switch ranking');
const siteLogoUrl = getPublicAssetUrl("/ico/wuaihot.svg");
const timeInterval = ref(null), showRefresh = ref(false), countdownText = ref(""), countdownTimer = ref(null), autoEnabled = ref(store.autoRefreshEnabled);
const refreshPanelOpen = ref(false);
const foreignMenu = event=>{if(event.detail?.id!=="header-refresh")refreshPanelOpen.value=false;};
watch(refreshPanelOpen,value=>{if(value)announceHoverMenuOpen("header-refresh");});
watch(()=>router.currentRoute.value.path,()=>{refreshPanelOpen.value=false;});
const timeForm = reactive({hour:0,minute:30,second:0});
const isSettingPage = computed(()=>["setting","setting-locale"].includes(router.currentRoute.value?.name));
const isRefreshEnabledRoute = name=>["home","home-locale","category","category-locale","list","list-locale","list-legacy","wool-topic","wool-topic-locale","game-deals-topic","game-deals-topic-locale","chigua-topic","chigua-topic-locale","ai-topic","ai-topic-locale","event","event-locale","setting","setting-locale"].includes(name);
const refreshButtonLabel = computed(()=>countdownText.value ? `${t("header.refreshPage")} ${countdownText.value}` : t("header.refreshPage"));
const showHeaderCountdown = computed(()=>store.autoRefreshEnabled && Boolean(countdownText.value));
const canManualRefresh = computed(()=>showRefresh.value && !isSettingPage.value);
const manualRefresh = () => {
  if (!canManualRefresh.value) return;
  requestDataRefresh({ reason: "manual", force: true });
};

const toggleAutoRefresh = (val) => {
  store.autoRefreshEnabled = val;
  if (!val) {
    store.autoRefreshPaused = false;
  }
};

const togglePause = () => {
  if (!store.autoRefreshEnabled) return;
  store.autoRefreshPaused = !store.autoRefreshPaused;
};

const secondsToTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.max(seconds % 60, 0);
  return { h, m, s };
};

const timeToSeconds = (time) => {
  const h = Number(time.hour) || 0;
  const m = Number(time.minute) || 0;
  const s = Number(time.second) || 0;
  return h * 3600 + m * 60 + s;
};

const syncTimeForm = () => {
  const { h, m, s } = secondsToTime(Number(store.autoRefreshInterval));
  timeForm.hour = h;
  timeForm.minute = m;
  timeForm.second = s;
};

const TIME_UNIT_LIMITS = {
  hour: [0, 23],
  minute: [0, 59],
  second: [0, 59],
};

const adjustTimeUnit = (unit, delta) => {
  const [min, max] = TIME_UNIT_LIMITS[unit] || [0, 0];
  const current = Number(timeForm[unit]) || 0;
  timeForm[unit] = Math.min(max, Math.max(min, current + delta));
  applyAutoInterval();
};

const handleIntervalWheel = (unit, event) => {
  adjustTimeUnit(unit, event.deltaY < 0 ? 1 : -1);
};

const applyAutoInterval = () => {
  const seconds = timeToSeconds(timeForm);
  if (seconds < 60) {
    $message.warning(t("header.refreshMinWarning"));
    return;
  }
  store.autoRefreshInterval = seconds;
  if (
    typeof window !== "undefined" &&
    store.autoRefreshEnabled &&
    !store.autoRefreshPaused
  ) {
    if (store.autoRefreshRoutePaused || window.$autoRefreshPausedByRoute) {
      store.autoRefreshRemainingMs = seconds * 1000;
      window.$autoRefreshRemainingMs = seconds * 1000;
      window.$nextAutoRefreshAt = null;
      return;
    }
    window.$nextAutoRefreshAt = Date.now() + seconds * 1000;
  }
};

const formatCountdown = (remainMs) => {
  const totalSeconds = Math.max(Math.floor(remainMs / 1000), 0);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const separator = locale.value === "en" ? " " : "";
  return [
    `${h}${t("header.hour")}`,
    `${m}${t("header.minute")}`,
    `${s}${t("header.second")}`,
  ].join(separator);
};

const normalizeRemainingMs = (value) => {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const getSyncedAutoRefreshRemainingMs = () =>
  normalizeRemainingMs(store.autoRefreshRemainingMs) ??
  normalizeRemainingMs(window.$autoRefreshRemainingMs);

const updateCountdown = () => {
  if (typeof window === "undefined" || !store.autoRefreshEnabled) {
    countdownText.value = "";
    return;
  }
  if (store.autoRefreshRoutePaused || window.$autoRefreshPausedByRoute) {
    const remainingMs = getSyncedAutoRefreshRemainingMs();
    countdownText.value =
      Number.isFinite(remainingMs) && remainingMs >= 0
        ? formatCountdown(remainingMs)
        : "";
    return;
  }
  if (store.autoRefreshPaused) {
    countdownText.value = "";
    return;
  }
  const syncedRemainingMs = getSyncedAutoRefreshRemainingMs();
  if (syncedRemainingMs !== null) {
    countdownText.value = formatCountdown(syncedRemainingMs);
    return;
  }
  const target = window.$nextAutoRefreshAt;
  const intervalSeconds = Number(store.autoRefreshInterval);
  if (!target && intervalSeconds > 0) {
    window.$nextAutoRefreshAt = Date.now() + intervalSeconds * 1000;
  }
  const nextTime = window.$nextAutoRefreshAt;
  if (!nextTime) {
    countdownText.value = "";
    return;
  }
  const remain = nextTime - Date.now();
  if (remain <= 0) {
    countdownText.value = t("header.refreshInProgress");
    return;
  }
  countdownText.value = formatCountdown(remain);
};

const setupCountdown = () => {
  clearInterval(countdownTimer.value);
  if (typeof window === "undefined") return;
  countdownTimer.value = setInterval(updateCountdown, 1000);
  updateCountdown();
};


watch(
  () => [
    store.autoRefreshEnabled,
    store.autoRefreshPaused,
    store.autoRefreshRoutePaused,
    store.autoRefreshRemainingMs,
    store.autoRefreshInterval,
    router.currentRoute.value?.name,
    locale.value,
  ],
  () => {
    autoEnabled.value = store.autoRefreshEnabled;
    syncTimeForm();
    setupCountdown();
  },
  { immediate: true },
);

// 监听路由参数变化
watch(
  () => router.currentRoute.value,
  (val) => {
    locale.value = getLocaleFromRoute(val);
    showRefresh.value = isRefreshEnabledRoute(val?.name);
  },
  { immediate: true },
);


onMounted(()=>{
 window.addEventListener(HOVER_MENU_OPEN_EVENT,foreignMenu);
 window.$timeInterval = timeInterval.value = setInterval(()=>{store.timeData=getCurrentTime();},1000);
 locale.value=getLocaleFromRoute(router.currentRoute.value);
 showRefresh.value=isRefreshEnabledRoute(router.currentRoute.value?.name);
 syncTimeForm();setupCountdown();
});
onBeforeUnmount(()=>{window.removeEventListener(HOVER_MENU_OPEN_EVENT,foreignMenu);clearInterval(timeInterval.value);clearInterval(countdownTimer.value);});
</script>
<style lang="scss" scoped>
.app-header { position:relative; z-index:1200; border-bottom:1px solid var(--n-border-color); background:var(--n-color); padding:0 var(--site-gutter,5vw); }
.header-layout { display:grid; grid-template-columns:minmax(0,1fr) auto minmax(200px,1fr); align-items:center; gap:20px; max-width: var(--site-container-width, 1400px); margin:auto; min-height:64px; }
.header-brand { display:flex; align-items:center; gap:9px; min-width:0; }
.logo { display:flex; align-items:center; gap:9px; color:inherit; text-decoration:none; white-space:nowrap; }.logo img { display:block; width:28px; height:28px; }.logo strong { font-size:16px; font-weight:650; }
.navigation-toggle { display:grid; place-items:center; width:32px; height:40px; border:0; padding:0; background:transparent; color:inherit; cursor:pointer; }.navigation-toggle .ui-glyph { width:18px; height:18px; }
.header-tools { display:flex; align-items:center; justify-content:flex-end; gap:8px; min-width:0; }
.header-tools :deep(.header-control-btn) { width:36px; height:36px; padding:0; border-radius:6px; }
.header-control-content { display:flex; align-items:center; justify-content:center; gap:6px; }.header-glyph { width:18px; height:18px; font-size:18px; }.countdown { display:none; font-size:11px; font-variant-numeric:tabular-nums; white-space:nowrap; }
.control-hit-area { display:flex; align-items:center; flex-shrink:0; }
.navigation-toggle:focus-visible,.logo:focus-visible { outline:2px solid var(--n-primary-color); outline-offset:2px; }
.refresh-panel {
      display: grid;
      gap: 12px;
      min-width: 324px;
      padding: 2px;

      .refresh-panel__hero {
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
      }

      .refresh-panel__icon {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 11px;
        background: color-mix(
          in srgb,
          var(--n-primary-color) 12%,
          var(--n-action-color)
        );
        color: var(--n-primary-color);
        font-size: 18px;
      }

      .refresh-panel__heading {
        display: grid;
        gap: 2px;
        min-width: 0;

        strong {
          color: var(--n-text-color);
          font-size: 13px;
          font-weight: 700;
        }

        span {
          color: var(--n-text-color-3);
          font-size: 11px;
        }
      }

      .refresh-panel__countdown {
        min-width: 58px;
        padding: 6px 9px;
        border-radius: 8px;
        background: var(--n-action-color);
        color: var(--n-text-color);
        font-variant-numeric: tabular-nums;
        font-size: 12px;
        font-weight: 700;
        text-align: center;

        &.paused {
          color: var(--n-text-color-3);
        }
      }

      .refresh-panel__now {
        min-height: 36px;
        border-radius: 9px;
      }

      .refresh-panel__section {
        display: grid;
        gap: 10px;
        padding-top: 12px;
        border-top: 1px solid
          color-mix(in srgb, var(--n-text-color-3) 22%, transparent);
      }

      .refresh-panel__auto-head,
      .refresh-panel__auto-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .refresh-panel__auto-head > div:first-child {
        display: grid;
        gap: 2px;
      }

      .refresh-panel__auto-head strong {
        color: var(--n-text-color);
        font-size: 12px;
        font-weight: 700;
      }

      .refresh-panel__auto-tip {
        max-width: 210px;
        font-size: 10px;
        line-height: 1.45;
      }

      .time-inputs {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        width: 100%;

        .time-item {
          display: grid;
          gap: 4px;

          .unit {
            color: var(--n-text-color-3);
            font-size: 10px;
            line-height: 1;
          }

          :deep(.n-input-number) {
            width: 100%;
          }

          :deep(.n-input__input-el) {
            text-align: center;
            font-variant-numeric: tabular-nums;
          }
        }
      }
    }
.time-number-control { display:grid; grid-template-columns:minmax(0,1fr) 24px; gap:3px; }.time-stepper { display:grid; grid-template-rows:1fr 1fr; }.time-stepper button { border:0; padding:0; color:inherit; background:var(--n-action-color); cursor:pointer; font-size:11px; }.time-stepper button:disabled { opacity:.35; cursor:default; }
@media(min-width:1500px) { .header-tools :deep(.refresh-control-btn.has-countdown) { width:auto; padding-inline:10px; }.countdown { display:inline; } }
@media(max-width:1100px) { .header-layout { gap:12px; }.logo strong { display:none; } }
@media(max-width:768px) {
 .app-header { padding-inline:10px; }.header-layout { grid-template-columns:auto minmax(0,1fr); gap:0 8px; min-height:96px; padding-top:4px; }
 .header-brand { grid-column:1; grid-row:1; gap:3px; }.header-tools { grid-column:2; grid-row:1; gap:4px; }.header-tools :deep(.header-control-btn) { width:32px; height:36px; }
 .header-layout :deep(.content-navigation) { grid-column:1/-1; grid-row:2; width:100%; justify-content:space-between; }
 .logo img { width:24px; height:24px; }.refresh-panel { min-width:0; width:min(300px,calc(100vw - 32px)); }.refresh-panel__hero { grid-template-columns:32px minmax(0,1fr) auto; }.refresh-panel__auto-tip { max-width:155px; }
}
</style>
