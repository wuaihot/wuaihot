import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {AI_TOPICS,AI_PRESETS,normalizeAiBoard,matchAiContent,aiContentTopic,aiOriginalRank,aiSourceMetric,aiCanonicalUrl,mergeAiArticles,aiRefinedItem,selectAiBoardItems,aiCuratedScore} from "../src/utils/aiContent.js";
import {aiSourceRole,aiTimes} from "../src/utils/aiEvidence.mjs";
import {AI_BOARD_COPY} from "../src/config/ai-board-copy.mjs";
import {buildAiDiscoveryTargets,projectAiDiscoveredItem,parseAiReleaseAtom,handleAiIntelligence} from "../api/_ai-intelligence.js";
const item=(title,source="media",fields={})=>({title,url:"https://example.org/"+encodeURIComponent(title),extra:{aiSignal:{primarySource:source}},...fields});
const fixedNow=Date.UTC(2026,9,7);
assert.ok(aiCuratedScore(item("EmbeddingGemma 2: an open lightweight multimodal embedding model","deepmind-blog",{publishedAt:fixedNow-3600000}),fixedNow)>aiCuratedScore(item("Introducing Gemini Live","deepmind-blog",{publishedAt:fixedNow-12*86400000}),fixedNow),"an old launch keyword must not displace a current verified publication");
for(const title of ["AI news","Claude Code release","OpenAI update","人工智能芯片","Qwen 3","DeepSeek融资","Kimi模型升级"])assert.ok(matchAiContent(item(title)),title);
for(const title of ["Thailand travel","chair design","mail software","Kimi wins Formula 1 in Miami","Google launches a bicycle","Apple store opens","AIx stock ticker"])assert.equal(matchAiContent(item(title)),"",title);
for(const [title,source,topic] of [
 ["Introducing GPT-6","openai-news","models"],["AI App launch","media","products"],["claude-mem","github-ai-trending","engineering"],
 ["AI benchmark paper","hf-papers","research"],["OpenAI partnership revenue","openai-news","business"],["AI copyright policy","media","safety"],
 ["How to use AI workflow","media","practice"],["GPT-6 leak speculation","reddit-localllama","opinion"]])assert.equal(aiContentTopic(item(title,source)),topic,title);
