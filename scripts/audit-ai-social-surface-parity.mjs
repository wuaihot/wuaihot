import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mergeAiVerifiedResetEvents} from '../src/utils/aiSocialThreads.js';
import {applyReviewedTranslation} from '../src/utils/reviewedTranslation.js';
import {aiContentTopic} from '../src/utils/aiContent.js';
import {aiPrecisionLane} from '../src/utils/aiPrecisionBoard.mjs';
import {aiQuotaResetNotice} from '../src/utils/aiQuotaReset.mjs';
import {formatCompactMetric} from '../src/utils/compactMetric.js';

const source='ai-author-thsottiaux',account='thsottiaux';
const base='2026-10-13T';
const id={day:'2109812216212099456',eta:'2109812360596865224',done:'2109873287853707513',plan:'2109892247580000595'};
const original={day:'Day 8/ Reset',eta:'Global reset landing by EOD PST time. Enjoy',
 done:"What would you like with your side of reset? It's done.",
 plan:'Good plans are simple. I have one that should result in significantly more usage for everyone. Hope to get it done soon.'};
const rows=Object.entries(id).map(([kind,postId])=>{
 const text=original[kind],date={day:'01:03:25',eta:'01:03:59',done:'05:06:06',plan:'06:21:26'}[kind];
 const title={day:'Tibo · Day 8：宣布额度重置，等待到账确认',eta:'Tibo：预计美西当天结束前落地',
  done:'Tibo：确认 Day 8 重置已宣告完成',plan:'Tibo：计划增加使用量，细节未公布'}[kind];
 return {id:source+':'+postId,postId,title:text,desc:text,originalTitle:text,originalDesc:text,
  url:'https://x.com/thsottiaux/status/'+postId,publishedAt:base+date+'Z',
  extra:{aiSignal:{primarySource:source,primarySourceLabel:'Tibo · X',timestampKind:'published'},
   socialPost:{sourceAccount:account,postId,authorRole:'employee',...(kind==='done'?{quoted:{username:account,url:'https://x.com/'+account+'/status/'+id.eta,text:original.eta}}:{})},
   aiAnalysis:{state:'evidence-grounded',kind:kind==='plan'?'discussion':'quota-update',
    facts:[{text:'Author statement',quote:text}],
    locales:{'zh-CN':{title,desc:kind==='plan'?'未来使用量计划，尚未公布实施细节。':'经过证据确认的作者进展声明。'}}}
  }};
});
const originalSet=new Set(rows.map(row=>row.url));
assert.equal(originalSet.size,4);
for(const locale of ['zh-CN','zh-TW','en']){
 const reviewed=rows.map(row=>applyReviewedTranslation(row,locale));
 const projected=mergeAiVerifiedResetEvents(reviewed,locale);
 assert.equal(projected.length,2,'14 public posts reduce to 10 events when two Day groups are resolved');
 const event=projected.find(x=>x.extra.socialPost.eventGroup?.day===8);
 assert.ok(event);
 assert.equal(event.id,rows[0].id,'canonical Day8 permalink must remain initial source post');
 assert.equal(event.extra.socialPost.eventGroup.status,'completed');
 assert.equal(event.extra.socialPost.eventGroup.completionKind,'declared-done');
 assert.equal(event.extra.socialPost.eventGroup.sourceCount,3);
 assert.equal(event.extra.socialPost.eventGroup.latestAt,rows[2].publishedAt);
 assert.deepEqual(event.extra.socialPost.eventGroup.posts.map(p=>p.url),rows.slice(0,3).map(p=>p.url));
 assert.ok(locale==='zh-CN'?event.title.includes('已宣告完成'):locale==='zh-TW'?event.title.includes('已宣告完成'):event.title.includes('declared complete'));
 const twice=mergeAiVerifiedResetEvents(projected,locale);
 assert.deepEqual(twice,projected,'client must not ungroup and downgrade server-confirmed Day8');
 const rawAgain=mergeAiVerifiedResetEvents([...projected,rows[1],rows[2]],locale);
 assert.equal(rawAgain.length,2,'inflight raw duplicate supplements cannot resurrect separate events');
 assert.equal(rawAgain.find(x=>x.extra.socialPost.eventGroup)?.extra.socialPost.eventGroup.status,'completed');
}
assert.equal(aiContentTopic(rows[0]),'products','verified quota state is a product usage update, not unclassified');
assert.equal(aiQuotaResetNotice(rows[0]),true,'original Day8 reset may receive the quota badge');
assert.equal(aiQuotaResetNotice(rows[2]),true,'quote-verified Day8 completion may receive the reset badge');
assert.equal(aiQuotaResetNotice(rows[3]),false,'a future usage-plan discussion MUST NEVER be labelled 额度动态');
assert.equal(aiQuotaResetNotice({...rows[3],extra:{...rows[3].extra,aiAnalysis:{...rows[3].extra.aiAnalysis,state:'pending'}}}),false);
assert.equal(formatCompactMetric(1218177,'zh-CN'),'121.8万','original post views use the shared localized 10k-unit contract');
assert.equal(formatCompactMetric(889467,'zh-CN'),'88.9万');
assert.equal(formatCompactMetric(402000,'en'),'402K','English numbers retain compact K/M units');
assert.equal(aiContentTopic(rows[3]),'opinion','the new usage plan is a prospective personal opinion, not a confirmed rollout');
assert.equal(aiPrecisionLane(rows[3]),'discussion','Tibo unannounced usage plan belongs in 热门讨论, not 热点要闻 or product launches');
assert.equal(aiPrecisionLane(rows[0]),'launches','verified quota reset may retain its real product update classification');
assert.equal(aiContentTopic({...rows[3],extra:{...rows[3].extra,aiAnalysis:{...rows[3].extra.aiAnalysis,state:'unverified'}}}),'other','unverified intent must not gain trusted topic classification');
const tools=readFileSync('api/_ai-intelligence.js','utf8');
const x=readFileSync('api/_ai-social.js','utf8');
const radar=readFileSync('src/views/AiTopic.vue','utf8');
const category=readFileSync('src/components/CategoryStream.vue','utf8');
const expansion=readFileSync('src/components/AiSocialEventSources.vue','utf8');
assert.ok(tools.includes('mergeAiVerifiedResetEvents(social.data.map')&&tools.includes('...qwen.data,...socialEvents]'));
assert.ok(tools.includes('socialOriginalPostCount:social.data.length')&&tools.includes('socialEventCount:socialEvents.length'));
assert.ok(tools.includes('const readerLocale=value(req.query.locale)'),'ai-tools must accept bounded locale for consistency');
assert.ok(x.includes('mergeAiVerifiedResetEvents(rawData,readerLocale)'),'dedicated social ranking keeps canonical server contract');
assert.ok(radar.includes("fetchAiRead('ai-tools',{locale:locale.value},signal)"));
assert.ok(radar.includes('mergeAiVerifiedResetEvents(mergeAiSocialThreads(rows),locale.value)'));
assert.ok(expansion.includes("group?.completionKind==='declared-done'"),'source expansion must not say propagated when the author only declared done');
assert.ok(expansion.includes('formatCompactMetric(post.views,locale)'),'every post uses the site-wide localized compact views convention');
assert.ok(expansion.includes('data-status=success'),'confirmed propagation has an independent success color');
assert.ok(expansion.includes('data-status=declared'),'author-declared completion must be visibly distinct from verified propagation');
assert.ok(!expansion.includes('<details v-for='),'one single disclosure, never recursively nested accordions');
assert.ok(radar.includes('<AiSocialEventSources v-if="item.extra.socialPost.eventGroup"'),'reader reuses ranked-details evidence timeline');
assert.ok(radar.includes(':locale="locale" inline :show-original="isOriginal(item,\'reader\')"'),'reader opens a single evidence popover with visible events, not another nested details');
assert.ok(expansion.includes("inline ? 'section' : 'details'"),'the shared evidence component must support flat inline reading and collapsible rankings');
assert.ok(!radar.includes('class="ai-social-post-proofs"'),'reader no longer maintains a second nested timeline');
assert.ok(category.includes("LIVE_SOCIAL_SOURCES.has(source.name)?SOCIAL_CARD_RECHECK_MS:CATEGORY_STREAM_COLLECTION_TTL_MS"));
assert.ok(category.includes('sourceLoadedAt[source.name]'),'revisiting cached category cannot freeze stale social cards');
// Execute the actual ai-tools serverless handler against a verified-shaped
// isolated social snapshot. No real network, credentials or timer mutations.
const {handleAiIntelligence}=await import('../api/_ai-intelligence.js');
const stamp=new Date().toISOString(),now=Date.now();
const offsets=[5*3600000,5*3600000-34000,3600000,1800000];
const liveShaped=rows.map((row,i)=>({...row,
 publishedAt:new Date(now-offsets[i]).toISOString(),
 extra:{...row.extra,aiAnalysis:{...row.extra.aiAnalysis,
  processedAt:stamp,model:'fixture',lane:'news'}}}));
