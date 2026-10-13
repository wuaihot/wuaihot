// Public HTML already rendered by LoL Esports; no credentials or private producer code.
import {officialStartTime} from '../src/utils/lolPhaseLayout.js';
const NEWS_URL = 'https://lolesports.com/en-US/news';
export const DC_PHASES = Object.freeze([
  {key:'swiss', label:'初始瑞士轮', enLabel:'Initial Swiss', id:'117133805551803623'},
  {key:'round4', label:'第4轮 · 循环赛', enLabel:'Round 4 · Round robin', id:'117133816701460037'},
  {key:'round5', label:'第5轮 · 晋级赛', enLabel:'Round 5 · Qualification', id:'117133816701460038'},
  {key:'playoffs', label:'淘汰赛', enLabel:'Playoffs', id:'117133816701460039'},
]);
const resultUrl = id => `https://lolesports.com/en-US/results/117133773242499009/stage/${id}`;
const safeImage = value => /^https?:\/\/(?:static\.lolesports\.com|cdn\.sanity\.io)\//.test(String(value||'')) ? String(value).replace(/^http:/,'https:') : '';
const text = value => typeof value === 'string' && !value.startsWith('$') ? value.trim().slice(0,1000) : '';
export function publicFlightValues(html, {resolveReferences=false}={}) {
  const stream = [...String(html).matchAll(/self\.__next_f\.push\((\[1,"(?:\\.|[^"\\])*"\])\)/g)].map(m=>{
    try{return JSON.parse(m[1])[1]}catch{return ''}
  }).join('');
  const rows=new Map();
  for(const line of stream.split('\n')){try{const at=line.indexOf(':');if(at<1)continue;rows.set(line.slice(0,at),JSON.parse(line.slice(at+1)))}catch{/* Non-JSON Flight frames. */}}
  if(!resolveReferences)return [...rows.values()];
  let budget=100000;
  const resolve=(v,depth=0,seen=new Set())=>{
    if(--budget<0||depth>35)return null;
    if(typeof v==='string'&&/^\$L[0-9a-f]+$/i.test(v)){
      const key=v.slice(2),target=rows.get(key);
      if(target&&typeof target==='object'&&!seen.has(key))return resolve(target,depth+1,new Set([...seen,key]));
    }
    if(Array.isArray(v))return v.map(c=>resolve(c,depth+1,seen));
    if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,c])=>[k,resolve(c,depth+1,seen)]));
    return v;
  };
  return [...rows.values()].map(v=>{budget=100000;return resolve(v)});
}
function visit(values, predicate) {
  const found=[];
  function walk(v,depth=0){if(!v||typeof v!=='object'||depth>60)return;if(predicate(v))found.push(v);for(const child of Object.values(v))walk(child,depth+1)}
  values.forEach(v=>walk(v));return found;
}
export function parseOfficialNews(html) {
  const articles=visit(publicFlightValues(html),v=>v.__typename==='Article');
  const seen=new Set();
  return articles.flatMap(a=>{
    const path=text(a.path?.current), title=text(a.externalTitle), date=text(a.publishingDates?.displayedPublishDate);
    if(!/^\/news\/[a-z0-9-]+$/i.test(path)||!title||!Number.isFinite(Date.parse(date)))return [];
    const url='https://lolesports.com/en-US/lolesports'+path;
    if(seen.has(url))return [];seen.add(url);
    return [{title,url,desc:text(a.description),summary:text(a.description),author:'LoL Esports',publishedAt:date,timestamp:Date.parse(date),pic:safeImage(a.bannerMedia?.sanityImage?.url),extra:{dataKind:'feed',publication:{publishedAt:date},source:'lolesports-news'}}];
  }).sort((a,b)=>b.timestamp-a.timestamp).slice(0,50).map((a,i)=>({...a,rank:i+1}));
}
const team = t => ({id:text(t.id||t.teamId||t.code),code:text(t.code),name:text(t.name),image:safeImage(t.image)});
export function parseOfficialMatchTimes(html,url='') {
  return visit(publicFlightValues(html),v=>v.__typename==='Match').flatMap(m=>{
    const id=text(m.id),startTime=officialStartTime(m.startTime);
    return /^\d{1,30}$/.test(id)&&startTime?[{id,startTime,url}]:[];
  });
}
export function enrichOfficialPhaseTimes(phases,times) {
  const dates=new Map();
  for(const entry of times){const old=dates.get(entry.id);if(!old)dates.set(entry.id,entry);else if(old.startTime!==entry.startTime)dates.set(entry.id,{...old,startTime:''});}
  return phases.map(phase=>({...phase,matches:phase.matches.map(match=>{
    const entry=dates.get(match.id);
    return match.startTime||!entry?.startTime?match:{...match,startTime:entry.startTime,timeSourceUrl:entry.url};
  })}));
}
export function parseOfficialPhase(html, phase) {
  const values=publicFlightValues(html,{resolveReferences:phase.key==='round4'});
  const teams=visit(values,v=>v.__typename==='Team'&&v.code&&v.record).flatMap(t=>{
    const wins=Number(t.record.wins),losses=Number(t.record.losses);
    return Number.isInteger(wins)&&Number.isInteger(losses)&&wins>=0&&losses>=0&&wins+losses<=30 ? [{...team(t),wins,losses}] : [];
  });
  // Round-robin standings are server-rendered table rows instead of Team objects.
  if(phase.key==='round4') {
    for(const row of visit(values,v=>Array.isArray(v)&&v[0]==='$'&&v[1]==='tr')){
      const parts=visit([row],v=>Array.isArray(v)&&v[0]==='$');
      const code=parts.find(v=>v[1]==='abbr')?.[3]?.children;
      const name=parts.find(v=>v[1]==='abbr')?.[3]?.title;
      const image=parts.find(v=>v[3]?.imageUrl)?.[3]?.imageUrl || parts.find(v=>v[1]==='img')?.[3]?.src;
      const record=visit([row],v=>Number.isInteger(v.numberOfWins)&&Number.isInteger(v.numberOfLosses))[0];
      if(typeof code==='string'&&record&&record.numberOfWins>=0&&record.numberOfLosses>=0&&record.numberOfWins+record.numberOfLosses<=30)teams.push({id:code,code,name:text(name),image:safeImage(image),wins:record.numberOfWins,losses:record.numberOfLosses});
    }
  }
  const uniqueTeams=[...new Map(teams.map(t=>[t.code,t])).values()].sort((a,b)=>b.wins-a.wins||a.losses-b.losses||a.code.localeCompare(b.code));
  const matches=visit(values,v=>v.__typename==='Match'&&Array.isArray(v.matchTeams)&&v.matchTeams.length===2&&v.matchTeams.every(t=>t&&typeof t==='object'))
    .filter(m=>phase.key==='swiss'?/^R[1-3]M\d/.test(m.description||''):phase.key==='round5'?/^R5M\d/.test(m.description||''):phase.key==='playoffs'?/^(Q[1-4]|SF[12]|Finals)$/.test(m.description||''):false)
    .map(m=>({id:text(m.id),structuralId:text(m.structuralId),description:text(m.description),state:text(m.state),startTime:officialStartTime(m.startTime),format:phase.key==='playoffs'?'BO5':phase.key==='swiss'&&/^R1M/.test(m.description)?'BO1':'BO3',
      ...(m.destinations?.win?.type==='match' && /^match_[a-z0-9]+$/i.test(m.destinations.win.structuralId) && [1,2].includes(m.destinations.win.slot) ? {next:{structuralId:m.destinations.win.structuralId,slot:m.destinations.win.slot}} : {}),
      teams:m.matchTeams.map(t=>({...team(t),score:m.state!=="unstarted"&&Number.isInteger(t.result?.gameWins)?t.result.gameWins:null,outcome:m.state==='completed'&&['win','loss'].includes(t.result?.outcome)?t.result.outcome:'',winner:m.state==='completed'&&t.result?.outcome==='win'}))}));
  const matchMap=new Map();
  for(const match of matches){const previous=matchMap.get(match.id);matchMap.set(match.id,{...match,startTime:match.startTime||previous?.startTime||''});}
  const uniqueMatches=[...matchMap.values()];
  if(phase.key==='swiss'&&(!uniqueTeams.length||!uniqueMatches.length)||phase.key==='round4'&&!uniqueTeams.length||['round5','playoffs'].includes(phase.key)&&!uniqueMatches.length)throw new Error('official_phase_structure_changed');
  return {...phase,url:resultUrl(phase.id),teams:uniqueTeams,matches:uniqueMatches};
}
const cache=new Map(), pending=new Map();
async function cached(key,load){const old=cache.get(key);if(old&&Date.now()-old.at<180000)return {...old.value,fromCache:true};if(pending.has(key))return pending.get(key);const task=load().then(value=>{cache.set(key,{at:Date.now(),value});return value}).finally(()=>pending.delete(key));pending.set(key,task);return task}
async function publicHtml(url){
  const response=await fetch(url,{headers:{Accept:'text/html'},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('official_http_'+response.status);
  const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.byteLength;if(size>2*1024*1024)throw new Error('official_payload_too_large');chunks.push(Buffer.from(chunk))}return Buffer.concat(chunks).toString('utf8');
}
export async function handleLolOfficial({req,res,pathValue}) {
  if(!['lolesports-news','lol-event-snapshot'].includes(pathValue))return false;
  if(req.method!=='GET'){res.status(405).json({code:405,message:'GET required'});return true}
  if(pathValue==='lol-event-snapshot'&&String(req.query?.event||'')!=='demacia-cup-2026'){res.status(400).json({code:400,message:'Unsupported event'});return true}
  try{
    const result=await cached(pathValue,async()=>{
      if(pathValue==='lolesports-news'){const data=parseOfficialNews(await publicHtml(NEWS_URL));if(!data.length)throw new Error('official_news_structure_changed');return {code:200,name:pathValue,title:'LoL 电竞',type:'官方动态',dataKind:'feed',updateTime:new Date().toISOString(),total:data.length,data}}
      const settled=await Promise.allSettled(DC_PHASES.map(async phase=>{const url=resultUrl(phase.id),html=await publicHtml(url);return {phase:parseOfficialPhase(html,phase),times:parseOfficialMatchTimes(html,url)};}));
      const readable=settled.flatMap(r=>r.status==='fulfilled'?[r.value]:[]);
      const phases=enrichOfficialPhaseTimes(readable.map(r=>r.phase),readable.flatMap(r=>r.times));
      if(!phases.length)throw new Error('official_results_unavailable');
      return {code:200,updateTime:new Date().toISOString(),phases,degraded:DC_PHASES.filter(p=>!phases.some(s=>s.key===p.key)).map(p=>p.key)};
    });
    res.setHeader('Cache-Control','public, s-maxage=180, stale-while-revalidate=300');res.status(200).json(result);
  }catch(error){res.setHeader('Cache-Control','no-store');res.status(502).json({code:502,message:error.message})}
  return true;
}
