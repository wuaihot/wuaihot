import assert from 'node:assert/strict';
import {AI_X_ACCOUNTS,AI_X_OPTIONS,AI_BLUESKY_ACCOUNTS,AI_BLUESKY_OPTIONS} from '../src/config/ai-social.js';
import {projectBlueskyFeed,checkBlueskyOriginal} from './lib/ai-social-bluesky.mjs';
import {recordObservation,observationReport,updateOriginalState} from './lib/ai-social-observation.mjs';
import {mergeAiSocialThreads} from '../src/utils/aiSocialThreads.js';
import {implicitAiResetCandidate} from '../src/utils/aiSocialSeries.js';
import {evaluateAiQuality} from '../src/utils/aiQuality.js';
import {publicProfilePosts,isThinSocialAnnouncement,expandResetAnnouncementThreads} from './lib/ai-social-profile.mjs';
import {validateSocialAnalysis,socialContentHash,sourceBackedResetAnalysis} from './lib/ai-social-analysis.mjs';
import {selectSocialAnalysisQueue} from './lib/ai-social-queue.mjs';
import {validateSocialSnapshot} from '../src/utils/aiSocialSnapshot.js';
import {loadAiSocial,handleAiSocial} from '../api/_ai-social.js';
import {applyReviewedTranslation} from '../src/utils/reviewedTranslation.js';
import {buildAiBoard,aiBoardEvidence} from '../src/utils/aiCuration.mjs';
import {aiSourceRole} from '../src/utils/aiEvidence.mjs';
import {getSourceVariantOptions} from '../src/utils/sourceSubtypes.js';

const now=Date.now(),account=AI_X_ACCOUNTS[0],published=new Date(now-60000).toISOString();
const makeTweet=(username,id,text,date=now-60000)=>({__isTweetResult:'Tweet',rest_id:id,details:{created_at_ms:date,full_text:text},core:{user_results:{result:{core:{screen_name:username},privacy:{protected:false}}}},views:{count:'123'}});
const raw='Day 4/ Codex API steering update is released. GPT-6.1 Sol ultrafast is available.';
const quoted=makeTweet('OpenAIDevs','901','GPT-6.1 Sol ultrafast is rolling out in Codex.');
const tweet={...makeTweet(account.username,'900',raw),quoted_tweet_results:{result:quoted}};
const script=values=>'<script>/* TimelineTimelineItem */ globalThis.__socialMustNotExecute=1;'+values.map((v,i)=>`$R[${i}]=${JSON.stringify(v)};`).join('')+'</script>';
const posts=publicProfilePosts(script([quoted,tweet,tweet,makeTweet('Other','902',raw),makeTweet(account.username,'903',raw,now+10000),makeTweet(account.username,'904',raw,now-8*86400000)]),account,now);
assert.equal(posts.length,1,'owner identity, dedupe, time window and future exclusion');
assert.equal(globalThis.__socialMustNotExecute,undefined,'untrusted scripts are parsed, never executed');
assert.equal(isThinSocialAnnouncement('Today, we are announcing ChatGPT.\nIt is here: https://t.co/test'),true);
assert.equal(isThinSocialAnnouncement('Today we are announcing GPT-6 in ChatGPT, available to all paid users.'),false);
assert.equal(posts[0].extra.socialPost.quoted.username,'OpenAIDevs');
assert.equal(posts[0].publishedAt,published);
const shortReset=(body,{username=account.username,quote=null}={})=>({
  originalDesc:body,extra:{socialPost:{sourceAccount:username,...(quote?{quoted:quote}:{})}},
});
assert.equal(implicitAiResetCandidate(shortReset('Day 6/ Reset'),account),true,'Tibo Day 6 reset post enters evidence analysis');
assert.equal(implicitAiResetCandidate(shortReset('Global reset landing by EOD PST time. Enjoy'),account),true,'explicit time-bound Tibo global reset reply is material without token keyword');
const day8Post=publicProfilePosts(script([makeTweet(account.username,'2109812216212099456','Day 8/ Reset')]),account,now)[0];
const day8Reply=publicProfilePosts(script([makeTweet(account.username,'2109812360596865224','Global reset landing by EOD PST time. Enjoy')]),account,now)[0];
const day8Rule=sourceBackedResetAnalysis(day8Post,account);
const replyRule=sourceBackedResetAnalysis(day8Reply,account);
assert.equal(day8Rule.keep,true,'source-backed Day 8 resets recover from model keep=false');
assert.equal(day8Rule.kind,'quota-update');
assert.equal(day8Rule.day,8);
assert.ok(day8Rule.titleZh.includes('Day 8'));
assert.ok(day8Rule.summaryZh.includes('未提供重置已到账的确认'),'announced is not propagated');
assert.equal(day8Rule.facts[0].quote,'Day 8/ Reset','no invented source evidence');
assert.equal(replyRule.keep,true);
assert.ok(replyRule.titleZh.includes('预计') && replyRule.summaryZh.includes('不是已完成确认'));
assert.equal(replyRule.effectiveTime,'','original says EOD without proof of rollout');
assert.equal(replyRule.facts[0].quote,'Global reset landing by EOD PST time. Enjoy');
const joined=await expandResetAnnouncementThreads([day8Post],account,async url=>{
  assert.equal(url,day8Post.url,'fetch only a verified first-party seed URL');
  return script([makeTweet(account.username,day8Post.postId,'Day 8/ Reset',now-60000),
    makeTweet(account.username,day8Reply.postId,'Global reset landing by EOD PST time. Enjoy',now-30000),
    makeTweet('Other', '2109812360596865225','Not an author post',now-25000)]);
},now);
assert.deepEqual({checked:joined.checked,failures:joined.failures},{checked:1,failures:0});
assert.deepEqual(joined.posts.map(p=>p.postId),[day8Reply.postId,day8Post.postId],
  'thread recovers same-author reply without admitting unrelated accounts');
