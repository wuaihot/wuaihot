import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AI_LENSES, aiMatchesLens, AI_READER_DEFAULTS, normalizeAiReader, readAiQuery, buildAiQuery, aiItemKey, aiRefreshChanges } from "../src/utils/aiWorkspace.mjs";
import { AI_WORKSPACE_COPY } from "../src/config/ai-workspace-copy.mjs";
const item = (id, source, extra = {}) => ({ id, title: "Original", url: "https://example.org/"+id, extra: {aiSignal:{primarySource:source}}, ...extra });
const media = item("media","36kr-ai",{extra:{aiSignal:{primarySource:"36kr-ai",kind:"model",confirmations:[{source:"openai-news",url:"https://openai.com/index/example",title:"Associated"}]}}});
assert.equal(aiMatchesLens(media,"official"),false);
assert.equal(aiMatchesLens(item("official","openai-research"),"official"),true);
for (const [source,lens] of [["github-ai-trending","repositories"],["hf-models","models"],["hf-papers","papers"],["paperswithcode","papers"],["hackernews-ai","discussion"],["reddit-localllama","discussion"]]) {
 assert.equal(aiMatchesLens(item(source,source),"all"),true);
 assert.equal(aiMatchesLens(item(source,source),lens),true);
 for (const other of AI_LENSES.filter(value=>value!=="all" && value!==lens)) assert.equal(aiMatchesLens(item(source,source),other),false);
}
assert.equal(aiMatchesLens(item("unknown","unknown"),"all"),true);
assert.equal(aiMatchesLens(media,"models"),false); // A model keyword is not a model-directory source.
assert.deepEqual(normalizeAiReader(null),AI_READER_DEFAULTS);
assert.deepEqual(normalizeAiReader({summaries:"false",images:1,original:null,compact:[]} ),AI_READER_DEFAULTS);
assert.deepEqual(normalizeAiReader({summaries:false,images:true,original:true,compact:false,unknown:true}),{summaries:false,images:true,original:true,compact:false});
const query={q:"Claude",source:"failed-feed",category:"unavailable-kind",lens:"papers",sort:"latest",confirmed:"1",page:"3",size:"50",extra:"preserved"};
const state=readAiQuery(query);
assert.equal(state.source,"failed-feed"); assert.equal(state.category,"unavailable-kind");
assert.deepEqual(buildAiQuery(query),query);
assert.deepEqual(buildAiQuery(query,{lens:"all",page:1}),{q:"Claude",source:"failed-feed",category:"unavailable-kind",sort:"latest",confirmed:"1",size:"50",extra:"preserved"});
assert.equal(readAiQuery({lens:"wrong",sort:"hot",page:"-5",size:"999",confirmed:true}).lens,"all");
assert.deepEqual(readAiQuery({lens:["models","papers"],page:"0",size:"100"}),{lens:"models",category:"all",source:"all",board:"all",time:"24h",sort:"smart",confirmed:false,page:1,size:100});
assert.equal(readAiQuery({page:"NaN",size:"NaN"}).page,1);
assert.deepEqual(buildAiQuery({}, {source:"all",category:"all",sort:"smart",page:1,size:30}),{});
assert.equal(readAiQuery({board:'technical'}).board,'technical');
assert.equal(readAiQuery({board:'research'}).board,'research');
assert.deepEqual(buildAiQuery({board:'technical',q:'Codex'},{board:'all',category:'models'}),{q:'Codex',category:'models'});
const a=item("a","github-ai-trending"), b=item("b","hf-models"), c=item("c","hf-papers");
assert.equal(aiItemKey({...a,title:"Updated"}),aiItemKey(a));
assert.equal(aiItemKey(item(undefined,"hf-models")), "hf-models|https://example.org/undefined");
assert.deepEqual(aiRefreshChanges([a,b],[{...a,title:"Updated"},c]),{added:1,removed:1,updated:1,reordered:false,total:3});
assert.deepEqual(aiRefreshChanges([a,b],[b,a]),{added:0,removed:0,updated:0,reordered:true,total:0});
assert.equal(aiRefreshChanges([a,b],[a,b]).total,0);
for (const locale of ["zh-CN","en","zh-TW","ja","ko"]) {
 const copy=AI_WORKSPACE_COPY[locale]; assert.ok(copy);
 assert.deepEqual(Object.keys(copy).sort(),Object.keys(AI_WORKSPACE_COPY["zh-CN"]).sort());
 assert.deepEqual(Object.keys(copy.lenses),AI_LENSES);
 for (const value of Object.values(copy).filter(value=>typeof value==="string")) assert.ok(value.trim());
}
for(const source of ['linuxdo','v2ex','reddit-localllama','csdn','juejin','hackernews'])assert.equal(aiMatchesLens({extra:{aiSignal:{primarySource:source}}},'discussion'),true,source+' remains discoverable through the community filter');
assert.equal(aiMatchesLens({extra:{aiSignal:{primarySource:'tieba'},discovery:{variant:'hot'}}},'discussion'),true);
assert.equal(aiMatchesLens({extra:{aiSignal:{primarySource:'tieba'},discovery:{variant:'software-today'}}},'discussion'),false);
const view=readFileSync(new URL("../src/views/AiTopic.vue",import.meta.url),"utf8");
assert.ok(view.includes("AiIntelligenceBoard") && view.includes('class="ai-navigation"'));
assert.ok(!view.includes('{ key: "category", value: activeCategory.value'), "topic selection has one home");
const controls=readFileSync(new URL("../src/components/AiTopicControls.vue",import.meta.url),"utf8");
assert.ok(controls.includes('scope="topic"') && controls.includes("'compact'"), 'width and layout controls remain beside the reader');
assert.ok(view.includes('getBoundingClientRect().width || 0) >= 1080'));
assert.match(view,/generation===requestGeneration/); assert.match(view,/if\(!isCurrent\(\)\)return/); assert.ok(view.includes("requestGeneration++"));
assert.match(view,/await applyAutomaticUpdate\(\(\)=>\{[^}]*result\.value=incoming;/); assert.ok(view.includes("captureReadingAnchor"));
assert.ok(!view.includes('activeSource.value = "all"'));
assert.ok(!view.includes("<n-input")); // Search belongs to the shared header.
console.log("AI_WORKSPACE_OK: board with independent provenance filters, preserved URL filters, optional device preferences, automatic updates with reading anchor, five locales, responsive boundary and request guard");
