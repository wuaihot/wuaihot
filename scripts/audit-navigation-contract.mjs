import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';

// The hidden legacy category must not be rewritten by two presentation effects.
const header = fs.readFileSync('src/components/Header.vue', 'utf8');
const toolbar = fs.readFileSync('src/components/ContextToolbar.vue', 'utf8');
assert.doesNotMatch(header, /watchEffect\(\(\) => \{[\s\S]{0,600}store\.setActiveCategory/, 'header must not rewrite route category, which loops with the context toolbar on general');
assert.doesNotMatch(toolbar, /watchEffect\(\(\) => \{[\s\S]{0,600}store\.setActiveCategory/, 'toolbar must derive category without rewriting it');

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
try {
  const nav = await vite.ssrLoadModule('/src/utils/rankingNavigation.js');
  const categories = [
    { id: 'general', name: '综合', slug: 'general', navigation: false },
    { id: 'news', name: '新闻', slug: 'news' },
    { id: 'news-domestic', name: '国内', slug: 'domestic-news', parentId: 'news' },
    { id: 'tech', name: '科技', slug: 'tech' },
    { id: 'custom', name: '我的分类', slug: 'custom' },
  ];
  const sources = [
    { name: 'douyin', label: '抖音', show: true, categoryIds: ['general'], order: 0 },
    { name: 'weibo', label: '微博', show: true, categoryIds: ['general'], order: 1 },
    { name: 'v2ex', label: 'V2EX', show: true, categoryIds: ['tech', 'custom'], order: 2 },
    { name: 'zhihu', show: false, categoryIds: ['tech'], order: -1 },
    { name: 'qq-music', show: true, directoryOnly: true, categoryIds: ['tech'], order: -2 },
  ];
  assert.equal(nav.normalizeNavigationScope('general', categories), nav.ALL_SCOPE);
  assert.equal(nav.normalizeNavigationScope('custom', categories), 'custom');
  assert.equal(nav.getRankingScope(sources[0], 'society', categories), 'news-domestic');
  assert.equal(nav.getRankingScope(sources[0], 'hot', categories), nav.ALL_SCOPE);
  const target = nav.resolveRankingDestination({ sources, categories, scope: 'news', remembered: { sourceName: 'douyin', variant: 'society' } });
  assert.equal(target.sourceName, 'douyin');
  assert.equal(target.variant, 'society');
  assert.equal(target.scope, 'news');
  const stale = nav.resolveRankingDestination({ sources, categories, scope: 'tech', remembered: { sourceName: 'douyin', variant: 'hot' } });
  assert.equal(stale.sourceName, 'v2ex', 'stale or unavailable projected variants must fall back to a valid source');
  assert.equal(nav.getRankingScope(sources[1], 'tech', categories), 'tech');
  assert.equal(nav.resolveRankingDestination({ sources: [], categories, scope: 'tech' }), null);
  const tree = nav.buildRankingNavigationTree(sources, categories);
  assert.equal(tree[0].id, 'category:__all__');
  assert.equal(tree.some(node => node.scope === 'general'), false);
  assert.match(tree[0].children.find(node => node.sourceName === 'qq-music').externalUrl, /^https:/);
  const nestedTree = nav.buildRankingNavigationTree([{ ...sources[2], categoryIds: ['child'] }], [...categories, { id: 'child', name: '开发者', parentId: 'tech' }]);
  const techNode = nestedTree.find(node => node.scope === 'tech');
  assert.equal(techNode.children.filter(node => node.sourceName === 'v2ex').length, 0, 'parent must not repeat a platform already under its child');
  assert.ok(techNode.children.find(node => node.scope === 'child').children.some(node => node.sourceName === 'v2ex'));
  assert.equal(nav.normalizeNavigationScope('missing', categories), nav.ALL_SCOPE);
  assert.equal(tree.find(node => node.scope === 'custom').children.some(node => node.sourceName === 'v2ex'), true);
  assert.equal(JSON.stringify(tree).includes('"sourceName":"zhihu"'), false);
  assert.equal(nav.filterNavigationTree(tree, '不存在').length, 0);
  assert.equal(nav.filterNavigationTree(tree, 'V2EX').some(node => node.scope === 'tech'), true);
  const corrupt = nav.normalizeNavigationPreferences({ expanded: 'bad', favorites: [null, { id: '__proto__' }], recent: null });
  assert.deepEqual(corrupt.favorites, []);
  assert.equal(typeof corrupt.expanded, 'object');
  const saved = nav.normalizeNavigationPreferences({ expanded: { 'category:tech': false }, favorites: [{ id: 'category:tech' }], recent: { tech: { sourceName: 'v2ex', variant: '' } } });
  assert.deepEqual(saved.expanded, {}, 'legacy expansion memory must be discarded');
  assert.equal(saved.recent.tech.sourceName, 'v2ex');
  const domains = nav.getReaderNavigationDomains(sources, categories);
  assert.deepEqual(domains.map(domain => domain.scope), ['__all__', 'news', 'tech', 'custom']);
  assert.ok(domains.every(domain => domain.children.every(node => node.kind === 'source' && !node.children.length)), 'reader candidates must be a flat platform list');
  assert.equal(domains[0].children.some(node => ['zhihu', 'qq-music'].includes(node.sourceName)), false, 'unavailable sources must not be reader candidates');
  assert.equal(domains.find(domain => domain.scope === 'news').children.find(node => node.sourceName === 'douyin').variant, 'society', 'a root domain must include projected variants from child categories');
  assert.equal(domains.find(domain => domain.scope === 'custom').children.some(node => node.sourceName === 'v2ex'), true);
  const { applyTrendsSourceCatalog } = await vite.ssrLoadModule('/src/utils/sourceSubtypes.js');
  applyTrendsSourceCatalog({ sources:[{ key:'weibo', defaultVariant:'hot', variantGroups:[{ key:'ranking', label:'榜单', options:[{ key:'hot',label:'热搜榜' },{ key:'entertainment',label:'文娱榜' }] }] }] });
  const weiboNode = tree[0].children.find(node => node.sourceName === 'weibo');
  assert.equal(nav.getRankingDestinationLabel({ ...weiboNode, variant: 'entertainment' }), '微博 · 文娱榜', 'destination label must identify the actual child ranking');
  const searches = nav.getRankingSearchNodes(weiboNode);
  const { matchNavigationEntries } = await vite.ssrLoadModule('/src/utils/navigationSearch.js');
  const matched = matchNavigationEntries(searches, '微博 文娱');
  assert.equal(matched.length, 1, 'platform plus child-ranking tokens must select one precise destination');
  assert.equal(matched[0].variant, 'entertainment', 'search label and navigation variant must agree');
  assert.equal(matched[0].favoriteId, weiboNode.id, 'search keeps the existing platform favorite identity');
  assert.equal(new Set(searches.map(node => node.id)).size, searches.length, 'child-ranking results need unique identities');
  assert.equal(nav.getRankingDestinationLabel({ sourceName:'fixture-no-variant', label:'Fixture platform', variant:'' }), 'Fixture platform', 'a source without variants must not invent a child ranking');
  applyTrendsSourceCatalog({});
  const globalIndex = new Map(tree[0].children.map(node => [node.id, node]));
  assert.deepEqual(nav.getDefaultNavigationFavorites(globalIndex), [{ id: 'source:__all__:weibo' }, { id: 'source:__all__:douyin' }], 'defaults must only contain available major platforms');
  assert.equal(nav.normalizeNavigationPreferences().favoritesInitialized, false);
  assert.equal(nav.normalizeNavigationPreferences({ favorites: [] }).favoritesInitialized, true, 'a user-cleared favorite list must stay empty');
  const cyclic = nav.buildRankingNavigationTree(sources, [...categories, { id: 'a', parentId: 'b', name: 'A' }, { id: 'b', parentId: 'a', name: 'B' }]);
  assert.ok(Array.isArray(cyclic));
  console.log('NAVIGATION_CONTRACT_OK: state ownership, scopes, projections, destinations, directory, persistence');
} finally { await vite.close(); }
