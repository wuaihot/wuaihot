import { computed, inject, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { mainStore } from '@/store';
import { buildCategoryPath, buildHomePath, buildRankPath, getLocaleFromRoute, getSourceNameBySlug, normalizeLocale } from '@/utils/locale';
import { getCategoryByRef } from '@/utils/categoryTree';
import { getDefaultSourceSubtype } from '@/utils/sourceSubtypes';
import { useTrendsCatalogRevision } from '@/composables/useTrendsCatalogRevision';
import { ALL_SCOPE, NAVIGATION_STORAGE_KEY, buildRankingNavigationTree, getRankingScope, getNavigationVariantOptions, normalizeNavigationPreferences, normalizeNavigationScope, getReaderNavigationDomains, getDefaultNavigationFavorites } from '@/utils/rankingNavigation';
import { TOPIC_REGISTRY, buildTopicPath, getTopicLabel } from '@/config/topics';
import { EVENT_REGISTRY, EVENT_SERIES, buildEventPath, getEventLabel, getEventSeriesEvents } from '@/config/events';

export const RANKING_NAVIGATION_KEY = Symbol('ranking-navigation');
const stringQuery = value => String(Array.isArray(value) ? value[0] || '' : value || '');
export const useRankingNavigation = () => {
  const shared = inject(RANKING_NAVIGATION_KEY, null);
  if (shared) return shared;
  const store = mainStore();
  const route = useRoute();
  const router = useRouter();
  const revision = useTrendsCatalogRevision();
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(NAVIGATION_STORAGE_KEY) || '{}'); } catch { /* Restricted or damaged storage uses defaults. */ }
  const preferences = reactive(normalizeNavigationPreferences(saved));
  const drawerOpen = ref(false);
  const navigationQuery = ref('');
  const locale = computed(() => normalizeLocale(getLocaleFromRoute(route)));
  const isList = computed(() => ['list', 'list-locale', 'list-legacy'].includes(String(route.name || '')));
  const sourceName = computed(() => isList.value ? getSourceNameBySlug(route.params.sourceSlug || route.query.type || '') : '');
  const source = computed(() => store.newsArr.find(item => item.name === sourceName.value));
  const variant = computed(() => isList.value ? String(route.params.subtypeSlug || route.query.subtype || getDefaultSourceSubtype(sourceName.value) || '') : '');
  const scope = computed(() => {
    if (!isList.value) return normalizeNavigationScope(route.params.categorySlug, store.categories);
    if (route.query.scope) {
      const requested = normalizeNavigationScope(stringQuery(route.query.scope), store.categories);
      if (requested === ALL_SCOPE || getNavigationVariantOptions(source.value, requested, store.categories).some(item => String(item.value || '') === variant.value)) return requested;
    }
    return getRankingScope(source.value, variant.value, store.categories);
  });
  const current = computed(() => ({ sourceName: sourceName.value, variant: variant.value }));
  const scopePath = id => {
    const normalized = normalizeNavigationScope(id, store.categories);
    const category = getCategoryByRef(store.categories, normalized);
    return normalized === ALL_SCOPE ? buildHomePath(locale.value) : buildCategoryPath(locale.value, category?.slug || '');
  };
  const tree = computed(() => { revision.value; return buildRankingNavigationTree(store.newsArr, store.categories, locale.value); });
  const topicNodes = computed(() => TOPIC_REGISTRY.map(topic => ({ id: `topic:${topic.id}`, kind: 'topic', label: getTopicLabel(topic, locale.value), path: buildTopicPath(topic, locale.value), children: [] })));
  const eventNodes = computed(() => {
    const seen = new Set();
    return EVENT_REGISTRY.flatMap(event => {
      if (event.seriesId) {
        if (seen.has(event.seriesId)) return [];
        seen.add(event.seriesId);
        const selected = getEventSeriesEvents(event.seriesId, Date.now())[0];
        const labels = EVENT_SERIES[event.seriesId]?.labels || {};
        return selected ? [{ id: `event-series:${event.seriesId}`, kind: 'event', label: labels[locale.value] || labels['zh-CN'] || event.seriesId, path: buildEventPath(selected, locale.value), eventIds: getEventSeriesEvents(event.seriesId).map(item => item.id), children: [] }] : [];
      }
      return [{ id: `event:${event.id}`, kind: 'event', label: getEventLabel(event, locale.value), path: buildEventPath(event, locale.value), children: [] }];
    });
  });
  const index = computed(() => {
    const map = new Map();
    const visit = node => { map.set(node.id, node); node.children?.forEach(visit); };
    [...tree.value, ...topicNodes.value, ...eventNodes.value].forEach(visit);
    return map;
  });
  const favorites = computed(() => preferences.favorites.map(item => index.value.get(item.id)).filter(Boolean));
  const currentNavigationPath = computed(() => {
    const root = index.value.get(`category:${scope.value}`);
    if (!root) return [];
    const visit = (node, path) => {
      const next = [...path, node];
      if (node.kind === 'source' && node.sourceName === sourceName.value && (node.variant === variant.value || node.children?.some(child => child.variant === variant.value))) return next;
      for (const child of node.children || []) { const result = visit(child, next); if (result) return result; }
      return null;
    };
    return isList.value ? visit(root, []) || [root] : [root];
  });
  const pageState = new Map();
  const stateKey = computed(() => isList.value ? `rank:${sourceName.value}:${variant.value}` : `cards:${scope.value}`);
  const rememberPage = () => {
    if (!['home', 'home-locale', 'category', 'category-locale', 'list', 'list-locale', 'list-legacy'].includes(String(route.name || ''))) return;
    pageState.set(stateKey.value, { query: { ...route.query } });
    if (pageState.size > 60) pageState.delete(pageState.keys().next().value);
  };
  const rankingLocation = target => {
    let targetScope = normalizeNavigationScope(target.scope, store.categories);
    const targetSource = store.newsArr.find(item => item.name === target.sourceName);
    if (targetScope !== ALL_SCOPE && !getNavigationVariantOptions(targetSource, targetScope, store.categories).some(item => String(item.value || '') === String(target.variant || ''))) targetScope = getRankingScope(targetSource, target.variant, store.categories);
    return { path: buildRankPath(locale.value, target.sourceName, target.variant), query: { ...(pageState.get(`rank:${target.sourceName}:${target.variant}`)?.query || {}), scope: targetScope } };
  };
  const categoryLocation = id => {
    const normalized = normalizeNavigationScope(id, store.categories);
    const isCurrentCatalog = !isList.value && ['home', 'home-locale', 'category', 'category-locale'].includes(String(route.name || '')) && normalized === scope.value;
    const query = { ...(isCurrentCatalog ? route.query : pageState.get(`cards:${normalized}`)?.query || {}) };
    delete query.view;
    return { path: scopePath(normalized), query };
  };
  const nodeLocation = node => {
    if (node.kind === 'category') return categoryLocation(node.scope);
    if (node.id?.startsWith('event-series:')) {
      const selected = getEventSeriesEvents(node.id.slice('event-series:'.length), Date.now())[0];
      if (selected) return { path: buildEventPath(selected, locale.value) };
    }
    return node.path ? { path: node.path } : rankingLocation({ ...node, scope: node.scope || ALL_SCOPE });
  };
  const navigate = node => { rememberPage(); drawerOpen.value = false; navigationQuery.value = ''; return router.push(nodeLocation(node)); };
  const isFavorite = id => preferences.favorites.some(item => item.id === id);
  const toggleFavorite = id => {
    if (isFavorite(id)) preferences.favorites = preferences.favorites.filter(item => item.id !== id);
    else if (preferences.favorites.length < 30) preferences.favorites.push({ id });
  };
  const moveFavorite = (id, direction) => {
    const start = preferences.favorites.findIndex(item => item.id === id);
    const end = start + direction;
    if (start < 0 || end < 0 || end >= preferences.favorites.length) return;
    const [item] = preferences.favorites.splice(start, 1);
    preferences.favorites.splice(end, 0, item);
  };
  const readerDomains = computed(() => { revision.value; return getReaderNavigationDomains(store.newsArr, store.categories, locale.value); });
  const readerDomain = ref(ALL_SCOPE);
  const revealCurrent = () => {
    let category = getCategoryByRef(store.categories, scope.value);
    const seen = new Set();
    while (category?.parentId && !seen.has(category.id)) {
      seen.add(category.id);
      category = getCategoryByRef(store.categories, category.parentId);
    }
    readerDomain.value = category?.id || ALL_SCOPE;
  };
  watch(index, value => {
    if (preferences.favoritesInitialized || !value.size) return;
    const defaults = getDefaultNavigationFavorites(value);
    if (!defaults.length) return;
    preferences.favorites = defaults;
    preferences.favoritesInitialized = true;
  }, { immediate: true });
  const reset = () => {
    Object.assign(preferences, normalizeNavigationPreferences());
    preferences.favorites = getDefaultNavigationFavorites(index.value);
    preferences.favoritesInitialized = true;
    navigationQuery.value = '';
    pageState.clear();
    revealCurrent();
  };
  watch(() => [route.path, stringQuery(route.query.scope), source.value], () => {
    revealCurrent();
    drawerOpen.value = false;
  }, { immediate: true });
  watch(() => [route.path, stringQuery(route.query.view)], () => {
    if (isList.value || !['home', 'home-locale', 'category', 'category-locale'].includes(String(route.name || '')) || !route.query.view) return;
    const query = { ...route.query };
    delete query.view;
    router.replace({ path: route.path, query, hash: route.hash });
  }, { immediate: true });
  watch(preferences, value => { try { localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(value)); } catch { /* Reading remains available without persistent storage. */ } }, { deep: true });
  return { preferences, drawerOpen, navigationQuery, locale, isList, scope, sourceName, variant, tree, readerDomains, readerDomain, topicNodes, eventNodes, favorites, index, currentNavigationPath, rememberPage, scopePath, categoryLocation, nodeLocation, navigate, revealCurrent, isFavorite, toggleFavorite, moveFavorite, reset };
};
