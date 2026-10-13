import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aiEvidence, aiAssociatedSourceCount, aiSourceRole, aiTimes, aiMetric, aiFeedState, aiCompare, aiSafeUrl, aiPrimarySource } from "../src/utils/aiEvidence.mjs";
import { AI_EVIDENCE_COPY } from "../src/config/ai-evidence-copy.mjs";
import {aiPublicationDisplayTime} from '../src/utils/aiTime.js';
const now = Date.UTC(2026,9,6);
const item = {title:"Translated title",originalTitle:"Original title",url:"https://example.org/report",timestamp:now-3600000,hot:999999,
 extra:{aiSignal:{primarySource:"36kr-ai",independentSourceCount:9,score:10,confirmations:[
 {source:"36kr-ai",title:"Original title",url:"https://example.org/report"},
 {source:"sina-ai",title:"Reprint",url:"https://example.org/report?utm_source=test#fragment"},
 {source:"openai-research",title:"Different event",url:"https://openai.com/index/research"},
 {source:"bad",title:"Unsafe",url:"javascript:alert(1)"}]}}};
assert.equal(aiAssociatedSourceCount(item),2); // Neither metadata=9 nor repeated/unsafe links count.
assert.equal(aiEvidence(item).length,2);
assert.equal(aiEvidence(item)[0].title,"Original title");
assert.equal(aiEvidence(item)[1].title,"Different event"); // Visible evidence, not an invented independent confirmation.
assert.equal(aiPrimarySource({}),"");
assert.equal(aiSourceRole("huggingface-blog"),"author");
assert.equal(aiSourceRole("hf-models"),"index");
assert.equal(aiSourceRole("openai-research"),"official");
assert.equal(aiSourceRole("unknown"),"unknown");
assert.equal(aiSafeUrl("https://user:secret@example.org"),"");
assert.equal(aiTimes(item,now).published,null);
assert.equal(aiTimes(item,now).sourceTime,now-3600000);
assert.equal(aiTimes({timestamp:now,extra:{aiSignal:{timestampKind:"observed"}}},now).published,null);
assert.equal(aiTimes({timestamp:now,extra:{aiSignal:{timestampKind:"observed"}}},now).observed,now);
assert.equal(aiTimes({publishedAt:new Date(now-5000).toISOString()},now).published,now-5000);
assert.equal(aiPublicationDisplayTime({publishedAt:'2026-08-13'},now),'2026-08-13','calendar publication keeps its precision');
assert.equal(aiPublicationDisplayTime({publishedAt:new Date(now-5000).toISOString(),datePublished:'2026-08-13'},now),now-5000,'a secondary calendar field does not replace the selected timestamp');
assert.equal(aiPublicationDisplayTime({publishedAt:'bad',extra:{aiSignal:{publishedAt:'2026-08-13'}}},now),'2026-08-13');
assert.equal(aiPublicationDisplayTime({publishedAt:'2026-02-31'},now),null);
assert.equal(aiPublicationDisplayTime({publishedAt:'2026-10-07'},now),null);
assert.equal(aiTimes({publishedAt:(now-5000)/1000},now).published,now-5000);
assert.equal(aiTimes({pubDate:String((now-5000)/1000)},now).published,now-5000);
assert.equal(aiTimes({publishedAt:"invalid",extra:{aiSignal:{publishedAt:new Date(now-5000).toISOString()}}},now).published,now-5000);
assert.equal(aiTimes({publishedAt:"",publishTime:now-5000},now).published,now-5000);
assert.equal(aiTimes({timestamp:(now-5000)/1000},now).published,null);
assert.equal(aiTimes({updatedAt:now-5000},now).published,null);
assert.equal(aiTimes({publishedAt:Date.UTC(2000,0,1)},now).published,Date.UTC(2000,0,1));
for (const publishedAt of [undefined, null, "", 0, "bad", now+1, Infinity]) assert.equal(aiTimes({publishedAt},now).published,null);
assert.equal(aiMetric(item),null); // Untyped hot never becomes votes/stars.
assert.equal(aiMetric({displayMetric:{kind:"mystery",value:9}}),null);
assert.deepEqual(aiMetric({displayMetric:{kind:"likes",value:0}}),{kind:"likes",value:0});
assert.equal(aiMetric({displayMetric:{kind:"likes",value:-1}}),null);
assert.equal(aiCompare({hot:1,extra:{aiSignal:{score:2}}},{hot:999999,extra:{aiSignal:{score:1}}}),-1);
const published={publishedAt:now-5000,extra:{aiSignal:{score:1}}};
assert.ok(aiCompare(item,published,"latest")>0); // Unknown publication sorts after known publication.
for (const [feed,state] of [[{status:"ok",count:3},"ok"],[{status:"ok",count:0},"empty"],[{status:"error",count:3},"failed"],[{status:"ok",count:3,stale:true},"stale"],[{fromCache:true,status:"ok",count:3},"ok"],[{},"unknown"]]) assert.equal(aiFeedState(feed),state);
for (const locale of ["zh-CN","en","zh-TW","ja","ko"]) {
 const copy=AI_EVIDENCE_COPY[locale];
 for (const role of ["official","news","author","index","discussion","repository","unknown"]) assert.ok(copy.roles[role]);
 for (const time of ["published","observed","fetched","updated","sourceTime"]) assert.ok(copy.times[time]);
 for (const state of ["ok","empty","failed","stale","unknown"]) assert.ok(copy.states[state]);
 assert.ok(copy.unknownPublished && copy.unknownMetric && copy.associationNote);
}
const view=readFileSync(new URL("../src/views/AiTopic.vue",import.meta.url),"utf8");
assert.ok(view.includes('class="event-evidence"') && view.includes("aiEvidence(item)") && view.includes("item.originalTitle"));
assert.ok(!view.includes("independentSourceCount") && !view.includes("OFFICIAL_SOURCES"));
assert.ok(!view.includes("evidenceCopy.notProvided") && !view.includes("readerCopy.publicationGap"));
console.log("AI_EVIDENCE_OK: association limits, linked originals, roles, typed times, metrics, source states, locale coverage");
