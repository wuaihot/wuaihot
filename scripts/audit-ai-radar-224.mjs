import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aiBoardEvidence, buildAiBoard } from '../src/utils/aiCuration.mjs';
import { aiReadingInWindow, AI_READER_WINDOWS, readAiQuery, buildAiQuery } from '../src/utils/aiWorkspace.mjs';
import { aiOfficialReleaseReference } from '../src/utils/aiOfficialReleaseReferences.mjs';
import { aiSourceRole } from '../src/utils/aiEvidence.mjs';
import { AI_TOPIC_METADATA } from '../src/config/site-metadata.mjs';

const now=Date.UTC(2026,9,10,4,42),hour=3600000;
const social=(id,title,publishedAt,description=title)=>({
  id:'ai-author-thsottiaux:'+id,title,originalTitle:title,desc:description,originalDesc:description,
  publishedAt:new Date(publishedAt).toISOString(),url:'https://x.com/thsottiaux/status/'+id,
  extra:{aiSignal:{primarySource:'ai-author-thsottiaux'},socialPost:{authorRole:'employee'},aiAnalysis:{state:'evidence-grounded',lane:'building',day:5,facts:[{text:'concrete update',quote:'original statement'}]}},
});
const dots=social('2108646052178092403','Day 5 (dots edition)/ You can now create and text your dot entirely from the ChatGPT mobile app',Date.UTC(2026,9,9,19,49,30));
const composer=social('2108645667451318747','Day 5/ Composer predictions in the desktop app. Included in the Pro plans without consuming usage.',Date.UTC(2026,9,9,19,47,58));
for(const entry of [dots,composer]){
  const e=aiBoardEvidence(entry,{now});
  assert.ok(e.eligible,'substantive evidence-grounded Tibo employee post must not fail title-only keyword gate: '+entry.id);
  assert.equal(e.lane,'building');
  assert.ok(aiReadingInWindow(entry,'24h',now));
}
const selected=buildAiBoard([dots,composer],{now,limit:12});
for(const item of [dots,composer])assert.ok(selected.some(lane=>lane.items.some(row=>row.item.id===item.id)),'both independent Day 5 product changes remain visible');

// A stale release should not indefinitely outrank a genuinely recent verified feature update.
const older={title:'Introducing GPT-6.1',originalTitle:'Introducing GPT-6.1',url:'https://openai.com/index/gpt-6-1',publishedAt:new Date(now-55*hour).toISOString(),extra:{aiSignal:{primarySource:'openai-news'}}};
const previous=aiBoardEvidence(older,{now});
assert.equal(previous.eligible,true);
assert.ok(aiBoardEvidence(composer,{now}).score > previous.score,'recent substantive employee news has sufficient freshness priority');

const justOutside={...composer,publishedAt:new Date(now-24*hour-1).toISOString()};
assert.equal(aiReadingInWindow(justOutside,'24h',now),false);
assert.equal(aiReadingInWindow(justOutside,'72h',now),true);
assert.equal(aiReadingInWindow({...composer,publishedAt:null},'24h',now),false,'snapshot time cannot fabricate publication');
assert.equal(aiReadingInWindow({...composer,publishedAt:null},'all',now),true,'archive selection keeps undated records');
assert.deepEqual(AI_READER_WINDOWS,['24h','72h','7d','all']);
assert.equal(readAiQuery({}).time,'24h');
assert.equal(readAiQuery({time:'invalid'}).time,'24h');
assert.equal(readAiQuery({time:'7d'}).time,'7d');
assert.deepEqual(buildAiQuery({q:'Codex',time:'7d',panel:'monitor'},{time:'24h',page:1}),{q:'Codex',panel:'monitor'});
assert.deepEqual(buildAiQuery({panel:'models'},{time:'all'}),{panel:'models',time:'all'});

const discussion={title:'Qwen-Image-2.1-Turbo released!',originalTitle:'Qwen-Image-2.1-Turbo released!',extra:{aiSignal:{primarySource:'reddit-localllama'}},url:'https://reddit.com/r/LocalLLaMA/comments/1x1lclx/qwenimage21turbo_released/'};
const official=aiOfficialReleaseReference(discussion);
assert.equal(official?.publisher,'Qwen');
assert.equal(official?.role,'official-reference');
assert.equal(official?.url,'https://huggingface.co/Qwen/Qwen-Image-2.1-Turbo');
assert.equal(aiSourceRole(discussion.extra.aiSignal.primarySource),'discussion','original community source must never be promoted to official');
assert.equal(aiOfficialReleaseReference({...discussion,title:'Random launch',originalTitle:'Random launch'}),null);
assert.equal(aiOfficialReleaseReference({...discussion,extra:{aiSignal:{primarySource:'openai-news'}}}),null);

const view=readFileSync('src/views/AiTopic.vue','utf8');
const source=view.slice(view.indexOf('const curatedBoard ='),view.indexOf('const focusReading'));
assert.ok(source.includes('buildAiPrecisionBoard(rawData.value'),'board projection is independent of reading time');
assert.ok(!source.includes('activeTime'),'reader time must not alter board ranking');
assert.ok(view.includes('aiReadingInWindow(item,activeTime.value)'));
assert.ok(view.includes('AiRadarMonitor')&&view.includes('monitorView')&&view.includes('setPanel(\'monitor\')'),'monitor is opt-in');
assert.ok(view.includes('officialReference:aiOfficialReleaseReference(item)'));
assert.ok(view.includes('近1天')&&view.includes('扩大时间范围'));
assert.equal(AI_TOPIC_METADATA['zh-CN'].seoTitle,'AI 热点雷达 - 全网一手AI信息源监控大屏实时刷新 | 吾爱热榜');
const monitor=readFileSync('src/components/AiRadarMonitor.vue','utf8');
assert.ok(monitor.includes('SNAPSHOT') && monitor.includes('Experimental editorial view'));
assert.ok(monitor.includes('v-for="(section,i) in edition.sections"'));
console.log('AI_RADAR_224_OK: both Tibo updates, fresh board ordering, independent time scope, full archive, provenance attribution, SEO and experimental monitor');
