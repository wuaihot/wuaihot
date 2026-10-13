// Associate *ranking appearances*, not the underlying claims. Exact title,
// bounded timestamps and independent host/source proof are required. Unlike
// publication event merging, ranked topics rarely have a publishedAt field.
const SOURCES=new Set(['sina-ai','weibo']);
const MAX_SNAPSHOT_AGE=6*3600000;
const normalizedTitle=text=>String(text||'').normalize('NFKC').toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu,'');
const source=item=>String(item?.extra?.aiSignal?.primarySource||'');
const validURL=(value,host,path)=>{
  try{const u=new URL(value);return u.protocol==='https:'&&u.hostname===host&&path.test(u.pathname)?u:null;}
  catch{return null;}
};
const titleURLMatches=(item,kind,key)=>{
  const u=kind==='sina-ai'
    ?validURL(item.url,'so.sina.cn',/^\/search\/list\.d\.html$/)
    :validURL(item.url,'m.weibo.cn',/^\/search$/);
  if(!u)return false;
  const query=kind==='sina-ai' ? u.searchParams.get('keyword')||''
    :u.searchParams.get('containerid')?.split(/(?:^|&)q=/).at(-1)||'';
  return normalizedTitle(query)===key;
};
const sourceRow=(item,now)=>{
  const kind=source(item),signal=item.extra?.aiSignal||{};
  if(!SOURCES.has(kind))return null;
  const key=normalizedTitle(item.originalTitle||item.title);
  if(key.length<10||key.length>140||!/ai|人工智能|模型|视频|影像|deepfake/iu.test(key))return null;
  if(!titleURLMatches(item,kind,key))return null;
  const rank=kind==='weibo'?Number(item.extra?.discovery?.originalRank)
    :Number(signal.primaryRank);
  if(!Number.isSafeInteger(rank)||rank<1||rank>100)return null;
  if(kind==='weibo'){
    const discovery=item.extra?.discovery;
    if(discovery?.source!=='weibo'||!['hot','tech'].includes(discovery.variant)||discovery.dataKind!=='ranking')return null;
    const updated=Date.parse(discovery.snapshotUpdatedAt||'');
    if(!Number.isFinite(updated)||updated>now+60000||now-updated>MAX_SNAPSHOT_AGE)return null;
  }else{
    if(signal.freshness!=='ranked'||!Array.isArray(signal.confirmations)
      ||!signal.confirmations.some(e=>e.source==='sina-ai'&&e.url===item.url
      &&normalizedTitle(e.title)===key))return null;
  }
  const name=kind==='sina-ai'?'新浪 AI 热榜':item.extra.discovery.variant==='hot'?'微博热搜':'微博科技榜';
  const url=kind==='sina-ai'?'/rank/sina/ai':'/rank/weibo/'+item.extra.discovery.variant;
  // Preserve a provider-defined heat metric only as that source's own number;
  // never convert it into the primary source's score or sum it with hot.
  const rawMetric=item.metric||item.displayMetric;
  const metric=kind==='weibo' && rawMetric?.kind==='heat'
    &&rawMetric.value!==null&&rawMetric.value!==''
    &&Number.isFinite(Number(rawMetric.value))&&Number(rawMetric.value)>=0
    ?{kind:'heat',label:String(rawMetric.label||'热度').slice(0,24),value:Number(rawMetric.value)}:null;
  return {item,kind,key,rank,label:name,rankingUrl:url,originalUrl:item.url,
    originalTitle:item.originalTitle||item.title,
    ...(metric?{metric}:{}),
    snapshotAt:kind==='weibo'?item.extra.discovery.snapshotUpdatedAt:null};
};

export function mergeAiRankedCrossPlatformTopics(items,{now=Date.now(),discovery=[]}={}) {
  if(!Array.isArray(items))return [];
  // URL deduplication may retain the Weibo technology ranking while dropping
  // the same topic's hot-ranking variant. Recover only verified, same-URL hot
  // evidence from the original discovery batch; never invent a hot rank.
  const hotByUrl=new Map();
  for(const candidate of Array.isArray(discovery)?discovery:[]){
    const row=sourceRow(candidate,now);
    if(!row||row.kind!=='weibo'||candidate.extra?.discovery?.variant!=='hot')continue;
    const prior=hotByUrl.get(row.originalUrl);
    if(!prior||Date.parse(row.snapshotAt)>Date.parse(prior.snapshotAt))hotByUrl.set(row.originalUrl,row);
  }
  const eligible=items.map(item=>{
    const row=sourceRow(item,now);
    const hot=row?.kind==='weibo'?hotByUrl.get(row.originalUrl):null;
    return hot?.key===row?.key?hot:row;
  }),byKey=new Map();
  eligible.forEach((row,index)=>{
    if(!row)return;
    const entries=byKey.get(row.key)||[];entries.push({index,...row});byKey.set(row.key,entries);
  });
  const replacement=new Map(),collapsed=new Set();
  for(const rows of byKey.values()){
    // Two channels must be the only independently matching rank entities.
    const sina=rows.filter(r=>r.kind==='sina-ai'),weibo=rows.filter(r=>r.kind==='weibo');
    if(sina.length!==1||weibo.length!==1)continue;
    const main=sina[0],other=weibo[0],original=main.item;
    if(main.index===other.index)continue;
    const confirmations=(original.extra.aiSignal.confirmations||[]).map(entry=>
      entry.source==='sina-ai'&&entry.url===main.originalUrl
        ?{...entry,originalRank:main.rank}:entry);
    const seen=new Set(confirmations.map(x=>x.url));
    for(const item of [other]){
      if(!seen.has(item.originalUrl)){
        confirmations.push({source:'weibo',sourceLabel:item.label,title:item.originalTitle,
          url:item.originalUrl,originalRank:item.rank,rank:item.rank,
          ...(item.metric?{metric:item.metric}:{}),
          snapshotAt:item.snapshotAt});
        seen.add(item.originalUrl);
      }
    }
    const evidence=[main,other].map(entry=>({
      source:entry.kind,label:entry.label,rankingUrl:entry.rankingUrl,
      rank:entry.rank,url:entry.originalUrl,title:entry.originalTitle,
      ...(entry.metric?{metric:entry.metric}:{}),
      ...(entry.snapshotAt?{snapshotAt:entry.snapshotAt}:{}),
    }));
    replacement.set(main.index,{...original,extra:{...original.extra,
      aiSignal:{...original.extra.aiSignal,
        // Keep primary score/heat unchanged: different platforms' raw
        // counters must never be summed or presented as verified facts.
        confirmations:confirmations.slice(0,30),
        sources:[...new Set([...(original.extra.aiSignal.sources||[]),'sina-ai','weibo'])],
        sourceCount:2,independentSourceCount:2},
      rankedTopicMerge:{method:'independent-exact-ranked-topic',sourceCount:2,
        titleKey:main.key,evidence}}});
    collapsed.add(other.index);
  }
  return items.flatMap((item,index)=>collapsed.has(index)?[]:[replacement.get(index)||item]);
}
