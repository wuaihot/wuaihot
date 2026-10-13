import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const apiSource=readFileSync('api/_ai-models.js','utf8');
assert.ok(apiSource.includes("from '../src/utils/aiModelBoardPaging.js'"),'Vercel CommonJS function must import the transpileable .js helper, never require an ESM-only .mjs');
assert.ok(!apiSource.includes('aiModelBoardPaging.mjs'),'critical: ESM-only .mjs import crashes the shared production API function');
import {handleAiModels} from '../api/_ai-models.js';
const csv='model,r,c,d\nQwen-1,72,82,78\nGPT-2,92,93,89\nClaude-3,86,87,84\nGemini-4,80,85,83\n';
const sources=[
  {originalTitle:'GPT-2',url:'https://example.com/gpt',rank:1},
  {originalTitle:'Qwen-1',url:'https://example.com/qwen',rank:2},
  {originalTitle:'Claude-3',url:'https://example.com/claude',rank:3},
  {originalTitle:'Gemini-4',url:'https://example.com/gemini',rank:4},
];
let calls=0;
const stub=async url=>{
  calls++;
  const s=String(url);
  if(s.endsWith('/src/lib/constants.js'))return new Response('export const RELEASES = ["2026-06-25"];',{status:200});
  if(s.endsWith('/public/table_2026_06_25.csv'))return new Response(csv,{status:200});
  if(s.endsWith('/public/categories_2026_06_25.json'))return new Response(JSON.stringify({'Reasoning':['r'],'Coding':['c'],'Data Analysis':['d']}),{status:200});
  if(s.includes('artificialanalysis?type=models')||s.includes('arena-ai?type=text'))return new Response(JSON.stringify({code:200,data:sources,updateTime:'2026-10-11T00:00:00Z'}),{status:200});
  throw Error('Unexpected upstream: '+s);
};
const env={INTERNAL_API_BASE_URL:'https://mock.wuaihot.invalid'};
const request=async (pathValue,query)=>{
  const res={statusCode:200,headers:{},data:null,
    setHeader(k,v){this.headers[k]=v;},
    status(n){this.statusCode=n;return this;},
    json(payload){this.data=payload;return this;}};
  const handled=await handleAiModels({req:{method:'GET',query},res,pathValue,fetchImpl:stub,env});
  assert.equal(handled,true);
  return res;
};
const summary=await request('ai-model-board',{view:'summary'});
assert.equal(summary.statusCode,200);
assert.equal(summary.data.boards.length,6);
assert.equal(summary.data.boards.find(b=>b.key==='livebench').total,4);
assert.equal(summary.data.consensusTotal,4);
assert.equal(summary.data.data,undefined,'model dashboard summary must omit the redundant full-detail data array');
const first=await request('ai-model-board',{view:'page',type:'livebench',offset:'1',limit:'2'});
assert.equal(first.statusCode,200);assert.equal(first.data.items.length,2);assert.equal(first.data.offset,1);
assert.equal(first.data.total,4);assert.equal(first.data.boards,undefined);
const full=await request('ai-model-board',{type:'livebench'});
assert.equal(full.statusCode,200);
assert.equal(full.data.data.length,4);
assert.ok(full.data.boards[0].items.length===4,'independent ranking detail API keeps legacy full semantics');
assert.equal((await request('ai-model-board',{view:'page',type:'livebench',limit:'200'})).statusCode,400,'unbounded page rejected');
assert.equal((await request('ai-model-board',{view:'summary',offset:'0'})).statusCode,400);
assert.equal((await request('ai-model-board',{view:'summary',unknown:'yes'})).statusCode,400);
assert.equal((await request('livebench',{view:'summary',type:'livebench'})).statusCode,400,'standalone ranking is not accidentally paginated');
assert.ok(calls<=5,'cached upstream sources are shared across summary, page and detail');
console.log('AI_MODEL_ENDPOINT_PAGING_OK: compact dashboard summary, strict page windows, unchanged full-detail API, shared upstream cache');
