<template>
  <Provider>
    <n-layout
      embedded
      :native-scrollbar="false"
      class="app-layout"
      :style="layoutStyle"
      :class="[
        store.headerFixed ? 'fixed' : null,
        store.compactMode ? 'compact' : null,
        navigation.isList.value ? 'is-ranking-page' : null,
        isTopicRoute ? 'is-topic-page' : null,
        isSplitTopicRoute ? 'is-split-topic-page' : null,
        headerExpanded ? 'header-expanded' : 'header-collapsed',
      ]"
    >
      <FloatingActions v-show="!quickPreview.show.value" />
      <Header
        ref="headerRef"
        :navigation-open="navigationOpen"
        :show-ranking-navigation="navigation.isList.value"
        :class="[{ expanded: headerExpanded, collapsed: !headerExpanded }]"
        @open-settings="settingsOpen = true"
        @open-navigation="toggleNavigation"
        @open-hotboard-manager="openHotboardManager"
      />
      <div class="reading-shell" :class="{ 'has-navigation': navigation.isList.value && !isNarrow && !navigation.preferences.collapsed }">
        <aside v-if="navigation.isList.value && !isNarrow && !navigation.preferences.collapsed" id="ranking-navigation-panel" class="global-ranking-sidebar">
          <RankingNavigation />
        </aside>
      <main id="ranking-content" tabindex="-1">
        <ContextToolbar />
        <router-view v-slot="{ Component }">
          <keep-alive include="List" :max="1">
              <component
                :is="Component"
                :key="routeViewKey"
              />
          </keep-alive>
        </router-view>
      </main>
      </div>
      <n-drawer v-if="navigation.isList.value" v-model:show="navigation.drawerOpen.value" :width="Math.min(viewportWidth - 24, 340)" placement="left" :auto-focus="false" :trap-focus="true" :close-on-esc="true">
        <n-drawer-content :body-content-style="{ padding: 0, height: '100%' }" closable>
          <div id="ranking-navigation-panel" class="navigation-drawer-body"><RankingNavigation drawer /></div>
        </n-drawer-content>
      </n-drawer>
      <RankingQuickPreview v-if="quickPreview.target.value" :controller="quickPreview" :viewport-width="viewportWidth" />
      <Footer class="site-footer" />
      <AnalyticsConsent />
      <HotboardManager
        v-model:show="hotboardManagerOpen"
        :initial-category-id="hotboardManagerCategoryId"
      />
      <SettingsModal
        v-if="settingsWarm || settingsOpen"
        v-model:show="settingsOpen"
      />
      <SpeedInsights v-if="showSpeedInsights" />
    </n-layout>
  </Provider>
</template>

<script setup>
import { mainStore } from "@/store";
import Provider from "@/components/Provider.vue";
import { resolveReadingWidth } from "@/utils/readingWidth";
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";
import FloatingActions from "@/components/FloatingActions.vue";
import AnalyticsConsent from "@/components/AnalyticsConsent.vue";
import ContextToolbar from "@/components/ContextToolbar.vue";
import { defineAsyncComponent, provide } from "vue";
import RankingNavigation from "@/components/RankingNavigation.vue";
import { RANKING_QUICK_PREVIEW, createRankingQuickPreview } from "@/composables/useRankingQuickPreview";
import { RANKING_NAVIGATION_KEY, useRankingNavigation } from "@/composables/useRankingNavigation";
import { SpeedInsights } from "@vercel/speed-insights/vue";
import { useRouter } from "vue-router";
import { DATA_REFRESH_EVENT, requestDataRefresh } from "@/utils/dataRefresh";