const threadFailure=await expandResetAnnouncementThreads([day8Post],account,async()=>{throw Error('x_timeout')},now);
assert.equal(threadFailure.failures,1);
assert.deepEqual(threadFailure.posts.map(p=>p.postId),[day8Post.postId],
  'thread failure preserves verified primary and records partial coverage');
assert.equal(sourceBackedResetAnalysis({...day8Post,originalDesc:'The day we reach perfection it will be resets from there onwards'},account),null,
  'jokes must never be promoted to a factual quota reset');
assert.equal(sourceBackedResetAnalysis(day8Post,AI_X_ACCOUNTS[1]),null,'no authority from another account');
const confirmedDay6={
  ...day8Post,id:account.source+':2109132167112782291',
  originalDesc:'Put the reset in the bag. All propagated.',
  extra:{...day8Post.extra,socialPost:{...day8Post.extra.socialPost,
    postId:'2109132167112782291',quoted:{username:'thsottiaux',
      text:'Global reset by EOD. May the tokens do good things for you.',
      url:'https://x.com/thsottiaux/status/2109045392684032299'}}},
};
const confirmation=sourceBackedResetAnalysis(confirmedDay6,account);
assert.equal(confirmation.keep,true);
assert.ok(confirmation.titleZh.includes('已全部推送'));
assert.equal(confirmation.facts[0].quote,confirmedDay6.originalDesc);
assert.equal(sourceBackedResetAnalysis({
  ...confirmedDay6,extra:{...confirmedDay6.extra,
    socialPost:{...confirmedDay6.extra.socialPost,quoted:{...confirmedDay6.extra.socialPost.quoted,username:'other'}}},
},account),null,'never treat unrelated quote as proof of successful reset');
assert.equal(implicitAiResetCandidate(shortReset('Global reset by EOD. May the tokens do good things for you.'),account),true,'token reset announcement can be analyzed without an AI brand token');
assert.equal(implicitAiResetCandidate(shortReset('Put the reset in the bag. All propagated.',{quote:{username:account.username,text:'Global reset by EOD. May the tokens do good things for you.'}}),account),true,'same-author source-linked confirmation is eligible');
assert.equal(implicitAiResetCandidate(shortReset('Pro users, would you rather have'),account),false,'incomplete social poll is not a factual announcement');
assert.equal(implicitAiResetCandidate(shortReset('The day we reach perfection it will be resets from there onwards',{quote:{username:account.username,text:'Day 6/ Reset'}}),account),false,'vague commentary is not an evidence-grounded update');
assert.equal(implicitAiResetCandidate(shortReset('Blinked and it’s already Saturday'),account),false,'personal chatter remains filtered');
assert.equal(implicitAiResetCandidate(shortReset('Day 6/ Reset',{username:'imposter'}),account),false,'verified author identity is required');
assert.equal(implicitAiResetCandidate(shortReset('Day 6/ Reset'),AI_X_ACCOUNTS[1]),false,'not a blanket allowance for official accounts');
assert.equal(implicitAiResetCandidate(shortReset('Put the reset in the bag. All propagated.',{quote:{username:'OtherAccount',text:'Global reset by EOD. May the tokens do good things for you.'}}),account),false,'third-party quoted assertion must not be treated as author confirmation');
assert.throws(()=>publicProfilePosts('<html>Login required</html>',account,now),/structure_changed/);
const long={...tweet,rest_id:'905',note_tweet:{note_tweet_results:{result:{text:raw+' Complete long post.'}}}};
assert.ok(publicProfilePosts(script([long]),account,now)[0].desc.endsWith('Complete long post.'));
const row={id:posts[0].id,keep:true,kind:'product-update',titleZh:'Tibo · Day 4：Codex 操控更新',summaryZh:'Tibo 表示 Codex 更新操控能力，GPT-6.1 Sol ultrafast 已推出。',facts:[{text:'操控能力已更新',quote:'Codex API steering update is released.'}]};
const checked=validateSocialAnalysis([row],posts).get(row.id);
assert.equal(checked.day,4,'Day comes from original text, not model inference');
assert.equal(validateSocialAnalysis([{...row,facts:[{text:'操控能力已更新',evidenceId:'p1'}]}],posts).get(row.id).facts[0].quote,raw,'evidence ID resolves to source text, never model-generated quotation');
assert.throws(()=>validateSocialAnalysis([{...row,facts:[{text:'Missing source',evidenceId:'p999'}]}],posts),/evidence/);
assert.throws(()=>validateSocialAnalysis([],posts),/shape/);
assert.throws(()=>validateSocialAnalysis([{...row,id:'unknown'}],posts),/identity/);
assert.throws(()=>validateSocialAnalysis([{...row,facts:[{text:'Reset everyone',quote:'A new reset for all accounts'}]}],posts),/evidence/);
assert.throws(()=>validateSocialAnalysis([{...row,titleZh:'Claude俳句 5.5'}],posts),/terms/);
assert.throws(()=>validateSocialAnalysis([{...row,summaryZh:'Anthropic 员工 Tibo 发布了更新'}],posts),/attribution/);
assert.throws(()=>validateSocialAnalysis([{...row,summaryZh:'OpenAI 工程师 Tibo 发布了更新'}],posts),/attribution/);
assert.throws(()=>validateSocialAnalysis([{...row,facts:[{text:'Quoted update',quote:'GPT-6.1 Sol ultrafast is rolling out in Codex.'}]}],posts),/primary_evidence/);
assert.throws(()=>validateSocialAnalysis([{...row,titleZh:'Day 3 update'}],posts),/day_context/);
assert.equal(validateSocialAnalysis([{id:row.id,keep:false}],posts).get(row.id).keep,false);
assert.throws(()=>validateSocialAnalysis([{id:row.id,keep:false,reason:'GPT-6 is not recognized as a known product'}],posts),/knowledge_substitution/,'training knowledge cannot overrule a current original');
assert.equal(socialContentHash(posts[0]),socialContentHash({...posts[0],displayMetric:{kind:'views',value:999}}),'changing popularity does not repeatedly charge AI');
assert.notEqual(socialContentHash(posts[0]),socialContentHash({...posts[0],originalDesc:raw+' Correction.'}),'changed original is reprocessed');
const item={...posts[0],extra:{...posts[0].extra,aiAnalysis:{state:'evidence-grounded',model:'test',processedAt:new Date(now-1000).toISOString(),kind:checked.kind,lane:'building',facts:checked.facts,day:999,locales:{'zh-CN':{title:row.titleZh,desc:row.summaryZh}}}}};
const payload={schemaVersion:1,generatedAt:new Date(now-500).toISOString(),feeds:[{source:account.source,status:'ok',lastSuccessfulAt:new Date(now-1000).toISOString()}],data:[item]};
const snapshot=validateSocialSnapshot(payload,now);
assert.equal(snapshot.data[0].extra.aiAnalysis.day,4);
assert.equal(snapshot.continuous,true);
assert.equal(snapshot.feeds[0].updateTime,payload.feeds[0].lastSuccessfulAt);
// The public Gist CDN caches raw files for five minutes. A shared two-minute
// URL bucket plus matching memory TTL bounds social update delay without
// hammering the origin on every user-driven "cache=false" refresh.
const gistSnapshotUrl='https://gist.githubusercontent.com/example/0123456789abcdef/raw/ai-social.json';
const gistReads=[];
const gistFetcher=async url=>{
  gistReads.push(String(url));
  return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(payload)};
};
const gistEnv={AI_SOCIAL_FEED_URL:gistSnapshotUrl};
const gistFirst=await loadAiSocial(gistFetcher,gistEnv);
const gistSecond=await loadAiSocial(gistFetcher,gistEnv);
assert.equal(gistReads.length,1,'warm social snapshot should avoid duplicate Gist reads');
assert.equal(gistFirst.data.length,gistSecond.data.length);
const gistBucket=new URL(gistReads[0]).searchParams.get('_social_snapshot_bucket');
assert.ok(/^\d+$/.test(gistBucket||''),'Gist raw requests must rotate a bounded CDN cache key');
assert.ok(Math.abs(Number(gistBucket)-Math.floor(Date.now()/120000))<=1);
assert.equal(new URL(gistReads[0]).origin,'https://gist.githubusercontent.com');
await loadAiSocial(gistFetcher,gistEnv,{force:true});
assert.equal(gistReads.length,2,'explicit refresh bypasses only the memory cache');
assert.equal(new URL(gistReads[1]).searchParams.get('_social_snapshot_bucket'),gistBucket,
  'public cache=false cannot create one unique CDN key per reader request');
