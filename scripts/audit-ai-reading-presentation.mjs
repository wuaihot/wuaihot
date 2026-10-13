import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AI_BOARD_LANES } from '../src/utils/aiCuration.mjs';
import { AI_PRECISION_LANES } from '../src/utils/aiPrecisionBoard.mjs';
import { normalizeAiLaneOrder,orderAiLanes,aiReadableMetric,aiAnchorPage,aiTranslationText,restoreAiSource,aiEditorialEmphasis } from '../src/utils/aiReadingPresentation.mjs';
import {aiQuotaResetFreshForBoard} from '../src/utils/aiQuotaReset.mjs';
import {formatCompactMetric} from '../src/utils/compactMetric.js';
import {conciseAiAuthorHeadline} from '../src/utils/aiHeadlinePresentation.js';
import {currentAiBoardUpdates} from '../src/utils/aiBoardSupersession.mjs';
assert.deepEqual(normalizeAiLaneOrder(null),AI_PRECISION_LANES);
assert.deepEqual(normalizeAiLaneOrder(['research','industry','building','discussion','news','launches']),['research','industry','building','discussion','news','launches'],'six custom tasks preserve unique ordering');
assert.deepEqual(normalizeAiLaneOrder(['technical']),['building','research',...AI_PRECISION_LANES.filter(x=>!['building','research'].includes(x))],'legacy technical group migrates to split domains');
assert.deepEqual(normalizeAiLaneOrder(['discussion','discussion','invalid',null]),['discussion',...AI_PRECISION_LANES.filter(key=>key!=='discussion')]);
assert.deepEqual(orderAiLanes([{key:'news'},{key:'discussion'}],['discussion']).map(l=>l.key),['discussion','news']);
assert.equal(aiReadableMetric({metric:{kind:'value',label:'指标',value:400}},{heat:'热度'},String),null);
assert.equal(aiReadableMetric({hot:45000},{heat:'热度'},String),null,'untyped numbers are not popularity');
assert.equal(aiReadableMetric({metric:{kind:'heat',value:12}},{heat:'热度'},String).heat,true);
assert.equal(aiReadableMetric({todayStars:122},{'stars-today':'Star 今日'},String).heat,false);
assert.equal(aiReadableMetric({metric:{kind:'comments',value:0}},{comments:'评论'},String).text,'0');
assert.equal(aiReadableMetric({metric:{kind:'heat',value:-1}},{heat:'热度'},String),null);
const rows=Array.from({length:60},(_,i)=>({key:'item-'+i}));
assert.equal(aiAnchorPage(rows,'item-30',30),2);
assert.equal(aiAnchorPage([{key:'fresh'},...rows],'item-29',30),2,'retained anchor moves to new page when fresh items precede it');
assert.equal(aiAnchorPage(rows,'deleted',30),null);
assert.equal(aiTranslationText('New Features GPT-6.1 Sol is now the default. \n'),'New Features GPT-6.1 Sol is now the default.','API and presentation use the same trimmed translation key');
assert.deepEqual(restoreAiSource({refined:true,excluded:['sina-ai','openai-news']},'sina-ai'),{refined:true,excluded:['openai-news']},'undo restores only its source, preserving later choices');
assert.equal(aiEditorialEmphasis({title:'Codex quota reset'}),false,'keywords alone cannot produce an editorial emphasis');
assert.equal(aiEditorialEmphasis({extra:{editorial:{reviewState:'unreviewed',noticeKind:'quota-reset'}}}),false);
assert.equal(aiEditorialEmphasis({extra:{editorial:{reviewState:'original-checked',noticeKind:'quota-reset'}}}),true);
const resetNotice={
  publishedAt:'2026-10-10T22:16:20Z',
  originalDesc:'Global reset by EOD. May the tokens do good things for you.',
  extra:{aiSignal:{primarySource:'ai-author-thsottiaux'},
    socialPost:{sourceAccount:'thsottiaux',authorRole:'employee'},
    aiAnalysis:{state:'evidence-grounded',kind:'quota-update',facts:[{text:'Global reset announced',quote:'Global reset by EOD'}]}}
};
assert.equal(aiEditorialEmphasis(resetNotice),true,'source-verified Tibo global reset must gain the quota badge automatically');
assert.equal(aiQuotaResetFreshForBoard(resetNotice,Date.parse('2026-10-11T12:00:00Z')),true);
assert.equal(aiQuotaResetFreshForBoard(resetNotice,Date.parse('2026-10-12T00:16:21Z')),false,'past-24h quota notices cannot lead the live board');
assert.equal(aiEditorialEmphasis({...resetNotice,extra:{...resetNotice.extra,aiAnalysis:{state:'pending'}}}),false,'unverified analysis cannot imply reset');
assert.equal(aiEditorialEmphasis({...resetNotice,extra:{...resetNotice.extra,socialPost:{sourceAccount:'unrelated',authorRole:'employee'}}}),false,'other authors cannot inherit the quota badge');
assert.equal(aiQuotaResetFreshForBoard({title:'unrelated model release'},Date.parse('2026-10-12T12:00:00Z')),true,'ordinary news must keep its own age policy');
const confirmedReset={...resetNotice,publishedAt:'2026-10-11T04:01:09Z',originalDesc:'Put the reset in the bag. All propagated.',
  extra:{...resetNotice.extra,socialPost:{...resetNotice.extra.socialPost,
    quoted:{username:'thsottiaux',text:resetNotice.originalDesc}}}};
