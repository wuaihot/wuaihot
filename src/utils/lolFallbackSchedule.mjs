// A static snapshot is evidence for its own date, not a response for another day.
export function scopedLolFallbackSchedule(schedule, scope, date, from, to) {
  if (!schedule) return schedule;
  const day=String(schedule.date || '').slice(0,10);
  const matches=scope==='all' || (scope==='range' ? day && day>=from && day<=to : day && day===date);
  const snapshot={...schedule,isStaticFallback:true,snapshotDate:day};
  return matches ? snapshot : {...snapshot,items:[],total:0,completedCount:0,liveCount:0,upcomingCount:0};
}
