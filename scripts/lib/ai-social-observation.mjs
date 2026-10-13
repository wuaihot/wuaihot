// Durable operational evidence. A green build cannot replace elapsed observation time.
export function recordObservation(state,{at,feeds,published,analysisFailures=0,withdrawn=0}){
  const window=state.observation ||= {startedAt:at,runs:0,accounts:{},days:{}};
  window.runs++;window.lastRunAt=at;window.analysisFailures=(window.analysisFailures||0)+analysisFailures;
  window.withdrawn=(window.withdrawn||0)+withdrawn;
  const day=at.slice(0,10),daily=window.days[day] ||= {runs:0,failures:0,published:0};
  daily.runs++;daily.published+=published;
  for(const feed of feeds){
    const a=window.accounts[feed.source] ||= {startedAt:at,stableStartedAt:at,successes:0,failures:0,changed:0,consecutiveFailures:0,maxGapMs:0,lastSuccessfulAt:''};
    if(feed.lastAttemptAt!==at)continue;
    if(feed.status==='ok'){
      a.successes++;a.consecutiveFailures=0;a.changed+=feed.changed||0;
      if(a.lastSuccessfulAt){const gap=Date.parse(feed.lastSuccessfulAt)-Date.parse(a.lastSuccessfulAt);a.maxGapMs=Math.max(a.maxGapMs,gap);if(gap>1800000)a.stableStartedAt=at;}
      a.lastSuccessfulAt=feed.lastSuccessfulAt;
    }else{a.failures++;a.consecutiveFailures++;daily.failures++;}
  }
  return observationReport(window,Date.parse(at));
}
export function observationReport(window,now=Date.now()){
  if(!window)return {state:'not-started',complete:false};
  const accounts=Object.entries(window.accounts).map(([source,a])=>({source,...a,elapsedHours:Math.max(0,(now-Date.parse(a.stableStartedAt||a.startedAt))/3600000),fresh:!!a.lastSuccessfulAt&&now-Date.parse(a.lastSuccessfulAt)<=1800000}));
  const elapsedHours=Math.max(0,(now-Date.parse(window.startedAt))/3600000);
  const ready=elapsedHours>=168&&Object.keys(window.days).length>=7&&accounts.length>0&&accounts.every(a=>a.elapsedHours>=168&&a.successes>=7*200&&a.fresh);
  return {state:ready?'ready-for-review':'observing',complete:ready,startedAt:window.startedAt,lastRunAt:window.lastRunAt,elapsedHours:Number(elapsedHours.toFixed(2)),requiredHours:168,runs:window.runs,dayCount:Object.keys(window.days).length,analysisFailures:window.analysisFailures||0,withdrawn:window.withdrawn||0,accounts,days:window.days};
}
export function updateOriginalState(row,result,at){
  const checked=Date.parse(at),previous=Date.parse(row.lastAbsentAt||'');
  row.lastOriginalCheckAt=at;
  if(result.state==='present'){row.absenceConfirmations=0;delete row.lastAbsentAt;delete row.withdrawnAt;return false;}
  // Network errors, challenges and timeline omission never prove deletion.
  if(result.state!=='absent')return false;
  if(!previous||checked-previous>=300000){row.absenceConfirmations=(row.absenceConfirmations||0)+1;row.lastAbsentAt=at;}
  if(row.absenceConfirmations>=2){row.withdrawnAt=at;return true;}
  return false;
}
