<template>
  <h1 v-if="routeKind === 'home'" class="sr-only">{{ copy.homeHeading }}</h1>
  <nav
    v-if="visible"
    class="context-toolbar"
    :class="[`is-${store.siteTheme}`, { 'is-compact': store.compactMode }]"
    :aria-label="copy.context"
  >
    <div class="context-toolbar__left">
      <div
        v-if="routeKind === 'home' || routeKind === 'category' || routeKind === 'list'"
        class="context-breadcrumb"
        :aria-label="copy.breadcrumb"
      >
        <router-link
          :to="navigation.categoryLocation('__all__')" @click="followCategory($event, '__all__')"
          class="context-breadcrumb__home"
          :aria-label="allLabel"
          :title="allLabel"
        >
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <path d="M3 8.1 9 3l6 5.1v6.4a.5.5 0 0 1-.5.5h-3.2v-4.2H6.7V15H3.5a.5.5 0 0 1-.5-.5V8.1Z" />
          </svg>
          <span>{{ allLabel }}</span>
        </router-link>

        <template v-for="category in categoryTrail" :key="category.id">
          <span class="context-breadcrumb__separator" aria-hidden="true">›</span>
          <router-link :to="navigation.categoryLocation(category.id)" class="context-breadcrumb__item" :class="{ 'is-current': category.id === currentCategory?.id }" @click="followCategory($event, category.id)">
            <CatalogViewIcon />
            <component :is="routeKind === 'category' && category.id === currentCategory?.id ? 'h1' : 'span'" class="context-breadcrumb__page-title">{{ routeKind === 'category' && category.id === currentCategory?.id ? categoryPageHeading(category) : categoryLabel(category) }}</component>
          </router-link>
        </template>

        <template v-if="routeKind === 'list'">
          <span class="context-breadcrumb__separator" aria-hidden="true">›</span>
          <span class="context-breadcrumb__item is-current">
            {{ currentSourceLabel }}
          </span>

          <template v-if="variantMenuOptions.length > 1">
            <span class="context-breadcrumb__separator" aria-hidden="true">›</span>
            <n-dropdown
              trigger="manual"
              placement="bottom-start"
              :options="variantMenuOptions"
              :show="activeBreadcrumbMenu === 'variant'"
              :menu-props="() => breadcrumbMenuProps('variant')"
              @select="switchVariant"
            >
              <div
                class="context-breadcrumb__trigger"
                @pointerenter="handleBreadcrumbEnter('variant',$event)"
                @pointerleave="handleBreadcrumbLeave('variant',$event)"
              >
                <button type="button" class="context-breadcrumb__item is-current" aria-haspopup="menu" :aria-expanded="activeBreadcrumbMenu === 'variant'" @click="openBreadcrumbMenu('variant')" @keydown.esc.prevent="activeBreadcrumbMenu = ''; cancelBreadcrumbClose()">
                  <span>{{ currentVariantLabel }}</span>
                  <svg
                    class="context-breadcrumb__caret"
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                  >
                    <path d="m2.5 4.5 3.5 3 3.5-3" />
                  </svg>
                </button>
              </div>
            </n-dropdown>
          </template>
        </template>

      </div>

      <div v-else-if="currentTopic" class="context-breadcrumb">
        <router-link
          :to="withSearch(buildHomePath(locale))"
          class="context-breadcrumb__home"
        >
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <path d="M3 8.1 9 3l6 5.1v6.4a.5.5 0 0 1-.5.5h-3.2v-4.2H6.7V15H3.5a.5.5 0 0 1-.5-.5V8.1Z" />
          </svg>
          <span>{{ copy.home }}</span>
        </router-link>
        <span class="context-breadcrumb__separator" aria-hidden="true">›</span>
        <span class="context-breadcrumb__section">{{ copy.topic }}</span>
        <span class="context-breadcrumb__separator" aria-hidden="true">›</span>
        <n-dropdown
          trigger="manual"
          placement="bottom-start"
          :options="topicMenuOptions"
          :show="activeBreadcrumbMenu === 'topic'"
          :menu-props="() => breadcrumbMenuProps('topic')"
          @select="switchTopic"
        >
          <div
            class="context-breadcrumb__trigger"
            @pointerenter="handleBreadcrumbEnter('topic',$event)"
            @pointerleave="handleBreadcrumbLeave('topic',$event)"
          >
            <button type="button" class="context-breadcrumb__item is-current" aria-haspopup="menu" :aria-expanded="activeBreadcrumbMenu === 'topic'" @click="openBreadcrumbMenu('topic')" @keydown.esc.prevent="activeBreadcrumbMenu = ''; cancelBreadcrumbClose()">
              <span>{{ currentTopicLabel }}</span>
              <svg
                class="context-breadcrumb__caret"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path d="m2.5 4.5 3.5 3 3.5-3" />
              </svg>
            </button>
          </div>
        </n-dropdown>
      </div>

    </div>
    <RankingCategoryScope v-if="routeKind === 'category'" class="context-toolbar__categories" />
  </nav>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  ref,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { mainStore } from "@/store";
