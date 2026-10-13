import { aiPrimarySource } from './aiEvidence.mjs';
import { aiTime } from './aiTime.js';

// Confidence-gated, source-specific release correlation. Do not use this
// projection for generic similarity, rumors, benchmarks, or model reviews.
const COMMUNITY=new Set(['reddit-localllama','reddit-artificial','hackernews','hackernews-ai']);
const CUE=/发布|上线|推出|正式|\b(?:released?|launched?|announc(?:ed|ement)|now available|hugging face)\b/iu;
const eventText=item=>String(item.originalTitle||item.title||'').toLowerCase().replace(/[\s/_]+/g,'-');
const sameModel=(item,model)=>{
 const name=eventText(item),pos=name.indexOf(model);
 const suffix=name.slice(pos+model.length);
 return pos>=0 && (pos===0||!/\w/.test(name[pos-1])) &&
   (!suffix || !/[a-z0-9-]/.test(suffix[0]) || /^-(?:released?|launched?|announcement|announced|available|hugging-face|发布|上线|推出|正式)(?:$|\b|[^a-z])/iu.test(suffix));
};
const evidence=item=>({source:aiPrimarySource(item),sourceLabel:item.extra?.aiSignal?.primarySourceLabel||'',
 title:item.originalTitle||item.title,url:item.url,publishedAt:item.publishedAt,
 originalRank:item.extra?.aiSignal?.primaryRank||item.extra?.discovery?.originalRank||item.rank,
 metric:item.displayMetric||item.metric});
export function mergeAiVerifiedOfficialEvents(items){
 const consumed=new Set(),replacements=new Map();
 const canonicals=items.filter(item=>aiPrimarySource(item)==='qwen-model-updates' && /^qwen[a-z0-9._-]{2,99}$/.test(String(item.extra?.verifiedReleaseId||'')))
   .sort((a,b)=>(aiTime(b.publishedAt)||0)-(aiTime(a.publishedAt)||0));
 for(const official of canonicals){
  const model=official.extra.verifiedReleaseId,date=aiTime(official.publishedAt);
  if(!date||!sameModel(official,model)||!CUE.test(String(official.originalTitle||official.title)))continue;
  const related=items.filter(item=>!consumed.has(item) && item!==official && COMMUNITY.has(aiPrimarySource(item)) &&
    CUE.test(String(item.originalTitle||item.title)) && sameModel(item,model) &&
    !!aiTime(item.publishedAt) && Math.abs(aiTime(item.publishedAt)-date)<=72*3600000);
  if(!related.length)continue;
  for(const row of related)consumed.add(row);
  const previous=official.extra?.aiSignal?.confirmations||[],seen=new Set();
  replacements.set(official,{...official,extra:{...official.extra,
    aiSignal:{...official.extra.aiSignal,confirmations:[...previous,...related.map(evidence)].filter(entry=>{
      if(!entry.url||seen.has(entry.url))return false;seen.add(entry.url);return true;
    })},eventMerge:{method:'verified-product-variant-release',count:related.length+1}}});
 }
 return items.filter(item=>!consumed.has(item)).map(item=>replacements.get(item)||item);
}