import {aiPrimarySource} from './aiEvidence.mjs';
import {aiQuotaResetNotice} from './aiQuotaReset.mjs';

// Supersession is a board projection, never a deletion from the reading archive.
// Fixed first-party identities prevent an unrelated report from retiring an announcement.
function updateIdentity(item) {
  if(aiPrimarySource(item)!=='ai-author-thsottiaux')return null;
  const title=String(item.originalTitle || item.title || '');
  const editorial=item.extra?.editorial;
  const analysis=item.extra?.aiAnalysis;
  const checked=editorial?.reviewState==='original-checked';
  const explicit=checked && editorial.updateSeries?.product==='codex' ? editorial.updateSeries : null;
  const machineDay=analysis?.state==='evidence-grounded'&&analysis.day&&analysis.facts?.length ? analysis.day : null;
  // A verified same-author reset notice may omit both 'Codex' and 'Day N'.
  // It still belongs to the reset notice series for board-only supersession.
  if(!explicit && !machineDay && !/\bcodex\b/iu.test(title) && !aiQuotaResetNotice(item))return null;
  const day=Number(explicit?.edition || machineDay || title.match(/\bday\s+(\d{1,3})\b/iu)?.[1]);
  const edition=Number.isSafeInteger(day)&&day>0&&day<367 ? day : null;
  const reset=aiQuotaResetNotice(item) ||
    !/\b(?:not|no|never|may|might|will|tomorrow)\b|传闻|预计|尚未|不会|不是|未重置/iu.test(title) &&
    /(?:banked reset|reset.{0,30}(?:processed|landed|confirmed)|(?:loading|loaded).{0,30}reset|额度.{0,12}重置)/iu.test(title);
  return {series:edition?'codex-day':null,edition,notice:reset?'codex-quota-reset':null};
}

export function currentAiBoardUpdates(rows) {
  const updates=rows.flatMap(row=>{
    // A ranking/snapshot is not a publication time or a newer announcement.
    const identity=updateIdentity(row.item);
    return identity && row.evidence.published ? [{row,...identity,time:row.evidence.published}] : [];
  });
  const retired=new Set();
  for(const old of updates) {
    if(updates.some(next=>next.time>old.time &&
      (old.series && next.series===old.series && next.edition>old.edition ||
       old.notice && next.notice===old.notice)))retired.add(old.row);
  }
  return rows.filter(row=>!retired.has(row));
}