import { dropdownSelectionProps } from "@/utils/dropdownSelection";
import {
  getCategoryByRef,
} from "@/utils/categoryTree";
import {
  buildHomePath,
  getCategoryLabel,
  getLocaleFromRoute,
  getSourceNameBySlug,
  normalizeLocale,
} from "@/utils/locale";
import {
  getDefaultSourceSubtype,
  getSourceSubtypeOptions,
  getSourceContentControlGroups,
  getSourceContentVariant,
  resolveSourceSubtype,
} from "@/utils/sourceSubtypes";
import {
  getSourceDisplayLabel,
  getSubtypeLabel,
} from "@/utils/sourceLabels";
import { useTrendsCatalogRevision } from "@/composables/useTrendsCatalogRevision";
import {
  TOPIC_REGISTRY,
  buildTopicPath,
  getTopicByRouteName,
  getTopicLabel,
} from "@/config/topics";

import { useRankingNavigation } from "@/composables/useRankingNavigation";
import CatalogViewIcon from "@/components/CatalogViewIcon.vue";
import RankingCategoryScope from "@/components/RankingCategoryScope.vue";

const route = useRoute();
const router = useRouter();
const store = mainStore();
const navigation = useRankingNavigation();
const allLabel = computed(() => copy.value.home);
const followCategory = (event, id) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigation.navigate({ kind: "category", scope: id }); };

const COPY = {
  "zh-CN": {
    "home": "首页",
    "homeHeading": "今日热榜",
    "rankingSuffix": "热榜",
    "topic": "专题",
    "breadcrumb": "当前位置",
    "context": "上下文工具栏"
  },
  "en": {
    "home": "Home",
    "homeHeading": "Trending Rankings",
    "rankingSuffix": " Rankings",
    "topic": "Topics",
    "breadcrumb": "Current location",
    "context": "Context toolbar"
  },
  "zh-TW": {
    "home": "首頁",
    "homeHeading": "今日熱榜",
    "rankingSuffix": "熱榜",
    "topic": "專題",
    "breadcrumb": "目前位置",
    "context": "內容工具列"
  },
  "ja": {
    "home": "ホーム",
    "homeHeading": "今日のトレンド",
    "rankingSuffix": "ランキング",
    "topic": "特集",
    "breadcrumb": "現在地",
    "context": "コンテキストツールバー"
  },
  "ko": {
    "home": "홈",
    "homeHeading": "오늘의 인기 랭킹",
    "rankingSuffix": " 랭킹",
    "topic": "주제",
    "breadcrumb": "현재 위치",
    "context": "컨텍스트 도구 모음"
  }
};

const locale = computed(() => normalizeLocale(getLocaleFromRoute(route)));
const copy = computed(() => COPY[locale.value] || COPY["zh-CN"]);

