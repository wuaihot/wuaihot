import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {playInProjection, playInMatchPosition, playInGraphEdgePath, PLAY_IN_SOURCE_IDS, PLAY_IN_GRAPH_EDGES, PLAY_IN_OFFICIAL_EDGES, PLAY_IN_GRAPH_GEOMETRY, verifiedMatchOutcome, playInRouteOutcome, provisionalSwissMatches, swissRoundByChicagoDate, PLAY_IN_LAYOUT, SWISS_RECORD_ROUTE} from '../src/utils/worlds2026Bracket.js';
const dates=['2026-10-15T18:00:00Z','2026-10-15T23:00:00Z','2026-10-16T18:00:00Z','2026-10-16T23:00:00Z','2026-10-17T18:00:00Z','2026-10-18T18:00:00Z'];
const playFixtures=dates.map((startAt,i)=>({id:PLAY_IN_SOURCE_IDS[i],startAt,status:'SCHEDULED',home:{name:i<2?'Verified team':'TBD'},away:{name:'TBD'}}));
const play=playInProjection([...playFixtures].reverse());
assert.deepEqual(play?.map(x=>x.matches.length),[2,2,1,1]);
assert.deepEqual(play?.flatMap(x=>x.matches.map(m=>m.id)),playFixtures.map(x=>x.id));
assert.deepEqual(PLAY_IN_LAYOUT.map(x=>x.slots),[2,2,1,1]);
assert.equal(playInMatchPosition(1,1),340);
assert.equal(playInProjection(playFixtures.slice(0,5)),null,'incomplete fixture coverage must not invent a sixth match');
assert.equal(playInProjection([...playFixtures,{id:'unexpected-new',startAt:'2026-10-19T12:00:00Z'}]),null,'changed format must not silently drop extra source fixtures');
assert.equal(playInProjection(playFixtures.map((f,i)=>({...f,id:'new-'+i}))),null,'unrecognized fixture identities must not inherit the old topology');
assert.equal(playInProjection([...playFixtures.slice(0,5),{...playFixtures[0]}]),null,'duplicate match IDs must not be accepted');
const expectedRoutes=[
  ['upper-a-win','win',0,1],['upper-b-win','win',0,1],
  ['upper-a-loss','loss',0,1],['upper-b-loss','loss',0,1],
  ['lower-semi-win','win',1,2],['upper-final-loss','loss',1,2],
  ['upper-final-win','win',1,3],['lower-final-win','win',2,3],
];
assert.equal(PLAY_IN_GRAPH_EDGES.length,8,'The upper-final winner must connect directly to grand final');
assert.deepEqual(PLAY_IN_GRAPH_EDGES.map(e=>[e.key,e.route,e.from[0],e.to[0]]),expectedRoutes);
assert.equal(PLAY_IN_GRAPH_GEOMETRY.width,868);
assert.equal(PLAY_IN_GRAPH_GEOMETRY.height,455);
assert.deepEqual(PLAY_IN_OFFICIAL_EDGES,["upper-a-win","upper-b-win","lower-semi-win","upper-final-win","lower-final-win"]);
assert.equal(PLAY_IN_GRAPH_EDGES.filter(x=>PLAY_IN_OFFICIAL_EDGES.includes(x.key)).length,5,'Only five official-style advancement feeders on the base diagram');
assert.equal(verifiedMatchOutcome({status:'SCHEDULED',home:{name:'FUR',winner:true},away:{name:'KC'}}),null,'Scheduled winner flags may not imply a result');
assert.equal(verifiedMatchOutcome({status:'UNOFFICIAL',home:{name:'FUR',winner:true},away:{name:'KC'}}),null,'Unverified data must not assert advancement');
const official={status:'OFFICIAL',home:{name:'FUR',winner:true},away:{name:'KC',winner:false}};
assert.deepEqual(verifiedMatchOutcome(official),{winner:'FUR',loser:'KC'});
const decided=play.map(round=>({...round,matches:round.matches.map(match=>({...match,status:'SCHEDULED'}))}));
assert.equal(playInRouteOutcome(PLAY_IN_GRAPH_EDGES[0],decided),'');
decided[0].matches[0]= {...official,id:PLAY_IN_SOURCE_IDS[0],startAt:dates[0]};
assert.equal(playInRouteOutcome(PLAY_IN_GRAPH_EDGES[0],decided),'FUR');
assert.equal(playInRouteOutcome(PLAY_IN_GRAPH_EDGES[2],decided),'KC');
for(const edge of PLAY_IN_GRAPH_EDGES){
  const match=play[edge.from[0]].matches[edge.from[1]];
  const destination=play[edge.to[0]].matches[edge.to[1]];
  assert.ok(match?.id && destination?.id,'Every structural edge must connect existing source fixtures');
  assert.match(playInGraphEdgePath(edge),/^M \d+ [\d.]+ H \d+ V [\d.]+ H \d+$/);
}
const grandFinalRoutes=PLAY_IN_GRAPH_EDGES.filter(edge=>['upper-final-win','lower-final-win'].includes(edge.key))
  .map(edge=>playInGraphEdgePath(edge));