const store = mainStore();
const router = useRouter();
const navigation = useRankingNavigation();
provide(RANKING_NAVIGATION_KEY, navigation);
const quickPreview = createRankingQuickPreview();
provide(RANKING_QUICK_PREVIEW, quickPreview);
const RankingQuickPreview = defineAsyncComponent(() => import("@/components/RankingQuickPreview.vue"));
watch(() => router.currentRoute.value.fullPath, () => quickPreview.close());
const headerRef = ref(null);
const headerHeight = ref(96);
const viewportWidth = ref(typeof window === "undefined" ? 1440 : window.innerWidth);
const isNarrow = computed(() => viewportWidth.value < 1100);
const navigationOpen = computed(() => navigation.isList.value && (isNarrow.value ? navigation.drawerOpen.value : !navigation.preferences.collapsed));
const toggleNavigation = () => {
  if (isNarrow.value) navigation.drawerOpen.value = !navigation.drawerOpen.value;
  else navigation.preferences.collapsed = !navigation.preferences.collapsed;
};
const updateViewport = () => {
  viewportWidth.value = window.innerWidth;
  if (!isNarrow.value) navigation.drawerOpen.value = false;
};
let headerObserver;
const scrollPositions = new Map();
let removeScrollBeforeGuard;
let removeScrollAfterGuard;
let restoreScrollTimer;
const pageScrollElement = () => document.querySelector('.app-layout > .n-scrollbar > .n-scrollbar-container');
const scrollKey = route => {
  const query = { ...route.query };
  delete query.view;
  return `${route.path}:${JSON.stringify(Object.entries(query).sort(([a], [b]) => a.localeCompare(b)))}`;
};
const HotboardManager = defineAsyncComponent(
  () => import("@/components/HotboardManager.vue"),
);
const SettingsModal = defineAsyncComponent(
  () => import("@/components/SettingsModal.vue"),
);
const hotboardManagerOpen = ref(false);
const hotboardManagerCategoryId = ref(null);
const settingsOpen = ref(false);
const settingsWarm = ref(false);
let settingsWarmHandle = null;
const warmSettingsModal = () => {
  if (settingsWarm.value) return;
  settingsWarm.value = true;
};
const scheduleSettingsWarmup = () => {
  if (typeof window === "undefined") return;
  settingsWarmHandle = window.setTimeout(warmSettingsModal, 320);
};
const cancelSettingsWarmup = () => {
  if (settingsWarmHandle == null || typeof window === "undefined") return;
  window.clearTimeout(settingsWarmHandle);
  settingsWarmHandle = null;
};
const openHotboardManager = (categoryId = null) => {
  navigation.drawerOpen.value = false;
  hotboardManagerCategoryId.value = categoryId || null;
  hotboardManagerOpen.value = true;
};
const softQueryRouteNames = new Set([
  "home",
  "home-locale",
  "category",
  "category-locale",
  "list",
  "list-locale",
  "list-legacy",
  "event",
  "event-locale",
]);
const routeViewKey = computed(() => {
  const currentRoute = router.currentRoute.value;
  const routeName = String(currentRoute?.name || "");
  if (["list", "list-locale", "list-legacy"].includes(routeName)) return `ranking-reader:${currentRoute.params.locale || 'zh-CN'}`;
  if (/^(chigua|ai|wool|game-deals)-topic(?:-locale)?$/.test(routeName)) return currentRoute?.path || "/";
  if (routeName === "event" || routeName === "event-locale") {
    return currentRoute?.path || "/";
  }
  if (!softQueryRouteNames.has(routeName)) {
    return currentRoute?.fullPath || currentRoute?.path || "/";
  }
  const query = { ...(currentRoute?.query || {}) };
  ["q", "view", "sources", "from", "to", "order", "date", "discipline"].forEach(
    (key) => delete query[key],
  );
  return `${currentRoute?.path || "/"}:${JSON.stringify(
    Object.entries(query).sort(([left], [right]) => left.localeCompare(right)),
  )}`;
});
const showSpeedInsights =
  import.meta.env.PROD &&
  (typeof window === "undefined" ||
    (window.location.hostname !== "127.0.0.1" &&
      window.location.hostname !== "localhost"));