const routeKind = computed(() => {
  const name = String(route.name || "");
  if (["home", "home-locale"].includes(name)) return "home";
  if (["category", "category-locale"].includes(name)) return "category";
  if (["list", "list-locale", "list-legacy"].includes(name)) return "list";
  if (name.includes("-topic")) return "topic";
  return "";
});
// Topic pages have self-contained navigation and hero headings. Keep this
// toolbar for category/ranking routes; breadcrumb JSON-LD remains independent.
const visible = computed(() =>
  ["category", "list"].includes(routeKind.value),
);
const currentTopic = computed(() => getTopicByRouteName(route.name));
const currentTopicLabel = computed(() =>
  currentTopic.value ? getTopicLabel(currentTopic.value, locale.value) : "",
);

const currentSourceName = computed(() => {
  if (routeKind.value !== "list") return "";
  return getSourceNameBySlug(
    route.params?.sourceSlug ||
      route.query?.type ||
      store.newsArr.find((item) => item.show)?.name ||
      "",
  );
});
const currentSourceMeta = computed(
  () =>
    store.newsArr.find((item) => item.name === currentSourceName.value) ||
    store.defaultNewsArr.find((item) => item.name === currentSourceName.value) ||
    null,
);
const currentCategory = computed(() => getCategoryByRef(store.categories, navigation.scope.value));


const categoryTrail = computed(() => {
  const result = [];
  const seen = new Set();
  let node = currentCategory.value;
  while (node && !seen.has(node.id)) {
    seen.add(node.id);
    result.unshift(node);
    node = node.parentId
      ? getCategoryByRef(store.categories, node.parentId)
      : null;
  }
  return routeKind.value === 'list' ? result.slice(0, 1) : result;
});
const categoryLabel = (category) =>
  category?.builtin
    ? getCategoryLabel(category.name, locale.value)
    : category?.name || "";
const categoryPageHeading = (category) => {
  const label = categoryLabel(category);
  if (!label) return label;
  if (locale.value === "zh-CN" && category?.name === "音乐") {
    return "音乐热榜";
  }
  if (category?.parentId) return label;
  return `${label}${copy.value.rankingSuffix}`;
};

const currentSourceLabel = computed(() => {
  const item = currentSourceMeta.value;
  return getSourceDisplayLabel(
    currentSourceName.value,
    locale.value,
    item?.label || currentSourceName.value,
  );
});
const subtypeCatalogRevision = useTrendsCatalogRevision();
const variantOptions = computed(() => {
  subtypeCatalogRevision.value;
  return getSourceSubtypeOptions(currentSourceName.value);
});
const currentVariant = computed(() =>
  resolveSourceSubtype(
    variantOptions.value,
    route.params?.subtypeSlug ||
      route.query?.subtype ||
      getDefaultSourceSubtype(currentSourceName.value),
  ),
);
const variantMenuOptions = computed(() =>
  getSourceContentControlGroups(currentSourceName.value, currentVariant.value).flatMap(group=>group.items || []).map((item) => ({
    key: item.value,
    label: getSubtypeLabel(item, locale.value),
    props: dropdownSelectionProps(getSourceContentVariant(currentSourceName.value,item.value) === getSourceContentVariant(currentSourceName.value,currentVariant.value), { current: true }),
  })),
);
const currentVariantLabel = computed(() => {
  const item = variantOptions.value.find(
    (option) => option.value === currentVariant.value,
  );
  return item ? getSubtypeLabel(item, locale.value) : "";
});

const topicMenuOptions = computed(() =>
  TOPIC_REGISTRY.map((topic) => ({
    key: topic.id,
    label: getTopicLabel(topic, locale.value),
    props: dropdownSelectionProps(topic.id === currentTopic.value?.id, { current: true }),
  })),
);

const queryValue = (value) =>
  String(Array.isArray(value) ? value[0] || "" : value || "");
let breadcrumbCloseTimer;
let breadcrumbOpenTimer;
const activeBreadcrumbMenu = ref("");

const currentSearchQuery = () => {
  const q = queryValue(route.query.q).trim();
  return q ? { q } : {};
};
const withSearch = (path) => ({ path, query: currentSearchQuery() });

