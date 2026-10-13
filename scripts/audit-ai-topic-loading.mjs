import assert from 'node:assert/strict';
import { createAiTopicReads, readAiSupplement, scanAiDiscovery, readAiSnapshot, writeAiSnapshot, mergeAiServiceStatuses } from '../src/utils/aiTopicLoading.mjs';
let transientCalls=0;
assert.deepEqual(await readAiSupplement(async()=>{if(++transientCalls===1)throw new TypeError('network unavailable');return {data:['official announcement']};}),{data:['official announcement']});
assert.equal(transientCalls,2,'one transient failure recovers the missing official source');
for(const error of [Error('ai_read_503'),Object.assign(Error('read timed out'),{name:'TimeoutError'})]) {
 let calls=0;await assert.rejects(readAiSupplement(async()=>{calls++;throw error;}));assert.equal(calls,2,'persistent failures have a two-read ceiling');
}
for(const error of [Error('ai_read_400'),Error('ai_invalid_response'),Object.assign(Error('cancelled'),{name:'AbortError'})]) {
 let calls=0;await assert.rejects(readAiSupplement(async()=>{calls++;throw error;}));assert.equal(calls,1,'invalid or cancelled requests are not repeated');
}
let obsoleteCalls=0;
await assert.rejects(readAiSupplement(async()=>{obsoleteCalls++;throw new TypeError('offline');},{isCurrent:()=>false}));
assert.equal(obsoleteCalls,1,'a newer page load stops obsolete recovery');
let finishTools;
const reads=createAiTopicReads({topic:async()=>({code:200,data:[1]}),sina:async()=>({code:200,data:[2]}),tools:()=>new Promise(resolve=>{finishTools=resolve}),discovery:async()=>({data:[]})});
const base=await reads.base;
assert.deepEqual(base.map(x=>x.value.data),[[1],[2]],'slow supplements do not delay primary reading');
finishTools({data:[3]});await reads.supplement;
let active=0,peak=0;const cursors=[];
const scan=await scanAiDiscovery(async query=>{
 const cursor=query.cursor||0;cursors.push(cursor);active++;peak=Math.max(peak,active);
 await new Promise(resolve=>setTimeout(resolve,5));active--;
 if(cursor===32)throw Error('upstream private detail');
 return {data:[{id:cursor}],feeds:Array.from({length:Math.min(16,70-cursor)},(_,i)=>({source:'s'+(cursor+i)})),coverage:{total:70,checked:Math.min(cursor+16,70),revision:'v1'},next:cursor+16<70?cursor+16:null};
});
assert.equal(peak,2);assert.deepEqual([...cursors].sort((a,b)=>a-b),[0,16,32,48,64]);
assert.equal(scan.coverage.checked,54);assert.equal(scan.failedBatches,1);assert.ok(!JSON.stringify(scan).includes('private'));
assert.deepEqual(scan.data.map(x=>x.id),[0,16,48,64],'parallel completions preserve catalog order');
let alive=true,count=0;
await scanAiDiscovery(async()=>{count++;alive=false;return {data:[],feeds:[],coverage:{total:32,revision:'v'},next:16}},{isCurrent:()=>alive});
assert.equal(count,1,'cancelled work schedules no further requests');
const memory=new Map(),storage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
const now=Date.UTC(2026,9,7),snapshot={result:{code:200,data:[{title:'AI',url:'https://example.test'}]},discovery:[],discoveryFeeds:[],toolFeeds:[],coverage:{}};
assert.equal(writeAiSnapshot(storage,'zh-CN',snapshot,now),true);
assert.ok(readAiSnapshot(storage,'zh-CN',now+1000));
assert.equal(readAiSnapshot(storage,'en',now+1000),null);
assert.equal(readAiSnapshot(storage,'zh-CN',now+180001),null);
assert.equal(readAiSnapshot(storage,'zh-CN',now-1),null);
const largeVerified={...snapshot,result:{code:200,data:[{title:'x'.repeat(875000),url:'https://example.test'}]}};
assert.equal(writeAiSnapshot(storage,'zh-CN',largeVerified,now),true,'real 876 kB complete snapshots must fit the browser session cache');
assert.equal(readAiSnapshot(storage,'zh-CN',now+1000)?.result.data[0].title.length,875000);
assert.equal(writeAiSnapshot(storage,'zh-CN',{...snapshot,result:{code:200,data:[{title:'x'.repeat(1500001),url:'https://example.test'}]}},now),false,'oversized payloads still fail closed');
assert.equal(readAiSnapshot({getItem:()=>'{broken'},'zh-CN',now),null);
console.log('AI_LOADING_OK: independent primary reads, bounded parallel discovery, partial coverage, cancellation and 1.5 MB verified session cache budget');

