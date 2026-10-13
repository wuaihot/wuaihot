import {AI_EDITORIAL_REPORTS} from '../src/config/ai-editorial.js';
import {applyReviewedTranslation} from '../src/utils/reviewedTranslation.js';
import {aiHasPrimarySubject,aiRefinedItem} from '../src/utils/aiContent.js';
import {AI_X_ACCOUNTS,AI_X_OPTIONS,AI_BLUESKY_ACCOUNTS,AI_BLUESKY_OPTIONS,AI_SOCIAL_ACCOUNTS,socialPlatform} from '../src/config/ai-social.js';
import {validateSocialSnapshot} from '../src/utils/aiSocialSnapshot.js';
import {mergeAiVerifiedResetEvents} from '../src/utils/aiSocialThreads.js';
// Fixed public identities. Credentials stay server-side. No arbitrary account URL input.
export {AI_X_ACCOUNTS};
// Only public, validated social snapshots use the tighter cadence. Direct X API
// requests retain their established 5-minute cache and failure backoff.
const cache=new Map(),pending=new Map(),TTL=300000,SNAPSHOT_TTL=120000,BACKOFF=900000;
const SNAPSHOT_CDN_BUCKET_MS=120000;
export function parseAiSocialPosts(payload,account,now=Date.now()) {
 return (Array.isArray(payload?.data)?payload.data:[]).slice(0,40).flatMap(post=>{
  const text=String(post.note_tweet?.text || post.text || '').trim(),date=Date.parse(post.created_at),id=String(post.id || '');
  if(!/^\d{1,24}$/.test(id) || !date || date>now || now-date>7*86400000 || !aiHasPrimarySubject({title:text}) || !aiRefinedItem({title:text}))return [];
  const item={id:account.source+':'+id,title:text.split('\n').filter(Boolean).join(' ').slice(0,260),desc:text,url:'https://x.com/'+account.username+'/status/'+id,author:account.name+' (@'+account.username+')',publishedAt:new Date(date).toISOString(),extra:{aiSignal:{primarySource:account.source,primarySourceLabel:account.name+' · X',timestampKind:'published'},intake:{channel:'official-x-api',state:'observing',observedAt:new Date(now).toISOString()}}};
  const views=Number(post.public_metrics?.impression_count);if(Number.isFinite(views)&&views>=0)item.displayMetric={kind:'views',label:'Views',value:views};return [item];
 });
}
async function readJson(url,token,fetchImpl) {
 const r=await fetchImpl(url,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(4500),redirect:'error'});
 if(!r.ok || Number(r.headers?.get('content-length'))>500000)throw Error('social_read_failed');
 const text=await r.text();if(Buffer.byteLength(text)>500000)throw Error('social_too_large');return JSON.parse(text);
}
export async function loadAiSocial(fetchImpl=fetch,env=process.env,{force=false}={}) {
 const token=String(env.AI_X_BEARER_TOKEN || '').trim(),now=Date.now();
 if(env.AI_SOCIAL_FEED_URL){
  try{
   const url=new URL(env.AI_SOCIAL_FEED_URL);if(url.protocol!=='https:'||url.username||url.password||url.port)throw Error('snapshot_url_invalid');
   const byFetcher=cache.get(fetchImpl)||new Map();cache.set(fetchImpl,byFetcher);const key='snapshot|'+url.href,old=byFetcher.get(key);
   if(!force&&old&&now-old.at<SNAPSHOT_TTL)return old.result;
   let calls=pending.get(fetchImpl);if(!calls){calls=new Map();pending.set(fetchImpl,calls);}if(calls.has(key))return await calls.get(key);
   const promise=(async()=>{try{
     // GitHub Gist raw responses use max-age=300. Reusing the exact raw URL
     // could keep a newly published 5-minute collector snapshot stale across
     // another 5-minute serverless cache window. Rotate one stable URL per
     // two-minute bucket ONLY for GitHub public Gist raw assets. Every request
     // within a bucket (including cache=false) shares the CDN key, so clients
     // cannot amplify origin traffic by inventing arbitrary cache-busters.
     const fetchUrl=new URL(url.href);
     if(fetchUrl.hostname==='gist.githubusercontent.com' && /\/raw\//.test(fetchUrl.pathname))
       fetchUrl.searchParams.set('_social_snapshot_bucket',String(Math.floor(now/SNAPSHOT_CDN_BUCKET_MS)));
     const response=await fetchImpl(fetchUrl,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000),redirect:'error'});
     if(!response.ok||Number(response.headers?.get('content-length'))>1000000)throw Error('snapshot_read_failed');
     const text=await response.text();if(Buffer.byteLength(text)>1000000)throw Error('snapshot_too_large');
     const result=validateSocialSnapshot(JSON.parse(text),Date.now());byFetcher.set(key,{at:Date.now(),result});return result;
   }finally{calls.delete(key);}})();calls.set(key,promise);return await promise;
  }catch{/* Keep the last successful publication with its real time; never invent a successful read. */
   const old=cache.get(fetchImpl)?.get('snapshot|'+String(env.AI_SOCIAL_FEED_URL));
   if(old?.result)return {...old.result,continuous:false,feeds:old.result.feeds.map(f=>({...f,status:'failed',stale:true})),data:old.result.data.map(i=>({...i,extra:{...i.extra,intake:{...i.extra.intake,stale:true}}}))};
   return {data:AI_EDITORIAL_REPORTS.filter(item=>now-Date.parse(item.publishedAt)<=7*86400000),feeds:AI_SOCIAL_ACCOUNTS.map(a=>({source:a.source,label:a.name+' · '+socialPlatform(a),status:'failed',stale:true,count:0})),mode:'snapshot-unavailable',continuous:false};
  }
 }
 if(!token){const data=AI_EDITORIAL_REPORTS.filter(item=>now-Date.parse(item.publishedAt)<=7*86400000);return {data,feeds:[{source:'ai-x-updates',status:data.length?'ok':'empty',intake:'editorial',count:data.length}],mode:'reviewed',continuous:false};}
 const results=await Promise.all(AI_X_ACCOUNTS.map(async account=>{
  // Scope cache by fetcher and credential so one deployment cannot reuse another account's access.
  let byFetcher=cache.get(fetchImpl);if(!byFetcher){byFetcher=new Map();cache.set(fetchImpl,byFetcher);}const key=token+'|'+account.username,previous=byFetcher.get(key);
  if(previous && now-previous.at<(previous.failed?BACKOFF:TTL))return previous;
  const pendingKey=key;let calls=pending.get(fetchImpl);if(!calls){calls=new Map();pending.set(fetchImpl,calls);}if(calls.has(pendingKey))return calls.get(pendingKey);
  const promise=(async()=>{try{const user=await readJson('https://api.x.com/2/users/by/username/'+account.username,token,fetchImpl),id=String(user.data?.id || '');if(!/^\d{1,24}$/.test(id))throw Error();
    const url='https://api.x.com/2/users/'+id+'/tweets?max_results=20&exclude=retweets&tweet.fields=created_at,public_metrics,note_tweet';const data=parseAiSocialPosts(await readJson(url,token,fetchImpl),account,now);
    const entry={at:now,data,account,failed:false,lastSuccessfulAt:new Date(now).toISOString()};byFetcher.set(key,entry);return entry;
   }catch{const entry={at:now,data:previous?.data || [],account,failed:true,lastSuccessfulAt:previous?.lastSuccessfulAt || ''};byFetcher.set(key,entry);return entry;}finally{calls.delete(pendingKey);}})();calls.set(pendingKey,promise);return promise;
 }));
 const data=results.flatMap(r=>r.data).filter(item=>now-Date.parse(item.publishedAt)<=7*86400000),ids=new Set(data.map(i=>i.id));
 return {data:[...data,...AI_EDITORIAL_REPORTS.filter(i=>!ids.has(i.id)&&now-Date.parse(i.publishedAt)<=7*86400000)],feeds:results.map(r=>({source:r.account.source,status:r.failed?'failed':'ok',count:r.data.length,lastSuccessfulAt:r.lastSuccessfulAt,intake:'official-x-api'})),mode:results.every(r=>!r.failed)?'api':'partial',continuous:results.some(r=>!r.failed)};
}
export async function handleAiSocial({req,res,pathValue,env=process.env,fetchImpl=fetch}) {
 if(!['ai-x-updates','ai-bluesky-updates'].includes(pathValue))return false;
 const bluesky=pathValue==='ai-bluesky-updates',accounts=bluesky?AI_BLUESKY_ACCOUNTS:AI_X_ACCOUNTS,options=bluesky?AI_BLUESKY_OPTIONS:AI_X_OPTIONS;
 if(!['GET','HEAD'].includes(req.method)){res.setHeader('allow','GET, HEAD');res.status(405).json({code:405,message:'Method not allowed'});return true;}
 if(Object.keys(req.query).some(k=>!['path','locale','translate_limit','translate_offset','translate_nonce','cache','type'].includes(k))){res.status(400).json({code:400,message:'Unsupported query'});return true;}
 const selected=String(req.query.type||'all');if(!options.some(o=>o.value===selected)){res.status(400).json({code:400,message:'Unknown person'});return true;}
 const sources=new Set(accounts.filter(a=>selected==='all'||a.username.toLowerCase()===selected).map(a=>a.source));
 const loaded=await loadAiSocial(fetchImpl,env,{force:req.query.cache==='false'}),feeds=loaded.feeds.filter(f=>sources.has(f.source));
 const result={...loaded,feeds,continuous:feeds.some(f=>f.status==='ok'&&!f.stale)&&loaded.continuous};
 const readerLocale=String(req.query.locale||'zh-CN');
 const rawData=loaded.data.filter(item=>sources.has(item.extra?.aiSignal?.primarySource)).map(item=>applyReviewedTranslation(item,readerLocale));
 const merged=bluesky?rawData.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))
   :mergeAiVerifiedResetEvents(rawData,readerLocale);
 const data=merged.map((item,index)=>({...item,rank:index+1}));
 const reviewedAt=data.reduce((last,item)=>item.extra?.editorial?.verifiedAt>last?item.extra.editorial.verifiedAt:last,'');
 res.setHeader('cache-control','public,max-age=30,stale-while-revalidate=60');res.status(200).json({...result,code:200,name:pathValue,title:bluesky?'AI 人物 · Bluesky':'AI 人物 · X',type:options.find(o=>o.value===selected).label,description:result.mode==='snapshot'?'公开原帖自动采集，AI 辅助筛选提炼；员工发言、作者观点与官方公告分别标注。':'连续采集未配置或不可用，已核验摘录不代表完整时间线。',link:bluesky?'https://bsky.app/profile/simonwillison.net':'https://x.com/thsottiaux',updateTime:result.generatedAt||reviewedAt,total:data.length,originalPostCount:rawData.length,selectedType:selected,params:{type:{name:'人物 / 账号',type:Object.fromEntries(options.map(o=>[o.value,o.label]))}},data});return true;
}
