import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const topic=readFileSync('src/views/AiTopic.vue','utf8');
const explorer=readFileSync('src/components/AiModelExplorer.vue','utf8');

// The user-facing reader always retains its historical 3-column workspace.
for(const marker of [
  'ref="readerContainerRef" class="topic-reader"',
  '<nav class="ai-navigation"',
  'ref="eventListRef" class="ai-main"',
  '<aside v-if="wideLayout" class="ai-settings"',
  '.is-wide .ai-workspace { grid-template-columns: minmax(160px,17%) minmax(0,1fr) minmax(190px,20%);',
  'readerContainerRef.value?.getBoundingClientRect().width || 0) >= 1080',
])assert.ok(topic.includes(marker),'reading layout contract: '+marker);
assert.ok(!topic.includes('加载深入阅读')&&!topic.includes('ai-reader-deferred'),
  'reading content must not be replaced by a manual loading prompt');

// Defer only network work when the reader is outside the prefetch area.
for(const marker of [
  'const modelReaderActive=ref(false)',
  'const activateModelReader=()=>{',
  'if(!modelView.value || modelReaderActive.value)return;',
  'if(!result.value)void loadTopic(false);',
  'const checkReaderVisibility=()=>{',
  'const observeReading=()=>{',
  'new IntersectionObserver(entries=>',
  'rootMargin:"400px 0px"',
  'nextTick(checkReaderVisibility)',
  'readerObserver?.disconnect()',
  '(modelView && !modelReaderActive) || (loading && !result)',
])assert.ok(topic.includes(marker),'automatic reading lazy-load contract: '+marker);
assert.ok(topic.includes('if(modelView.value)void loadModelStatuses();else void loadTopic(false);'),
  'model first view must keep lightweight status scheduling');
assert.ok(topic.includes('watch(modelView,(isModel,wasModel)=>'),
  'switching panels must preserve automatic reader activation');
assert.ok(explorer.includes("fetch('/api/ai-model-board?view=summary'"),
  'model overview must continue using the lightweight paginated projection');

console.log('AI_MODEL_DEFERRED_OK: 3-column reading auto-appears; intersection prefetches content; model API remains independently paginated');