const isTopicRoute = computed(() => /^(chigua|ai|wool|game-deals)-topic(?:-locale)?$/.test(String(router.currentRoute.value.name || "")));
const isSplitTopicRoute = computed(() => /^(chigua|ai)-topic(?:-locale)?$/.test(String(router.currentRoute.value.name || "")));
const headerExpanded = computed(() => !store.compactMode);
const clampLayoutWidth = (value, fallback, min, max) => {
  const numeric = Number(value);
  return Math.min(max, Math.max(min, Number.isFinite(numeric) ? numeric : fallback));
};
const layoutStyle = computed(() => ({
  "--site-header-height": `${headerHeight.value}px`,
  "--navigation-sticky-top": store.headerFixed ? `${headerHeight.value + 12}px` : "12px",
  "--site-container-width": `${clampLayoutWidth(store.siteContainerWidth, 1400, 1120, 1800)}px`,
  "--site-ranking-container-width": `${resolveReadingWidth(store, "ranking")}px`,
  "--site-topic-container-width": `${resolveReadingWidth(store, "topic")}px`,
  "--site-focus-container-width": `${clampLayoutWidth(store.focusContainerWidth, 1360, 1080, 1600)}px`,
  "--site-gutter": store.compactMode
    ? "clamp(12px, 1.5vw, 24px)"
    : "clamp(16px, 2vw, 32px)",
  "--site-gutter-total": store.compactMode
    ? "clamp(24px, 3vw, 48px)"
    : "clamp(32px, 4vw, 64px)",
}));

const autoRefreshTimer = ref(null);
const autoRefreshPausedByRoute = ref(false);
const routePausedRemainingMs = ref(null);
const lastAutoRefreshIntervalMs = ref(Number(store.autoRefreshInterval) * 1000);
let removeAutoRefreshRouteGuard = null;
const AUTO_REFRESH_PAUSE_KEY = "dailyhot:autoRefreshPause";
const settingRouteNames = new Set(["setting", "setting-locale"]);
const autoRefreshRouteNames = new Set([
  "home",
  "home-locale",
  "category",
  "category-locale",
  "list",
  "list-locale",
  "list-legacy",
  "wool-topic",
  "wool-topic-locale",
  "game-deals-topic",
  "game-deals-topic-locale",
  "chigua-topic",
  "chigua-topic-locale",
  "event",
  "event-locale",
]);
const isSettingRoute = computed(() => {
  const currentRoute = router.currentRoute.value;
  const path = currentRoute?.path || "";
  return (
    settingRouteNames.has(currentRoute?.name) ||
    path === "/setting" ||
    /\/setting$/.test(path)
  );
});
const isSettingsContext = computed(
  () => isSettingRoute.value || settingsOpen.value,
);
const isAutoRefreshRoute = computed(() => {
  const currentRoute = router.currentRoute.value;
  const path = currentRoute?.path || "/";
  return (
    autoRefreshRouteNames.has(currentRoute?.name) ||
    path === "/" ||
    /\/(category|rank|topic|event)(\/|$)/.test(path)
  );
});

const getAutoRefreshIntervalMs = () => {
  const seconds = Number(store.autoRefreshInterval);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0;
};

const normalizeRemainingMs = (value) => {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const isDocumentHidden = () =>
  typeof document !== "undefined" && document.visibilityState === "hidden";

const readStorageValue = (key) => {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.sessionStorage?.getItem(key) ??
      window.localStorage?.getItem(key) ??
      null
    );
  } catch {
    return null;
  }
};

const writeStorageValue = (key, value) => {
  if (typeof window === "undefined") return;
  try {
    if (value === null || typeof value === "undefined") {
      window.sessionStorage?.removeItem(key);
      window.localStorage?.removeItem(key);
      return;
    }
    window.sessionStorage?.setItem(key, value);
    window.localStorage?.setItem(key, value);
  } catch {
    // Web storage may be blocked in private or restricted browser modes.
  }
};

