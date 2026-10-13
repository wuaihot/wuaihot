import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AI_PRECISION_LANES} from '../src/utils/aiPrecisionBoard.mjs';
import {AI_DEFAULT_VISIBLE_LANES,normalizeAiVisibleLanes,swapAiVisibleLane} from '../src/utils/aiVisibleLanes.mjs';
import {aiContentTopic} from '../src/utils/aiContent.js';
import {AI_BOARD_COPY} from '../src/config/ai-board-copy.mjs';

assert.equal(AI_PRECISION_LANES.length,6);
assert.deepEqual(AI_DEFAULT_VISIBLE_LANES,['news','launches','building','discussion']);
assert.deepEqual(normalizeAiVisibleLanes(null),AI_DEFAULT_VISIBLE_LANES);
assert.deepEqual(normalizeAiVisibleLanes(['news','launches','building','research']),['news','launches','building','research']);
assert.deepEqual(normalizeAiVisibleLanes(['news','news','building','research']),AI_DEFAULT_VISIBLE_LANES);
assert.deepEqual(normalizeAiVisibleLanes(['news','launches','building','research','industry']),AI_DEFAULT_VISIBLE_LANES);
const custom=swapAiVisibleLane(null,'building','research');
assert.deepEqual(custom,['news','launches','research','discussion']);
assert.deepEqual(swapAiVisibleLane(custom,'research','industry'),['news','launches','industry','discussion']);
assert.deepEqual(swapAiVisibleLane(custom,'news','discussion'),custom,'duplicate swap rejected');
assert.deepEqual(swapAiVisibleLane(custom,'research','invalid'),custom,'unknown option rejected');
assert.deepEqual(normalizeAiVisibleLanes(['discussion','news','launches','research']),['discussion','news','launches','research'],'drag reorder kept');
for(const locale of ['zh-CN','zh-TW','en','ja','ko'])assert.ok(AI_BOARD_COPY[locale].switchLane);

const view=readFileSync('src/views/AiTopic.vue','utf8'),board=readFileSync('src/components/AiIntelligenceBoard.vue','utf8');
assert.ok(view.includes(':lanes="visibleBoardLanes"')&&view.includes(':available-lanes="boardLanes"'));
assert.ok(view.includes('replaceVisibleLane')&&view.includes('AI_VISIBLE_LANES_STORAGE'));
assert.ok(!view.includes('ai-lane-switcher')&&!view.includes('laneFocus'),'no full-width, noisy six-chip row');
assert.ok(board.includes('grid-template-columns:repeat(4,minmax(0,1fr))'),'four columns on full-size desktop');
assert.ok(board.includes('laneOptions(lane)')&&board.includes('HoverMenuSelect')&&board.includes('choice.key !== current.key'),'all six lane choices with disabled duplicates through shared menu');
assert.ok(board.includes('draggable'),'drag-to-reorder kept');
const menu=readFileSync('src/components/HoverMenuSelect.vue','utf8');
assert.ok(board.includes('copy.switchLane')&&!board.includes('board-lane-picker'),'the visible selection is a labelled control without stretched invisible native select');
assert.ok(menu.includes('hover-menu-select__chevron')&&menu.includes('align-items:center')&&!menu.includes('⌄'),'centered SVG chevron, not a font glyph with corrective transforms');
assert.ok(menu.includes('(hover: hover) and (pointer: fine)')&&menu.includes("event.pointerType === 'mouse'"),'hover opens only for precision mouse input');
assert.ok(menu.includes("event.key === 'Escape'")&&menu.includes('ArrowDown')&&menu.includes('role="listbox"')&&menu.includes('role="option"'),'keyboard and accessible listbox contract');
assert.ok(menu.includes('clearTimeout(enterTimer)')&&menu.includes('clearTimeout(leaveTimer)')&&menu.includes('HOVER_MENU_OPEN_EVENT'),'hover-intent cancellation and one open menu');
assert.ok(board.includes('height:43px;min-height:43px')&&board.includes('opacity:.3;cursor:grab'),'compact single-line header with subdued drag affordance');
assert.ok(board.includes('data-lane="lane.key"')||board.includes(':data-lane="lane.key"'),'lane structure retained');

