import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  DEFAULT_MODEL_BOARD_KEYS,
  normalizeModelBoardSelections,
  reorderModelBoardSelections,
  moveModelBoardSelection,
} from '../src/utils/aiModelBoardOrder.mjs';

const defaults=['livebench','aa','arena','consensus'];
assert.deepEqual(DEFAULT_MODEL_BOARD_KEYS,defaults,'historical default four columns are unchanged');
assert.deepEqual(normalizeModelBoardSelections(null),defaults);
assert.deepEqual(normalizeModelBoardSelections(['arena','consensus','livebench','aa']),['arena','consensus','livebench','aa'],'saved order remains authoritative');
assert.deepEqual(normalizeModelBoardSelections(['arena','arena','not-a-board','consensus']),['arena','consensus','livebench','aa'],'invalid/duplicate storage repaired without losing valid slots');
assert.deepEqual(normalizeModelBoardSelections(['coding','reasoning','aa','arena'],[...defaults,'coding','reasoning']),['coding','reasoning','aa','arena'],'custom boards survive refresh when available');
const base=['livebench','aa','arena','consensus'],desired=['consensus','arena','aa','livebench'];
assert.deepEqual(reorderModelBoardSelections(base,desired),desired);
assert.deepEqual(base,['livebench','aa','arena','consensus'],'reorder never mutates API or caller arrays');
assert.equal(reorderModelBoardSelections(base,['consensus','consensus','aa','arena']),null,'duplicate drag result rejected');
assert.equal(reorderModelBoardSelections(base,['consensus','arena','aa','unsafe']),null,'unknown dragged board rejected');
assert.deepEqual(moveModelBoardSelection(base,'aa',-1),['aa','livebench','arena','consensus']);
assert.deepEqual(moveModelBoardSelection(base,'arena',1),['livebench','aa','consensus','arena']);
assert.equal(moveModelBoardSelection(base,'livebench',-1),null,'keyboard left boundary respected');
assert.equal(moveModelBoardSelection(base,'consensus',1),null,'keyboard right boundary respected');

const model=readFileSync('src/components/AiModelExplorer.vue','utf8');
const page=readFileSync('src/views/AiTopic.vue','utf8');
const ai=readFileSync('src/components/AiIntelligenceBoard.vue','utf8');
const chigua=readFileSync('src/views/ChiguaTopic.vue','utf8');
for(const marker of ['import draggable from','handle=".model-board-drag-handle"',':item-key="key => key"','@update:model-value="reorder"','aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"','@keydown.left.prevent="move(key,-1)"','@keydown.right.prevent="move(key,1)"','data-model-board="key"','model-board-ghost','model-board-announcement']) {
  assert.ok(model.includes(marker),'model drag-and-keyboard contract: '+marker);
}
assert.ok(model.includes("storage='wuaihot-ai-model-cards-v1'"),'existing four-column preferences migrate in place');
assert.ok(model.includes('normalizeModelBoardSelections')&&model.includes('reorderModelBoardSelections')&&model.includes('moveModelBoardSelection'),'pure persisted-order helpers are used');
assert.ok(model.includes('optionsFor(key)')&&model.includes('option.value!==key&&selections.value.includes(option.value)'),'already-selected sources not accidentally duplicated');
assert.ok(model.includes('grid-template-columns:repeat(4,minmax(0,1fr))'),'desktop grid remains four columns');
assert.ok(model.includes('@container model-boards (max-width:1050px)'),'mobile/small-screen horizontal progressive disclosure retained');
assert.ok(model.includes('ol>li:nth-child(1)>.model-number')&&model.includes('border-bottom:1px solid color-mix'),'compact ranked rows reuse Chigua editorial hierarchy without copying data semantics');
assert.ok(page.includes("'is-model-panel': modelView")&&page.includes("'is-model-workspace': modelView"),'banner, tabs, and model board form a single panel-specific workspace');
assert.ok(page.includes('is-model-workspace')&&page.includes('.ai-topic:is(.is-model-panel,.is-intelligence-panel) .topic-reader'),'top model workspace and bottom reader form two sections');
assert.ok(page.includes('modelView ? modelIdentity.title : copy.title'),'model-specific banner is applied only in model view');
for(const locale of ['zh-CN','zh-TW','en','ja','ko'])assert.ok(page.includes(`'${locale}': { title:`)||page.includes(`${locale}: { title:`),'all five locales have explicit model identity');
assert.ok(ai.includes('class="ai-board-grid"')&&ai.includes('board-drag-handle'),'established Intelligence board has not been converted in this stage');
assert.ok(chigua.includes('<TopicLaneGrid'),'Chigua remains an independent reference and is not modified');
const hover=readFileSync('src/components/HoverMenuSelect.vue','utf8');
const logos=readFileSync('src/utils/sourceLogos.js','utf8');
assert.ok(hover.includes("variant === 'model' && activeIcon") && hover.includes("variant === 'model' && option.icon"),'model headings and popover choices must show the same scoped icon');
assert.ok(logos.includes('livebench: "/logo/ai/livebench.svg"')&&logos.includes('artificialanalysis: "/logo/ai/artificialanalysis.png"')&&logos.includes('"arena-ai": "/logo/ai/arena-ai.png"'),'model icon sources match the category navigation logos');
assert.ok(model.includes('getSourceLogo(s.name)')&&model.includes("o.value==='aa'?'artificialanalysis'")&&model.includes("o.value==='arena'?'arena-ai'"),'public source variants and built-in boards reuse category platform logos');
assert.ok(!model.includes('class="model-board-tools"')&&!model.includes('class="model-caption"')&&!model.includes('<footer>'),'repeat footer/caption and redundant lower tools row are removed');
assert.ok(model.includes('height:300px')&&model.includes('defineExpose({refresh,loading,reset})'),'the compact cards keep programmatic reset via header action');
assert.ok(page.includes('class="ai-header-right"')&&page.includes('class="ai-model-reset"')&&page.includes('class="ai-model-help"'),'banner actions, methodology and reset are grouped on the right');
assert.ok(page.includes("'is-intelligence-workspace': !modelView && !monitorView")&&page.includes('is-intelligence-workspace :deep(.ai-board)'),'AI Intelligence banner is joined to its existing four lanes without changing card internals');
assert.ok(page.includes('border:0;font-size:13px')&&page.includes('font-size:clamp(19px,1.65vw,23px)'),'tabs have no underline and remain legible, with two equal-scale headlines');
assert.ok(page.includes('class="ai-panel-switch"')&&page.indexOf('class="ai-panel-switch"')<page.indexOf('</header>'),'view-switch tabs live inside the banner header');
console.log('AI_MODEL_WORKSPACE_OK: isolated model banner+board visual group, four draggable keyboard-operable persisted cards, compact ranking presentation, five localized headings');