const readPersistedPauseRemainingMs = () => {
  const rawValue = readStorageValue(AUTO_REFRESH_PAUSE_KEY);
  if (!rawValue) return null;
  try {
    const parsed = JSON.parse(rawValue);
    return normalizeRemainingMs(parsed?.remainingMs);
  } catch {
    return normalizeRemainingMs(rawValue);
  }
};

const writePersistedPauseRemainingMs = (remainingMs) => {
  const normalizedRemainingMs = normalizeRemainingMs(remainingMs);
  if (normalizedRemainingMs === null) {
    writeStorageValue(AUTO_REFRESH_PAUSE_KEY, null);
    return;
  }
  writeStorageValue(
    AUTO_REFRESH_PAUSE_KEY,
    JSON.stringify({
      remainingMs: normalizedRemainingMs,
      savedAt: Date.now(),
    }),
  );
};

const writeAutoRefreshRemaining = (remainingMs) => {
  const normalizedRemainingMs = normalizeRemainingMs(remainingMs);
  store.autoRefreshRemainingMs = normalizedRemainingMs;
  if (typeof window !== "undefined") {
    window.$autoRefreshRemainingMs = normalizedRemainingMs;
    window.$nextAutoRefreshAt =
      normalizedRemainingMs === null
        ? null
        : Date.now() + normalizedRemainingMs;
  }
};

const clearRoutePauseState = () => {
  autoRefreshPausedByRoute.value = false;
  routePausedRemainingMs.value = null;
  store.autoRefreshRoutePaused = false;
  writeAutoRefreshRemaining(null);
  writePersistedPauseRemainingMs(null);
  if (typeof window !== "undefined") {
    window.$autoRefreshPausedByRoute = false;
  }
};

const clearAutoRefresh = ({ clearTarget = false } = {}) => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value);
    clearTimeout(autoRefreshTimer.value);
    autoRefreshTimer.value = null;
  }
  if (typeof window !== "undefined") {
    window.$autoRefreshTimer = null;
    if (clearTarget) {
      window.$nextAutoRefreshAt = null;
    }
  }
};

const getPausedRemainingMs = () => {
  const candidates = [
    routePausedRemainingMs.value,
    store.autoRefreshRemainingMs,
    typeof window !== "undefined" ? window.$autoRefreshRemainingMs : null,
  ];
  for (const value of candidates) {
    if (value === null || typeof value === "undefined" || value === "") {
      continue;
    }
    const number = Number(value);
    if (Number.isFinite(number) && number >= 0) {
      return number;
    }
  }
  return null;
};

const freezeAutoRefreshForRoute = (forcedRemainingMs = null) => {
  clearAutoRefresh();
  if (typeof window === "undefined") return;
  const intervalMs = getAutoRefreshIntervalMs();
  const existingTarget = Number(window.$nextAutoRefreshAt);
  const pausedRemainingMs = getPausedRemainingMs();
  const remainingMs =
    forcedRemainingMs ??
    (autoRefreshPausedByRoute.value || store.autoRefreshRoutePaused
      ? pausedRemainingMs
      : null) ??
    (existingTarget ? Math.max(existingTarget - Date.now(), 0) : intervalMs);
  routePausedRemainingMs.value = remainingMs ?? intervalMs;
  autoRefreshPausedByRoute.value = true;
  store.autoRefreshRoutePaused = true;
  window.$autoRefreshPausedByRoute = true;
  writeAutoRefreshRemaining(routePausedRemainingMs.value);
  writePersistedPauseRemainingMs(routePausedRemainingMs.value);
};

