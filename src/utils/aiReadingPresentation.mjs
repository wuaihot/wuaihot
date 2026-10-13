import { AI_BOARD_LANES, aiBoardGroup } from './aiCuration.mjs';
import { AI_PRECISION_LANES } from './aiPrecisionBoard.mjs';
import { aiSourceMetric } from './aiContent.js';
import { aiQuotaResetNotice } from './aiQuotaReset.mjs';

export const AI_LANE_ORDER_STORAGE = 'wuaihot-ai-lane-order-v1';
export function normalizeAiLaneOrder(value) {
  const known=(Array.isArray(value)?value:[]).flatMap(key=>key==="technical"?["building","research"]:[key]);
  return [...new Set([...known.filter(key=>AI_PRECISION_LANES.includes(key)),...AI_PRECISION_LANES])];
}
export function orderAiLanes(lanes, order) {
  const keys = normalizeAiLaneOrder(order);
  return [...lanes].sort((a, b) => keys.indexOf(a.key) - keys.indexOf(b.key));
}
// Unknown numeric values are never upgraded into popularity metrics.
export function aiReadableMetric(item, labels, format) {
  const metric = aiSourceMetric(item);
  if (!metric || metric.kind === 'value') return null;
  const label = labels[metric.kind] || metric.label;
  if (!label) return null;
  return { kind: metric.kind, text: format(metric.value) || '0', label, heat: metric.kind === 'heat' };
}
export function aiAnchorPage(items, key, size) {
  const index = items.findIndex(item => item.key === key);
  return index < 0 ? null : Math.floor(index / size) + 1;
}
export function canPreserveAiReading({scrollTop,readerTop,readingLine}) {
  return Number.isFinite(scrollTop) && scrollTop>1 && Number.isFinite(readerTop) && readerTop<=readingLine;
}
export function mergeAiSourcePreferences(board,reader) {
  const valid=values=>Array.isArray(values)?values.filter(value=>typeof value==='string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value)):[];
  return {...reader,excluded:[...new Set([...valid(board?.excluded),...valid(reader?.excluded)])].slice(0,300)};
}

export const aiTranslationText = value => String(value || '').trim();
export function restoreAiSource(preference,source) {
  return {...preference,excluded:(preference.excluded || []).filter(value=>value!==source)};
}
export const aiEditorialEmphasis = aiQuotaResetNotice;
