import { AI_PRECISION_LANES } from './aiPrecisionBoard.mjs';
export const AI_DEFAULT_VISIBLE_LANES=Object.freeze(['news','launches','building','discussion']);
export const AI_VISIBLE_LANES_STORAGE='wuaihot-ai-visible-lanes-v1';

// The editorial board always shows exactly four different topics.
// Optional domains are progressive choices, not extra default columns.
export function normalizeAiVisibleLanes(value) {
 const selected=Array.isArray(value)?value:[],
   valid=selected.filter(v=>AI_PRECISION_LANES.includes(v));
 const unique=[...new Set(valid)];
 if(unique.length!==4)return [...AI_DEFAULT_VISIBLE_LANES];
 return unique;
}
export function swapAiVisibleLane(value,previous,next){
 const current=normalizeAiVisibleLanes(value);
 if(!AI_PRECISION_LANES.includes(next) || !current.includes(previous)
   || previous!==next && current.includes(next))return current;
 return current.map(key=>key===previous?next:key);
}
