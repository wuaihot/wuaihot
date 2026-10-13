import { aiBoardEvidence } from './aiCuration.mjs';
import { aiCanonicalUrl, aiContentTopic } from './aiContent.js';
import { aiPrimarySource, AI_DISCUSSION_CHANNELS } from './aiEvidence.mjs';
import { currentAiBoardUpdates } from './aiBoardSupersession.mjs';
import { aiBoardPresentationDecision } from './aiBoardEditorialPriority.mjs';
import { aiQuotaResetFreshForBoard } from './aiQuotaReset.mjs';

export const AI_PRECISION_LANES = Object.freeze(['news','launches','building','research','industry','discussion']);
const DISCUSSIONS = new Set(AI_DISCUSSION_CHANNELS);
const PRODUCT_UPDATE = /\b(?:ChatGPT|Codex|Claude|Gemini|Qwen|GPT|Devin|model)\b.{0,100}\b(?:app|mobile|desktop|beta|released?|rollout|support|composer|predictions?|dots?|subscription)\b|\b(?:composer predictions?|dots?|ChatGPT mobile)\b/iu;
const INDUSTRY = /\b(?:policy|regulation|lawsuit|compliance|copyright|funding|acquisition|governance|safety|false.front.{0,12}operations|influence.operations)\b|政策|监管|合规|融资|收购|版权|安全治理|AI.{0,6}泡沫|AI领域.{0,8}角逐/iu;
const CUSTOMER_CASE = /\b(?:cuts? (?:\w+ )?(?:costs?|time|threat investigation)|turns? .{0,70}into campaigns|customer (?:story|case study)|using .{0,45}to (?:automate|scale))\b|客户案例|成功案例/iu;

export function aiPrecisionLane(item,evidence=null) {
  const source=aiPrimarySource(item),topic=aiContentTopic(item);
  const title=String(item.originalTitle || item.title || '');
  if (DISCUSSIONS.has(source)) return 'discussion';
  // A source-reviewed personal intention is discussion, not a shipped update.
  // Keep the exception narrow: it must pass the Tibo source-backed topic gate.
  if(source==='ai-author-thsottiaux' && topic==='opinion'
    &&item.extra?.aiAnalysis?.state==='evidence-grounded'
    &&item.extra?.aiAnalysis?.kind==='discussion')return 'discussion';
  if (['hf-papers','arxiv-ai','paperswithcode'].includes(source) || topic==='research') return 'research';
  const verifiedProductUpdate = PRODUCT_UPDATE.test(title) && (
    source==='ai-author-thsottiaux' && item.extra?.aiAnalysis?.state==='evidence-grounded' ||
    evidence?.official || ['openai-devs-x','openai-x'].includes(source));
  // Concrete verified product changes outrank an incidental business/industry classifier.
  // A policy announcement still belongs to governance, even when its subject is a product.
  if (verifiedProductUpdate && !INDUSTRY.test(title))return 'launches';
  if (['business','safety'].includes(topic) || INDUSTRY.test(title) ||
      ['openai-news','anthropic-news','openai','anthropic'].includes(source) && CUSTOMER_CASE.test(title)) return 'industry';
  if (['models','products'].includes(topic))return 'launches';
  if (source==='github-ai-trending' || ['codex-releases','claude-code-releases'].includes(source) ||
      topic==='engineering' || topic==='practice' || evidence?.lane==='building') return 'building';
  if (evidence?.lane==='research') return 'research';
  if (evidence?.lane==='industry') return 'industry';
  if (evidence?.lane==='launches') return 'launches';
  return 'news';
}
export function aiPrecisionReadingLane(item) {return aiPrecisionLane(item);}
export function buildAiPrecisionBoard(items,{now=Date.now(),feeds=[],excluded=[],limit=12}={}) {
  const excludedSources=new Set(excluded),groups=new Map(AI_PRECISION_LANES.map(lane=>[lane,[]]));
  const candidates=items.flatMap(item=>{
    if (excludedSources.has(aiPrimarySource(item)) || !aiQuotaResetFreshForBoard(item,now)) return [];
    const evidence=aiBoardEvidence(item,{now,feeds});
    if(!evidence.eligible)return [];
    const decision=aiBoardPresentationDecision(item,evidence);
    return decision.admit?[{item,evidence,presentationScore:evidence.score+decision.adjustment}]:[];
  });
  const seenUrls=new Set(),seenTitles=new Set();
  for (const row of currentAiBoardUpdates(candidates)) {
    const canonical=aiCanonicalUrl(row.item.url);
    const url=row.item.extra?.verifiedReleaseId && aiPrimarySource(row.item)==='qwen-model-updates'
      ? canonical+'::'+row.item.extra.verifiedReleaseId+'::'+String(row.item.publishedAt||'') : canonical;
    const title=String(row.item.originalTitle||row.item.title||'').toLowerCase().replace(/[\p{P}\p{Z}]+/gu,'');
    if (!url || seenUrls.has(url) || title.length>15 && seenTitles.has(title))continue;
    seenUrls.add(url);if(title.length>15)seenTitles.add(title);
    groups.get(aiPrecisionLane(row.item,row.evidence)).push(row);
  }
  return AI_PRECISION_LANES.map(key=>{
    const all=groups.get(key).sort((a,b)=>b.presentationScore-a.presentationScore ||
      (b.evidence.published||0)-(a.evidence.published||0) ||
      aiCanonicalUrl(a.item.url).localeCompare(aiCanonicalUrl(b.item.url)));
    const chosen=[],sourceCounts=new Map();
    for(const row of all){
      const family=aiPrimarySource(row.item),max=key==='discussion'?2:3;
      if ((sourceCounts.get(family)||0)>=max)continue;
      chosen.push(row);sourceCounts.set(family,(sourceCounts.get(family)||0)+1);
      if(chosen.length>=limit)break;
    }
    // When fewer than limit, show remaining qualified items rather than silently disappearing.
    if(chosen.length<limit)for(const row of all)if(!chosen.includes(row)&&chosen.length<limit)chosen.push(row);
    chosen.sort((a,b)=>all.indexOf(a)-all.indexOf(b));
    return {key,count:all.length,items:chosen};
  });
}
