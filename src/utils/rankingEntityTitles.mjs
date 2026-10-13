const MODEL_SOURCES = new Set(['ai-model-board','livebench','artificialanalysis','arena-ai','openrouter-rankings']);
export const preservesRankingTitle = (item,source) => MODEL_SOURCES.has(source) || item?.noAutoTranslate === true;
// Repair old translated payloads as well as preventing future translations.
export function restoreRankingEntityTitles(result,source) {
  if(!Array.isArray(result?.data))return result;
  let changed=false;
  const data=result.data.map(item=>{
    if(!preservesRankingTitle(item,source))return item;
    const title=item.originalTitle || item.title;
    if(item.title===title && item.noAutoTranslate===true)return item;
    changed=true;return {...item,title,noAutoTranslate:true};
  });
  return changed?{...result,data}:result;
}