assert.equal(aiContentTopic(item("Unclear")),"other");
assert.equal(aiContentTopic(item("Claude Code version","claude-code-releases",{desc:"new policy and security checks"})),"engineering");
assert.equal(aiSourceRole("codex-releases"),"official");
for(const source of ["openai","cohere","mistral","meta-ai"])assert.equal(aiSourceRole(source),"official","known primary catalog identity: "+source);
assert.equal(aiSourceRole("hackernews"),"discussion","a linked official URL must not upgrade the discussion channel");
assert.deepEqual(normalizeAiBoard({preset:"invalid",excluded:["openai-news","openai-news","../secret"],refined:false}),{preset:"general",excluded:["openai-news"],refined:false});
assert.equal(aiOriginalRank(item("rank","media",{rank:-2})),null);
assert.equal(aiOriginalRank(item("rank","media",{rank:0})),null);
assert.equal(aiSourceMetric({hot:""}),null);assert.deepEqual(aiSourceMetric({hot:12}),{kind:"value",value:12});
assert.deepEqual(aiSourceMetric({todayStars:0}),{kind:"stars-today",value:0});
assert.equal(aiSourceMetric({metric:{value:-1}}),null);
assert.equal(aiCanonicalUrl("https://www.anthropic.com/news/release"),"https://anthropic.com/news/release");
assert.equal(aiCanonicalUrl("javascript:alert(1)"),"");assert.equal(aiCanonicalUrl("https://u:p@example.org/"),"");
assert.equal(aiCanonicalUrl("https://example.org/report?utm_source=x&ref=y#fragment"),"https://example.org/report");
const original=item("Report","openai-news",{url:"https://example.org/report",extra:{aiSignal:{primarySource:"openai-news",primaryRank:3}}});
const other=item("Same report","hackernews",{url:"https://example.org/report?utm_source=hn",metric:{kind:"points",value:500},rank:1,extra:{aiSignal:{primarySource:"hackernews"},discovery:{source:"hackernews",originalRank:1}}});
const merged=mergeAiArticles([original],[other]);
assert.equal(merged.length,1);assert.equal(merged[0].metric,undefined,"secondary metrics must not become official primary metrics");
assert.equal(aiOriginalRank(merged[0]),3,"secondary rank must not become primary rank");
assert.equal(merged[0].extra.aiSignal.primarySource,"openai-news");
assert.equal(mergeAiArticles([original],[{...other,url:"https://example.org/another"}]).length,2,"similar titles never merge unrelated events");
const native={...original,metric:{kind:"heat",value:1},extra:{...original.extra,discovery:{source:"openai-news",originalRank:9}}};
assert.equal(aiOriginalRank(mergeAiArticles([original],[native])[0]),9,"native original rank wins over aggregation sequence");
assert.equal(aiTimes(mergeAiArticles([original],[{...native,publishedAt:"2026-10-06T00:00:00Z"}])[0]).published,Date.parse("2026-10-06T00:00:00Z"));
assert.equal(aiTimes(mergeAiArticles([original],[{...other,publishedAt:"2026-10-06T00:00:00Z"}])[0]).published,null,"secondary-source publication is not a primary-source timestamp");
assert.equal(aiRefinedItem(item("a model","hf-models")),true,"restoring an inventory source remains effective with refined mode");
assert.equal(aiRefinedItem(item("AI research","paperswithcode")),true);
assert.equal(aiRefinedItem(item("Review","producthunt-ai")),false);
assert.equal(aiRefinedItem(item("Claude update","producthunt-ai")),true);
assert.equal(aiRefinedItem(item("DeepSeek Harness 薅羊毛")),false);
assert.equal(aiRefinedItem(item("免费开源AI部署教程")),true);
const diverse=selectAiBoardItems([item("Release Codex 1","codex-releases"),item("Release Codex 2","codex-releases"),item("Release Claude Code","claude-code-releases"),item("Project 1","github-ai-trending"),item("Project 2","github-ai-trending")]);
assert.equal(diverse.length,4);assert.equal(diverse.filter(i=>i.extra.aiSignal.primarySource==="codex-releases").length,1);assert.equal(diverse.filter(i=>i.extra.aiSignal.primarySource==="github-ai-trending").length,2);
const releasesByTime=selectAiBoardItems([item("Codex older","codex-releases",{updatedAt:"2026-10-06T00:00:00Z"}),item("Codex newer","codex-releases",{updatedAt:"2026-10-07T00:00:00Z"})]);
assert.equal(releasesByTime[0].title,"Codex newer","latest stable release represents its tool");
for(const preset of Object.values(AI_PRESETS))assert.deepEqual([...preset].sort(),[...AI_TOPICS].sort(),"presets retain all topics");
for(const copy of Object.values(AI_BOARD_COPY)){assert.deepEqual(Object.keys(copy).sort(),Object.keys(AI_BOARD_COPY["zh-CN"]).sort());assert.deepEqual(Object.keys(copy.topics),[...AI_TOPICS,"other"]);}
for(const [title,source,expected] of [
 ["Introducing Ray-Ban Meta Audio and More AI Glasses Styles","meta-ai","products"],
 ["The Other Half of the Memory Wall: Serving 35B MoEs from SSD with Trained Routing Prediction","hf-papers","research"],
 ["WeatherNext AI model achieves breakthrough in forecasting cyclones","deepmind-blog","models"],
 ["claude frontier academy","anthropic-news","practice"],
 ["barclays scales claude","anthropic-news","business"],
 ["life sciences verification program","anthropic-news","research"],
 ["如何克服两种文化之分","sina-ai","other"],
])assert.equal(aiContentTopic(item(title,source)),expected,title);
assert.equal(matchAiContent(item("Kimi AI deployment tutorial")),"AI");
const disabled={sources:[{key:"fixture",hotspotEligible:true,variantSelectorEnabled:false,defaultVariant:"hot",variantGroups:[{options:[{key:"hot"},{key:"tech"}]}]}]};
assert.equal(buildAiDiscoveryTargets(disabled,"display","https://fixture-provider.test/display/v1/catalog").length,1);
const catalog={sources:Array.from({length:20},(_,i)=>({key:"news-"+i,name:"News "+i,category:["general","finance","culture","tech"][i%4],dataKind:"feed",defaultVariant:"hot",variantGroups:[{options:[{key:"hot",runtimeAvailability:"available"},{key:"tech",runtimeAvailability:"unavailable"}]}]}))};
catalog.sources.push({key:"stock-table",dataKind:"ranking",hotspotEligible:false,category:"finance"});
const targets=buildAiDiscoveryTargets(catalog,"display","https://fixture-provider.test/display/v1/catalog");
assert.equal(targets.length,20);assert.equal(targets.some(t=>t.variant==="tech"),false);assert.equal(targets.some(t=>t.source==="stock-table"),false);
assert.ok(targets.some(t=>t.category==="culture"));
const projected=projectAiDiscoveredItem({title:"Claude update",url:"https://example.org/report",rank:7,metric:{kind:"points",value:14}},targets[0],{data:{dataKind:"ranking",updatedAt:"2026-10-06T00:00:00Z"}},Date.now());
assert.equal(aiOriginalRank(projected),7);assert.equal(projected.metric.value,14);assert.equal(aiTimes(projected).published,null,"snapshot time is not publication time");
assert.equal(projected.extra.discovery.reason,"Claude");
assert.equal(projectAiDiscoveredItem({title:"ordinary travel",url:"https://example.org/x"},targets[0],{data:{}},Date.now()),null);
const researchTarget={source:'arxiv-ai',name:'Research',variant:'',dataKind:'feed'};
assert.ok(projectAiDiscoveredItem({title:'OpenWAM: Composable World-Action Models',url:'https://arxiv.org/abs/2610.00001'},researchTarget,{data:{dataKind:'feed'}},Date.now()),'dedicated research does not require AI brands in its title');
const communityTargets=buildAiDiscoveryTargets({sources:[{key:'hackernews',defaultVariant:'hot',variantGroups:[{options:['hot','best','new','show','ask','jobs'].map(key=>({key,runtimeAvailability:'available'}))}]}]},'display','https://fixture-provider.test/catalog');
assert.deepEqual(communityTargets.map(t=>t.variant),['hot','best','new','show','ask'],'new posts complement hot discussions without adding jobs');
const env={VITE_TRENDS_DISPLAY_API:"https://fixture-provider.test/display/v1"};
let network=0;
const fetchImpl=async url=>{
 network++;const target=new URL(url);
 if(target.pathname.endsWith("/catalog"))return {ok:true,json:async()=>catalog};
 if(target.pathname.endsWith("/news-3"))throw new Error("private token detail");
 assert.equal(target.hostname,"fixture-provider.test");assert.equal(target.searchParams.get("limit"),"100");
 return {ok:true,json:async()=>({data:{source:{key:target.pathname.split("/").at(-1)},items:[{rank:7,title:"AI launch",url:"https://example.org/"+target.pathname.split("/").at(-1)},{rank:8,title:"ordinary travel",url:"https://example.org/ignored"}]}})};
};
const request=async(query={},method="GET",fetcher=fetchImpl,config=env,pathValue="ai-discovery")=>{
 const res={headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(body){this.body=body}};
 await handleAiIntelligence({req:{method,query},res,pathValue,env:config,fetchImpl:fetcher});return res;
};
const first=await request();
let statusReads=0;
const statusOnly=await request({},'GET',async url=>{
 assert.ok(url.includes('summary.json'),'status endpoint must not read RSS or releases');statusReads++;
 return {ok:true,json:async()=>({status:{indicator:'none',description:'Operational'}})};
},env,'ai-status');
assert.equal(statusOnly.code,200);assert.equal(statusReads,2);assert.equal(statusOnly.body.statuses.length,2);assert.ok(statusOnly.body.checkedAt);
assert.equal(first.code,200);assert.equal(first.body.coverage.checked,16);assert.equal(first.body.coverage.total,20);assert.equal(first.body.next,16);
assert.equal(first.body.feeds.length,16);assert.equal(first.body.feeds.filter(f=>f.status==="failed").length,1);
assert.equal(JSON.stringify(first.body).includes("private token"),false);
const beforeCache=network;await request();assert.ok(network-beforeCache<=1,"successful snapshots are reused; failed source may retry");
const second=await request({cursor:"16",revision:first.body.coverage.revision});assert.equal(second.body.coverage.checked,20);assert.equal(second.body.next,null);
assert.equal((await request({revision:"different"})).code,409);
for(const query of [{cursor:"-1"},{cursor:"99999"},{url:"https://attacker.test"},{source:"../secret"}])assert.equal((await request(query)).code,400);
assert.equal((await request({},"POST")).code,405);
assert.equal((await request({},"GET",fetchImpl,{})).code,503);
assert.equal((await request({},"GET",async()=>{throw Error("private secret")},{VITE_TRENDS_DISPLAY_API:"https://offline.test/display/v1"})).code,503);
const feed={key:"codex-releases",name:"Codex",home:"https://github.com/openai/codex/releases"};
const atom='<feed><entry><title>v1.0.0-alpha.1</title><link rel="alternate" href="'+feed.home+'/tag/alpha"/></entry><entry><title>v1.0.0</title><updated>2026-10-06T00:00:00Z</updated><link rel="alternate" href="'+feed.home+'/tag/v1.0.0"/><content>&lt;p&gt;Added &amp; fixed&lt;/p&gt;</content></entry><entry><title>v2.0.0</title><link href="https://attacker.test/"/></entry></feed>';
const releases=parseAiReleaseAtom(atom,feed);assert.equal(releases.length,1);assert.equal(releases[0].desc,"Added & fixed");
assert.equal(aiTimes(releases[0]).published,null);assert.ok(aiTimes(releases[0]).updated);
assert.throws(()=>parseAiReleaseAtom("invalid",feed));
const view=readFileSync("src/views/AiTopic.vue","utf8");
assert.ok(view.includes("AiIntelligenceBoard")&&view.includes("translateReadableTitles")&&view.includes("excludedSources.value.has(primarySource(item))"));
assert.ok(view.includes("discoveryApplied.value=mergeAiArticles(discovered.data)")&&view.includes("restoreReadingAnchor"));
console.log("AI_BOARD_OK: topics, presets, false positives, exclusions, exact-URL dedup, native rank/metrics, provider admission, bounded cached discovery, partial failures and official Atom semantics");
