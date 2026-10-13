// Product Hunt product names are entities, not free-form headlines.
// Preserve the first-party ranking's exact named product while still
// allowing natural-language descriptions to be translated.
const PRODUCT_HOSTS=new Set(['www.producthunt.com','producthunt.com']);

export function canonicalProductHuntName(item) {
  if(item?.extra?.aiSignal?.primarySource!=='producthunt-ai')return '';
  let parsed;
  try { parsed=new URL(String(item.url||'')); }catch { return ''; }
  if(parsed.protocol!=='https:' || !PRODUCT_HOSTS.has(parsed.hostname)
    || !/^\/(?:products|posts)\/[^/]+/.test(parsed.pathname))return '';
  const confirmations=item.extra.aiSignal.confirmations;
  const original=Array.isArray(confirmations) ? confirmations.find(entry=>
    entry?.source==='producthunt-ai' && entry?.url===item.url
    && typeof entry.title==='string' && entry.title.trim()
  )?.title : null;
  const name=String(original||item.originalTitle||item.title||'').trim();
  return name && name.length<=200 && !/[<>\u0000-\u001f]/.test(name) ? name : '';
}
