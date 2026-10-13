import assert from "node:assert/strict";
import {createRequire} from "node:module";
const {handleTrendsCatalogProxy,handleTrendsRankingProxy,getCatalogEndpoint}=createRequire(import.meta.url)("../api/_trends-catalog.js");
const env={VITE_TRENDS_DIRECTORY_API:"https://provider.test/trends",VITE_TRENDS_PUBLIC_API:"https://provider.test/trends/public/v1"};
assert.equal(getCatalogEndpoint("display",env),"https://provider.test/trends/display/v1/catalog");
const makeRes=()=>({headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},json(v){this.body=v}});
let target;
for(const surface of ["directory","public","display","status"]) {
 const res=makeRes();
 await handleTrendsCatalogProxy({req:{method:"GET",query:{surface}},res,pathValue:"trends-catalog",env,fetchImpl:async url=>{target=url;return {ok:true,json:async()=>surface==="status"?{sources:1,variants:1}:{sources:[{key:"sina",publicAvailable:false}]}}}});
 assert.equal(res.code,200); assert.equal(target.hostname,"provider.test");
 assert.equal(surface==="status"?res.headers["cache-control"]==="no-store":Array.isArray(res.body.sources),true);
}
for(const [method,surface,status] of [["POST","public",405],["GET","https://attacker.test",400]]) {
 const res=makeRes();await handleTrendsCatalogProxy({req:{method,query:{surface}},res,pathValue:"trends-catalog",env,fetchImpl:()=>assert.fail("invalid input reached network")});assert.equal(res.code,status);
}
const res=makeRes();await handleTrendsCatalogProxy({req:{method:"GET",query:{surface:"display"}},res,pathValue:"trends-catalog",env,fetchImpl:async()=>{throw new Error("private transport detail")}});assert.equal(res.code,502);assert.equal(JSON.stringify(res.body).includes("private transport"),false);
const calls=[];
const rankingFetch=async url=>{
 const target=new URL(url); calls.push(target);
 return {ok:true,json:async()=>target.pathname.endsWith("/catalog")
   ? {sources:[{key:"weibo",defaultVariant:"hot",variantGroups:[{options:[{key:"hot"},{key:"entertainment"},{key:"disabled",runtimeAvailability:"unavailable"}]}]}]}
   : {data:{source:{key:"weibo"},items:[{rank:1,title:"真实榜单"}]}}};
};
const ranking=async (query={},pathValue="trends-ranking/weibo",method="GET",fetchImpl=rankingFetch)=>{
 const result=makeRes();await handleTrendsRankingProxy({req:{method,query:{surface:"display",...query}},res:result,pathValue,env,fetchImpl});return result;
};
assert.equal((await ranking({variant:"entertainment",limit:1000})).code,200);
assert.equal(calls.at(-1).pathname,"/trends/display/v1/rankings/weibo");
assert.equal(calls.at(-1).searchParams.get("variant"),"entertainment");
assert.equal(calls.at(-1).searchParams.get("limit"),"100");
const cachedCatalogCalls=calls.filter(c=>c.pathname.endsWith("/catalog")).length;
assert.equal((await ranking()).code,200);
assert.equal(calls.filter(c=>c.pathname.endsWith("/catalog")).length,cachedCatalogCalls,"same surface must reuse bounded catalog cache");
for(const variant of ["disabled","unknown","https://attacker.test"]) assert.equal((await ranking({variant})).code,404);
assert.equal((await ranking({},"trends-ranking/unknown")).code,404);
assert.equal((await ranking({},"trends-ranking/../secret")).code,400);
assert.equal((await ranking({surface:"private"})).code,400);
assert.equal((await ranking({},"trends-ranking/weibo","POST")).code,405);
assert.equal((await ranking({force:"1"})).headers["cache-control"],"no-store");
const failedRanking=await ranking({force:"1"},"trends-ranking/weibo","GET",async()=>{throw new Error("private credentials")});
assert.equal(failedRanking.code,200);assert.equal(failedRanking.body.refreshFallback,true);assert.equal(JSON.stringify(failedRanking.body).includes("private credentials"),false);
console.log("[catalog-proxy] bounded surfaces and rankings, variant admission, cache/status, methods and sanitized failure verified");

const newVariantFailure=await ranking({variant:"entertainment",limit:99,force:"1"},"trends-ranking/weibo","GET",async()=>{throw new Error("upstream unavailable")});
assert.equal(newVariantFailure.code,502,"never borrow another period/limit snapshot");
for (const status of [403,404]) {
 assert.equal((await ranking({force:"1"},"trends-ranking/weibo","GET",async()=>({ok:false,status}))).code,status,"denied data must not fall back or become a transient failure");
 assert.equal((await ranking({},"trends-ranking/weibo","GET",async()=>({ok:false,status}))).code,status,"denial evicts fresh server cache too");
}
assert.equal(calls.filter(c=>c.pathname.endsWith("/catalog")).length,cachedCatalogCalls,"ranking refresh must not force re-read admission catalog");
