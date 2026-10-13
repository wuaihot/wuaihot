import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AI_X_ACCOUNTS} from '../src/config/ai-social.js';
import {implicitAiResetCandidate,tiboResetCompletionKind,tiboUsagePlanIntent} from '../src/utils/aiSocialSeries.js';
import {sourceBackedResetAnalysis} from './lib/ai-social-analysis.mjs';
import {mergeAiVerifiedResetEvents} from '../src/utils/aiSocialThreads.js';
import {applyReviewedTranslation} from '../src/utils/reviewedTranslation.js';
const account=AI_X_ACCOUNTS.find(x=>x.username==='thsottiaux');
const source=account.source,rootId='2109812216212099456',etaId='2109812360596865224',doneId='2109873287853707513';
const eta='Global reset landing by EOD PST time. Enjoy';
const completion="What would you like with your side of reset? It's done.";
const intent='Good plans are simple. I have one that should result in significantly more usage for everyone. Hope to get it done soon.';
const quoted={username:'thsottiaux',url:'https://x.com/thsottiaux/status/'+etaId,text:eta};
const post=(id,text,at,quote=null)=>({id:source+':'+id,postId:id,title:text,desc:text,originalTitle:text,originalDesc:text,
 url:'https://x.com/thsottiaux/status/'+id,publishedAt:at,author:'Tibo (@thsottiaux)',
 extra:{aiSignal:{primarySource:source,primarySourceLabel:'Tibo · X',timestampKind:'published'},
 socialPost:{postId:id,sourceAccount:'thsottiaux',authorRole:'employee',...(quote?{quoted:quote}:{})}}});
const root=post(rootId,'Day 8/ Reset','2026-10-13T01:03:25Z');
const expected=post(etaId,eta,'2026-10-13T01:03:59Z');
const done=post(doneId,completion,'2026-10-13T07:01:00Z',quoted);
const future=post('2109892247580000595',intent,'2026-10-13T08:01:00Z');
assert.equal(tiboResetCompletionKind(done.originalDesc,quoted),'declared-done');
assert.equal(implicitAiResetCandidate(done,account),true,'new exact same-author quoted completion enters verified collector');
assert.equal(implicitAiResetCandidate(future,account),true,'explicit usage increase proposal is an attributed pending plan, not a completed rollout');
assert.equal(tiboUsagePlanIntent(intent),true);
assert.equal(implicitAiResetCandidate(post('101','Want a side of fries with reset? done','2026-10-13T06:00:00Z',quoted),account),false);
for(const bad of [
 {...quoted,username:'someone-else'},
 {...quoted,url:'https://x.com/other/status/'+etaId},
 {...quoted,text:'Reset polls are fun.'},
])assert.equal(tiboResetCompletionKind(completion,bad),'','never accept third-party or unrelated quote');
const completed=sourceBackedResetAnalysis(done,account);
const planning=sourceBackedResetAnalysis(future,account);
assert.equal(completed.kind,'quota-update');
assert.ok(completed.titleZh.includes('Day 8')&&completed.summaryZh.includes('不证明每个账户'));
assert.equal(completed.facts[0].quote,completion);
assert.equal(planning.kind,'discussion');
assert.ok(planning.summaryZh.includes('尚未公布')&&!planning.titleZh.includes('已完成'));
assert.equal(planning.facts[0].quote,intent);
assert.equal(sourceBackedResetAnalysis({...done,extra:{...done.extra,socialPost:{...done.extra.socialPost,quoted:{...quoted,username:'other'}}}},account),null);
assert.equal(sourceBackedResetAnalysis(done,AI_X_ACCOUNTS.find(x=>x.username!=='thsottiaux')),null);
const analyzed=(row)=>{
 const a=sourceBackedResetAnalysis(row,account);assert.equal(a.keep,true);
 return {...row,extra:{...row.extra,aiAnalysis:{...a,state:'evidence-grounded',model:'source-backed-reset-v1',locales:{'zh-CN':{title:a.titleZh,desc:a.summaryZh}}}}};
};
const fixtures=[root,expected,done,future].map(analyzed);
for(const locale of ['zh-CN','zh-TW','en']){
 const rows=mergeAiVerifiedResetEvents(fixtures,locale);
 assert.equal(rows.length,2,'Day 8: three original posts become one stateful event; future plan is independent');
 const event=rows.find(x=>x.extra.socialPost.eventGroup);
 assert.equal(event.id,root.id,'root identity remains stable');
 assert.equal(event.extra.socialPost.eventGroup.status,'completed');
 assert.equal(event.extra.socialPost.eventGroup.sourceCount,3);
 assert.deepEqual(event.extra.socialPost.eventGroup.posts.map(p=>p.postId),[rootId,etaId,doneId]);
 assert.equal(event.extra.socialPost.eventGroup.posts.at(-1).originalText,completion);
 assert.equal(rows.find(x=>x.id===future.id)?.extra.aiAnalysis.kind,'discussion');
 assert.ok(locale==='zh-CN'?event.title.includes('已宣告完成'):locale==='zh-TW'?event.title.includes('已宣告完成'):event.title.includes('declared complete'));
 assert.equal(applyReviewedTranslation(event,locale).title,event.title,'old root approved Day 8 translation cannot overwrite the newest event status');
}
const noQuote=analyzed(expected);
assert.equal(mergeAiVerifiedResetEvents([analyzed(root),noQuote], 'zh-CN')[0].extra.socialPost.eventGroup.status,'expected');
const isolated=mergeAiVerifiedResetEvents([analyzed(root),analyzed(expected),{...analyzed(done),publishedAt:'2026-10-15T03:00:00Z'}],'zh-CN');
assert.equal(isolated.filter(x=>x.extra.socialPost.eventGroup).length,1);
assert.equal(isolated.find(x=>x.extra.socialPost.eventGroup)?.extra.socialPost.eventGroup.status,'expected','out-of-window completion may not mutate yesterday event');
const radar=readFileSync('src/views/AiTopic.vue','utf8');
assert.ok(radar.includes('mergeAiVerifiedResetEvents(mergeAiSocialThreads(rows),locale.value)'),'Radar must reuse exactly the social leaderboard evidence-based grouping');
assert.ok(radar.includes("eventGroup?.kind==='verified-day-reset')return item"),'the latest group state must not be overwritten by root translation');
assert.ok(radar.includes('<AiSocialEventSources v-if="item.extra.socialPost.eventGroup"'),'reuse the ranked-source component rather than duplicate nested details');
assert.ok(radar.includes('aiReadingLatestTime(b)-aiReadingLatestTime(a)'),
 'sorting by latest must use the evidence-backed latest event post, without falsifying root publication');
assert.ok(radar.includes("{{ locale.startsWith('zh')?'最新进展':'Latest update' }}"),
 'reader event cards must identify the most recent stage as an update, not the root publication date');
assert.ok(radar.includes(':show-original="isOriginal(item,\'reader\')"'),'original quotes should not always render mixed-language');
console.log('TIBO_DAY8_COMPLETION_OK: quote-bound done, future plan intent, Day8 3→1, multilingual latest status, original disclosure, hostile/stale counterexamples');
