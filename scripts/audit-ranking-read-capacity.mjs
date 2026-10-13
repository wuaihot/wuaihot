import assert from 'node:assert/strict';
import fs from 'node:fs';

const apiText = fs.readFileSync('src/api/index.js', 'utf8');
const match = apiText.match(/const requestTrendsRanking = async \([\s\S]*?(?=\nconst compareTrendsShadow)/);
assert.ok(match, 'ranking request must have an independently testable boundary');
const requests = [];
const fetchStub = async url => {
  requests.push(new URL(url));
  return { ok: true, json: async () => ({ data: { source: { key: 'douyin' }, items: Array.from({ length: Math.min(50, Number(new URL(url).searchParams.get('limit'))) }, (_, rank) => ({ rank: rank + 1 })) } }) };
};
const requestFactory = new Function('fetch', 'TRENDS_DISPLAY_API', 'TRENDS_PUBLIC_API', 'getTrendsShadowVariant', 'normalizeTrendsRankingResult', 'SAME_ORIGIN_TRENDS_ORIGIN', match[0] + '; return requestTrendsRanking;');
const request = requestFactory(fetchStub, 'https://provider.example/display/v1', 'https://provider.example/public/v1', () => 'hot', payload => ({ code: 200, data: payload.data.items }));
assert.equal((await request('douyin', {}, 'display')).data.length, 20);
assert.equal((await request('douyin', {}, 'display', { rankingLimit: 100 })).data.length, 50, 'detail must ask for full capacity');
assert.equal(requests.at(-1).searchParams.get('limit'), '100');
assert.equal((await request('douyin', {}, 'public')).data.length, 50, 'existing public capacity is preserved');
const sameOriginRequest = requestFactory(fetchStub, 'https://provider.example/display/v1', 'https://provider.example/public/v1', () => 'hot', payload => ({ code: 200, data: payload.data.items }), 'https://site.example');
assert.equal((await sameOriginRequest('douyin', {}, 'display', { rankingLimit: 100, forceNoCache: true })).data.length, 50);
assert.equal(requests.at(-1).origin, 'https://site.example');
assert.equal(requests.at(-1).pathname, '/api/trends-ranking/douyin');
assert.equal(requests.at(-1).searchParams.get('surface'), 'display');
assert.equal(requests.at(-1).searchParams.get('variant'), 'hot');
assert.equal(requests.at(-1).searchParams.get('force'), '1');
assert.equal(requests.at(-1).searchParams.get('limit'), '100');

const collectionText = fs.readFileSync('src/utils/rankingCollection.js', 'utf8');
let calls = 0;
const stub = async (_source, _isNew, _params, options) => {
  calls += 1;
  return { result: { code: 200, data: Array.from({ length: options.rankingLimit || 20 }) } };
};
const collectionCode = collectionText.replace(/import \{ getHotListsWithFallback \} from ["']@\/api["'];?/, 'const getHotListsWithFallback = globalThis.__rankingCapacityStub;');
globalThis.__rankingCapacityStub = stub;
const collection = await import('data:text/javascript;base64,' + Buffer.from(collectionCode).toString('base64'));
delete globalThis.__rankingCapacityStub;
assert.equal((await collection.getSharedRanking('douyin')).result.data.length, 20);
assert.equal((await collection.getSharedRanking('douyin', false, {}, { rankingLimit: 100 })).result.data.length, 100, 'small card cache must not truncate the reader');
await collection.getSharedRanking('douyin', false, {}, { rankingLimit: 100 });
assert.equal(calls, 2, 'same full-capacity request should reuse its own cache');
assert.match(fs.readFileSync('src/components/CategoryStream.vue', 'utf8'), /rankingLimit: sourcePageMode\.value \? 100 : 20/);
console.log('RANKING_READ_CAPACITY_OK: request sizes and cache isolation; provider cap remains authoritative');