const originalNow=Date.now;
try {
  const elapsedAt=originalNow()+120001;
  Date.now=()=>elapsedAt;
  await loadAiSocial(gistFetcher,gistEnv);
  assert.equal(gistReads.length,3,'normal requests refresh at two minutes rather than five');
  assert.notEqual(new URL(gistReads[2]).searchParams.get('_social_snapshot_bucket'),gistBucket,
    'refresh moves to one fresh CDN key after the bounded time window');
} finally {
  Date.now=originalNow;
}
const otherSnapshotUrls=[];
const otherFetcher=async url=>{
  otherSnapshotUrls.push(String(url));
  return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(payload)};
};
await loadAiSocial(otherFetcher,{AI_SOCIAL_FEED_URL:'https://example.test/public-social.json'});
assert.equal(otherSnapshotUrls[0],'https://example.test/public-social.json',
  'non-Gist snapshot providers retain their exact URL');
const gistFailure=await loadAiSocial(async()=>{throw Error('unavailable')},gistEnv,{force:true});
assert.equal(gistFailure.continuous,false,'upstream failure must not claim healthy continuous feed');
const partialThread=validateSocialSnapshot({...payload,feeds:[{
  ...payload.feeds[0],coverage:'public-profile-window;thread-partial',
  threadStatus:'partial',threadChecked:1,threadFailures:1,
}]},now);
assert.equal(partialThread.feeds[0].status,'ok','verified profile data remains available when replies time out');
assert.equal(partialThread.feeds[0].threadStatus,'partial','do not claim complete reply coverage');
assert.equal(partialThread.feeds[0].threadFailures,1);
assert.equal(partialThread.feeds[0].coverage,'public-profile-window;thread-partial');
assert.equal(validateSocialSnapshot({...payload,data:[{...item,url:'https://x.com/Other/status/900'}]},now).data.length,0);
assert.equal(validateSocialSnapshot({...payload,data:[{...item,publishedAt:new Date(now+1000).toISOString()}]},now).data.length,0);
assert.equal(validateSocialSnapshot({...payload,data:[{...item,extra:{...item.extra,aiAnalysis:{...item.extra.aiAnalysis,facts:[{text:'Invented',quote:'Not in the original'}]}}}]},now).data.length,0);
assert.equal(validateSocialSnapshot({...payload,data:[{...item,extra:{...item.extra,aiAnalysis:{...item.extra.aiAnalysis,locales:{'zh-CN':{title:row.titleZh,desc:'Anthropic员工Tibo发布更新'}}}}}]},now).data.length,0);
const stale=validateSocialSnapshot({...payload,feeds:[{source:account.source,status:'ok',lastSuccessfulAt:new Date(now-31*60000).toISOString()}]},now);
assert.equal(stale.continuous,false);assert.equal(stale.data[0].extra.intake.stale,true);
assert.equal(aiBoardEvidence(stale.data[0],{now,feeds:stale.feeds}).eligible,false);
const failed=validateSocialSnapshot({...payload,feeds:[{...payload.feeds[0],status:'failed'}]},now);
assert.equal(failed.continuous,false);assert.equal(failed.data[0].extra.intake.stale,true);
assert.equal(applyReviewedTranslation(snapshot.data[0],'zh-CN').title,row.titleZh);
const legacySnapshotPost=(postId,originalDesc,legacyTitle,quote)=>({
  ...item,id:account.source+':'+postId,postId,
  url:'https://x.com/'+account.username+'/status/'+postId,
  originalDesc,originalTitle:originalDesc,
  extra:{...item.extra,socialPost:{...item.extra.socialPost,postId},
    aiAnalysis:{...item.extra.aiAnalysis,day:undefined,
      facts:[{text:'Source-backed announcement',quote}],
      locales:{'zh-CN':{title:legacyTitle,desc:'Tibo 发布的内容以所引用的原始公告为准。'}}}},
});
const historicalTitles=validateSocialSnapshot({...payload,data:[
  legacySnapshotPost('910','Day 7/ We have increased default context length for GPT-6.1 Sol to 500k when used through Codex & Work, up from 272k or an ~ 80% increase.',
    'Tibo · Day 7：Tibo 宣布 GPT-6.1 Sol 默认上下文长度提升至 500k（Codex & Work）',
    'We have increased default context length for GPT-6.1 Sol to 500k when used through Codex & Work'),
  legacySnapshotPost('911','Global reset by EOD. May the tokens do good things for you.',
    'Tibo：OpenAI 员工 Tibo 宣布今日结束前进行全球 token 重置',
    'Global reset by EOD. May the tokens do good things for you.'),
]},now);
assert.deepEqual(historicalTitles.data.map(post=>applyReviewedTranslation(post,'zh-CN').title),[
  'Tibo · Day 7：GPT-6.1 Sol 默认上下文升至 500k（Codex & Work）',
  'Tibo：全球 Token 重置计划于当日结束前完成',
],'historical source-backed titles must be corrected at shared snapshot validation, before any API renders them');
assert.equal(historicalTitles.data[0].originalDesc.startsWith('Day 7/'),true,'original English evidence stays intact');