const setupAutoRefresh = (preferredDelayMs = null) => {
  clearAutoRefresh();
  if (typeof window !== "undefined") {
    const intervalMs = getAutoRefreshIntervalMs();
    if (
      !store.autoRefreshEnabled ||
      store.autoRefreshPaused ||
      !isAutoRefreshRoute.value ||
      isSettingsContext.value ||
      isDocumentHidden() ||
      intervalMs <= 0
    ) {
      window.$nextAutoRefreshAt = null;
      return;
    }
    let remainingMs =
      normalizeRemainingMs(preferredDelayMs) ??
      normalizeRemainingMs(store.autoRefreshRemainingMs) ??
      normalizeRemainingMs(window.$autoRefreshRemainingMs) ??
      readPersistedPauseRemainingMs() ??
      intervalMs;
    store.autoRefreshRoutePaused = false;
    window.$autoRefreshPausedByRoute = false;
    writeAutoRefreshRemaining(remainingMs);
    writePersistedPauseRemainingMs(null);

    let lastTickAt = Date.now();
    window.$autoRefreshTimer = autoRefreshTimer.value = setInterval(() => {
      const now = Date.now();
      remainingMs = Math.max(remainingMs - (now - lastTickAt), 0);
      lastTickAt = now;
      writeAutoRefreshRemaining(remainingMs);

      if (remainingMs <= 0) {
        requestDataRefresh({ reason: "auto", force: false });
        remainingMs = intervalMs;
        lastTickAt = Date.now();
        writeAutoRefreshRemaining(remainingMs);
      }
    }, 1000);
  }
};

const reconcileAutoRefresh = () => {
  const intervalMs = getAutoRefreshIntervalMs();
  const intervalChanged = intervalMs !== lastAutoRefreshIntervalMs.value;

  if (!store.autoRefreshEnabled || intervalMs <= 0) {
    clearAutoRefresh({ clearTarget: true });
    clearRoutePauseState();
    lastAutoRefreshIntervalMs.value = intervalMs;
    return;
  }

  if (store.autoRefreshPaused) {
    clearAutoRefresh({ clearTarget: true });
    clearRoutePauseState();
    lastAutoRefreshIntervalMs.value = intervalMs;
    return;
  }

  if (isSettingsContext.value) {
    freezeAutoRefreshForRoute(intervalChanged ? intervalMs : null);
    lastAutoRefreshIntervalMs.value = intervalMs;
    return;
  }

  const pausedRemainingMs =
    getPausedRemainingMs() ?? readPersistedPauseRemainingMs();
  const hasRoutePause =
    autoRefreshPausedByRoute.value ||
    store.autoRefreshRoutePaused ||
    pausedRemainingMs !== null;
  const resumedDelayMs = hasRoutePause
    ? (pausedRemainingMs ?? intervalMs)
    : null;
  clearRoutePauseState();
  setupAutoRefresh(intervalChanged ? intervalMs : resumedDelayMs);
  lastAutoRefreshIntervalMs.value = intervalMs;
};

const reconcileAutoRefreshAfterVisibilityChange = () => {
  if (isDocumentHidden()) {
    if (
      store.autoRefreshEnabled &&
      !store.autoRefreshPaused &&
      isAutoRefreshRoute.value
    ) {
      freezeAutoRefreshForRoute();
    }
    return;
  }
  nextTick(reconcileAutoRefresh);
};

const handleFreezeAutoRefreshRoute = () => {
  if (store.autoRefreshEnabled && !store.autoRefreshPaused) {
    freezeAutoRefreshForRoute();
  }
};

const handleDataRefreshRequest = (event) => {
  if (event?.detail?.reason !== "manual") return;
  const intervalMs = getAutoRefreshIntervalMs();
  if (
    store.autoRefreshEnabled &&
    !store.autoRefreshPaused &&
    isAutoRefreshRoute.value &&
    !isDocumentHidden() &&
    intervalMs > 0
  ) {
    setupAutoRefresh(intervalMs);
  }
};

watch(
  () => [
    store.autoRefreshEnabled,
    store.autoRefreshInterval,
    store.autoRefreshPaused,
    router.currentRoute.value?.name,
    router.currentRoute.value?.fullPath,
    settingsOpen.value,
  ],
  reconcileAutoRefresh,
  { immediate: true },
);

