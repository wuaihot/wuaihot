import { getCategoryByRef, getSourceCategoryIds, sourceBelongsToCategory } from '@/utils/categoryTree';
import { getCategoryScopedVariantOptions } from '@/utils/categoryVariantScope';
import { getDefaultSourceSubtype, getSourceVariantOptions } from '@/utils/sourceSubtypes';
import { getCategoryLabel } from '@/utils/locale';
import { getSourceDisplayLabel, getSubtypeLabel } from '@/utils/sourceLabels';
import { VARIANT_CATEGORY_PROJECTIONS } from '@/config/taxonomy-v3';
import { getDirectoryOnlySourceDetails } from '@/config/directorySources';

export const ALL_SCOPE = '__all__';
export const NAVIGATION_STORAGE_KEY = 'wuaihot:ranking-navigation:v1';
const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype']);
const safeKey = value => typeof value === 'string' && value.length <= 240 && !unsafeKeys.has(value);

export const normalizeNavigationScope = (ref, categories = []) => {
  if (!ref || [ALL_SCOPE, 'general', '全部', '综合'].includes(String(ref))) return ALL_SCOPE;
  const category = getCategoryByRef(categories, ref);
  return category && category.id !== 'general' ? String(category.id) : ALL_SCOPE;
};

export const getRankingScope = (source, variant, categories = []) => {
  const projection = VARIANT_CATEGORY_PROJECTIONS.find(item => item.sourceName === source?.name && item.variant === variant);
  const [id] = projection?.categoryIds || getSourceCategoryIds(source, categories);
  return normalizeNavigationScope(id, categories);
};

export const getNavigationVariantOptions = (source, scope, categories = []) => {
  if (!source || source.directoryOnly) return [];
  if (normalizeNavigationScope(scope, categories) !== ALL_SCOPE) {
    const scoped = getCategoryScopedVariantOptions(source, scope, categories);
    if (scoped.length || getSourceVariantOptions(source.name).length || !sourceBelongsToCategory(source, scope, categories)) return scoped;
    return [{ value: getDefaultSourceSubtype(source.name) || '', label: source.subtype || source.label || source.name }];
  }
  const options = getSourceVariantOptions(source.name);
  return options.length ? options : [{ value: getDefaultSourceSubtype(source.name) || '', label: source.subtype || source.label || source.name }];
};

export const resolveRankingDestination = ({ sources = [], categories = [], scope = ALL_SCOPE, remembered, current } = {}) => {
  const normalizedScope = normalizeNavigationScope(scope, categories);
  const candidates = sources.filter(source => source.show && !source.directoryOnly).slice().sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const valid = candidate => {
    if (!candidate?.sourceName) return null;
    const source = candidates.find(item => item.name === candidate.sourceName);
    if (!source) return null;
    const options = getNavigationVariantOptions(source, normalizedScope, categories);
    const option = options.find(item => String(item.value || '') === String(candidate.variant || ''));
    return option ? { sourceName: source.name, variant: option.value || '', scope: normalizedScope } : null;
  };
  const previous = valid(remembered) || valid(current);
  if (previous) return previous;
  for (const source of candidates) {
    const options = getNavigationVariantOptions(source, normalizedScope, categories);
    if (!options.length) continue;
    const option = options.find(item => item.value === getDefaultSourceSubtype(source.name)) || options[0];
    return { sourceName: source.name, variant: option.value || '', scope: normalizedScope };
  }
  return null;
};

