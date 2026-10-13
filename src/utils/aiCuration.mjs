import { aiCanonicalUrl, aiContentText, aiContentTopic, aiOriginalRank, aiSourceMetric, matchAiContent } from './aiContent.js';
import { aiTime, aiTimes } from './aiTime.js';
import { aiPrimarySource, aiSourceRole, AI_DISCUSSION_CHANNELS } from './aiEvidence.mjs';
import { evaluateAiQuality, isAiPopularitySurface } from './aiQuality.js';
import { aiOfficialModelRelease,aiModelReleaseReport } from './aiReleaseSignals.mjs';
import {currentAiBoardUpdates} from './aiBoardSupersession.mjs';

export const AI_BOARD_LANES = ['news','launches','technical','discussion'];
export const aiBoardGroup = key => ({building:'technical',research:'technical',industry:'news'}[key] || key);
const ORDERS = {
  general: AI_BOARD_LANES,
  developer: ['technical','launches','discussion','news'],
  researcher: ['technical','launches','discussion','news'],
  industry: ['news','launches','discussion','technical'],
  creator: ['launches','news','technical','discussion'],
};
const HOUR=3600000;
const ALIASES = new Map([
  ['hackernews-ai','hackernews'],['sina-ai','sina'],['36kr-ai','36kr'],['ithome-ai','ithome'],
  ['geekpark-ai','geekpark'],['qbitai-ai','qbitai'],['meta-ai-blog','meta-ai'],['openai-news','openai'],
  ['minimax-blog','minimax'],['ai-vendor-minimax','minimax'],['kimi-blog','kimi'],['ai-vendor-kimi','kimi'],['simon-blog','simon-willison'],['simon-bluesky','simon-willison'],['qwen-blog','qwen'],['qwen-model-updates','qwen'],['ai-vendor-qwen','qwen'],['gemini-blog','google'],['ai-vendor-google','google'],['openai-research','openai'],['mistral-news','mistral'],['cohere-blog','cohere'],
]);
const family = source => ALIASES.get(source) || source;
const RANKED = new Set(['github-ai-trending','hackernews-ai','reddit-localllama','hf-models','hf-papers','producthunt-ai','sina-ai']);
// Some provider news feeds are declared 'ranking' but have chronological rows;
// only known popularity surfaces supply board rank admission.
const DISCUSSION = new Set(AI_DISCUSSION_CHANNELS);
const TOOLS = new Set(['codex-releases','claude-code-releases']);
const LAUNCH = /发布|上线|上新|推出|升级|开放|支持|限额|额度|降价|\b(?:launch(?:ed|ing)?|releas(?:e[ds]?|ing)|introducing|new|update[ds]?|available|roll(?:ing)? out|reset|pricing)\b/iu;
const UNCERTAIN = /传闻|据传|被曝|爆料|曝光|疑似|leak|rumou?r|speculat|prediction|will (?:release|launch)|plans? to|expected to|即将|将于|承诺|如果|预计/iu;
function snapshotFor(item,feeds,now) {
  const source=aiPrimarySource(item), discovery=item.extra?.discovery;
  if(discovery && family(discovery.source)===family(source) && isAiPopularitySurface(discovery.source,discovery.variant,discovery.dataKind)) {
    // Preserve the exact variant's snapshot/rank, never fall back to a fresh unrelated variant.
    const time=aiTime(discovery.snapshotUpdatedAt,now);
    const feed=feeds.find(f=>f.source===discovery.source && (f.variant || '')===(discovery.variant || ''));
    const healthy=!feed || (feed.status==='ok' && !feed.stale);
    const rank=Number(discovery.originalRank);
    return {source:discovery.source,variant:discovery.variant || '',label:discovery.rankingLabel || '',time,
      rank:Number.isSafeInteger(rank)&&rank>0?rank:null,valid:healthy && !!time && now-time<=6*HOUR};
  }
  if(!RANKED.has(source))return null;
  const feed=feeds.find(f=>f.source===source && f.status==='ok' && !f.stale);
  const time=aiTime(feed?.updateTime,now),rank=aiOriginalRank(item);
  return {source,variant:feed?.variant || '',label:feed?.rankingLabel || '',time,rank,valid:!!time && now-time<=6*HOUR};
}
function taskLane(item,{fresh,hot,release,tool,project},topic) {
  const source=aiPrimarySource(item);
  if(item.extra?.aiAnalysis?.state==='evidence-grounded'&&item.extra.aiAnalysis.lane)return item.extra.aiAnalysis.lane;
  if(source==='ai-author-thsottiaux' && item.extra?.editorial?.reviewState==='original-checked')return item.extra.editorial.lane;
  if(tool || project || (topic==='engineering' && !DISCUSSION.has(source)))return 'building';
  if(DISCUSSION.has(source))return 'discussion';
  if(topic==='research')return 'research';
  if(['business','safety'].includes(topic))return 'industry';
  if((fresh || hot) && ['models','products'].includes(topic) || release && ['engineering','other'].includes(topic))return 'launches';
  return 'news';
}
// Reading exposes the whole task, without weakening the board's evidence gates.
export function aiReadingBoardGroup(item) {
  const source=aiPrimarySource(item),title=String(item.originalTitle || item.title || '');
  return aiBoardGroup(taskLane(item,{fresh:true,hot:false,release:LAUNCH.test(title)&&!UNCERTAIN.test(title),tool:TOOLS.has(source),project:source==='github-ai-trending'},aiContentTopic(item)));
}
export function aiBoardEvidence(item,{now=Date.now(),feeds=[]}={}) {
  const source=aiPrimarySource(item),title=String(item.originalTitle || item.title || ''),text=aiContentText(item);
  const official=aiSourceRole(source)==='official',tool=TOOLS.has(source),project=source==='github-ai-trending';
  const topic=aiContentTopic(item),times=aiTimes(item,now),snapshot=snapshotFor(item,feeds,now);
  const reject = () => ({eligible:false,reasons:[],score:0,lane:null,snapshot});
  if(item.extra?.socialPost && (item.extra.aiAnalysis?.state!=='evidence-grounded'||item.extra.intake?.stale))return reject();
  if(source==='tieba' && item.extra?.discovery?.variant!=='hot')return reject();
  const quality=evaluateAiQuality(item,{now});
  if(!quality.eligible)return reject();
  if(/^\s*(?:8点1氪|早报|晚报|晨报|新闻速览|morning briefing|daily roundup|daily digest)/iu.test(title))return reject();
  // Fresh first-party marketing remains readable, but freshness alone is not a highlight.
  if(official && /partnership|partner(?:ing|s)? with|how .{1,70}(?:uses?|using|leverag|scal)|\b(?:ads|advertising)\b|(?:合作伙伴|客户案例)|(?:如何|怎样).{1,60}(?:利用|使用)|bring(?:s|ing)?.{1,60}to ChatGPT/iu.test(title) &&
    !/模型|架构|基准|漏洞|隐私|监管|model|architecture|benchmark|vulnerab|privacy|regulat/iu.test(title))return reject();
  // A passing mention in a description doesn't make a general news story AI intelligence.
  const verifiedEmployeeUpdate = source === 'ai-author-thsottiaux' && item.extra?.aiAnalysis?.state === 'evidence-grounded' &&
    item.extra?.socialPost?.authorRole === 'employee' && (item.extra.aiAnalysis.facts?.length || 0) > 0;
  const dedicated=official || tool || project || verifiedEmployeeUpdate || ['hf-papers','arxiv-ai','huggingface-blog','reddit-localllama','producthunt-ai'].includes(source);
  if(!dedicated && !matchAiContent({title}))return reject();
  if(/ai (?:music )?short.{0,20}cute|小视频.{0,10}可爱|品牌大使|brand ambassador/iu.test(text))return reject();
  // Sensational secondary headlines are not primary evidence of a proven breakthrough.
  if(!official && !['hf-papers','arxiv-ai'].includes(source) && /数学大爆炸|(?:黎曼|哥德巴赫)猜想.{0,10}(?:已被证明|被攻克)|攻克\s*\d+\s*个数学难题/iu.test(title))return reject();
  const fresh=!!times.published && now-times.published<=72*HOUR;
  const updated=tool && !!times.updated && now-times.updated<=72*HOUR;
  const hot=!!snapshot?.valid && !!snapshot.rank && snapshot.rank<=10;
  const stars=aiSourceMetric(item);
  const growing=project && !!snapshot?.valid && stars?.kind==='stars-today' && stars.value>=100;
  if(!fresh && !updated && !hot && !growing)return reject();
  // Project discovery requires actual daily growth, not an inventory sequence.
  if(project && !growing)return reject();
  const modelRelease=aiModelReleaseReport(item,now);
  const officialModelRelease=modelRelease && aiOfficialModelRelease(item,now);
  const release=fresh && (modelRelease ? officialModelRelease : LAUNCH.test(title)) && !UNCERTAIN.test(title);
  const reasons=[];
  if(officialModelRelease)reasons.push({code:'model-release',time:times.published});
  if(updated)reasons.push({code:'update',time:times.updated});
  if(growing)reasons.push({code:'growth',value:stars.value,time:snapshot.time});
  if(release)reasons.push({code:'release',time:times.published});
  if(hot)reasons.push({code:'ranked',rank:snapshot.rank,time:snapshot.time,source:snapshot.source,label:snapshot.label,variant:snapshot.variant});
  if(fresh)reasons.push({code:now-times.published<24*HOUR?'new':'recent',time:times.published});
  const lane=modelRelease?'launches':taskLane(item,{fresh,hot,release,tool,project},topic);
  // Cross-source raw heat is never comparable. Numeric metrics only resolve same-source ties below.
  const age=fresh?(now-times.published)/HOUR:updated?(now-times.updated)/HOUR:Infinity;
  // Fresh substantive updates must not be buried beneath older, permanently boosted launch cards.
  // Qualification is unchanged; this adjusts only the independent board presentation.
  const recencyWeight = fresh ? (age <= 24 ? 24 - age / 2 : -Math.min(72, (age - 24) * 2)) : 0;
  const score=(fresh ? 36 + Math.max(0,24-age)/3 : 0)+(officialModelRelease?54:0)+(release?8:0)+(updated?42:0)+(growing?38:0)+(hot?24+(11-snapshot.rank):0)+quality.score/5+recencyWeight;
  return {eligible:true,reasons,score,lane,snapshot,topic,quality,official,published:times.published,updated:updated?times.updated:null};
}
export function buildAiBoard(items,{now=Date.now(),feeds=[],preset='general',excluded=[],limit=5}={}) {
  const hidden=new Set(excluded),seen=new Set(),seenTitles=new Set(),groups=new Map(AI_BOARD_LANES.map(key=>[key,[]]));
  const candidates=items.flatMap(item=>{
    if(hidden.has(aiPrimarySource(item)))return [];
    const evidence=aiBoardEvidence(item,{now,feeds});
    return evidence.eligible?[{item,evidence}]:[];
  });
  for(const {item,evidence} of currentAiBoardUpdates(candidates)) {
    const key=aiCanonicalUrl(item.url);if(seen.has(key))continue;
    const titleKey=String(item.originalTitle||item.title||'').toLowerCase().replace(/[\p{P}\p{Z}]+/gu,'');
    if(titleKey.length>15 && seenTitles.has(titleKey))continue;
    const group=groups.get(aiBoardGroup(evidence.lane));
    if(!group)continue;
    seen.add(key);if(titleKey.length>15)seenTitles.add(titleKey);group.push({item,evidence});
  }
  return (ORDERS[preset] || ORDERS.general).flatMap(key=>{
    const all=groups.get(key).sort((a,b)=>{
      const delta=b.evidence.score-a.evidence.score;if(delta)return delta;
      if(aiPrimarySource(a.item)===aiPrimarySource(b.item) &&
        (a.evidence.snapshot?.variant || '')===(b.evidence.snapshot?.variant || '') &&
        (a.evidence.snapshot?.label || '')===(b.evidence.snapshot?.label || '')) {
        const am=aiSourceMetric(a.item),bm=aiSourceMetric(b.item);
        if(am && bm && am.kind===bm.kind)return bm.value-am.value;
      }
      return (b.evidence.published || b.evidence.updated || 0)-(a.evidence.published || a.evidence.updated || 0) || aiCanonicalUrl(a.item.url).localeCompare(aiCanonicalUrl(b.item.url));
    });
    const counts=new Map(),chosen=[];
    const take=row=>{
      const source=family(aiPrimarySource(row.item)),cap=TOOLS.has(source)?1:2;
      if(chosen.includes(row) || chosen.length>=Math.min(5,limit) || (counts.get(source)||0)>=cap)return;
      chosen.push(row);counts.set(source,(counts.get(source)||0)+1);
    };
    // Show different qualified communities before repeating the same one.
    if(key==='discussion')for(const row of all) {
      if(!counts.has(family(aiPrimarySource(row.item))))take(row);
    }
    // Preserve both qualified jobs in a merged lane before filling by score.
    const subtasks=key==='technical'?['building','research']:key==='news'?['news','industry']:[];
    if(limit>=subtasks.length && subtasks.every(task=>all.some(row=>row.evidence.lane===task))) {
      for(const task of subtasks) {
        for(const row of all.filter(row=>row.evidence.lane===task)) {
          const before=chosen.length;take(row);if(chosen.length>before)break;
        }
      }
    }
    for(const row of all)take(row);
    chosen.sort((a,b)=>all.indexOf(a)-all.indexOf(b));
    // With a scrollable lane, never pin a much older diversity fallback ahead of newer
    // qualified items: source caps govern initial selection, not the displayed chronology.
    if(limit>5) {
      for(const row of all)if(chosen.length<limit && !chosen.includes(row))chosen.push(row);
      chosen.sort((a,b)=>all.indexOf(a)-all.indexOf(b));
    }
    return chosen.length?[{key,count:all.length,items:chosen}]:[];
  });
}