const grandFinalBends=grandFinalRoutes.map(path=>Number(path.match(/ H (\d+) V /)?.[1]));
assert.deepEqual(grandFinalBends,[660,660],'Both grand-final feeders must turn on the exact same vertical guide, without a 2px kink');
assert.equal(PLAY_IN_GRAPH_EDGES.find(e=>e.key==='upper-final-win')?.to[0],3);
assert.equal(PLAY_IN_GRAPH_EDGES.find(e=>e.key==='upper-final-loss')?.to[0],2);
const chicago=value=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));const field=key=>parts.find(p=>p.type===key)?.value;return [field('year'),field('month'),field('day')].join('-');};
// Official stage fixture calendar: 8+8+8+6+3. Assign by the tournament-local day,
// not the reader's display timezone. No synthetic teams or round results.
const cohorts=[['2026-10-23',8],['2026-10-24',8],['2026-10-25',4],['2026-10-26',4],['2026-10-28',2],['2026-10-29',2],['2026-10-30',2],['2026-10-31',3]];
const rounds=provisionalSwissMatches(cohorts.flatMap(([date,count])=>Array.from({length:count},(_,i)=>({id:date+'-'+i,startAt:date+'T20:00:00Z',home:{name:'TBD'},away:{name:'TBD'}}))),chicago);
assert.deepEqual(rounds.map(x=>x.key),['1','2','3','4','5']);
assert.deepEqual(rounds.map(x=>x.matches.length),[8,8,8,6,3]); // Official Swiss bracket: 3+3 Round 4, then three 2-2 deciders.
assert.equal(swissRoundByChicagoDate('2026-10-31'),'5');
assert.equal(SWISS_RECORD_ROUTE['5'],'2–2');
const vue=readFileSync('src/components/Worlds2026Bracket.vue','utf8');
const guide=readFileSync('src/components/Worlds2026Guide.vue','utf8');
assert.ok(vue.includes('playInProjection(')&&vue.includes('provisionalSwissMatches('));
assert.ok(vue.includes('wb-playin-route-map')&&vue.includes('playInGraphEdgePath(edge)')&&vue.includes('wb-round-route')&&vue.includes('is-knockout'));
assert.ok(vue.includes('wb-official-playin-heads')&&vue.includes('visiblePlayInEdges')&&vue.includes('isTrackedPlayInEdge(edge)')&&vue.includes('knockoutPairTrackedPath('));
assert.ok(!vue.includes('class="wb-loss-direction"'),'Unconfirmed lower-bracket arrows must not clutter the official-style default');
assert.ok(vue.includes('repeat(4,196px)')&&vue.includes('repeat(3,210px)'),'Official bracket stages need compact consistent card columns');
assert.ok(vue.includes('.wb-playin-route-map path[data-route="win"].is-verified')&&vue.includes('.wb-playin-route-map path.is-tracked'),'Result and user tracking must be distinct visual layers');
for(const forbidden of ['不预填队伍','不生成假晋级路线','No fabricated teams','待官方排定','仅展示官方已公布','structuralNotice']){
  assert.ok(!vue.includes(forbidden),'Internal editorial/validation language must not leak to UI: '+forbidden);
}
assert.ok(!guide.includes('<p class="wg-note">{{ c.statusDisclaimer }}</p>'));
const css=readFileSync('src/views/EventHub.vue','utf8');
assert.ok(css.includes('height:auto;box-sizing:border-box;max-height:none;min-height:0;overflow:hidden;align-self:stretch'));
assert.ok(css.includes('flex:1 1 0;min-width:0;min-height:0;max-height:none;'));
console.log('WORLDS_2026_BRACKET_LAYOUT_OK: play-in 2/2/1/1, Swiss rounds 1-5, fixture-only, stage visuals and no leaked engineer copy');
