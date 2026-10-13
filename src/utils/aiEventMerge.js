import {aiTimes} from './aiTime.js';
import {aiPrimarySource,aiSourceRole,AI_DISCUSSION_CHANNELS} from './aiEvidence.mjs';
const title=item=>String(item.originalTitle || item.title || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
const versions=item=>(String(item.originalTitle || item.title || '').match(/\b(?:Qwen[- ]?Image[- ]?\d+(?:\.\d+)*(?:[- ]?(?:Turbo|Pro|Edit|Flash))?|GPT[-‑ ]?\d[\w.-]*|(?:Haiku|Sonnet|Opus|Fable|Gemini|DeepSeek|Qwen|Kimi|GLM|Grok)[- ]?\d[\w.-]*)/gi)||[]).map(x=>x.toLowerCase().replace(/\s+/g,'-')).sort().join('|');
const action=item=>{const text=String(item.originalTitle || item.title || '');return /rumou?r|leak|传闻|即将|将于/iu.test(text)?'unconfirmed':/恢复|resolved|recover/iu.test(text)?'recovery':/outage|故障|中断/iu.test(text)?'incident':/launch|introduc|release|发布|上线|开放/iu.test(text)?'release':'other';};
const grams=text=>new Set(Array.from({length:Math.max(0,text.length-1)},(_,i)=>text.slice(i,i+2)));
export function sameAiEvent(a,b) {
 const left=title(a),right=title(b),ta=aiTimes(a).published,tb=aiTimes(b).published;
 if((left.length<16 || right.length<16) && !(left===right && versions(a) && left.length>=10))return false;
 if(!left || !right || !ta || !tb || Math.abs(ta-tb)>48*3600000 || versions(a)!==versions(b) || action(a)!==action(b))return false;
 if(left===right)return true;
 // Exact named model/variant and a first-party dated announcement allow a community
 // headline to use different wording. Never promote the community source itself.
 const verified=a.extra?.publicationEvidence && aiSourceRole(aiPrimarySource(a))==='official' && AI_DISCUSSION_CHANNELS.includes(aiPrimarySource(b)) ||
   b.extra?.publicationEvidence && aiSourceRole(aiPrimarySource(b))==='official' && AI_DISCUSSION_CHANNELS.includes(aiPrimarySource(a));
 if(verified && action(a)==='release' && versions(a).startsWith('qwen-image-'))return true;
 const aa=grams(left),bb=grams(right),common=[...aa].filter(x=>bb.has(x)).length;
 return Math.min(left.length,right.length)/Math.max(left.length,right.length)>=.9 && common/Math.max(aa.size,bb.size)>=.94;
}
const evidence=item=>({source:item.extra?.aiSignal?.primarySource,sourceLabel:item.extra?.aiSignal?.primarySourceLabel,title:item.originalTitle || item.title,url:item.url,publishedAt:item.publishedAt,originalRank:item.extra?.aiSignal?.primaryRank || item.rank,metric:item.displayMetric || item.metric});
export function mergeAiEvents(items) {
 const rows=[],groups=new Map();
 for(const item of items){const normalized=title(item),key=versions(item)+'|'+action(item)+(versions(item)?'':'|'+normalized.slice(0,12)),candidates=groups.get(key)||[];const index=candidates.find(i=>sameAiEvent(rows[i],item)) ?? -1;if(index<0){candidates.push(rows.length);groups.set(key,candidates);rows.push(item);continue;}
  const previous=rows[index],preferred=item.extra?.publicationEvidence&&!previous.extra?.publicationEvidence?item:previous,other=preferred===item?previous:item;
  const confirmations=[...(preferred.extra?.aiSignal?.confirmations || []),evidence(other),...(other.extra?.aiSignal?.confirmations || [])];
  const seen=new Set();rows[index]={...preferred,extra:{...preferred.extra,aiSignal:{...preferred.extra?.aiSignal,confirmations:confirmations.filter(e=>e.url&&!seen.has(e.url)&&seen.add(e.url)).slice(0,30)},eventMerge:{method:'dated-near-identical-title',count:(previous.extra?.eventMerge?.count || 1)+1}}};
 }
 return rows;
}
