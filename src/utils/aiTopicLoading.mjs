import {aiStatusDetails} from './aiServiceStatus.js';
// A full first-party + discovery snapshot is typically ~0.9 MB. The old
// 600 KB cap silently discarded healthy snapshots on every subsequent visit.
const CACHE_VERSION=2, CACHE_TTL=180000, MAX_BYTES=1500000;
const cacheKey=locale=>'wuaihot-ai-snapshot-v2:'+locale;

// Retry one transient read failure. Invalid payloads and cancelled/obsolete work
// remain failures; existing content stays available while a supplement recovers.
export async function readAiSupplement(read,{isCurrent=()=>true}={}) {
  try{return await read();}
  catch(error) {
    const transient=error instanceof TypeError || error?.name==='TimeoutError' || /^ai_read_5\d\d$/.test(error?.message || '');
    if(!isCurrent() || !transient)throw error;
    return read();
  }
}

export function createAiTopicReads({topic,sina,tools,discovery,isCurrent=()=>true}) {
  const run=read=>Promise.resolve().then(read);
  return {base:Promise.allSettled([run(topic),run(sina)]),supplement:Promise.allSettled([run(()=>readAiSupplement(tools,{isCurrent})),run(()=>readAiSupplement(discovery,{isCurrent}))])};
}

export async function scanAiDiscovery(read,{isCurrent=()=>true}={}) {
  const first=await read({cursor:0});
  const batches=new Map([[0,first]]),total=first.coverage?.total,step=first.next;
  if(!Number.isSafeInteger(total) || total<0 || total>2000 || !Array.isArray(first.data) || !Array.isArray(first.feeds))throw Error('ai_discovery_invalid');
  const jobs=[];
  if(step!==null) {
    if(!Number.isSafeInteger(step) || step<=0 || step>total)throw Error('ai_discovery_invalid');
    for(let cursor=step;cursor<total;cursor+=step)jobs.push(cursor);
  }
  let next=0,failedBatches=0;
  await Promise.all(Array.from({length:Math.min(2,jobs.length)},async()=>{
    while(next<jobs.length && isCurrent()) {
      const cursor=jobs[next++];
      try {
        const payload=await read({cursor,revision:first.coverage.revision});
        if(!Array.isArray(payload.data) || !Array.isArray(payload.feeds) || payload.coverage?.revision!==first.coverage.revision)throw Error('ai_discovery_invalid');
        batches.set(cursor,payload);
      }catch{failedBatches++;}
    }
  }));
  const ordered=[...batches.entries()].sort((a,b)=>a[0]-b[0]).map(([,payload])=>payload);
  return {data:ordered.flatMap(x=>x.data),feeds:ordered.flatMap(x=>x.feeds),failedBatches,
    coverage:{...first.coverage,checked:ordered.reduce((sum,x)=>sum+x.feeds.length,0),failedBatches}};
}

function validSnapshot(value) {
  return value?.result?.code===200 && Array.isArray(value.result.data) && value.result.data.length>0 && value.result.data.length<=2000
    && value.result.data.every(item=>item && typeof item.title==='string' && typeof item.url==='string')
    && ['discovery','discoveryFeeds','toolFeeds'].every(key=>Array.isArray(value[key]) && value[key].length<=2000);
}
export function readAiSnapshot(storage,locale,now=Date.now()) {
  try {
    const text=storage.getItem(cacheKey(locale));if(!text || text.length>MAX_BYTES)return null;
    const value=JSON.parse(text);
    return value.version===CACHE_VERSION && value.locale===locale && Number.isFinite(value.at) && now>=value.at && now-value.at<=CACHE_TTL && validSnapshot(value) ? value : null;
  }catch{return null;}
}
export function writeAiSnapshot(storage,locale,value,now=Date.now()) {
  try {
    if(!validSnapshot(value))return false;
    const text=JSON.stringify({...value,version:CACHE_VERSION,locale,at:now});
    if(new TextEncoder().encode(text).length>MAX_BYTES)return false;
    storage.setItem(cacheKey(locale),text);return true;
  }catch{return false;}
}

// Failed refreshes preserve the last verified state, visibly labelled as a past check.
export function mergeAiServiceStatuses(previous=[],incoming=[],checkedAt=null) {
  const sources=['openai-status','claude-status'],indicators=['none','minor','major','critical','maintenance'];
  const valid=row=>row && sources.includes(row.source) && indicators.includes(row.indicator) && typeof row.description==='string' && row.description.length<=300;
  return sources.flatMap(source=>{
    const fresh=(Array.isArray(incoming)?incoming:[]).find(row=>row.source===source && valid(row));
    const old=(Array.isArray(previous)?previous:[]).find(row=>row.source===source && valid(row));
    const row=fresh || old;if(!row)return [];
    const at=row.checkedAt || (fresh?checkedAt:null);
    const details=aiStatusDetails({incidents:row.incidentDetails,components:row.affectedComponents});
    return [{source,indicator:row.indicator,description:row.description,checkedAt:Number.isFinite(Date.parse(at))?at:null,stale:!fresh,...details}];
  });
}
