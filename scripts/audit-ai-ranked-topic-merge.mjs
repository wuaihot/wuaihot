import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mergeAiRankedCrossPlatformTopics} from '../src/utils/aiRankedTopicMerge.mjs';
import {aiAssociatedSourceCount,aiEvidence} from '../src/utils/aiEvidence.mjs';
const now=Date.parse('2026-10-13T07:35:00Z');
const title='AI视频已经以假乱真了';
const sinaURL='https://so.sina.cn/search/list.d.html?keyword=AI%E8%A7%86%E9%A2%91%E5%B7%B2%E7%BB%8F%E4%BB%A5%E5%81%87%E4%B9%B1%E7%9C%9F%E4%BA%86';
const weiboURL='https://m.weibo.cn/search?containerid=100103type%3D1%26t%3D10%26q%3D%23AI%E8%A7%86%E9%A2%91%E5%B7%B2%E7%BB%8F%E4%BB%A5%E5%81%87%E4%B9%B1%E7%9C%9F%E4%BA%86%23';
const sina={id:'sina-ai-1',title,url:sinaURL,hot:110000,extra:{aiSignal:{
  primarySource:'sina-ai',primarySourceLabel:'新浪 AI',primaryRank:3,
  kind:'other',freshness:'ranked',score:15.7,sourceCount:1,independentSourceCount:1,
  sources:['sina-ai'],confirmations:[{source:'sina-ai',title,url:sinaURL,rank:3}],
}}};
const weibo={id:'weibo-hot-1',title,url:weiboURL,rank:7,metric:{kind:'heat',label:'热度',value:441000},extra:{
  aiSignal:{primarySource:'weibo',primarySourceLabel:'微博',primaryRank:7,
    confirmations:[{source:'weibo',title,url:weiboURL}]},
  discovery:{source:'weibo',variant:'hot',dataKind:'ranking',originalRank:8,
    snapshotUpdatedAt:'2026-10-13T07:32:08Z'},
}};
const joined=mergeAiRankedCrossPlatformTopics([sina,weibo],{now});
assert.equal(joined.length,1);
const merged=joined[0],proof=merged.extra.rankedTopicMerge;
assert.equal(merged.id,sina.id);
assert.equal(merged.url,sinaURL);
assert.equal(merged.hot,110000,'never sum incompatible metrics');
assert.equal(merged.extra.aiSignal.score,15.7,'do not invent combined popularity');
assert.deepEqual(proof.evidence[1].metric,{kind:'heat',label:'热度',value:441000},'Weibo hot heat must remain its own typed metric');
assert.equal(aiEvidence(merged).find(x=>x.source==='weibo').metric.value,441000,'evidence popover retains original Weibo heat');
assert.equal(merged.extra.aiSignal.sourceCount,2);
assert.equal(merged.extra.aiSignal.independentSourceCount,2);
assert.equal(aiAssociatedSourceCount(merged),2);
assert.deepEqual(proof.evidence.map(e=>[e.source,e.rank,e.rankingUrl]),[
 ['sina-ai',3,'/rank/sina/ai'],['weibo',8,'/rank/weibo/hot']]);
assert.deepEqual(new Set(aiEvidence(merged).map(e=>e.url)),new Set([sinaURL,weiboURL]));
assert.equal(aiEvidence(merged).find(e=>e.source==='sina-ai').originalRank,3);
assert.equal(aiEvidence(merged).find(e=>e.source==='weibo').originalRank,8);
assert.equal(aiEvidence(merged).find(e=>e.source==='weibo').role,'index','Weibo hot search is ranking evidence, not official claim verification');
assert.equal(proof.method,'independent-exact-ranked-topic');
assert.equal(merged.publishedAt,undefined,'ranking snapshots must not masquerade as publication dates');
assert.equal(mergeAiRankedCrossPlatformTopics([sina],{now}).length,1);
const outside=mergeAiRankedCrossPlatformTopics([sina,{...weibo,title:'AI 视频已经全面可信'},],{now});
assert.equal(outside.length,2,'similar themes with different claims do not merge');
const old=mergeAiRankedCrossPlatformTopics([sina,{...weibo,extra:{...weibo.extra,discovery:{...weibo.extra.discovery,snapshotUpdatedAt:'2026-10-12T01:00:00Z'}}}],{now});
assert.equal(old.length,2,'stale snapshot must not become present-day independent heat');
const forged={...weibo,url:'https://example.net/search?containerid=100103type%3D1'};
assert.equal(mergeAiRankedCrossPlatformTopics([sina,forged],{now}).length,2);
const tech={...weibo,id:'weibo-tech',rank:7,metric:{kind:'heat',label:'热度',value:350000},extra:{...weibo.extra,
  aiSignal:{...weibo.extra.aiSignal,primaryRank:7},
  discovery:{...weibo.extra.discovery,variant:'tech',originalRank:7}}};