const status={source:'openai-status',indicator:'none',description:'All Systems Operational',checkedAt:new Date(now).toISOString()};
assert.equal(mergeAiServiceStatuses([status],[])[0].stale,true);
assert.equal(mergeAiServiceStatuses([status],[])[0].checkedAt,status.checkedAt);
assert.equal(mergeAiServiceStatuses([status],[{...status,indicator:'major'}])[0].stale,false);
assert.equal(mergeAiServiceStatuses([],[{...status,url:'https://untrusted.test'}])[0].url,undefined);
assert.deepEqual(mergeAiServiceStatuses([],[{...status,indicator:'bad'}]),[]);

const realDateNow=Date.now;
try {
  const now=Date.UTC(2026,9,11,1,0);
  Date.now=()=>now;
  const env={INTERNAL_API_BASE_URL:'https://reddit-provider.test/api'};
  const failures=new Set();
  const sourceNames=['reddit-localllama','reddit-machinelearning','reddit-artificial'];
  const fakeFetch=async url=>{
    const source=sourceNames.find(name=>String(url).endsWith('/'+name));
    if(!source || failures.has(source))throw Error('provider temporarily unavailable');
    return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify({code:200,updateTime:new Date(Date.now()).toISOString(),
      data:[{title:'AI model research discussion '+source,url:'https://www.reddit.com/r/test/comments/'+source+'/sample/',
        publishedAt:new Date(now-3600000).toISOString()}]})};
  };
  const {loadAiReddit}=await import('../api/_ai-intake.js');
  const first=await loadAiReddit(fakeFetch,env);
  assert.equal(first.data.length,3);
  assert.ok(first.feeds.every(feed=>feed.status==='ok'),'all three verified Reddit RSS sources load normally');
  Date.now=()=>now+6*60000;
  failures.add('reddit-machinelearning');
  const partial=await loadAiReddit(fakeFetch,env);
  assert.equal(partial.data.length,3,'transient failure retains the source-specific last verified snapshot');
  const restored=partial.feeds.find(feed=>feed.source==='reddit-machinelearning');
  assert.equal(restored.status,'stale','fallback is visibly marked stale, never described as fresh');
  assert.equal(restored.stale,true);
  assert.ok(restored.lastSuccessfulAt);
  assert.equal(partial.data.find(item=>item.extra?.aiSignal?.primarySource==='reddit-machinelearning').extra.intake.stale,true);
  Date.now=()=>now+16*60000;
  const expired=await loadAiReddit(fakeFetch,env);
  assert.equal(expired.feeds.find(feed=>feed.source==='reddit-machinelearning').status,'failed','expired evidence must not be retained indefinitely');
  assert.equal(expired.data.length,2);
  const separateFetch=async()=>{throw Error('isolated fetch session offline')};
  const isolated=await loadAiReddit(separateFetch,env);
  assert.equal(isolated.data.length,0,'snapshots must not leak across isolated fetch contexts');
}finally{
  Date.now=realDateNow;
}
const {readFileSync}=await import('node:fs');
const readingPage=readFileSync('src/views/AiTopic.vue','utf8');
assert.ok(readingPage.includes('class="ai-reading-progress" role="status"'),
  'the reader must identify provisional counts while supplementary sources load');
assert.ok(readingPage.includes('{{ boardCopy.supplementing }}'),
  'partial data counts must not look final until supplements settle');