onMounted(() => {
  updateViewport();
  window.addEventListener("resize", updateViewport);
  headerObserver = new ResizeObserver(([entry]) => { headerHeight.value = Math.ceil(entry.target.getBoundingClientRect().height); });
  if (headerRef.value?.$el) headerObserver.observe(headerRef.value.$el);
  removeScrollBeforeGuard = router.beforeEach((_to, from) => {
    navigation.rememberPage();
    scrollPositions.set(scrollKey(from), pageScrollElement()?.scrollTop || 0);
    if (scrollPositions.size > 60) scrollPositions.delete(scrollPositions.keys().next().value);
  });
  removeScrollAfterGuard = router.afterEach((to, from, failure) => {
    if (failure || to.path === from.path) return;
    clearTimeout(restoreScrollTimer);
    const top = scrollPositions.get(scrollKey(to)) || 0;
    nextTick(() => {
      pageScrollElement()?.scrollTo({ top, behavior: "instant" });
      // Restore again after cached ranking data paints, without an animated jump.
      restoreScrollTimer = window.setTimeout(() => {
        if (router.currentRoute.value.fullPath === to.fullPath) pageScrollElement()?.scrollTo({ top, behavior: "instant" });
      }, 240);
    });
  });
  removeAutoRefreshRouteGuard = router.afterEach(() => {
    nextTick(reconcileAutoRefresh);
  });
  reconcileAutoRefresh();
  store.checkNewsUpdate();
  scheduleSettingsWarmup();
  if (typeof document !== "undefined") {
    document.addEventListener(
      "visibilitychange",
      reconcileAutoRefreshAfterVisibilityChange,
    );
  }
  if (typeof window !== "undefined") {
    window.addEventListener(
      "pageshow",
      reconcileAutoRefreshAfterVisibilityChange,
    );
    window.addEventListener(
      "popstate",
      reconcileAutoRefreshAfterVisibilityChange,
    );
    window.addEventListener(DATA_REFRESH_EVENT, handleDataRefreshRequest);
    window.addEventListener(
      "dailyhot:freeze-auto-refresh-route",
      handleFreezeAutoRefreshRoute,
    );
  }
  nextTick(() => {
    if (store.newsArr.length === 0) {
      store.newsArr = store.defaultNewsArr;
    }
    if (typeof document !== "undefined") {
      document.dispatchEvent(new Event("prerender-ready"));
    }
  });
});

onBeforeUnmount(() => {
  headerObserver?.disconnect();
  window.removeEventListener("resize", updateViewport);
  removeScrollBeforeGuard?.();
  removeScrollAfterGuard?.();
  clearTimeout(restoreScrollTimer);
  cancelSettingsWarmup();
  if (removeAutoRefreshRouteGuard) {
    removeAutoRefreshRouteGuard();
    removeAutoRefreshRouteGuard = null;
  }
  if (typeof document !== "undefined") {
    document.removeEventListener(
      "visibilitychange",
      reconcileAutoRefreshAfterVisibilityChange,
    );
  }
  if (typeof window !== "undefined") {
    window.removeEventListener(
      "pageshow",
      reconcileAutoRefreshAfterVisibilityChange,
    );
    window.removeEventListener(
      "popstate",
      reconcileAutoRefreshAfterVisibilityChange,
    );
    window.removeEventListener(DATA_REFRESH_EVENT, handleDataRefreshRequest);
    window.removeEventListener(
      "dailyhot:freeze-auto-refresh-route",
      handleFreezeAutoRefreshRoute,
    );
  }
  clearAutoRefresh();
});
</script>