export const buildRankingNavigationTree = (sources = [], categories = [], locale = 'zh-CN') => {
  const visibleSources = sources.filter(item => item.show).slice().sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const sourceNodes = (scope, childScopes = []) => visibleSources.flatMap(source => {
    const options = getNavigationVariantOptions(source, scope, categories).filter(option => !childScopes.some(child => getNavigationVariantOptions(source, child, categories).some(nested => nested.value === option.value)));
    if (!options.length && !source.directoryOnly) return [];
    if (source.directoryOnly && scope !== ALL_SCOPE && !sourceBelongsToCategory(source, scope, categories)) return [];
    if (source.directoryOnly && childScopes.some(child => sourceBelongsToCategory(source, child, categories))) return [];
    const label = getSourceDisplayLabel(source.name, locale, source.label || source.name);
    const sourceId = `source:${scope}:${source.name}`;
    return [{
      id: sourceId, kind: 'source', label, scope, sourceName: source.name,
      variant: (options.find(item => item.value === getDefaultSourceSubtype(source.name)) || options[0])?.value || '',
      externalUrl: source.directoryOnly ? getDirectoryOnlySourceDetails(source.name)?.officialRankingUrl || source.officialRankingUrl || '' : '',
      directoryOnly: Boolean(source.directoryOnly),
      children: options.length > 1 ? options.map(option => ({ id: `rank:${scope}:${source.name}:${option.value}`, kind: 'rank', label: getSubtypeLabel(option, locale), scope, sourceName: source.name, variant: option.value || '', children: [] })) : [],
    }];
  });
  const visit = (category, ancestors = new Set()) => {
    if (ancestors.has(category.id)) return null;
    const next = new Set(ancestors).add(category.id);
    const children = categories.filter(item => item.parentId === category.id).sort((a, b) => Number(a.order || 0) - Number(b.order || 0)).map(item => visit(item, next)).filter(Boolean);
    return { id: `category:${category.id}`, kind: 'category', scope: category.id, label: category.builtin ? getCategoryLabel(category.name, locale) : category.name, children: [...children, ...sourceNodes(category.id, children.map(item => item.scope))] };
  };
  const allLabels = { 'zh-CN': '全部', 'zh-TW': '全部', en: 'All', ja: 'すべて', ko: '전체' };
  return [
    { id: `category:${ALL_SCOPE}`, kind: 'category', scope: ALL_SCOPE, label: allLabels[locale] || allLabels['zh-CN'], children: sourceNodes(ALL_SCOPE) },
    ...categories.filter(item => !item.parentId && item.id !== 'general' && item.navigation !== false).sort((a, b) => Number(a.navOrder ?? a.order ?? 0) - Number(b.navOrder ?? b.order ?? 0)).map(item => visit(item)).filter(Boolean),
  ];
};

export const getReaderNavigationDomains = (sources = [], categories = [], locale = 'zh-CN') =>
  buildRankingNavigationTree([], categories, locale).map(domain => ({
    ...domain,
    children: sources.filter(source => source.show && !source.directoryOnly)
      .slice().sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
      .flatMap(source => {
        const options = getNavigationVariantOptions(source, domain.scope, categories);
        if (!options.length) return [];
        return [{
          id: `source:${ALL_SCOPE}:${source.name}`, kind: 'source',
          label: getSourceDisplayLabel(source.name, locale, source.label || source.name),
          scope: domain.scope, sourceName: source.name,
          variant: (options.find(item => item.value === getDefaultSourceSubtype(source.name)) || options[0]).value || '',
          children: [],
        }];
      }),
  }));

export const getRankingDestinationLabel = (node = {}, locale = 'zh-CN') => {
  const platform = getSourceDisplayLabel(node.sourceName, locale, node.sourceLabel || node.label || node.sourceName);
  const option = getSourceVariantOptions(node.sourceName).find(item => String(item.value || '') === String(node.variant || ''));
  const subtype = option ? getSubtypeLabel(option, locale) : '';
  return subtype ? `${platform} · ${subtype}` : platform;
};

// Discovery labels and destinations share the same variant; favorites retain their existing source id.
export const getRankingSearchNodes = (node, locale = 'zh-CN', options = getSourceVariantOptions(node.sourceName)) => {
  if (node.directoryOnly) return [node];
  const variants = options.length ? options : [{ value: node.variant || '' }];
  return variants.map(option => {
    const target = { ...node, sourceLabel: node.sourceLabel || node.label, variant: option.value || '' };
    return { ...target, id: `${node.id}:variant:${target.variant}`, favoriteId: node.id, label: getRankingDestinationLabel(target, locale), name: `${node.sourceName} ${target.variant}` };
  });
};

export const getDefaultNavigationFavorites = index =>
  ['baidu', 'weibo', 'douyin', 'zhihu', 'bilibili']
    .map(name => `source:${ALL_SCOPE}:${name}`)
    .filter(id => index.has(id))
    .map(id => ({ id }));

export const filterNavigationTree = (nodes, query = '') => {
  const text = query.trim().toLocaleLowerCase();
  if (!text) return nodes;
  const visit = node => {
    if ([node.label, node.sourceName].filter(Boolean).join(' ').toLocaleLowerCase().includes(text)) return node;
    const children = (node.children || []).map(visit).filter(Boolean);
    return children.length ? { ...node, children } : null;
  };
  return nodes.map(visit).filter(Boolean);
};

export const normalizeNavigationPreferences = (value = {}) => {
  const object = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const favorites = [...new Set((Array.isArray(object.favorites) ? object.favorites : []).map(item => item?.id).filter(id => safeKey(id) && /^(category|source|rank|topic|event|event-series):/.test(id)))].slice(0, 30).map(id => ({ id }));
  const recent = Object.fromEntries(Object.entries(object.recent || {}).filter(([scope, item]) => safeKey(scope) && safeKey(item?.sourceName) && typeof item?.variant === 'string').map(([scope, item]) => [scope, { sourceName: item.sourceName, variant: item.variant.slice(0, 120) }]));
  return { expanded: {}, favorites, favoritesInitialized: Array.isArray(object.favorites), recent, collapsed: object.collapsed === true };
};
