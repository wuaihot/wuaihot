// Restore the meaning of legacy scalars before any view chooses a metric icon.
const NON_HEAT_SOURCES = new Set(['ai-model-board','livebench','artificialanalysis','arena-ai','lmarena','designarena','hf-models','hf-papers','skills-rank','aicpb-rankings','llm-stats']);
export function normalizeRankingMetric(item={},source='') {
  const explicit=item.displayMetric || item.metric;
  const label=String(explicit?.label || '');
  const inferred=/^tokens?$/i.test(label)?'tokens':/^(?:score|评分|評分|得分)$/i.test(label)?'score':/^(?:downloads|下载|下載)$/i.test(label)?'downloads':/^(?:requests|请求|請求)$/i.test(label)?'requests':'';
  if(inferred)return {...item,metric:{...explicit,kind:inferred},displayMetric:undefined,hot:undefined};
  if(explicit?.kind && explicit.kind!=='value')return {...item,metric:explicit,hot:explicit.kind==='heat'?explicit.value:undefined};
  if(source==='openrouter-rankings') {
    // Official app/model usage payloads use hot for token volume; never for popularity.
    if(/\bTokens?\b/iu.test(item.originalDesc || item.desc || '') && Number.isFinite(Number(item.hot)))return {...item,hot:undefined,metric:{kind:'tokens',label:'Tokens',value:Number(item.hot)}};
    return {...item,hot:undefined};
  }
  if(NON_HEAT_SOURCES.has(source))return {...item,hot:undefined};
  return item;
}
export function rankingMetricHeat(item={},source='') {
  const normalized=normalizeRankingMetric(item,source),metric=normalized.metric;
  if(metric?.kind && !['value','heat'].includes(metric.kind))return null;
  const value=metric?.kind==='heat'?metric.value:normalized.hot;
  return value!==null && value!==undefined && value!=='' && Number.isFinite(Number(value))?Number(value):null;
}