const item=(title,source='reddit-localllama')=>({title,originalTitle:title,extra:{aiSignal:{primarySource:source}}});
const expectations=[
 [item('Mistral Large 4','simon-blog'),'models'],
 [item('Qwen3.8 27B addition in words','simon-blog'),'models'],
 [item('GLM 5.3 Flash opensource @ the top of Artificial Analysis Cyber Index over Claude.'),'models'],
 [item('OpenAI “rogue” agent activities found on Wikimedia projects','simon-blog'),'safety'],
 [item('[2610.08927] Can AI Agents Make Open-Ended Scientific Discovery? Evidence from Station','reddit-machinelearning'),'research'],
 [item('The Alchemy of Semi-Supervision [R]','reddit-machinelearning'),'research'],
 [item('I built ALHR: sparse attention through low-dimensional parameter mapping [P]','reddit-machinelearning'),'engineering'],
 [item('ttok 1.0','simon-blog'),'engineering'],
 [item('Claude model updates: Do you think new users will leave social media?','reddit-artificial'),'opinion'],
 [item('Typesafe AI raises $870M at $7.5B','hackernews'),'business'],
 [item('AI写小说的一些经验和讨论','linuxdo'),'practice'],
 [item('Quoting The New York Times','simon-blog'),'other'],
 [item('[D] Monthly Who\'s Hiring and Who wants to be Hired?','reddit-machinelearning'),'other'],
 [item('SAC tickets non-transferable? [D]','reddit-machinelearning'),'other'],
 [item('Are .ipynb notebooks already outdated in the agentic era? [D]','reddit-machinelearning'),'opinion'],
 [item('Is an LLM reasoning agent worth it? [D]','reddit-machinelearning'),'opinion'],
 [item('New notebook IDE 1.2 [D]','reddit-machinelearning'),'other'],
];
for(const [entry,category] of expectations)assert.equal(aiContentTopic(entry),category,entry.title);
const firstPartyUpdate=(title,analysis)=>({title,originalTitle:title,extra:{aiSignal:{primarySource:'ai-author-thsottiaux'},aiAnalysis:analysis}});
const grounded={state:'evidence-grounded',kind:'product-update',facts:[{text:'Official subscription update',quote:'Your ChatGPT subscription is now also a Devin subscription'}]};
assert.equal(aiContentTopic(firstPartyUpdate('Your ChatGPT subscription is now also a Devin subscription',grounded)),'products','actual verified Devin+ChatGPT subscription update');
assert.equal(aiContentTopic(firstPartyUpdate('Dots got a pretty big upgrade',{...grounded,facts:[{text:'New Codex integration',quote:'Your dot can now start work in Codex and follow up on existing threads'}]})),'products','evidence-grounded dots product upgrade');
assert.equal(aiContentTopic(firstPartyUpdate('Dots got a pretty big upgrade',{...grounded,state:'pending'})),'other','unreviewed claims must never become products');
assert.equal(aiContentTopic(firstPartyUpdate('Dots got a pretty big upgrade',{...grounded,facts:[]})),'other','empty fact evidence cannot establish product change');
const quoting=item('Quoting The New York Times','simon-blog');
assert.equal(aiContentTopic({...quoting,originalDesc:'Anthropic detailed the activity of its A.I. agents after automated visa applications to the State Department website.'}),'safety','concrete sourced agent-government incident');
assert.equal(aiContentTopic({...quoting,originalDesc:'Some newspaper quotes unrelated to AI or any incident.'}),'other','generic quote remains honestly unknown');
console.log('AI_RADAR_228_OK: exactly four editable visible columns, all six choices preserved in hover-capable accessible dropdown, drag order, five locales, grounded category recovery and honest unknowns');
