#!/usr/bin/env node
import {readFile,writeFile,mkdir,rename,unlink,open,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {AI_SOCIAL_ACCOUNTS,socialPlatform,socialChannel} from '../src/config/ai-social.js';
import {aiHasPrimarySubject} from '../src/utils/aiContent.js';
import {conciseAiAuthorHeadline} from '../src/utils/aiHeadlinePresentation.js';
import {publicProfilePosts,isThinSocialAnnouncement,expandResetAnnouncementThreads} from './lib/ai-social-profile.mjs';
import {implicitAiResetCandidate} from '../src/utils/aiSocialSeries.js';
import {analyzeSocialBatch,socialContentHash,validateSocialAnalysis,sourceBackedResetAnalysis} from './lib/ai-social-analysis.mjs';
import {selectSocialAnalysisQueue} from './lib/ai-social-queue.mjs';

import {collectBluesky,checkBlueskyOriginal} from './lib/ai-social-bluesky.mjs';
import {recordObservation,updateOriginalState} from './lib/ai-social-observation.mjs';

async function readXPage(url){
  const response=await fetch(url,{headers:{Accept:'text/html','User-Agent':'wuaihot-public-intelligence/1.0'},signal:AbortSignal.timeout(20000),redirect:'error'});
  if(!response.ok)throw Error('profile_http_'+response.status);
  let html='',size=0;const decoder=new TextDecoder();for await(const c of response.body){size+=c.length;if(size>2*1024*1024)throw Error('profile_too_large');html+=decoder.decode(c,{stream:true});}return html+decoder.decode();
}
const args=process.argv.slice(2),arg=(k,fallback)=>{const i=args.indexOf(k);return i<0?fallback:args[i+1];};
const statePath=resolve(arg('--state','./.local/ai-social/state.json')),outputPath=resolve(arg('--output','./.local/ai-social/feed.json'));
const providerPath=arg('--provider-config',''),gistId=arg('--gist',''),accounts=AI_SOCIAL_ACCOUNTS.filter(a=>!arg('--accounts','')||arg('--accounts','').split(',').includes(a.username));
const now=Date.now(),timestamp=new Date(now).toISOString(),lockPath=statePath+'.lock';
const save=async(path,data)=>{await mkdir(dirname(path),{recursive:true});const temp=path+'.tmp';await writeFile(temp,JSON.stringify(data,null,2),{mode:0o600});await rename(temp,path);};
await mkdir(dirname(statePath),{recursive:true});
let lock;
try{lock=await open(lockPath,'wx',0o600);await lock.writeFile(JSON.stringify({pid:process.pid,at:now}));}
catch{
  let stale=false;try{const old=JSON.parse(await readFile(lockPath,'utf8'));if(!Number.isSafeInteger(old.pid)||old.pid<=0)throw Error();try{process.kill(old.pid,0);}catch{stale=true;}}catch{stale=now-(await stat(lockPath)).mtimeMs>300000;}
  if(!stale){console.log('AI_SOCIAL_COLLECTOR_BUSY');process.exit(0);}await unlink(lockPath);lock=await open(lockPath,'wx',0o600);await lock.writeFile(JSON.stringify({pid:process.pid,at:now}));
}
try{
  let state;try{state=JSON.parse(await readFile(statePath,'utf8'));}catch{state={records:{},feeds:{},runs:0};}
  let provider;
  if(providerPath){const config=JSON.parse(await readFile(providerPath,'utf8')),p=config.models?.providers?.minimax||config;
    const raw=p.apiKey||config.env?.MINIMAX_API_KEY||process.env.MINIMAX_API_KEY;
    const apiKey=String(raw||'').replace(/^\$\{([A-Z_]+)\}$/,(_,key)=>process.env[key]||config.env?.[key]||'');
    if(apiKey)provider={apiKey,baseUrl:p.baseUrl||'https://api.minimaxi.com/anthropic',model:p.model||p.models?.[0]?.id||'MiniMax-M2.7'};
  }
  const changed=[];let withdrawn=0;
  for(const account of accounts){
    const previous=state.feeds[account.source]||{},backoff=Math.min(3600000,300000*Math.pow(2,Math.min(previous.failures||0,4)));
    if(previous.status==='failed'&&now-Date.parse(previous.lastAttemptAt)<backoff)continue;
    try{
      const profilePosts=account.platform==='bluesky'?await collectBluesky(account,now):publicProfilePosts(await readXPage('https://x.com/'+account.username),account,now);
      if(account.platform!=='bluesky'&&!profilePosts.length)throw Error('profile_has_no_verified_posts');
      const expanded=account.platform==='bluesky'
        ? {posts:profilePosts,checked:0,failures:0}
        : await expandResetAnnouncementThreads(profilePosts,account,readXPage,now);
      const posts=expanded.posts;
      let relevant=0,sourceChanged=0;
      for(const item of posts){
        if(!(aiHasPrimarySubject({title:item.originalDesc,desc:item.extra.socialPost.quoted?.text||''}) || implicitAiResetCandidate(item,account)) || isThinSocialAnnouncement(item.originalDesc)){delete state.records[item.id];continue;}
        relevant++; const hash=socialContentHash(item),old=state.records[item.id];
        if(old?.hash===hash&&old.item.extra.socialPost.originalCheckedAt)item.extra.socialPost={...item.extra.socialPost,originalCheckedAt:old.item.extra.socialPost.originalCheckedAt,originalState:old.item.extra.socialPost.originalState};
        let analysis=old?.hash===hash?old.analysis:null;
        if(analysis){try{validateSocialAnalysis([{id:item.id,...analysis}],[item]);}catch{analysis=null;old.nextAnalyzeAt=0;}}
        // A verified, narrowly defined first-party reset notice must not be
        // silently discarded by a model's "vague announcement" false negative.
        // The source rule uses only the original post, passes the same evidence
        // validator, and never claims that a future reset is already complete.
        const sourceRule=sourceBackedResetAnalysis(item,account);
        if(sourceRule&&(!analysis||analysis.keep===false))
          analysis={...sourceRule,model:'source-backed-reset-v1',processedAt:timestamp};
        const nextAnalyzeAt=old?.hash===hash?old.nextAnalyzeAt||0:0,analysisFailures=old?.hash===hash?old.analysisFailures||0:0;
        if(!old||old.hash!==hash)sourceChanged++;
        state.records[item.id]={...old,item,hash,analysis,nextAnalyzeAt,analysisFailures};if(!analysis&&now>=nextAnalyzeAt)changed.push(item);
      }
      state.feeds[account.source]={source:account.source,label:account.name+' · '+socialPlatform(account),sourceAccount:account.username,status:'ok',failures:0,lastAttemptAt:timestamp,lastSuccessfulAt:new Date().toISOString(),intake:socialChannel(account),coverage:account.username==='thsottiaux'
        ? expanded.failures?'public-profile-window;thread-partial':expanded.checked?'public-profile-window+checked-reset-threads':'public-profile-window;no-reset-seed'
        : account.platform==='bluesky'?'public-bluesky-api':'public-profile-window',threadChecked:expanded.checked,threadFailures:expanded.failures,threadStatus:expanded.failures?'partial':expanded.checked?'ok':'not-required',inspected:posts.length,count:relevant,changed:sourceChanged};
    }catch(e){state.feeds[account.source]={...previous,source:account.source,label:account.name+' · '+socialPlatform(account),sourceAccount:account.username,status:'failed',lastAttemptAt:timestamp,lastSuccessfulAt:previous.lastSuccessfulAt||'',failures:(previous.failures||0)+1,error:String(e.message).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80),intake:socialChannel(account)};}
  }
  const originals=Object.values(state.records).filter(r=>now-Date.parse(r.lastOriginalCheckAt||0)>(r.withdrawnAt?6*3600000:r.absenceConfirmations?300000:3600000)).sort((a,b)=>Date.parse(a.lastOriginalCheckAt||0)-Date.parse(b.lastOriginalCheckAt||0)).slice(0,8);
  for(const row of originals){
    const account=AI_SOCIAL_ACCOUNTS.find(a=>a.source===row.item.extra.aiSignal.primarySource);if(!account)continue;
    let result;try{result=account.platform==='bluesky'?await checkBlueskyOriginal(row.item,account):publicProfilePosts(await readXPage(row.item.url),account,Date.now(),row.item.postId);}catch{result={state:'unknown'};}
    const checkedAt=new Date().toISOString();row.item.extra.socialPost.originalCheckedAt=checkedAt;row.item.extra.socialPost.originalState=result.state;
    const wasWithdrawn=Boolean(row.withdrawnAt);if(updateOriginalState(row,result,checkedAt)){if(!wasWithdrawn)withdrawn++;continue;}
    if(result.state==='present'&&socialContentHash(result.item)!==row.hash){row.item={...result.item,extra:{...result.item.extra,socialPost:{...result.item.extra.socialPost,originalCheckedAt:checkedAt,originalState:result.state}}};row.hash=socialContentHash(row.item);row.analysis=null;row.nextAnalyzeAt=0;row.analysisFailures=0;const index=changed.findIndex(i=>i.id===row.item.id);if(index<0)changed.push(row.item);else changed[index]=row.item;}
  }
  const analysisQueue=selectSocialAnalysisQueue(changed,state.records,{
    now,limit:24,reserved:8,
    eligibleSources:new Set(accounts.map(account=>account.source)),
    contentHash:socialContentHash,
  });
  const recoveredPending=analysisQueue.filter(item=>!changed.some(fresh=>fresh.id===item.id)).length;
  let analyzed=0,analysisFailures=0;
  const deadline=now+240000;
  const processBatch=async batch=>{
    if(Date.now()>deadline)return;
    try{const {results,model}=await analyzeSocialBatch(batch,provider);for(const item of batch){const analysis=results.get(item.id);if(analysis.keep&&item.extra.socialPost.authorRole!=='official'){
      const account=AI_SOCIAL_ACCOUNTS.find(a=>a.source===item.extra.aiSignal.primarySource);
      if(!analysis.titleZh.startsWith(account.name))analysis.titleZh=account.name+'：'+analysis.titleZh;
      if(analysis.day&&!new RegExp('Day\\s*'+analysis.day,'i').test(analysis.titleZh))analysis.titleZh=account.name+' · Day '+analysis.day+'：'+analysis.titleZh.replace(new RegExp('^'+account.name+'[：:]'),'');
    }state.records[item.id].analysis={...analysis,model,processedAt:new Date().toISOString()};state.records[item.id].nextAnalyzeAt=0;state.records[item.id].analysisFailures=0;analyzed++;}}
    catch(e){if(batch.length>1){for(const item of batch)await processBatch([item]);return;}analysisFailures++;const row=state.records[batch[0].id];row.analysisFailures=(row.analysisFailures||0)+1;row.nextAnalyzeAt=Date.now()+Math.min(6*3600000,900000*2**Math.min(row.analysisFailures-1,5));if(e.candidates)await save(resolve(dirname(statePath),'analysis-rejections',batch[0].id.replace(/[^a-zA-Z0-9_-]/g,'_')+'.json'),{at:new Date().toISOString(),reason:e.message,candidates:e.candidates});console.error('AI_ANALYSIS_FAILED',batch[0].id,String(e.message).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,100));}
  };
  if(provider)for(let at=0;at<analysisQueue.length;at+=3){await processBatch(analysisQueue.slice(at,at+3));
  }
  // Previously observed, source-verified notices can outlive the profile's
  // small recent-post window. Re-evaluate only unchanged first-party originals
  // to repair stored model false negatives, never unknown or withdrawn posts.
  for(const [id,row] of Object.entries(state.records)){
    if(now-Date.parse(row.item.publishedAt)>7*86400000){delete state.records[id];continue;}
    const account=AI_SOCIAL_ACCOUNTS.find(a=>a.source===row.item.extra?.aiSignal?.primarySource);
    if(!account||row.withdrawnAt||row.item.extra?.socialPost?.originalState==='absent'
      ||row.hash!==socialContentHash(row.item))continue;
    const sourceRule=sourceBackedResetAnalysis(row.item,account);
    if(sourceRule&&(!row.analysis||row.analysis.keep===false))
      row.analysis={...sourceRule,model:'source-backed-reset-v1',processedAt:timestamp};
  }
  const data=Object.values(state.records).sort((a,b)=>Date.parse(b.item.publishedAt)-Date.parse(a.item.publishedAt)).slice(0,160).flatMap(({item,analysis})=>{
    if(analysis?.keep===false||state.records[item.id].withdrawnAt)return [];
    if(!analysis)return [];
    const account=AI_SOCIAL_ACCOUNTS.find(a=>a.source===item.extra.aiSignal.primarySource);
    // Repair previously stored machine-authored Chinese titles as well as
    // future publications, without changing the cited original X content.
    analysis.titleZh=conciseAiAuthorHeadline(item,analysis.titleZh,'zh-CN');
    const summaryZh=account.role==='official'||analysis.summaryZh.startsWith(account.name)?analysis.summaryZh:account.name+' 表示：'+analysis.summaryZh;
    const lane=analysis.kind==='model-release'?'launches':analysis.kind==='quota-update'?'news':analysis.kind==='product-update'?'building':analysis.kind==='research'?'research':analysis.kind==='discussion'?'discussion':'news';
    return [{...item,extra:{...item.extra,aiAnalysis:{state:'evidence-grounded',model:analysis.model,processedAt:analysis.processedAt,kind:analysis.kind,lane,facts:analysis.facts,audience:analysis.audience,effectiveTime:analysis.effectiveTime,day:analysis.day||null,locales:{'zh-CN':{title:analysis.titleZh,desc:summaryZh}}}}}];
  });
  state.runs++;state.lastRunAt=new Date().toISOString();
  const report=recordObservation(state,{at:timestamp,feeds:accounts.map(a=>state.feeds[a.source]).filter(Boolean),published:data.length,analysisFailures,withdrawn});
  await save(statePath,state);await save(resolve(dirname(statePath),'observation-report.json'),report);
  const payload={schemaVersion:1,generatedAt:state.lastRunAt,collector:{intervalSeconds:300,runs:state.runs,analyzed,analysisFailures,model:provider?.model||'',transport:'public-social-sources',observation:{startedAt:report.startedAt,elapsedHours:report.elapsedHours,state:report.state}},feeds:accounts.map(a=>state.feeds[a.source]?{...state.feeds[a.source],pendingCount:Object.values(state.records).filter(r=>r.item.extra.aiSignal.primarySource===a.source&&!r.analysis).length}:null).filter(Boolean),data};
  if(Buffer.byteLength(JSON.stringify(payload))>1000000)throw Error('snapshot_too_large');
  await save(outputPath,payload);
  if(gistId){if(!/^[a-f0-9]{20,40}$/i.test(gistId))throw Error('invalid_gist_id');const updatePath=outputPath+'.publish';await save(updatePath,{files:{'ai-social.json':{content:JSON.stringify(payload)}}});
    try{execFileSync('gh',['api','--method','PATCH','/gists/'+gistId,'--input',updatePath,'--silent'],{timeout:30000,stdio:['ignore','ignore','pipe']});}finally{await unlink(updatePath);}
  }
  console.log(JSON.stringify({run:state.runs,at:state.lastRunAt,accounts:payload.feeds.map(f=>({source:f.source,status:f.status,lastSuccessfulAt:f.lastSuccessfulAt})),items:data.length,changed:changed.length,recoveredPending,queued:analysisQueue.length,analyzed,analysisFailures,published:!!gistId}));
}finally{await lock.close();await unlink(lockPath).catch(()=>{});}