<style lang="scss" scoped>
.app-layout {
  height: 100%;
  position: relative;

  &.fixed {
    :deep(.app-header) {
      width: 100%;
      margin: 0;
      position: absolute;
      z-index: 1200;
      top: 0;
      left: 0;
      box-sizing: border-box;
    }

    &.header-expanded {
      main {
        padding-top: 116px;
      }
    }

    &.header-collapsed {
      main {
        padding-top: 72px;
      }
    }
  }

  :deep(.n-scrollbar-rail) {
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 3;
  }

  main {
    box-sizing: border-box;
    width: min(calc(100% - var(--site-gutter-total)), var(--site-container-width));
    padding: 24px 0 0;
    margin: 0 auto;
    min-height: calc(100vh - 238px);
    transition: padding 0.25s ease, width 0.2s ease;
  }
}

.app-layout.compact {
  &.fixed {
    &.header-expanded {
      main {
        padding-top: 98px;
      }
    }

    &.header-collapsed {
      main {
        padding-top: 56px;
      }
    }
  }

  main {
    padding-top: 14px;
  }

  // 列表与卡片内容收紧
  :deep(.list .type) {
    margin-bottom: 8px;
  }

  :deep(.list .card) {
    margin-top: 12px;
    border-radius: 6px;
  }

  :deep(.list .card .n-card__content) {
    padding: 12px 16px;
  }

  :deep(.list .card .header) {
    height: 52px;
    grid-template-columns: 1fr 1.2fr 1fr;
  }

  :deep(.list .card .name .title) {
    font-size: 18px;
  }

  :deep(.list .card .name .subtitle) {
    font-size: 12px;
  }

  :deep(.list .card .all .n-list-item) {
    padding: 12px 12px;
  }

  :deep(.list .card .all .message) {
    margin-top: 8px;
  }

  :deep(.list .card .all .pagination) {
    margin: 12px 0;
  }

  // 页脚紧凑化
  :deep(.site-footer) {
    padding: 0;
    margin-top: 12px;
    height: 80px;
  }

  // 设置页网格间距收紧
  :deep(.mews-group) {
    gap: 14px;
  }
}

// 路由跳转动画
.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.app-layout .reading-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 20px;
  width: min(calc(100% - var(--site-gutter-total)), var(--reading-container-width, var(--site-container-width)));
  margin: 0 auto;
  padding-top: 16px;
}
.app-layout.is-ranking-page { --reading-container-width: var(--site-ranking-container-width); }
.app-layout.is-ranking-page .reading-shell { container: ranking-reader / inline-size; }
.app-layout.is-topic-page { --reading-container-width: var(--site-topic-container-width); }
.app-layout.is-split-topic-page .reading-shell {
  width: calc(100% - var(--site-gutter-total));
}
.app-layout.is-split-topic-page :deep(:is(.context-toolbar, .topic-overview)) {
  box-sizing: border-box;
  width: min(100%, var(--site-container-width));
  margin-inline: auto;
}
.app-layout.is-split-topic-page :deep(.topic-reader) {
  box-sizing: border-box;
  width: min(100%, var(--site-topic-container-width));
  margin-inline: auto;
  container: topic-reader / inline-size;
}
.app-layout .reading-shell.has-navigation { grid-template-columns: 248px minmax(0, 1fr); }
.app-layout .reading-shell main { width: 100%; min-width: 0; padding: 0; margin: 0; transition: none; }
.app-layout.fixed .reading-shell { padding-top: calc(var(--site-header-height) + 16px); }
.app-layout.fixed.header-expanded .reading-shell main,
.app-layout.fixed.header-collapsed .reading-shell main { padding-top: 0; }
.global-ranking-sidebar {
  position: sticky;
  top: var(--navigation-sticky-top);
  height: calc(100dvh - var(--navigation-sticky-top) - 16px);
  min-height: 360px;
  overflow: hidden;
  border-right: 1px solid var(--n-border-color);
}
.navigation-drawer-body { height: 100%; }
@media (max-width: 1099px) { .app-layout .reading-shell { display: block; } }
@media (prefers-reduced-motion: reduce) { .app-layout main { transition: none; } }
</style>
