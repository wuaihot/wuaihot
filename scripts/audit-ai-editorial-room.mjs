import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {aiEditorialLayout,aiEditorialSignalRows,aiEditorialHistogram} from '../src/utils/aiEditorialLayout.mjs';

const now=Date.parse('2026-10-10T08:00:00Z'),h=3600000;
const item=(id,age,{summary='',official=false,badge=false,priority=false,newItem=false}={})=>({
 key:id,url:'https://example.org/'+id,title:'Verifiable headline '+id,originalTitle:'Verifiable headline '+id,
 sourceLabel:official?'Official source':'News source',source:official?'openai-news':'other-news',
 published:age===null?null:now-age*h,summary,emphasis:priority,badgeKind:badge?'official':null,new:newItem,
 reason:official?'Official release':'Source-evidence ranking',raw:{extra:official?{publicationEvidence:{url:'https://example.org/official'}}:{}}
});
const lanes=[
 {key:'news',label:'热点要闻',subtitle:'原始报道',items:[item('news1',3,{summary:'Original sourced summary',priority:true}),item('news2',12),item('news3',18),item('news4',33),item('news5',55),item('news6',null)]},
 {key:'launches',label:'模型与产品',subtitle:'原生发布',items:[item('model1',5,{official:true,priority:true}),item('model2',9,{official:true}),item('model3',60),item('future',-1)]},
 {key:'building',label:'开发工具',subtitle:'代码实践',items:[item('dev1',8),item('dev2',22),item('dev3',44)]},
 {key:'research',label:'研究评测',subtitle:'基准论文',items:[item('paper1',13),item('paper2',32)]},
 {key:'industry',label:'产业与治理',subtitle:'产业政策',items:[item('policy1',11),item('policy2',56)]},
 {key:'discussion',label:'热门讨论',subtitle:'社区讨论',items:[item('community1',7),item('community2',25)]},
];
const x=aiEditorialLayout(lanes,{now,hours:72});
assert.equal(x.total,17,'all dated, unique records in 72h, excluding undated and future');
assert.ok(x.lead,'real top story');
assert.equal(x.lead.item.key,'model1','verified first-party release outranks unattributed posts');
assert.ok(x.secondary.length===3);
const assigned=[x.lead,...x.secondary,...x.briefs,...x.sections.flatMap(s=>s.entries)];
assert.equal(new Set(assigned.map(s=>s.id)).size,assigned.length,'no duplicate story across lead, side, wire, sections');
assert.equal(assigned.length,x.total,'all qualified records assigned somewhere');
assert.equal(x.sections.length,6,'six semantic domains remain accessible');
assert.equal(aiEditorialLayout(lanes,{now,hours:24}).total,10,'24h filter excludes old dated items');
assert.equal(aiEditorialLayout(lanes,{now,hours:72,selected:'research'}).total,2,'topic focus is strict');
assert.equal(aiEditorialLayout(lanes,{now,hours:24,selected:'industry'}).sections.length,1);
assert.equal(aiEditorialLayout([], {now}).lead,null,'empty source snapshot creates no invented news');
const hist=aiEditorialHistogram(lanes,{now});assert.equal(hist.length,6);
assert.ok(hist.every(t=>Number.isInteger(t.count)&&t.count>=0));
assert.equal(hist.reduce((s,t)=>s+t.count,0),10);
const duplicate={...lanes[1],items:[...lanes[1].items,lanes[0].items[0]]};
assert.equal(aiEditorialSignalRows([lanes[0],duplicate],{now}).length,8,'duplicate key filtered and timestamps validated');
const component=readFileSync('src/components/AiRadarMonitor.vue','utf8'),
 board=readFileSync('src/components/AiIntelligenceBoard.vue','utf8'),
 page=readFileSync('src/views/AiTopic.vue','utf8');
assert.ok(page.includes('v-show="!monitorView" class="topic-overview"')&&page.includes(':aria-hidden="monitorView"'),'the background AI topic must leave visual/accessibility rendering whenever full-screen newsroom is active');
assert.ok(page.includes('<Teleport to="body"><AiRadarMonitor v-if="monitorView"'),'the full screen dialog must remain teleported outside the hidden background');
for(const marker of ['lead-package','cover-story','side-stories','wire-desk','section-coverage','editorial-sections','wall-histogram','SOURCE HEALTH','source-policy','SNAPSHOT','aria-modal="true"','handleDialogKey','position:fixed;inset:0;z-index:99999'])
 assert.ok(component.toLowerCase().includes(marker.toLowerCase()),'missing '+marker);
assert.ok(!component.includes('wall-lane-grid'),'equal-weight six-lane wall must be replaced by editorial hierarchy');
assert.ok(component.includes('sourceLabel')&&component.includes('summary')&&component.includes('published'),'provenance and source-backed summary');
assert.ok(component.includes('prefers-reduced-motion')&&component.includes('max-width:650px')&&component.includes('max-width:980px'));
assert.ok(component.includes("document.getElementById('app')")&&component.includes('appRoot.inert=true')&&component.includes('appRoot.inert=previousAppInert'),'teleported monitor must inert ordinary page then faithfully restore preexisting inert state');
assert.ok(component.includes('previousFocus?.focus')&&component.includes('document.body.style.overflow'),'modal must return focus and restore page scroll lock');
assert.ok(board.includes('grid-template-columns:repeat(4,minmax(0,1fr))'),'ordinary board must keep four columns');
const liveLike=[
 {key:'launches',label:'Model releases',items:[{...item('actual-release',35,{official:true,priority:true}),title:'Qwen-Image-2.1-Turbo 发布'}]},
 {key:'news',label:'General news',items:[{...item('customer-case-1',2,{official:true}),title:'Asana cuts model costs 76x in browser tests with GPT-6.1 Sol',originalTitle:'Asana cuts model costs 76x in browser tests with GPT-6.1 Sol'},item('genuine-news',4,{newItem:true}),item('genuine-news-2',10,{newItem:true})]},
 {key:'research',label:'Research',items:[item('research-study',5)]},
 {key:'industry',label:'Industry',items:[item('policy-review',8)]}
];
liveLike.push({key:'discussion',label:'Community hypotheses',items:[item('hypothetical-question',1,{newItem:true})]});
const promoDesk=aiEditorialLayout(liveLike,{now,hours:72});
assert.equal(promoDesk.lead.item.key,'actual-release','first-party model release remains lead');
assert.ok(!promoDesk.secondary.some(x=>x.item.key==='customer-case-1'),'customer marketing must not crowd out real leads');
assert.ok(!promoDesk.secondary.some(x=>x.item.key==='hypothetical-question'),'one-hour-old hypothetical community discussion does not displace factual updates from newsroom priorities');
assert.ok(promoDesk.all.some(x=>x.item.key==='customer-case-1'&&x.customerCase),'source-backed customer story stays readable, but demoted');
console.log('AI_EDITORIAL_ROOM_OK: source-backed lead, secondaries, wire and topic beats; no duplicates, date windows, no fabricated article, mobile and accessibility structure');