assert.equal(applyReviewedTranslation(snapshot.data[0],'en').title,raw);
assert.equal(aiSourceRole('ai-author-thsottiaux'),'author');assert.equal(aiSourceRole('openai-devs-x'),'official');
const releasing='Day 4/ '+('We have improved steering to react immediately. ').repeat(3)+'Also releasing GPT-6.1 Sol ultrafast.';
const releasingPost={...item,title:releasing,originalTitle:releasing,desc:releasing,originalDesc:releasing,extra:{...item.extra,aiAnalysis:{...item.extra.aiAnalysis,facts:[{text:'发布新版',quote:'Also releasing GPT-6.1 Sol ultrafast.'}]}}};
const releasingValidated=validateSocialSnapshot({...payload,data:[releasingPost]},now).data[0];
assert.ok(aiBoardEvidence(releasingValidated,{now,feeds:snapshot.feeds}).reasons.some(r=>r.code==='release'),'releasing in a long primary post is a release signal, not freshness alone');
const day3={...snapshot.data[0],id:'previous',title:'Day 3/ Codex API update is released',originalTitle:'Day 3/ Codex API update is released',publishedAt:new Date(now-2*86400000).toISOString(),extra:{...snapshot.data[0].extra,aiAnalysis:{...snapshot.data[0].extra.aiAnalysis,day:3}}};
const board=buildAiBoard([day3,snapshot.data[0]],{now,feeds:snapshot.feeds,limit:12});
const boardItems=board.flatMap(group=>group.items);
assert.ok(boardItems.some(r=>r.item.id===item.id),'newest checked Day update is admitted');
assert.ok(!boardItems.some(r=>r.item.id==='previous'),'old Day edition leaves highlights, not archive');
let calls=0,fail=false;const fetcher=async()=>{calls++;if(fail)throw Error('offline');return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(payload)};};
const env={AI_SOCIAL_FEED_URL:'https://example.test/feed.json'};
await Promise.all([loadAiSocial(fetcher,env),loadAiSocial(fetcher,env)]);assert.equal(calls,1,'concurrent readers share a publication request');
await loadAiSocial(fetcher,env);assert.equal(calls,1,'cached publication');
fail=true;const retained=await loadAiSocial(fetcher,env,{force:true});assert.equal(retained.continuous,false);assert.equal(retained.data[0].extra.intake.stale,true);assert.equal(retained.data[0].publishedAt,published);
fail=false;let body,status;await handleAiSocial({req:{method:'GET',query:{type:'thsottiaux',locale:'zh-CN',cache:'false'}},res:{setHeader(){},status(v){status=v;return this;},json(v){body=v;}},pathValue:'ai-x-updates',fetchImpl:fetcher,env});
assert.equal(status,200);assert.equal(body.type,'Tibo');assert.equal(body.feeds.length,1);assert.equal(body.data[0].title,row.titleZh);assert.equal(body.data[0].rank,1);assert.ok(body.params.type.type.openaidevs);
await handleAiSocial({req:{method:'GET',query:{type:'Unlisted'}},res:{setHeader(){},status(v){status=v;return this;},json(){}},pathValue:'ai-x-updates',env});assert.equal(status,400);
assert.equal(AI_X_OPTIONS.length,5);
assert.deepEqual(getSourceVariantOptions('ai-x-updates').map(o=>({value:o.value,label:o.label})),AI_X_OPTIONS,'build-compatible projection matches the registered identities');
assert.deepEqual(getSourceVariantOptions('ai-bluesky-updates').map(o=>({value:o.value,label:o.label})),AI_BLUESKY_OPTIONS);
const b=AI_BLUESKY_ACCOUNTS[0],uri=`at://${b.did}/app.bsky.feed.post/abc123`,post={uri,cid:'cid-one',author:{did:b.did,handle:b.username},record:{$type:'app.bsky.feed.post',text:'Claude Haiku 5.5 is released. Useful AI model update.',createdAt:published},likeCount:24};
const bPosts=projectBlueskyFeed({feed:[{post},{post},{post:{...post,author:{did:'did:plc:imposter',handle:b.username}}},{post,reason:{$type:'repost'}}]},b,now);
assert.equal(bPosts.length,1,'fixed DID wins over a copied handle; reposts excluded');
assert.equal(bPosts[0].displayMetric.kind,'likes');
assert.equal(projectBlueskyFeed({feed:[{post:{...post,record:{...post.record,reply:{root:{uri:'at://did:plc:other/app.bsky.feed.post/abc'},parent:{uri}}}},reply:{parent:post}}]},b,now).length,0,'unrelated replies do not enter person monitoring');
const child={...post,uri:uri+'c',record:{...post.record,text:'Claude Haiku 5.5 AI evaluation: here is the coding benchmark.',reply:{root:{uri},parent:{uri}}}};
const threadPosts=projectBlueskyFeed({feed:[{post},{post:child,reply:{parent:post}}]},b,now);
assert.equal(threadPosts.length,2);assert.equal(mergeAiSocialThreads(threadPosts).length,1,'explicit self-authored thread is one reading event');
assert.equal(mergeAiSocialThreads([...threadPosts,{...bPosts[0],id:'unrelated',url:bPosts[0].url+'x',extra:{...bPosts[0].extra,socialPost:{...bPosts[0].extra.socialPost,threadRoot:uri+'x'}}}]).length,2,'similar titles alone never merge threads');
const bRow={id:bPosts[0].id,keep:true,kind:'discussion',titleZh:'Simon Willison：Claude Haiku 5.5 发布观察',summaryZh:'Simon Willison 分享 Claude Haiku 5.5 的发布信息。',facts:[{text:'Claude Haiku 5.5 发布',evidenceId:'p1'}]};
const bAnalysis=validateSocialAnalysis([bRow],bPosts).get(bRow.id);
const bItem={...bPosts[0],extra:{...bPosts[0].extra,aiAnalysis:{state:'evidence-grounded',kind:bAnalysis.kind,lane:'discussion',model:'test',processedAt:new Date(now-1000).toISOString(),facts:bAnalysis.facts,locales:{'zh-CN':{title:bRow.titleZh,desc:bRow.summaryZh}}}}};
const mixed={...payload,data:[item,bItem],feeds:[...payload.feeds,{source:b.source,status:'ok',lastSuccessfulAt:published}]};
assert.equal(validateSocialSnapshot(mixed,now).data.length,2);
assert.equal(validateSocialSnapshot(mixed,now).data[1].extra.socialPost.threadRoot,uri);
assert.equal(evaluateAiQuality(bItem,{now}).eligible,true);
assert.equal(evaluateAiQuality({...bItem,extra:{...bItem.extra,aiAnalysis:null}},{now}).eligible,false,'real monitored posts still require AI acceptance');
const legacy={...bItem,extra:{...bItem.extra,aiAnalysis:null,intake:{transport:'public-bluesky'}}};
assert.equal(evaluateAiQuality(legacy,{now}).eligible,true,'native validated Bluesky input is not mistaken for pending X processing');
const mixedFetch=async()=>({ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(mixed)});
await handleAiSocial({req:{method:'GET',query:{type:b.username,locale:'zh-CN'}},res:{setHeader(){},status(v){status=v;return this;},json(v){body=v;}},pathValue:'ai-bluesky-updates',fetchImpl:mixedFetch,env});
assert.equal(body.name,'ai-bluesky-updates');assert.equal(body.data.length,1);assert.equal(body.data[0].title,bRow.titleZh);assert.equal(body.feeds.length,1);
await handleAiSocial({req:{method:'GET',query:{type:'all'}},res:{setHeader(){},status(v){status=v;return this;},json(v){body=v;}},pathValue:'ai-x-updates',fetchImpl:mixedFetch,env});
assert.equal(body.data.length,1,'X all cannot leak Bluesky posts');
const original=await checkBlueskyOriginal(bPosts[0],b,async()=>({ok:true,text:async()=>JSON.stringify({thread:{$type:'app.bsky.feed.defs#threadViewPost',post}})}));
assert.equal(original.state,'present');
const absent=await checkBlueskyOriginal(bPosts[0],b,async()=>({ok:true,text:async()=>JSON.stringify({thread:{$type:'app.bsky.feed.defs#notFoundPost',uri}})}));assert.equal(absent.state,'absent');
const unavailable=await checkBlueskyOriginal(bPosts[0],b,async()=>{throw Error('network');});assert.equal(unavailable.state,'unknown');
const lifecycle={};assert.equal(updateOriginalState(lifecycle,absent,published),false);assert.equal(updateOriginalState(lifecycle,unavailable,new Date(now).toISOString()),false);assert.equal(updateOriginalState(lifecycle,absent,new Date(now+5*60000).toISOString()),true,'two direct confirmations separated by five minutes');
assert.equal(updateOriginalState(lifecycle,original,new Date(now+6*60000).toISOString()),false);assert.equal(lifecycle.withdrawnAt,undefined,'restored original resets withdrawal');
const observation={},at=new Date(now).toISOString();recordObservation(observation,{at,feeds:[{source:b.source,status:'ok',lastAttemptAt:at,lastSuccessfulAt:at}],published:1});
assert.equal(observationReport(observation.observation,now).complete,false,'one successful run cannot satisfy seven-day acceptance');
const at2=new Date(now+3600000).toISOString();recordObservation(observation,{at:at2,feeds:[{source:b.source,status:'ok',lastAttemptAt:at2,lastSuccessfulAt:at2}],published:1});assert.equal(observation.observation.accounts[b.source].stableStartedAt,at2,'a long outage restarts the stability window');

