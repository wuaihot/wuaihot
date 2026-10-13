const text=(value,limit=300)=>typeof value==='string'?value.replace(/[\u0000-\u001f]/g,' ').trim().slice(0,limit):'';
const time=value=>Number.isFinite(Date.parse(value))?new Date(value).toISOString():'';
export function aiStatusDetails(payload={}) {
  return {
    affectedComponents:(payload.components || []).filter(row=>row.status && row.status!=='operational').slice(0,30).map(row=>({name:text(row.name),status:text(row.status,80)})),
    incidentDetails:(payload.incidents || []).slice(0,8).map(row=>({
      id:text(row.id,100),name:text(row.name,500),status:text(row.status,80),impact:text(row.impact,80),
      startedAt:time(row.started_at || row.created_at || row.startedAt),updatedAt:time(row.updated_at || row.updatedAt),
      updates:(row.incident_updates || row.updates || []).slice(0,3).map(update=>({body:text(update.body,2000),status:text(update.status,80),at:time(update.display_at || update.created_at || update.at)})),
    })),
  };
}
export function aiStatusTooltip(status,checkedLabel='最近核验') {
  const incidents=(status.incidentDetails || []).map(row=>row.name+(row.updates?.[0]?.body?' — '+row.updates[0].body.slice(0,500):''));
  const components=(status.affectedComponents || []).map(row=>row.name+' · '+row.status);
  return [status.description,...incidents,...components,status.checkedAt?checkedLabel+' '+new Date(status.checkedAt).toLocaleString():null].filter(Boolean).join('\n');
}