const techOnly=mergeAiRankedCrossPlatformTopics([sina,tech],{now});
assert.equal(techOnly.length,1,'the same two-platform topic still merges with technology rank only');
assert.deepEqual(techOnly[0].extra.rankedTopicMerge.evidence[1].rankingUrl,'/rank/weibo/tech');
assert.equal(techOnly[0].extra.rankedTopicMerge.evidence[1].rank,7);
assert.equal(techOnly[0].extra.rankedTopicMerge.evidence[1].metric.value,350000);
assert.equal(aiEvidence(techOnly[0]).find(x=>x.source==='weibo').sourceLabel,'微博科技榜');
const both=mergeAiRankedCrossPlatformTopics([sina,tech],{now,discovery:[tech,weibo]});
assert.equal(both.length,1,'same-URL hot evidence outranks temporary technology variant');
assert.deepEqual(both[0].extra.rankedTopicMerge.evidence[1].rankingUrl,'/rank/weibo/hot');
assert.equal(both[0].extra.rankedTopicMerge.evidence[1].rank,8);
assert.equal(both[0].extra.rankedTopicMerge.evidence[1].metric.value,441000,'hot heat replaces tech metric, never adds it');
assert.equal(aiEvidence(both[0]).find(x=>x.source==='weibo').sourceLabel,'微博热搜');
for(const metricValue of [-1,NaN,Infinity]){
 const untrusted={...weibo,metric:{kind:'heat',label:'热度',value:metricValue}};
 assert.equal(mergeAiRankedCrossPlatformTopics([sina,untrusted],{now})[0].extra.rankedTopicMerge.evidence[1].metric,undefined,
  'invalid source heat cannot enter editorial evidence');
}
const oldHot={...weibo,extra:{...weibo.extra,
 discovery:{...weibo.extra.discovery,snapshotUpdatedAt:'2026-10-12T01:00:00Z'}}};
const noFakeHot=mergeAiRankedCrossPlatformTopics([sina,tech],{now,discovery:[oldHot]});
assert.deepEqual(noFakeHot[0].extra.rankedTopicMerge.evidence[1].rankingUrl,'/rank/weibo/tech',
 'never import a stale hot rank from past data');
assert.equal(mergeAiRankedCrossPlatformTopics([sina,{...weibo,extra:{...weibo.extra,aiSignal:{...weibo.extra.aiSignal,primarySource:'sina-ai'}}}],{now}).length,2);
assert.equal(mergeAiRankedCrossPlatformTopics([sina,weibo,{...sina,id:'unverified-second-sina'}],{now}).length,3,
 'multiple matching ranked primaries must fail closed');
assert.equal(mergeAiRankedCrossPlatformTopics([sina,{...weibo,url:sinaURL}],{now}).length,2,
 'a same-platform URL cannot spoof independent appearance');
assert.equal(mergeAiRankedCrossPlatformTopics([sina,{...weibo,title:'AI视频已经以假乱真了！！'}],{now}).length,1,
 'punctuation normalization is safe for an otherwise identical claim');
const unrelated={...sina,title:'昨日天气真好',url:'https://so.sina.cn/search/list.d.html?keyword=%E6%98%A8%E6%97%A5%E5%A4%A9%E6%B0%94%E7%9C%9F%E5%A5%BD'};
assert.equal(mergeAiRankedCrossPlatformTopics([unrelated,weibo],{now}).length,2);
const topicUI=readFileSync('src/views/AiTopic.vue','utf8');
assert.ok(topicUI.includes('primaryRank ? withLocalePrefix(locale.value,primaryRank.rankingUrl)'),
  'board primary source link must point to actual Sina AI ranking, not deduped sina/all');
assert.ok(topicUI.includes('rank:primaryRank?.rank??main.rank'),
  'board primary ranking reason must not borrow a conflicting discovery alias rank');
console.log('AI_RANKED_CROSS_PLATFORM_OK: two independent platforms, exact title, provenance rank and heat, safe ranking link, stale/spoofed/ambiguous counterexamples');
