import { AI_VENDOR_MODELS, AI_EXTRA_PUBLICATIONS, AI_PEOPLE, AI_INTAKE_OPTIONS } from '../src/config/ai-intake.js';
import { parseAiPublications } from './_ai-publications.js';
import {loadAiSocial} from './_ai-social.js';
import {parseAiOfficialPage} from './_ai-official-pages.js';
import { aiCanonicalUrl, aiHasPrimarySubject } from '../src/utils/aiContent.js';
import { aiTime } from '../src/utils/aiTime.js';
const CACHE_MS=300000,MAX_BYTES=2000000,cache=new WeakMap();
const REDDIT_STALE_MS=15*60000,redditLastGood=new WeakMap();
export function aiRankingQueryError(query={}) {
  if(Object.keys(query).some(k=>!['path','type','locale','cache','translate_limit','translate_offset','translate_nonce'].includes(k)))return 'Unsupported query';
  if(query.cache!==undefined && !['true','false'].includes(String(query.cache)))return 'Invalid cache preference';
  for(const [key,max] of [['translate_limit',1000],['translate_offset',100000]])if(query[key]!==undefined && (!/^\d{1,6}$/.test(String(query[key])) || Number(query[key])>max))return 'Invalid translation window';
  if(query.translate_nonce!==undefined && !/^[\w-]{1,80}$/.test(String(query.translate_nonce)))return 'Invalid translation nonce';
  if(query.locale!==undefined && !/^[a-zA-Z][a-zA-Z0-9-]{0,34}$/.test(String(query.locale)))return 'Invalid locale';
  return '';
}
export async function readAiInput(url,fetchImpl=fetch,json=false,options={}) {
  const response=await fetchImpl(url,{headers:{Accept:json?'application/json':'application/rss+xml, application/atom+xml, text/plain','User-Agent':'wuaihot-public-intelligence/1.0',...(options.headers||{})},signal:AbortSignal.timeout(options.timeout||5000)});
  if(!response.ok || Number(response.headers?.get('content-length'))>MAX_BYTES)throw Error('input_unavailable');
  let text='';
  if(response.body?.getReader){
    const reader=response.body.getReader(),decoder=new TextDecoder();let bytes=0;
    try {while(true){const c=await reader.read();if(c.done)break;bytes+=c.value.byteLength;if(bytes>MAX_BYTES)throw Error('input_too_large');text+=decoder.decode(c.value,{stream:true});}text+=decoder.decode();}finally{await reader.cancel().catch(()=>{});}
  }else {text=await response.text();if(Buffer.byteLength(text)>MAX_BYTES)throw Error('input_too_large');}
  return json?JSON.parse(text):text;
}
export async function cachedAiInput(key,loader,fetchImpl=fetch,ttl=CACHE_MS) {
  let map=cache.get(fetchImpl);if(!map){map=new Map();cache.set(fetchImpl,map);}
  const previous=map.get(key);if(previous && Date.now()-previous.at<ttl)return previous.promise;
  const entry={at:Date.now(),promise:Promise.resolve().then(loader)};map.set(key,entry);
  entry.promise.catch(()=>{if(map.get(key)===entry)map.delete(key);});if(map.size>80)map.delete(map.keys().next().value);
  return entry.promise;
}
export function projectVendorModels(rows,vendor,now=Date.now()) {
  if(!Array.isArray(rows))throw Error('invalid_models');
  return rows.flatMap(row=>{
    const id=String(row.id||'');if(row.private || !id.startsWith(vendor.org+'/') || !/^[\w./-]+$/.test(id))return [];
    const created=aiTime(row.createdAt,now);if(!created || /(?:GGUF|GPTQ|AWQ|fp8|onnx|mlx|checkpoint|test|internal)(?:[-_/]|$)/iu.test(id))return [];
    const url='https://huggingface.co/'+id;
    return [{id:'ai-vendor:'+id,title:id.split('/').slice(1).join('/')+' · 官方模型仓库',url,createdAt:new Date(created).toISOString(),
      desc:vendor.name+' 官方组织新建的模型仓库。仓库创建时间不等于正式发布日期；模型卡、许可证及使用方式见原文。',author:vendor.name,
      extra:{aiSignal:{primarySource:'ai-vendor-'+vendor.key,primarySourceLabel:vendor.name,kind:'model'},
        intake:{state:'observing',transport:'official-hub',entity:vendor.org},modelRepository:{createdAt:new Date(created).toISOString(),pipeline:row.pipeline_tag || '',tags:(row.tags||[]).filter(t=>/^license:/.test(t)).slice(0,2)}}}];
  }).slice(0,12);
}
export function projectBlueskyPosts(payload,person,now=Date.now()) {
  if(!Array.isArray(payload?.feed))throw Error('invalid_author_feed');
  return payload.feed.flatMap(row=>{
    const p=row.post,record=p?.record,uri=String(p?.uri||'');
    if(row.reason || record?.reply || p?.author?.handle!==person.actor || record?.$type!=='app.bsky.feed.post' || !/^at:\/\/did:[^/]+\/app.bsky.feed.post\/[\w]+$/.test(uri))return [];
    const text=String(record.text||'').trim(),published=aiTime(record.createdAt,now);
    if(!text || !published || !aiHasPrimarySubject({title:text.split('\n')[0].slice(0,160),desc:text}))return [];
    const url=person.url+'/post/'+uri.split('/').pop();
    return [{id:'ai-person:'+uri,title:text.split('\n')[0].slice(0,160),desc:text.slice(0,1000),url,publishedAt:new Date(published).toISOString(),author:p.author.displayName || person.name,
      displayMetric:Number.isFinite(p.likeCount)?{kind:'likes',value:p.likeCount}:undefined,
      extra:{aiSignal:{primarySource:person.key,primarySourceLabel:person.name,timestampKind:'published'},
        intake:{state:'observing',transport:'public-bluesky',identity:person.identity},socialPost:{uri,authorDid:p.author.did,comments:p.replyCount,claimScope:'personal'}}}];
  }).slice(0,20);
}
const itemOfPublication=p=>({id:'ai-input:'+p.url,title:p.title,desc:p.desc,url:p.url,publishedAt:p.publishedAt,
  extra:{aiSignal:{primarySource:p.source,primarySourceLabel:p.sourceLabel,timestampKind:'published'},publicationEvidence:{url:p.feedUrl,publishedAt:p.publishedAt,format:p.format || 'RSS'},intake:{state:'observing',transport:'first-party-publication'}}});
