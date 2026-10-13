import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MODEL_BOARD_INITIAL_ROWS,MODEL_BOARD_PAGE_SIZE,MODEL_BOARD_MAX_PAGE_SIZE,
  parseModelBoardView,summarizeModelBoards,modelBoardPage} from '../src/utils/aiModelBoardPaging.js';
const createRows=(prefix,n)=>Array.from({length:n},(_,i)=>({model:prefix+'-'+i,rank:i+1,score:100-i/10,url:'https://example.com/'+prefix+'/'+i}));
const payload={boards:[
  {key:'livebench',status:'ok',items:createRows('livebench',453),version:'2026-10-01'},
  {key:'coding',status:'ok',items:createRows('coding',440)},
  {key:'reasoning',status:'ok',items:createRows('reasoning',380)},
  {key:'analysis',status:'ok',items:createRows('analysis',399)},
  {key:'aa',status:'ok',items:createRows('aa',320)},
  {key:'arena',status:'ok',items:createRows('arena',280)},
],consensus:createRows('consensus',221),checkedAt:'2026-10-11T00:00:00Z',methodVersion:2};
const summary=summarizeModelBoards(payload);
assert.equal(summary.code,200);
assert.equal(summary.boards[0].total,453);
assert.equal(summary.boards[0].items.length,MODEL_BOARD_INITIAL_ROWS);
assert.equal(summary.consensus.length,MODEL_BOARD_INITIAL_ROWS);
assert.equal(summary.consensusTotal,221);
assert.equal(summary.boards.reduce((n,b)=>n+b.items.length,0)+summary.consensus.length,7*MODEL_BOARD_INITIAL_ROWS,
  'even 450-record rankings send only twelve rows per board');
assert.equal(payload.boards[0].items.length,453,'projection must not mutate the full ranking details');
const first=modelBoardPage(payload,{type:'livebench',offset:MODEL_BOARD_INITIAL_ROWS,limit:MODEL_BOARD_PAGE_SIZE});
assert.equal(first.items.length,MODEL_BOARD_PAGE_SIZE);
assert.equal(first.items[0].model,'livebench-12');
assert.equal(first.total,453);
assert.equal(first.hasMore,true);
assert.equal(first.offset,12);
const last=modelBoardPage(payload,{type:'livebench',offset:444,limit:MODEL_BOARD_PAGE_SIZE});
assert.equal(last.items.length,9);
assert.equal(last.hasMore,false);
assert.equal(modelBoardPage(payload,{type:'invalid',offset:0,limit:16}),null);
for(const query of [{view:'page',offset:'-1'},{view:'page',offset:'01'},
  {view:'page',offset:'100001'},{view:'page',limit:'0'},{view:'page',limit:'41'},
  {view:'summary',offset:'0'},{view:'random'}])assert.ok(parseModelBoardView(query).error,JSON.stringify(query));
assert.deepEqual(parseModelBoardView({view:'page',offset:'12',limit:'16'}),{view:'page',offset:12,limit:16});
assert.equal(MODEL_BOARD_MAX_PAGE_SIZE,40);
const component=readFileSync('src/components/AiModelExplorer.vue','utf8');
const api=readFileSync('api/_ai-models.js','utf8');
const hover=readFileSync('src/components/HoverMenuSelect.vue','utf8');
const topic=readFileSync('src/views/AiTopic.vue','utf8');
assert.ok(component.includes("fetch('/api/ai-model-board?view=summary'"),'initial fetch must use the small projection');
assert.ok(component.includes("&offset='+offset+'&limit='+MODEL_BOARD_PAGE_SIZE"),'more records fetched only for selected board scroll');
assert.ok(component.includes('@scroll="position=>onBoardScroll(key,position)"'),'Naive scrollbar triggers demand loading');
assert.ok(component.includes('items.slice(0,visibleLimits.value[key] || MODEL_BOARD_INITIAL_ROWS)'),'custom variants also cap DOM rows');
assert.ok(component.includes('pageBusy.value[key]')&&component.includes('gen!==generation'),'requests coalesce and ignore late/aborted pages');
assert.ok(api.includes('summarizeModelBoards(payload)')&&api.includes('modelBoardPage(payload,'),'API keeps full detail but exposes bounded summary and page');
assert.ok(hover.includes('v-if="isOpen"')&&hover.includes('getSourceLogoFallback')&&hover.includes('img v-if="variant === \'model\''),'model option images mount only when opening menu and use platform logo fallback');
assert.ok(topic.includes('background:transparent;')&&topic.includes('padding:0;\n  border:0;\n  border-radius:0;'),'no redundant outer workspace border/background/padding');
assert.ok(topic.includes('font-size:13px;font-weight:650')&&topic.includes('class="ai-brand-metadata"'),'readable 13px tabs and metadata moved to banner summary');
console.log('AI_MODEL_PAGING_OK: 453-row source bounded to 12+16 on demand; full rankings intact; menu logos lazy; overview chrome removed');
