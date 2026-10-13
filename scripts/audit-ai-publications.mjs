import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AI_PUBLICATION_FEEDS, parseAiPublications, loadAiPublications, recentAiPublicationItems, compactAiPublicationIndex } from "../api/_ai-publications.js";
import { applyAiPublication } from "../src/utils/aiPublications.mjs";
import { aiTimes } from "../src/utils/aiEvidence.mjs";
import { handleAiIntelligence } from "../api/_ai-intelligence.js";
const feed = AI_PUBLICATION_FEEDS[0], now = Date.UTC(2026,9,7);
const compact=compactAiPublicationIndex(Array.from({length:2225},(_,i)=>({url:'https://openai.com/index/'+i,publishedAt:new Date(now-i*86400000).toISOString(),feedUrl:feed.url,title:'A'.repeat(500),desc:'D'.repeat(1000)})),now);
assert.equal(compact.length,91);
assert.ok(Buffer.byteLength(JSON.stringify(compact))<30000,'dates must not transport an entire article archive');
assert.deepEqual(Object.keys(compact[0]).sort(),['feedUrl','publishedAt','url']);
// Vercel transpiles this project's server .js graph to CommonJS. A static .mjs
// dependency passes local native-ESM tests but prevents the deployed API from starting.
const visited = new Set();
function auditServerGraph(file) {
  if (visited.has(file.href)) return;
  visited.add(file.href);
  const source = readFileSync(file,"utf8");
  for (const [,specifier] of source.matchAll(/(?:import[\s\S]*?from|export[^;]*?from)\s*["'](\.[^"']+)["']/g)) {
    assert.ok(!specifier.endsWith('.mjs'),"server CommonJS dependency must not require native ESM: "+specifier);
    auditServerGraph(new URL(specifier,file));
  }
}
auditServerGraph(new URL('../api/_ai-intelligence.js',import.meta.url));
const originalFeed='<rss><item><title>New AI model</title><description>&lt;p&gt;Original summary&lt;/p&gt;</description><link>https://openai.com/index/new-model</link><pubDate>2026-10-06</pubDate></item><item><title>Old model</title><link>https://openai.com/index/old</link><pubDate>2026-09-01</pubDate></item></rss>';
const fresh=recentAiPublicationItems(parseAiPublications(originalFeed,feed,now),now);
assert.equal(fresh.length,1);assert.equal(fresh[0].title,'New AI model');assert.equal(fresh[0].desc,'Original summary');
assert.equal(fresh[0].extra.aiSignal.primarySource,'openai-news');assert.equal(aiTimes(fresh[0],now).published,now-86400000);
assert.equal(recentAiPublicationItems([{url:'https://openai.com/no-title',publishedAt:now-1000,source:'openai-news'}],now).length,0);
const rss = '<rss><channel><item><link>https://openai.com/index/example?utm_source=rss&amp;ref=rss</link><pubDate>Tue, 06 Oct 2026 12:00:00 GMT</pubDate></item><item><link>https://openai.com/index/no-date</link><updated>2026-10-06</updated></item><item><link>https://attacker.test/x</link><pubDate>2026-10-06</pubDate></item><item><link>https://openai.com/index/future</link><pubDate>2099-10-06</pubDate></item></channel></rss>';
const entries = parseAiPublications(rss,feed,now);
assert.equal(entries.length,1);
assert.equal(entries[0].url,"https://openai.com/index/example");
assert.equal(entries[0].publishedAt,"2026-10-06T12:00:00.000Z");
assert.equal(entries[0].feedUrl,feed.url);
const atom = '<feed><entry><link href="https://openai.com/index/atom" rel="alternate"/><published>2026-10-06T12:00:00Z</published><updated>2026-10-07</updated></entry></feed>';
assert.equal(parseAiPublications(atom,feed,now)[0].publishedAt,entries[0].publishedAt);
assert.throws(()=>parseAiPublications('invalid',feed));
assert.throws(()=>parseAiPublications('<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///secret">]>'+rss,feed));
assert.throws(()=>parseAiPublications('<rss>'+"中".repeat(700000)+'</rss>',feed));
assert.equal(parseAiPublications('<rss>'+Array.from({length:2100},(_,i)=>'<item><link>https://openai.com/index/'+i+'</link><pubDate>2026-10-06</pubDate></item>').join('')+'</rss>',feed,now).length,2000);
const index = new Map(entries.map(entry=>[entry.url,entry]));
const original = {title:"Example",url:"https://openai.com/index/example?utm_source=reader",timestamp:now,extra:{aiSignal:{primarySource:"openai-news"}}};
const dated=applyAiPublication(original,index);
assert.equal(aiTimes(dated,now).published,Date.parse(entries[0].publishedAt));
assert.equal(dated.extra.publicationEvidence.url,feed.url);
assert.equal(dated.extra.aiSignal.primarySource,"openai-news");
assert.equal(applyAiPublication({...original,publishedAt:now-1000},index).publishedAt,now-1000,"explicit source dates remain authoritative");
assert.equal(applyAiPublication({...original,url:"https://discussion.test/comment",extra:{aiSignal:{confirmations:[{url:original.url}]}}},index).publishedAt,undefined,"related link dates never become primary article dates");
assert.equal(original.publishedAt,undefined,"no mutation");
let calls=0,active=0,peak=0;
const fetcher=async url=>{
  calls++;active++;peak=Math.max(peak,active);await Promise.resolve();active--;
  assert.ok(AI_PUBLICATION_FEEDS.some(feed=>feed.url===url));
  if(url.includes('deepmind'))throw Error("secret upstream detail");
  return {ok:true,text:async()=>url===feed.url?rss:'<rss></rss>'};
};
const first=await loadAiPublications(fetcher);assert.equal(first.publications.length,1);assert.equal(first.publicationFeeds.filter(f=>f.status==='failed').length,1);assert.equal(peak,AI_PUBLICATION_FEEDS.length);
await loadAiPublications(fetcher);assert.equal(calls,AI_PUBLICATION_FEEDS.length+1,"successful feeds cached, failed feed retried");
const tooLarge=await loadAiPublications(async()=>({ok:true,headers:{get:()=>"2000001"},text:async()=>{throw Error('must not read oversized body')}}));
assert.equal(tooLarge.publications.length,0);
const res={setHeader(){},status(code){this.code=code;return this},json(body){this.body=body}};
await handleAiIntelligence({req:{method:"GET",query:{}},res,pathValue:"ai-tools",fetchImpl:async url=>{
  if(AI_PUBLICATION_FEEDS.some(feed=>feed.url===url))throw Error("RSS unavailable");
  if(url.includes('summary.json'))return {ok:true,json:async()=>({status:{indicator:"none",description:"Operational"}})};
  return {ok:true,text:async()=>'<feed></feed>'};
}});
assert.equal(res.code,200);assert.equal(res.body.statuses.length,0,"statuses use their independent endpoint");assert.equal(res.body.publications.length,0,"publication outage does not remove tools/statuses");
assert.equal(JSON.stringify(res.body).includes('secret'),false);
console.log("AI_PUBLICATIONS_OK: explicit dates, exact original URLs, bounded fixed feeds, cache, partial failures, no fabricated publication or arbitrary article fetch");
