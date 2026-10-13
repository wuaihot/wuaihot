import { readAiInput, cachedAiInput, readAiProvider, aiRankingQueryError } from './_ai-intake.js';
import { parseAiCsv, scoreLiveBench, buildModelConsensus } from '../src/utils/aiModels.js';
import { AI_MODEL_OPTIONS } from '../src/config/ai-intake.js';
import {parseModelBoardView,summarizeModelBoards,modelBoardPage} from '../src/utils/aiModelBoardPaging.js';
const RAW='https://raw.githubusercontent.com/LiveBench/new-livebench/main/';
export async function loadLiveBench(fetchImpl=fetch,{force=false}={}) {
  return cachedAiInput('livebench',async()=>{
    const constants=await readAiInput(RAW+'src/lib/constants.js',fetchImpl);
    const literal=constants.match(/export const RELEASES\s*=\s*\[([\s\S]*?)\]/)?.[1];
    const dates=[...String(literal||'').matchAll(/"(20\d{2}-\d{2}-\d{2})"/g)].map(m=>m[1]).filter(d=>Date.parse(d)<=Date.now()).sort();
    const version=dates.at(-1);if(!version)throw Error('invalid_release');
    const name=version.replace(/-/g,'_');
    const [csv,categories]=await Promise.all([readAiInput(RAW+'public/table_'+name+'.csv',fetchImpl),readAiInput(RAW+'public/categories_'+name+'.json',fetchImpl,true)]);
    return {rows:parseAiCsv(csv),categories,version,checkedAt:new Date().toISOString(),dataUrl:RAW+'public/table_'+name+'.csv'};
  },fetchImpl,force?0:1800000);
}
function rankRows(payload) {
  if(payload.code!==200 || !Array.isArray(payload.data) || !payload.data.length)throw Error('invalid_ranking');
  return payload.data.slice(0,500).map((item,i)=>({model:String(item.originalTitle||item.title||''),rank:i+1,url:item.url,description:item.desc||'',score:null})).filter(i=>i.model);
}
export async function loadAiModelBoards(fetchImpl=fetch,env=process.env,{force=false}={}) {
  const base=String(env.INTERNAL_API_BASE_URL || env.INTERNAL_API_FALLBACK_BASE_URL || '').replace(/\/+$/,'');
  const getUpstream=key=>cachedAiInput('model:'+base+':'+key,async()=>({payload:await readAiProvider((key==='aa'?'artificialanalysis?type=models':'arena-ai?type=text')+(force?'&cache=false':''),fetchImpl,env),checkedAt:new Date().toISOString()}),fetchImpl,force?0:300000);
  const results=await Promise.allSettled([loadLiveBench(fetchImpl,{force}),getUpstream('aa'),getUpstream('arena')]);
  const lb=results[0].status==='fulfilled'?results[0].value:null;
  const boards=['livebench','coding','reasoning','analysis'].map(key=>({key,label:AI_MODEL_OPTIONS.find(o=>o.value===key).label,role:'capability',status:lb?'ok':'failed',version:lb?.version||'',checkedAt:lb?.checkedAt||'',url:'https://livebench.ai/',dataUrl:lb?.dataUrl||'',items:lb?scoreLiveBench(lb.rows,lb.categories,key):[]}));
  for(const [index,key,label,url,role] of [[1,'aa','Artificial Analysis','https://artificialanalysis.ai/leaderboards/models','capability'],[2,'arena','Arena 用户偏好','https://arena.ai/leaderboard/text','preference']]) {
    const result=results[index];let items=[];try{if(result.status==='fulfilled')items=rankRows(result.value.payload);}catch{}
    boards.push({key,label,url,role,status:items.length?'ok':'failed',version:'',checkedAt:items.length?result.value.checkedAt:'',sourceUpdatedAt:result.status==='fulfilled'?result.value.payload.updateTime:'',items});
  }
  const consensus=buildModelConsensus(boards.filter(b=>['livebench','aa'].includes(b.key)));
  return {code:200,boards,consensus,methodVersion:2,composition:{owner:'wuaihot',unit:'model-version',configuration:'best-ranked-per-source',missing:'excluded',sources:['livebench','aa']},checkedAt:new Date().toISOString()};
}
export async function handleAiModels({req,res,pathValue,fetchImpl=fetch,env=process.env}) {
  if(!['ai-model-board','livebench'].includes(pathValue))return false;
  const fail=(code,message)=>{res.setHeader('cache-control','no-store');res.status(code).json({code,message});return true;};
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('allow','GET, HEAD');return fail(405,'Method not allowed');}
  const queryError=aiRankingQueryError(Object.fromEntries(Object.entries(req.query||{}).filter(([key])=>!['view','offset','limit'].includes(key))));if(queryError)return fail(400,queryError);
  const window=parseModelBoardView(req.query||{});if(window.error)return fail(400,window.error);
  if(pathValue==='livebench'&&window.view!=='full')return fail(400,'Full-detail ranking does not accept board pagination');
  const force=String(req.query.cache)==='false';
  const type=String(req.query.type||(pathValue==='livebench'?'livebench':'consensus'));if(!AI_MODEL_OPTIONS.some(o=>o.value===type) || pathValue==='livebench' && !['livebench','coding','reasoning','analysis'].includes(type))return fail(400,'Unknown ranking');
  try {
    // Standalone LiveBench doesn't wait on unrelated providers.
    let payload;
    if(pathValue==='livebench') {const lb=await loadLiveBench(fetchImpl,{force});payload={boards:[{key:type,role:'capability',status:'ok',label:'LiveBench',items:scoreLiveBench(lb.rows,lb.categories,type),version:lb.version,checkedAt:lb.checkedAt,url:'https://livebench.ai/'}]};}
    else payload=await cachedAiInput('ai-model-computed:'+String(env.INTERNAL_API_BASE_URL||env.INTERNAL_API_FALLBACK_BASE_URL||''),()=>loadAiModelBoards(fetchImpl,env,{force}),fetchImpl,force?0:60000);
    if(payload.boards.every(b=>b.status==='failed'))return fail(503,'Model benchmarks temporarily unavailable');
    if(pathValue==='ai-model-board' && window.view!=='full') {
      const projection=window.view==='summary'?summarizeModelBoards(payload):modelBoardPage(payload,{...window,type});
      if(!projection)return fail(400,'Unknown ranking');
      res.setHeader('cache-control',force?'no-store':'public, max-age=60, stale-while-revalidate=120');
      res.status(200).json(projection);
      return true;
    }
    const board=payload.boards.find(b=>b.key===type),items=type==='consensus'?payload.consensus:board?.items||[];
    const data=items.map(row=>({id:'ai-model:'+type+':'+row.model,title:row.model,originalTitle:row.model,noAutoTranslate:true,url:row.url||board?.url||'https://livebench.ai/',rank:row.rank,
      desc:type==='consensus'?'本站位置指数 '+row.score.toFixed(1)+' · '+row.coverage+' 个能力源 · 各站最佳测试配置'+(row.configurationVaries?'不同':'一致')+'，原榜与配置见方法':row.score!==null?'测试均值 '+row.score.toFixed(2)+' / 100 · '+(board?.version||''):row.description,
      extra:{aiModel:row,ranking:{type,version:board?.version||'',checkedAt:board?.checkedAt||payload.checkedAt}},displayMetric:row.score!==null?{kind:'score',value:row.score}:undefined}));
    res.setHeader('cache-control',force?'no-store':'public, max-age=60, stale-while-revalidate=120');res.status(200).json({...payload,code:200,name:pathValue,title:pathValue==='livebench'?'LiveBench':'全球 AI 模型榜',type:AI_MODEL_OPTIONS.find(o=>o.value===type).label,selectedType:type,description:'独立测试与跨榜比较，保留配置、覆盖和原始证据。',link:'https://livebench.ai/',data,total:data.length,updateTime:board?.checkedAt||payload.checkedAt,params:{type:{name:'榜单',type:Object.fromEntries(AI_MODEL_OPTIONS.filter(o=>pathValue!=='livebench'||['livebench','coding','reasoning','analysis'].includes(o.value)).map(o=>[o.value,o.label]))}}});return true;
  }catch{return fail(503,'Model benchmarks temporarily unavailable');}
}