const snapshot={schemaVersion:1,generatedAt:stamp,
 feeds:[{source,status:'ok',lastSuccessfulAt:stamp}],data:liveShaped};
let socialReads=0;
const mocked=async url=>{
 if(String(url).startsWith('https://verified-social.example.test/public.json')){
  socialReads++;
  return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(snapshot)};
 }
 throw new Error('unavailable fixture-only unrelated public feed');
};
const env={AI_SOCIAL_FEED_URL:'https://verified-social.example.test/public.json'};
const response=()=>({code:null,body:null,setHeader(){return this},
 status(code){this.code=code;return this},json(body){this.body=body;return this}});
for(const lang of ['zh-CN','en']){
 const res=response();
 await handleAiIntelligence({req:{method:'GET',query:{locale:lang}},res,
  pathValue:'ai-tools',env,fetchImpl:mocked});
 assert.equal(res.code,200,'real server handler should publish normalized social events');
 const projected=res.body.data.filter(x=>x.extra?.aiSignal?.primarySource===source);
 assert.equal(res.body.socialOriginalPostCount,4);
 assert.equal(res.body.socialEventCount,2);
 assert.equal(projected.length,2);
 const canonical=projected.find(x=>x.extra?.socialPost?.eventGroup?.day===8);
 assert.equal(canonical.extra.socialPost.eventGroup.posts.length,3);
 assert.equal(canonical.extra.socialPost.eventGroup.completionKind,'declared-done');
 assert.ok(lang==='zh-CN'?canonical.title.includes('已宣告完成'):canonical.title.includes('declared complete'));
 assert.deepEqual(mergeAiVerifiedResetEvents(projected,lang),projected,
  'real API projection remains stable when reused by AI Radar');
}
const bad=response();
await handleAiIntelligence({req:{method:'GET',query:{locale:'undefined-locale'}},res:bad,
 pathValue:'ai-tools',env,fetchImpl:mocked});
assert.equal(bad.code,400,'unbounded locale keys must not create arbitrary cache variants');
assert.ok(socialReads>=1);
console.log('AI_SOCIAL_SURFACE_PARITY_OK: actual ai-tools handler 4→2, zh-CN/en, Day8 done, no double-merge, category freshness and source semantics');
