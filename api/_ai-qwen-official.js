// Bounded first-party live source. Never infer a release from community traffic,
// a cached article title, or the time this document happens to be fetched.
export const QWEN_CHANGELOG_URL='https://platform.qianwenai.com/docs/changelog/models';
const MAX_BYTES=2_000_000,MAX_RECORDS=160,CACHE_MS=300_000,STALE_MS=1_800_000,MAX_AGE_DAYS=180;
const cache=new WeakMap();
const decode=str=>String(str||'').replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>{const cp=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return cp>0&&cp<=0x10ffff?String.fromCodePoint(cp):'';}).replace(/&(nbsp|amp|lt|gt|quot|apos);/gi,(_,k)=>({nbsp:' ',amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[k.toLowerCase()]));
const strip=html=>decode(String(html||'').replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
const dateOf=value=>{const m=String(value||'').match(/(20\d{2})年(1[0-2]|0?[1-9])月(3[01]|[12]\d|0?[1-9])日/);if(!m)return null;const d=[m[1],m[2].padStart(2,'0'),m[3].padStart(2,'0')].join('-'),utc=Date.parse(d+'T00:00:00+08:00');if(!Number.isFinite(utc))return null;const check=new Date(utc+8*3600000).toISOString().slice(0,10);return check===d?d:null;};
const idOf=headline=>{const prefix=strip(headline).toLowerCase().match(/^(qwen[a-z0-9._-]{2,99})(?:\b|$)/);return prefix?prefix[1]:null;};
const publishedAt=date=>Date.parse(date+'T00:00:00+08:00');

export function parseQwenOfficialChangelog(html,{now=Date.now()}={}){
 if(typeof html!=='string'||Buffer.byteLength(html,'utf8')>MAX_BYTES||!Number.isFinite(now))throw Error('qwen_bad_document');
 const safeHtml=html.replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'');
 const marker=/<div\b(?=[^>]*\bclass=["'][^"']*\bupdate-container\b)[^>]*>/gi;
 const blocks=[...safeHtml.matchAll(marker)].slice(0,500);
 if(!blocks.length)throw Error('qwen_markers_not_found');
 const items=[],seen=new Set();
 for(let i=0;i<blocks.length;i++){
  const section=safeHtml.slice(blocks[i].index,blocks[i+1]?.index||safeHtml.length);
  const top=blocks[i][0];
  const label=top.match(/\bid=["']([^"']+)["']/i)?.[1]||
    strip(section.match(/data-component-part=["']update-label["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]);
  const date=dateOf(label);if(!date)continue;
  const publication=publishedAt(date);if(publication>now||now-publication>MAX_AGE_DAYS*86400000)continue;
  const content=section.match(/data-component-part=["']update-content["'][^>]*>([\s\S]*)/i)?.[1];
  if(!content)continue;
  const headings=[...content.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)].slice(0,60);
  for(let n=0;n<headings.length;n++){
   const headline=strip(headings[n][1]);
   const excerpt=strip(content.slice(headings[n].index+headings[n][0].length,headings[n+1]?.index||Math.min(content.length,headings[n].index+2800))).slice(0,640);
   for(const candidate of headline.split(/[、，,]\s*/)){
    const model=idOf(candidate);if(!model)continue;const key=date+':'+model;
    if(seen.has(key))continue;seen.add(key);
    items.push({key,model,date,title:model.replace(/^qwen/i,'Qwen').replace(/-([a-z])/g,(_,letter)=>'-'+letter.toUpperCase())+' 发布',description:excerpt,
      url:QWEN_CHANGELOG_URL+'#'+encodeURIComponent(label),
      canonicalSourceUrl:QWEN_CHANGELOG_URL});
    if(items.length>=MAX_RECORDS)return items.sort((a,b)=>b.date.localeCompare(a.date)||a.model.localeCompare(b.model));
   }
  }
 }
 if(!items.length)throw Error('qwen_no_qualified_records');
 return items.sort((a,b)=>b.date.localeCompare(a.date)||a.model.localeCompare(b.model));
}
export function qwenOfficialItems(records,{now=Date.now(),days=14}={}){
 const windowDays=[7,14,30,90,180].includes(days)?days:14;
 return records.filter(x=>{const ts=publishedAt(x.date);return Number.isFinite(ts)&&ts<=now&&now-ts<=windowDays*86400000;}).map(x=>({
  id:'qwen-official:'+x.key,title:x.title,originalTitle:x.title,
  desc:x.description||'千问平台官方模型发布记录。',originalDesc:x.description||'千问平台官方模型发布记录。',
  url:x.url,publishedAt:x.date,extra:{
   verifiedReleaseId:x.model,aiSignal:{primarySource:'qwen-model-updates',primarySourceLabel:'千问平台官方发布',timestampKind:'calendar-date'},
   publicationEvidence:{url:x.canonicalSourceUrl,publishedAt:x.date,format:'official-changelog'},
  },
 }));
}
export async function loadQwenOfficialReleases(fetchImpl=fetch,{now=Date.now(),days=14}={}){
 let cached=cache.get(fetchImpl);
 if(cached?.at&&now-cached.at<CACHE_MS){return response(cached.records,'ok',cached.at,now,days);}
 if(cached?.failedAt&&now-cached.failedAt<60_000)return response(cached.at&&now-cached.at<STALE_MS?cached.records:[],cached.at&&now-cached.at<STALE_MS?'stale':'failed',cached.at&&now-cached.at<STALE_MS?cached.at:null,now,days);
 if(cached?.pending)return cached.pending;
 const promise=(async()=>{
  try{
   const r=await fetchImpl(QWEN_CHANGELOG_URL,{headers:{accept:'text/html'},signal:AbortSignal.timeout(6500)});
   if(!r?.ok)throw Error('qwen_http_failure');
   const bytes=Number(r.headers?.get?.('content-length'));
   if(Number.isFinite(bytes)&&bytes>MAX_BYTES)throw Error('qwen_content_too_large');
   const html=await r.text(),records=parseQwenOfficialChangelog(html,{now});
   cache.set(fetchImpl,{at:now,records});
   return response(records,'ok',now,now,days);
  }catch{
   cache.set(fetchImpl,{...cached,pending:null,failedAt:now});
   if(cached?.at&&now-cached.at<STALE_MS)return response(cached.records,'stale',cached.at,now,days);
   return response([],'failed',null,now,days);
  }
 })();
 cache.set(fetchImpl,{...cached,pending:promise});return promise;
}
function response(records,status,checkedAt,now,days){
 const data=qwenOfficialItems(records,{now,days});
 return {data,feeds:[{source:'qwen-model-updates',label:'千问平台官方发布',status,count:data.length,intake:'observing',
  checkedAt:checkedAt?new Date(checkedAt).toISOString():null,official:true}],checkedAt:checkedAt?new Date(checkedAt).toISOString():null};
}