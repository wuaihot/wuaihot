// Deterministic editorial hierarchy using only source-backed, already-admitted signals.
// It cannot invent summaries, dates, reporting status, or topic classifications.
const AGE_HOURS={24:24,72:72,168:168};
const IMPORTANT=new Set(['news','launches']);
// Do not treat official vendor customer-marketing stories as equal to releases.
// They remain browseable in topical coverage, but are not preferred as leads.
const CUSTOMER_CASE=/\b(?:case stud(?:y|ies)|customer stor(?:y|ies)|customer spotlight|partner spotlight)\b|\b(?:cuts?|reduces?|saves?)\b.{0,70}\b(?:costs?|time|workload|tickets|expense)\b|\b(?:campaigns?|advertising)\b.{0,25}\bwith\b|客户案例|成功案例|营销案例|降本.{0,30}客户/iu;
const isCustomerCase=item=>!item.emphasis&&CUSTOMER_CASE.test(String(item.originalTitle||item.title||''));
const sourceOfficial=item=>item?.raw?.extra?.publicationEvidence || item.badgeKind==='official';
const urlKey=item=>String(item.key||item.url||'');
export function aiEditorialSignalRows(lanes,{hours=72,selected='all',now=Date.now()}={}){
 const duration=AGE_HOURS[hours]||72,ids=new Set(),all=[];
 for(const lane of lanes||[]){
  if(selected!=='all'&&selected!==lane.key)continue;
  for(const item of lane.items||[]){
   const published=Number(item.published);
   // No time? Not a verified "recent" headline; remain visible in ordinary reading.
   if(!Number.isFinite(published)||published<=0||published>now||now-published>duration*3600000)continue;
   const id=urlKey(item);
   if(!id||ids.has(id)||!/^https?:\/\//i.test(String(item.url||'')))continue;ids.add(id);
   const ageHours=(now-published)/3600000;
   const freshness=ageHours<=6?42:ageHours<=24?30:ageHours<=72?13:4;
   const customerCase=isCustomerCase(item);
   const score=(sourceOfficial(item)?33:0)+(item.emphasis?40:0)+(item.new?18:0)+
     (IMPORTANT.has(lane.key)?12:0)+freshness-(customerCase?45:0);
   all.push({id,item,laneKey:lane.key,laneLabel:lane.label,score,published,customerCase});
  }
 }
 return all.sort((a,b)=>b.score-a.score||b.published-a.published||a.id.localeCompare(b.id));
}
export function aiEditorialLayout(lanes,options={}){
 const all=aiEditorialSignalRows(lanes,options),used=new Set();
 const choose=predicate=>{const i=all.find(x=>!used.has(x.id)&&predicate(x));if(i)used.add(i.id);return i||null;};
 const lead=choose(row=>!row.customerCase&&['news','launches','research'].includes(row.laneKey))||choose(row=>!row.customerCase)||choose(()=>true);
 const secondary=[];
 while(secondary.length<3){
  const row=choose(x=>!x.customerCase&&x.laneKey!=='discussion'&&!secondary.some(y=>y.laneKey===x.laneKey))||
    choose(x=>!x.customerCase&&x.laneKey!=='discussion')||
    choose(x=>!x.customerCase&&!secondary.some(y=>y.laneKey===x.laneKey))||choose(x=>!x.customerCase)||choose(()=>true);
  if(!row)break;secondary.push(row);
 }
 const briefs=[];
 while(briefs.length<6){const row=choose(()=>true);if(!row)break;briefs.push(row);}
 const sections=(lanes||[]).filter(x=>options.selected==='all'||!options.selected||x.key===options.selected)
   .map(lane=>{
     const entries=all.filter(x=>x.laneKey===lane.key&&!used.has(x.id)).slice(0,5);
     entries.forEach(x=>used.add(x.id));
     return {key:lane.key,label:lane.label,subtitle:lane.subtitle,entries,
       total:all.filter(x=>x.laneKey===lane.key).length};
   });
 return {lead,secondary,briefs,sections,total:all.length,all};
}
export function aiEditorialHistogram(lanes,{now=Date.now()}={}){
 const ids=new Set(),published=[];
 for(const lane of lanes||[])for(const item of lane.items||[]){
  const stamp=Number(item.published),id=urlKey(item);
  if(!id||ids.has(id)||!Number.isFinite(stamp)||stamp<=0||stamp>now||now-stamp>24*3600000)continue;
  ids.add(id);published.push(stamp);
 }
 return Array.from({length:6},(_,i)=>{
  const lower=now-(6-i)*4*3600000,upper=lower+4*3600000;
  return {hoursAgo:24-i*4,count:published.filter(t=>t>=lower&&t<upper).length};
 });
}
