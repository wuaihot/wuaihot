// A source-backed completion claim is bound to the *author's own quoted ETA*.
// "It's done" is not evidence of every account's balance or plan eligibility.
export function tiboResetCompletionKind(text,quoted) {
  const message=String(text||'').trim();
  if(String(quoted?.username||'').toLowerCase()!=='thsottiaux')return '';
  const context=String(quoted?.text||'').trim();
  if(/^Put the reset in the bag\.\s*All propagated\.?$/i.test(message)
    &&/^Global reset (?:landing )?by EOD\b/i.test(context))return 'propagated';
  if(/^What would you like with your side of reset\?\s*It's done\.?$/i.test(message)
    &&/^Global reset landing by EOD PST time\b/i.test(context)
    &&/^https:\/\/x\.com\/thsottiaux\/status\/\d{1,24}$/.test(String(quoted?.url||'')))return 'declared-done';
  return '';
}
// Employee commentary about a possible future usage plan is a separate
// proposal, never an accomplished reset or an official product announcement.
export const tiboUsagePlanIntent=text=>/^Good plans are simple\.\s*I have one that should result in significantly more usage for everyone\.\s*Hope to get it done soon\.?$/i.test(String(text||'').trim());

// Short Tibo Day-series reset notices have source context even without product
// names. Allow analysis only; this does not approve publication or infer scope.
export function implicitAiResetCandidate(item, account) {
  const author = String(account?.username || '').toLowerCase();
  const source = String(item?.extra?.socialPost?.sourceAccount || '').toLowerCase();
  if (author !== 'thsottiaux' || source !== author) return false;
  const primary = String(item?.originalDesc || '').trim();
  const quote = item?.extra?.socialPost?.quoted;
  if(tiboResetCompletionKind(primary,quote)||tiboUsagePlanIntent(primary))return true;
  if (/^Day\s+\d{1,3}\s*[/:-]\s*Reset\b/i.test(primary)) return true;
  // A direct, time-bound global reset announcement is substantive even without
  // the word "tokens". Keep this narrow; generic reset jokes are not news.
  if (/^Global reset (?:landing )?by EOD(?: PST time)?\b/i.test(primary)) return true;
  if (/\bglobal\s+reset\b/i.test(primary) && /\btokens?\b/i.test(primary)) return true;
  return /\breset\b/i.test(primary)
    && /\b(?:propagat(?:ed|ion)|confirmed|landed)\b/i.test(primary)
    && String(quote?.username || '').toLowerCase() === author
    && /\bglobal\s+reset\b/i.test(String(quote?.text || ''))
    && /\btokens?\b/i.test(String(quote?.text || ''));
}
// A same-author confirmation may belong to the quoted announcement's Day series.
// This is event grouping, never evidence that another quota reset occurred.
export function socialSeriesDay(original,quoted,username){
  const primary=Number(String(original).match(/\bDay\s+(\d{1,3})\b/i)?.[1]||0);
  if(primary)return primary;
  if(quoted?.username?.toLowerCase()===String(username).toLowerCase() && /^\s*Confirmed\b.{0,60}\blanded\b/i.test(original))return Number(quoted.text.match(/\bDay\s+(\d{1,3})\b/i)?.[1]||0);
  return 0;
}
