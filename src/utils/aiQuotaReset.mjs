// Source-grounded, product-agnostic signal for timely quota-reset notices.
// An employee's public claim is not proof that a specific account has reset.
import {aiPrimarySource} from './aiEvidence.mjs';
import {aiTimes} from './aiTime.js';
import {implicitAiResetCandidate} from './aiSocialSeries.js';

const DAY=24*3600000;
export function aiQuotaResetNotice(item) {
  if(item?.extra?.editorial?.reviewState==='original-checked' && item.extra.editorial.noticeKind==='quota-reset')return true;
  const source=aiPrimarySource(item),social=item?.extra?.socialPost,analysis=item?.extra?.aiAnalysis;
  if(source!=='ai-author-thsottiaux' || social?.sourceAccount!=='thsottiaux' ||
     social?.authorRole!=='employee' || analysis?.state!=='evidence-grounded' ||
     !Array.isArray(analysis.facts) || !analysis.facts.length)return false;
  // The collector also admits future usage-plan commentary through the broad
  // candidate gate. Only an evidence-grounded *quota update* earns the badge.
  return analysis.kind==='quota-update' && implicitAiResetCandidate(item,{username:'thsottiaux'});
}

export function aiQuotaResetFreshForBoard(item,now=Date.now()) {
  if(!aiQuotaResetNotice(item))return true;
  const published=aiTimes(item,now).published;
  return published!==null && now>=published && now-published<=DAY;
}