export async function loadAiIntake(fetchImpl=fetch,{type='all',force=false,env=process.env}={}) {
  if(type==='simon-bluesky'&&env.AI_SOCIAL_FEED_URL){const social=await loadAiSocial(fetchImpl,env,{force}),data=social.data.filter(i=>i.extra?.aiSignal?.primarySource==='simon-bluesky');return {...social,code:200,name:'ai-official-intake',title:'AI 一手动态',selectedType:type,type:'Simon Willison · Bluesky',data,total:data.length,feeds:social.feeds.filter(f=>f.source==='simon-bluesky'),params:{type:{name:'来源',type:Object.fromEntries(AI_INTAKE_OPTIONS.map(o=>[o.value,o.label]))}}};}
  const definitions=[...AI_EXTRA_PUBLICATIONS.map(f=>({...f,kind:'rss'})),...AI_VENDOR_MODELS.map(f=>({...f,kind:'models'})),...AI_PEOPLE.filter(()=>type!=='all'||!env.AI_SOCIAL_FEED_URL).map(f=>({...f,kind:'social'}))].filter(f=>type==='all'||f.key===type);
  if(!definitions.length)throw Error('invalid_type');
  const results=await Promise.allSettled(definitions.map(f=>cachedAiInput(f.key,async()=>{
    if(f.kind==='rss') {
      const text=await readAiInput(f.url,fetchImpl),parse=f.parser?parseAiOfficialPage:parseAiPublications;
      return {checkedAt:new Date().toISOString(),items:parse(text,f).map(itemOfPublication).filter(i=>['simon-blog','chip-blog'].includes(f.source)?aiHasPrimarySubject(i):true).slice(0,30)};
    }
    if(f.kind==='models')return {checkedAt:new Date().toISOString(),items:projectVendorModels(await readAiInput('https://huggingface.co/api/models?author='+encodeURIComponent(f.org)+'&sort=createdAt&direction=-1&limit=20',fetchImpl,true),f)};
    return {checkedAt:new Date().toISOString(),items:projectBlueskyPosts(await readAiInput('https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor='+encodeURIComponent(f.actor)+'&filter=posts_no_replies&limit=30',fetchImpl,true),f)};
  },fetchImpl,force?0:CACHE_MS)));
  const feeds=definitions.map((f,i)=>({source:f.kind==='models'?'ai-vendor-'+f.key:f.source||f.key,label:f.name,variant:f.key,intake:'observing',status:results[i].status==='rejected'?'failed':results[i].value.items.length?'ok':'empty',count:results[i].status==='fulfilled'?results[i].value.items.length:0,checkedAt:results[i].status==='fulfilled'?results[i].value.checkedAt:''}));
  const data=results.flatMap(r=>r.status==='fulfilled'?r.value.items:[]).sort((a,b)=>Date.parse(b.publishedAt||b.createdAt)-Date.parse(a.publishedAt||a.createdAt));
  return {code:200,name:'ai-official-intake',title:'AI 一手动态',type:AI_INTAKE_OPTIONS.find(o=>o.value===type)?.label,selectedType:type,
    description:'官方公告、官方模型仓库与有身份依据的作者原文；仓库创建与正式发布分别标注。',link:'/topic/ai',data,feeds,total:data.length,updateTime:new Date().toISOString(),params:{type:{name:'来源',type:Object.fromEntries(AI_INTAKE_OPTIONS.map(o=>[o.value,o.label]))}}};
}
export async function handleAiIntake({req,res,pathValue,fetchImpl=fetch}) {
  if(pathValue!=='ai-official-intake')return false;
  const fail=(code,message)=>{res.setHeader('cache-control','no-store');res.status(code).json({code,message});return true;};
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('allow','GET, HEAD');return fail(405,'Method not allowed');}
  const queryError=aiRankingQueryError(req.query);if(queryError)return fail(400,queryError);
  const type=String(req.query.type||'all');if(!AI_INTAKE_OPTIONS.some(o=>o.value===type))return fail(400,'Unknown source');
  const force=String(req.query.cache)==='false',payload=await loadAiIntake(fetchImpl,{type,force});
  const status=payload.feeds.every(f=>f.status==='failed')?503:200;
  res.setHeader('cache-control',status===200 && !force?'public, max-age=30, stale-while-revalidate=60':'no-store');res.status(status).json({...payload,code:status});return true;
}
export async function loadAiReddit(fetchImpl=fetch,env=process.env) {
  const base=String(env.INTERNAL_API_BASE_URL||env.INTERNAL_API_FALLBACK_BASE_URL||'').replace(/\/+$/,'');
  const names=[['reddit-localllama','Reddit · LocalLLaMA'],['reddit-machinelearning','Reddit · MachineLearning'],['reddit-artificial','Reddit · artificial']];
  let previous=redditLastGood.get(fetchImpl);
  if(!previous){previous=new Map();redditLastGood.set(fetchImpl,previous);}
  const outcomes=await Promise.allSettled(names.map(async ([source])=>{
    const key='reddit:'+base+':'+String(env.INTERNAL_API_FALLBACK_BASE_URL||'')+':'+source;
    try {
      const entry=await cachedAiInput(key,async()=>{
        const payload=await readAiProvider(source,fetchImpl,env,3500);
        if(payload.code!==200 || !Array.isArray(payload.data))throw Error('invalid_community');
        return {payload,checkedAt:new Date(Date.now()).toISOString()};
      },fetchImpl);
      const at=Date.parse(entry.checkedAt);
      if(Number.isFinite(at)&&(!previous.has(key)||at>previous.get(key).at))previous.set(key,{at,entry});
      return {...entry,stale:false};
    }catch(error){
      const fallback=previous.get(key);
      if(fallback&&Date.now()>=fallback.at&&Date.now()-fallback.at<=REDDIT_STALE_MS)
        return {...fallback.entry,stale:true};
      throw error;
    }
  }));
  const feeds=[],data=[];
  outcomes.forEach((result,i)=>{
    const [source,label]=names[i];
    if(result.status!=='fulfilled'){feeds.push({source,label,status:'failed',count:0});return;}
    const {payload,checkedAt,stale}=result.value;
    const items=payload.data.flatMap(item=>{
      const url=aiCanonicalUrl(item.url);if(!url || new URL(url).hostname!=='www.reddit.com' || !url.includes('/comments/'))return [];
      // This fixed RSS adapter's timestamp is its RSS pubDate field; never infer dates from ranking positions.
      const published=aiTime(item.publishedAt || item.timestamp);
      return [{...item,id:'ai-reddit:'+url,publishedAt:published?new Date(published).toISOString():undefined,
        extra:{...item.extra,aiSignal:{primarySource:source,primarySourceLabel:label,timestampKind:published?'published':undefined},intake:{state:'observing',transport:'public-provider-rss',...(stale?{stale:true,lastSuccessfulAt:checkedAt}:{})},discovery:{source,variant:'',dataKind:'feed',snapshotUpdatedAt:payload.updateTime || ''}}}];
    });
    data.push(...items);feeds.push({source,label,status:stale?'stale':items.length?'ok':'empty',count:items.length,updateTime:payload.updateTime,checkedAt,...(stale?{stale:true,lastSuccessfulAt:checkedAt}:{})});
  });return {data,feeds};
}
export async function readAiProvider(path,fetchImpl=fetch,env=process.env,timeout=8000) {
  const bases=[env.INTERNAL_API_FALLBACK_BASE_URL,env.INTERNAL_API_BASE_URL].filter(Boolean);
  if(!bases.length)throw Error('provider_not_configured');
  for(const base of [...new Set(bases)]) {
    const origin=new URL(base);if(!['http:','https:'].includes(origin.protocol))continue;
    try {
      const headers=base===env.INTERNAL_API_BASE_URL && env.INTERNAL_PROXY_TOKEN?{'X-Internal-Proxy-Token':env.INTERNAL_PROXY_TOKEN}:{};
      const payload=await readAiInput(String(base).replace(/\/+$/,'')+'/'+path,fetchImpl,true,{headers,timeout});
      if(payload.code!==200 || !Array.isArray(payload.data))throw Error('invalid_provider');return payload;
    }catch{}
  }throw Error('provider_unavailable');
}