const cancelBreadcrumbClose = () => {
  clearTimeout(breadcrumbCloseTimer);
  breadcrumbCloseTimer = undefined;
};
const cancelBreadcrumbOpen = () => {
  clearTimeout(breadcrumbOpenTimer);
  breadcrumbOpenTimer = undefined;
};
const openBreadcrumbMenu = (id) => {
  cancelBreadcrumbOpen();
  cancelBreadcrumbClose();
  activeBreadcrumbMenu.value = id;
};
const scheduleBreadcrumbMenuClose = (id) => {
  cancelBreadcrumbClose();
  breadcrumbCloseTimer = window.setTimeout(() => {
    if (activeBreadcrumbMenu.value === id) {
      activeBreadcrumbMenu.value = "";
    }
  }, 140);
};
const fineMouse = event => event.pointerType === 'mouse' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const handleBreadcrumbEnter = (id, event) => {
  if (!fineMouse(event)) return;
  cancelBreadcrumbOpen();
  cancelBreadcrumbClose();
  breadcrumbOpenTimer = window.setTimeout(() => openBreadcrumbMenu(id), 130);
};
const handleBreadcrumbLeave = (id, event) => {
  if (!fineMouse(event)) return;
  cancelBreadcrumbOpen();
  if (activeBreadcrumbMenu.value === id) scheduleBreadcrumbMenuClose(id);
};
const breadcrumbMenuProps = (id) => ({
  onMouseenter: () => openBreadcrumbMenu(id),
  onMouseleave: () => scheduleBreadcrumbMenuClose(id),
});
const switchVariant = variant => {
  activeBreadcrumbMenu.value = "";
  navigation.navigate({ sourceName: currentSourceName.value, variant, scope: navigation.scope.value });
};
const switchTopic = (topicId) => {
  activeBreadcrumbMenu.value = "";
  const topic = TOPIC_REGISTRY.find((item) => item.id === topicId);
  if (!topic) return;
  router.push({
    path: buildTopicPath(topic, locale.value),
    query: currentSearchQuery(),
  });
};

onBeforeUnmount(() => { cancelBreadcrumbOpen(); cancelBreadcrumbClose(); });

</script>

<style scoped>
.context-toolbar { display:flex; align-items:center; min-width:0; margin:0 0 12px; padding:0; color:inherit; background:transparent; border:0; box-shadow:none; font-size:12px; }
.context-toolbar { gap:12px; flex-wrap:wrap; }
.context-toolbar__left { min-width:0; }
.context-toolbar__categories { flex:1; margin-left:auto; }
.context-toolbar:has(.context-toolbar__categories) .context-toolbar__left { flex:0 1 auto; }.context-breadcrumb { display:flex; align-items:center; flex-wrap:wrap; gap:3px; min-width:0; }
.context-breadcrumb__home,.context-breadcrumb__item { display:inline-flex; align-items:center; justify-content:center; gap:5px; min-height:30px; padding:0 5px; border:0; border-radius:4px; color:inherit; background:transparent; text-decoration:none; font:inherit; cursor:pointer; }
.context-breadcrumb__home { padding-left:0; }.context-breadcrumb__home svg { width:14px; height:14px; fill:none; stroke:currentColor; stroke-width:1.3; stroke-linejoin:round; }
.context-breadcrumb__page-title { margin:0; font-size:inherit; font-weight:inherit; }.context-breadcrumb__item.is-current { font-weight:600; }
.context-breadcrumb__separator { opacity:.45; padding:0 2px; }.context-breadcrumb__section { opacity:.7; }.context-breadcrumb__trigger { display:flex; align-items:center; }.context-breadcrumb__caret { display:block; width:12px; height:12px; flex:0 0 12px; align-self:center; fill:none; stroke:currentColor; opacity:0.66; stroke-width:1.4; stroke-linecap:round; stroke-linejoin:round; }
.context-toolbar :is(a,button):hover { color:var(--n-primary-color,#ea444d); }.context-toolbar :is(a,button):focus-visible { outline:2px solid var(--n-primary-color,#ea444d); outline-offset:1px; }
.sr-only { position:absolute; width:1px; height:1px; padding:0; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
@media(max-width:768px) { .context-breadcrumb__home,.context-breadcrumb__item { min-height:40px; }.context-toolbar { margin-bottom:8px; gap:4px; }.context-toolbar__categories { flex-basis:100%; } }
</style>
