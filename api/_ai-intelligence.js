import { loadAiIntake, loadAiReddit } from "./_ai-intake.js";
import { aiStatusDetails } from '../src/utils/aiServiceStatus.js';
import {loadAiSocial} from './_ai-social.js';
import {mergeAiVerifiedResetEvents} from '../src/utils/aiSocialThreads.js';
import {applyReviewedTranslation} from '../src/utils/reviewedTranslation.js';
import { getCatalogEndpoint } from "./_trends-catalog.js";
import { matchAiContent, aiCanonicalUrl } from "../src/utils/aiContent.js";
import { loadAiPublications, recentAiPublicationItems, compactAiPublicationIndex } from "./_ai-publications.js";
import {loadQwenOfficialReleases} from "./_ai-qwen-official.js";

const CACHE_MS = 300000, BATCH_SIZE = 16, CONCURRENCY = 8;
const candidateCache = new Map(), snapshotCache = new Map(), inflight = new Map();
const COMMUNITY = new Set(["tieba","hackernews","hackernews-ai","reddit-localllama","juejin","csdn","linuxdo","v2ex","stackoverflow","hostloc","nodeseek","hellogithub","ngabbs","newsmth","hatena-hot"]);
const PRIORITY = ["linuxdo","v2ex","tieba","hackernews","weibo","ithome","baidu","36kr","qq-news","sina","sina-news","cls","zhihu","bilibili","juejin","wallstreetcn"];
const value = v => String(Array.isArray(v) ? v[0] || "" : v || "");
async function cached(key,loader,ttl=CACHE_MS) {
  const existing=snapshotCache.get(key);
  if (existing && Date.now()-existing.at<ttl) return existing;
  if (inflight.has(key)) return inflight.get(key);
  const promise=(async()=>{const data=await loader(); const entry={at:Date.now(),data};snapshotCache.set(key,entry);if(snapshotCache.size>1024)snapshotCache.delete(snapshotCache.keys().next().value);return entry})();
  inflight.set(key,promise);
  try {return await promise} finally {inflight.delete(key)}
}
async function readJson(url,fetchImpl,timeout=4500) {
  const response=await fetchImpl(url,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(timeout)});
  if (!response.ok) throw new Error("public_read_unavailable");
  return response.json();
}
export function buildAiDiscoveryTargets(catalog,surface,endpoint) {
  if (!Array.isArray(catalog?.sources)) return [];
  const targets=[];
  for (const source of catalog.sources) {
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(source.key || "")) continue;
    if (!(source.hotspotEligible || ["feed","flash","official_release"].includes(source.dataKind) || COMMUNITY.has(source.key))) continue;
    const options=(source.variantGroups||[]).flatMap(g=>g.options||[]).filter(o=>!o.runtimeAvailability || o.runtimeAvailability==="available");
    const defaultVariant=source.defaultVariant || options[0]?.key || "";
    const taskVariants={v2ex:['hot'],hackernews:['hot','best','new','show','ask'],linuxdo:['daily'],github:['day'],huggingface:['blog','papers'],openai:['news','research'],anthropic:['news']}[source.key] || [];
    const variants=[defaultVariant,...options.filter(o=>taskVariants.includes(o.key)).map(o=>o.key),...(source.variantSelectorEnabled===false?[]:options.filter(o=>/^(tech|ai|news|finance|science|developer)(-|$)|^cs-ai$|^hot-ai/iu.test(o.key)).map(o=>o.key))].filter((v,i,a)=>a.indexOf(v)===i).slice(0,source.key==='hackernews'?5:4);
    for (const variant of variants) {
      const option=options.find(o=>o.key===variant);
      targets.push({source:source.key,name:source.name,category:source.category,surface,endpoint,variant,label:option?.label || source.rankingLabel || "",dataKind:option?.dataKind || source.dataKind});
    }
  }
  return targets;
}
async function candidates(env,fetchImpl) {
  const endpoints=["display","public"].map(surface=>({surface,endpoint:getCatalogEndpoint(surface,env)})).filter(e=>e.endpoint);
  if (!endpoints.length) throw new Error("provider_not_configured");
  for(const {endpoint} of endpoints) if(!["http:","https:"].includes(new URL(endpoint).protocol)) throw new Error("provider_not_configured");
  const key=endpoints.map(e=>e.endpoint).join("|");
  const previous=candidateCache.get(key);
  if(previous && Date.now()-previous.at<CACHE_MS)return previous;
  const results=await Promise.allSettled(endpoints.map(async e=>({ ...e,catalog:await readJson(e.endpoint,fetchImpl,3500)})));
  const seen=new Set(),targets=[];
  let failedSurfaces=0;
  for(const result of results) {
    if(result.status!=="fulfilled"){failedSurfaces++;continue}
    const {surface,endpoint,catalog}=result.value;
    for(const target of buildAiDiscoveryTargets(catalog,surface,endpoint)) {
      const identity=target.source+"|"+target.variant;if(seen.has(identity))continue;
      seen.add(identity);targets.push(target);
    }
  }
  if(!targets.length)throw new Error("catalog_unavailable");
  targets.sort((a,b)=>{
    const priority=t=>{const at=PRIORITY.indexOf(t.source);return at<0?100:at};
    return priority(a)-priority(b) || a.source.localeCompare(b.source) || a.variant.localeCompare(b.variant);
  });
  const version=targets.map(t=>t.source+":"+t.variant).join("|");
  let hash=2166136261; for(const c of version)hash=Math.imul(hash^c.charCodeAt(0),16777619);
  const entry={at:Date.now(),targets,revision:(hash>>>0).toString(36),failedSurfaces};
  candidateCache.set(key,entry);return entry;
}
export function projectAiDiscoveredItem(item,target,payload,fetchedAt) {
  // A verified AI research feed is relevant even when its paper title omits AI brands.
  const reason=matchAiContent(item) || (target.source==='arxiv-ai' ? 'AI research' : ''),url=aiCanonicalUrl(item?.url);
  if(!reason||!url||!String(item?.title||"").trim())return null;
  const rank=Number(item.rank),rankingLabel=payload.data?.rankingLabel || target.label;
  return {...item,id:"ai-discovery:"+target.source+":"+target.variant+":"+url,url,desc:item.summary || item.desc || "",
    extra:{aiSignal:{primarySource:target.source,primarySourceLabel:target.name,primaryRank:Number.isSafeInteger(rank)&&rank>0?rank:null,
      kind:"other",fetchedAt:new Date(fetchedAt).toISOString(),confirmations:[{source:target.source,sourceLabel:target.name,title:item.title,url}]},
      discovery:{source:target.source,variant:target.variant,category:target.category,rankingLabel,dataKind:payload.data?.dataKind || target.dataKind,
        reason,originalRank:Number.isSafeInteger(rank)&&rank>0?rank:null,snapshotUpdatedAt:payload.data?.updatedAt || "",surface:target.surface}}};
}
async function discoverBatch(plan,cursor,fetchImpl) {
  const batch=plan.targets.slice(cursor,cursor+BATCH_SIZE),data=[],feeds=[];
  let index=0;
  await Promise.all(Array.from({length:Math.min(CONCURRENCY,batch.length)},async()=>{
    while(index<batch.length) {
      const target=batch[index++],url=new URL(target.endpoint.replace(/\/catalog$/, "/rankings/")+encodeURIComponent(target.source));
      url.searchParams.set("limit","100");if(target.variant)url.searchParams.set("variant",target.variant);
      try {
        const entry=await cached(url.href,async()=>{
          const payload=await readJson(url,fetchImpl,4000);
          if(!payload?.data?.source || !Array.isArray(payload.data.items))throw new Error("invalid_ranking");
          return payload;
        });
        const items=entry.data.data.items.slice(0,100).map(item=>projectAiDiscoveredItem(item,target,entry.data,entry.at)).filter(Boolean);
        data.push(...items);
        feeds.push({source:target.source,label:target.name,variant:target.variant,rankingLabel:target.label,status:entry.data.data.items.length?"ok":"empty",count:items.length,inspected:entry.data.data.items.length,updateTime:entry.data.data.updatedAt || "",cached:Date.now()-entry.at>1000});
      }catch {feeds.push({source:target.source,label:target.name,variant:target.variant,rankingLabel:target.label,status:"failed",count:0,inspected:0})}
    }
  }));
  return {data,feeds,next:cursor+batch.length<plan.targets.length?cursor+batch.length:null};
}
const OFFICIAL_FEEDS=[
  {key:"codex-releases",name:"Codex",url:"https://github.com/openai/codex/releases.atom",home:"https://github.com/openai/codex/releases",kind:"release"},
  {key:"claude-code-releases",name:"Claude Code",url:"https://github.com/anthropics/claude-code/releases.atom",home:"https://github.com/anthropics/claude-code/releases",kind:"release"},
  {key:"openai-status",name:"OpenAI",url:"https://status.openai.com/api/v2/summary.json",home:"https://status.openai.com/",kind:"status"},
  {key:"claude-status",name:"Claude",url:"https://status.claude.com/api/v2/summary.json",home:"https://status.claude.com/",kind:"status"},
];
const decodeXml=text=>String(text||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&#(x[\da-f]+|\d+);/gi,(_,n)=>{const cp=n[0].toLowerCase()==="x"?parseInt(n.slice(1),16):Number(n);return cp>0&&cp<=0x10ffff?String.fromCodePoint(cp):""}).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&");
const plain=text=>decodeXml(decodeXml(text)).replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
export function parseAiReleaseAtom(xml,feed) {
  if(typeof xml!=="string" || xml.length>1000000 || !/<feed\b/i.test(xml))throw new Error("invalid_atom");
  return [...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/g)].flatMap(([,entry])=>{
    const field=tag=>entry.match(new RegExp("<"+tag+"\\b[^>]*>([\\s\\S]*?)<\\/"+tag+">"))?.[1] || "";
    const version=plain(field("title"));
    if(!version || /alpha|beta|preview|rc[.\d-]/iu.test(version))return [];
    const links=[...entry.matchAll(/<link\b([^>]+)>/g)];
    const attrs=links.find(([,a])=>/rel=["']alternate["']/.test(a))?.[1] || links[0]?.[1] || "";
    const url=aiCanonicalUrl(decodeXml(attrs.match(/href=["']([^"']+)["']/)?.[1]));
    if(!url || !url.startsWith(feed.home+"/tag/"))return [];
    const updated=plain(field("updated")), publishedAt=plain(field("published"));
    return [{id:feed.key+":"+url,title:feed.name+" "+version.replace(/^rust-v(?=\d)/u,"v"),desc:plain(field("content")||field("summary")).slice(0,280),url,updatedAt:updated,publishedAt,
      extra:{aiSignal:{primarySource:feed.key,primarySourceLabel:feed.name+" Releases",kind:"developer",timestampKind:"updated",updatedAt:updated,
        confirmations:[{source:feed.key,sourceLabel:feed.name+" Releases",title:feed.name+" "+version,url}]},intake:{state:"observing",transport:"official-atom"}}}];
  }).slice(0,3);
}
async function signals(fetchImpl,kind="all") {
  const data=[],statuses=[],feeds=[];
  await Promise.all(OFFICIAL_FEEDS.filter(feed=>kind==="all" || feed.kind===kind).map(async feed=>{
    try {
      const entry=await cached(feed.url,async()=>{
        if(feed.kind==="status")return readJson(feed.url,fetchImpl);
        const r=await fetchImpl(feed.url,{headers:{Accept:"application/atom+xml"},signal:AbortSignal.timeout(4500)});
        if(!r.ok)throw new Error("release_read_failed");return parseAiReleaseAtom(await r.text(),feed);
      },feed.kind==="status"?60000:CACHE_MS);
      if(feed.kind==="release")data.push(...entry.data);
      else if(entry.data?.status?.indicator)statuses.push({source:feed.key,name:feed.name,url:feed.home,indicator:entry.data.status.indicator,description:entry.data.status.description,
        checkedAt:new Date(entry.at).toISOString(),updatedAt:entry.data.page?.updated_at || "",incidents:Array.isArray(entry.data.incidents)?entry.data.incidents.length:0,...aiStatusDetails(entry.data)});
      else throw new Error("invalid_status");
      feeds.push({source:feed.key,label:feed.name,status:feed.kind==="release"&&!entry.data.length?"empty":"ok",count:feed.kind==="release"?entry.data.length:1,intake:"observing"});
    }catch {feeds.push({source:feed.key,label:feed.name,status:"failed",count:0,intake:"observing"})}
  }));
  return {data,statuses,feeds};
}
export async function handleAiIntelligence({req,res,pathValue,env=process.env,fetchImpl=fetch}) {
  if(!["ai-discovery","ai-tools","ai-status","ai-qwen-official"].includes(pathValue))return false;
  const fail=(code,message)=>{res.setHeader("cache-control","no-store");res.status(code).json({code,message});return true};
  if(!["GET","HEAD"].includes(req.method)){res.setHeader("allow","GET, HEAD");return fail(405,"Method not allowed")}
  if(Object.keys(req.query).some(k=>!(pathValue==="ai-qwen-official"?["path","days"]:pathValue==="ai-tools"?["path","locale"]:["path","cursor","revision"]).includes(k)))return fail(400,"Unsupported query");
  try {
    if(pathValue==="ai-qwen-official") {
      const raw=value(req.query.days)||"14";if(!["7","14","30","90","180"].includes(raw))return fail(400,"Unsupported time window");
      const payload=await loadQwenOfficialReleases(fetchImpl,{days:Number(raw)});
      res.setHeader("cache-control","public, max-age=60, stale-while-revalidate=120");
      res.status(200).json({code:200,...payload,source:"qwen-model-updates",scope:"official-qwen-models-only"});return true;
    }
    if(pathValue==="ai-status") {
      const payload=await signals(fetchImpl,"status");
      res.setHeader("cache-control","public, max-age=20, stale-while-revalidate=40");
      res.status(200).json({code:200,...payload,checkedAt:new Date().toISOString()});return true;
    }
    if(pathValue==="ai-tools") {
      const readerLocale=value(req.query.locale)||'zh-CN';
      if(!['zh-CN','zh-TW','en','ja','ko'].includes(readerLocale))return fail(400,'Unsupported locale');
      const [payload, publicationIndex, intake, reddit,social,qwen]=await Promise.all([signals(fetchImpl,"release"),loadAiPublications(fetchImpl),loadAiIntake(fetchImpl),loadAiReddit(fetchImpl,env),loadAiSocial(fetchImpl,env),loadQwenOfficialReleases(fetchImpl)]);
      // Match ai-x-updates' server-confirmed event projection. The snapshot
      // remains the only source of truth; no second reader-side guesswork.
      const socialEvents=mergeAiVerifiedResetEvents(social.data.map(item=>applyReviewedTranslation(item,readerLocale)),readerLocale);
      res.setHeader("cache-control","public, max-age=30, stale-while-revalidate=60");res.status(200).json({code:200,...payload,feeds:[...payload.feeds,...intake.feeds,...reddit.feeds,...social.feeds,...qwen.feeds],data:[...payload.data,...intake.data.filter(item=>item.createdAt || !item.publishedAt || Date.now()-Date.parse(item.publishedAt)<=7*86400000),...reddit.data,...recentAiPublicationItems(publicationIndex.publications),...qwen.data,...socialEvents],socialOriginalPostCount:social.data.length,socialEventCount:socialEvents.length,...publicationIndex,publications:compactAiPublicationIndex(publicationIndex.publications)});return true;
    }
    const raw=value(req.query.cursor)||"0";
    if(!/^\d{1,5}$/.test(raw))return fail(400,"Invalid cursor");
    const cursor=Number(raw),plan=await candidates(env,fetchImpl);
    if(value(req.query.revision)&&value(req.query.revision)!==plan.revision)return fail(409,"Catalog changed; restart discovery");
    if(cursor>plan.targets.length)return fail(400,"Invalid cursor");
    const batch=await discoverBatch(plan,cursor,fetchImpl);
    res.setHeader("cache-control","public, max-age=30, stale-while-revalidate=60");
    res.status(200).json({code:200,...batch,coverage:{checked:Math.min(cursor+BATCH_SIZE,plan.targets.length),total:plan.targets.length,revision:plan.revision,failedSurfaces:plan.failedSurfaces,
      scope:"default-and-related-readable-variants",perRankingLimit:100},updateTime:new Date().toISOString()});return true;
  }catch {return fail(503,"AI discovery temporarily unavailable")}
}