assert.equal(aiEditorialEmphasis(confirmedReset),true,'same-author source-linked propagation confirmation qualifies');
assert.deepEqual(currentAiBoardUpdates([
  {item:resetNotice,evidence:{published:Date.parse(resetNotice.publishedAt)}},
  {item:confirmedReset,evidence:{published:Date.parse(confirmedReset.publishedAt)}}
]).map(row=>row.item),[confirmedReset],'confirmed follow-up supersedes previous reset notice only in board view');
const tibo={extra:{aiSignal:{primarySource:'ai-author-thsottiaux'}}};
assert.equal(conciseAiAuthorHeadline(tibo,'Tibo · Day 7：Tibo 宣布 GPT-6.1 Sol 默认上下文长度提升至 500k（Codex & Work）','zh-CN'),
  'Tibo · Day 7：GPT-6.1 Sol 默认上下文升至 500k（Codex & Work）','retain real version, date series, metrics and app scope without repeating author');
assert.equal(conciseAiAuthorHeadline(tibo,'Tibo：OpenAI 员工 Tibo 宣布今日结束前进行全球 token 重置','zh-CN'),
  'Tibo：全球 Token 重置计划于当日结束前完成','preserve future reset qualification and anchor the relative date to original announcement');
assert.equal(conciseAiAuthorHeadline(tibo,'Tibo：Codex 额度重置已处理','zh-CN'),
  'Tibo：Codex 额度重置已处理','do not rewrite previously concise editor-approved headlines');
assert.equal(conciseAiAuthorHeadline(tibo,'Tibo：Tibo 与研究员共同测试新模型','zh-CN'),
  'Tibo：Tibo 与研究员共同测试新模型','do not remove the subject when the name is not a boilerplate attribution');
assert.equal(conciseAiAuthorHeadline(tibo,'Tibo · Day 7：Tibo 宣布 GPT-6.1 Sol 默认上下文长度提升至 500k（Codex & Work）','en'),
  'Tibo · Day 7：Tibo 宣布 GPT-6.1 Sol 默认上下文长度提升至 500k（Codex & Work）','do not alter original/foreign-language content');
assert.equal(conciseAiAuthorHeadline({extra:{aiSignal:{primarySource:'simon-blog'}}},'Tibo：OpenAI 员工 Tibo 宣布新计划','zh-CN'),
  'Tibo：OpenAI 员工 Tibo 宣布新计划','do not change a non-Tibo publisher quotation');
const view=readFileSync('src/views/AiTopic.vue','utf8');
assert.ok(!view.includes('pendingResult')&&!view.includes('queuedDiscoveryCount')&&!view.includes('applyPending'));
assert.ok(view.includes('result.value=incoming;') && view.includes('await applyAutomaticUpdate('));
assert.ok(view.includes('aiAnchorPage(filteredData.value')&&view.includes('anchor.focus>=0'));
assert.ok(view.includes('conciseAiAuthorHeadline(item,displayTitle,locale.value)'),'board and reader must share concise titles while the original mode remains unchanged');
assert.equal(formatCompactMetric(497000,'zh-CN'),'49.7万','AI X standalone ranking uses native Chinese reading units');
assert.equal(formatCompactMetric(1304684,'zh-CN'),'130.5万','verified Day 8 individual post views use the same units');
assert.equal(formatCompactMetric(497000,'en'),'497K','English readers keep international K/M format');
assert.equal(formatCompactMetric(497000,'zh-TW'),'49.7萬','traditional Chinese localizes the compact units');
assert.ok(view.includes('formatCompactMetric(num,locale.value)'), 'AI Radar view counts and heat metrics must reuse the same localized formatter as social source rows');
assert.ok(!view.includes('if (num >= 1000000)'), 'do not reintroduce a parallel hard-coded English K/M formatter');
console.log('AI_READING_PRESENTATION_OK: persistent order normalization, typed metrics, automatic refresh anchor pagination and focus');