const pendingItem={...posts[0],id:'pending-retained',publishedAt:new Date(now-2*86400000).toISOString()};
const pendingRow={item:pendingItem,analysis:null,hash:socialContentHash(pendingItem),nextAnalyzeAt:0,analysisFailures:0};
const knownSources=new Set([account.source]);
const selectQueue=(discovered,records)=>selectSocialAnalysisQueue(discovered,records,{now,limit:24,reserved:8,eligibleSources:knownSources,contentHash:socialContentHash});
assert.deepEqual(selectQueue([],{[pendingItem.id]:pendingRow}).map(item=>item.id),[pendingItem.id],'older verified post must retry after leaving limited profile window');
assert.equal(selectQueue([pendingItem],{[pendingItem.id]:pendingRow}).length,1,'new discovery and persisted retry must not duplicate work');
const busyQueue=selectQueue(Array.from({length:30},(_,index)=>({...pendingItem,id:'fresh-'+index})),{[pendingItem.id]:pendingRow});
assert.equal(busyQueue.length,24,'provider call budget stays bounded');
assert.ok(busyQueue.some(item=>item.id===pendingItem.id),'a busy discovery window must reserve retry capacity');
for(const update of [
  {analysis:{keep:false}},
  {withdrawnAt:new Date(now).toISOString()},
  {nextAnalyzeAt:now+900000},
  {hash:'incorrect'},
  {item:{...pendingItem,publishedAt:new Date(now-8*86400000).toISOString()}},
  {item:{...pendingItem,extra:{...pendingItem.extra,socialPost:{...pendingItem.extra.socialPost,originalState:'absent'}}}},
  {item:{...pendingItem,extra:{...pendingItem.extra,aiSignal:{primarySource:'unknown'}}}},
]) {
  assert.equal(selectQueue([],{[pendingItem.id]:{...pendingRow,...update}}).length,0,'retries must honor rejection, deletion, backoff, expiry, integrity and source admission');
}

console.log('AI_SOCIAL_MONITOR_OK: inert public-page parser, identity/quotes/time, evidence/terms, edit hash, stale failures, no AI in reader requests, person subrankings, board supersession');
