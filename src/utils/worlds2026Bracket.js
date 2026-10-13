/**
 * Public-fixture bracket projection for Worlds 2026.
 * Source results remain authoritative. Structural slots convey tournament format,
 * never guessed opponents, scores or advancements.
 */
export const PLAY_IN_LAYOUT = Object.freeze([
  { key: 'upper-semis', slots: 2 },
  { key: 'upper-and-lower', slots: 2 },
  { key: 'lower-final', slots: 1 },
  { key: 'play-in-final', slots: 1 },
]);
export const PLAY_IN_SOURCE_IDS = Object.freeze([
  '115660588583040710', '115660588583171786',
  '115660588583171790', '115660588583171794',
  '115660588583171798', '116299649498303884',
]);
export const PLAY_IN_POSITIONS = Object.freeze([
  [0, 148],    // upper bracket opening series
  [74, 340],  // upper final / separate lower semifinal lane
  [340],      // lower final
  [215],      // deciding final joins upper and lower routes
]);
export const SWISS_RECORD_ROUTE = Object.freeze({
  '1': '0–0',
  '2': '1–0 / 0–1',
  '3': '2–0 / 1–1 / 0–2',
  '4': '2–1 / 1–2',
  '5': '2–2',
});
export function swissRoundByChicagoDate(date) {
  if (date <= '2026-10-23') return '1';
  if (date <= '2026-10-24') return '2';
  if (date <= '2026-10-26') return '3';
  if (date <= '2026-10-30') return '4';
  return '5';
}
export function playInProjection(items) {
  const verified = [...items].filter(item => item?.id && item?.startAt);
  if (verified.length !== 6) return null;
  const byId = new Map(verified.map(item => [String(item.id),item]));
  // The 2026 graph topology is bound to verified source fixtures, not merely
  // "any six matches" that happen to be scheduled in this period.
  // Changed, duplicate or unknown identities fall back to a plain fixture list.
  if (byId.size !== PLAY_IN_SOURCE_IDS.length || !PLAY_IN_SOURCE_IDS.every(id => byId.has(id))) return null;
  const sorted = PLAY_IN_SOURCE_IDS.map(id => byId.get(id));
  return PLAY_IN_LAYOUT.map(({key,slots},index) => {
    const from = [0,2,4,5][index];
    return {key, matches:sorted.slice(from,from+slots)};
  });
}
export function playInMatchPosition(roundIndex,slot) {
  return PLAY_IN_POSITIONS[roundIndex]?.[slot] ?? 45;
}

// Explicit *format* graph, not confirmed progression. Match identity is
// resolved in playInProjection; edges are never colored as an actual result.
// node = [bracket column, match slot]. Layout matches the 2026 official
// upper/lower double-elimination tournament structure.
// The full topology is retained for verified team-trace logic. The official
// default display renders the FIVE upper/lower advancement feeders only;
// defeat-transfer edges are available only for evidence-based interaction.
export const PLAY_IN_OFFICIAL_EDGES = Object.freeze([
  'upper-a-win', 'upper-b-win', 'lower-semi-win',
  'upper-final-win', 'lower-final-win',
]);
export const PLAY_IN_GRAPH_EDGES = Object.freeze([
  {key:'upper-a-win',from:[0,0],to:[1,0],route:'win'},
  {key:'upper-b-win',from:[0,1],to:[1,0],route:'win'},
  {key:'upper-a-loss',from:[0,0],to:[1,1],route:'loss'},
  {key:'upper-b-loss',from:[0,1],to:[1,1],route:'loss'},
  {key:'lower-semi-win',from:[1,1],to:[2,0],route:'win'},
  {key:'upper-final-loss',from:[1,0],to:[2,0],route:'loss'},
  {key:'upper-final-win',from:[1,0],to:[3,0],route:'win'},
  {key:'lower-final-win',from:[2,0],to:[3,0],route:'win'},
]);

export const PLAY_IN_GRAPH_GEOMETRY = Object.freeze({
  columnWidth:196,
  gap:28,
  cardHeight:98,
  width:868,
  height:455,
});

// Distinguish a real result from a structural possibility. A first loss
// transfers to the lower bracket; it is not the same as elimination.
export function verifiedMatchOutcome(match) {
  if (match?.status !== 'OFFICIAL' || !match.home?.name || !match.away?.name ||
      [match.home.name,match.away.name].some(name=>name==='TBD') ||
      Boolean(match.home.winner) === Boolean(match.away.winner)) return null;
  return {winner:String(match.home.winner?match.home.name:match.away.name).toUpperCase(),
    loser:String(match.home.winner?match.away.name:match.home.name).toUpperCase()};
}
export function playInRouteOutcome(edge,rounds) {
  const match=rounds?.[edge.from[0]]?.matches?.[edge.from[1]];
  const outcome=verifiedMatchOutcome(match);
  return outcome?.[edge.route==='loss'?'loser':'winner'] || '';
}
// One direction marker per *lower-bracket destination*, not one at the end of
// each overlapping source line. This avoids stacking arrows at shared nodes.
export const PLAY_IN_LOSS_DESTINATIONS=Object.freeze([
  {key:'lower-semi',column:1,slot:1},
  {key:'lower-final',column:2,slot:0},
]);
export function playInLossArrowPath(destination) {
  const {columnWidth,gap,cardHeight}=PLAY_IN_GRAPH_GEOMETRY;
  const x=destination.column*(columnWidth+gap);
  const y=playInMatchPosition(destination.column,destination.slot)+cardHeight/2;
  return `M ${x-19} ${y} H ${x-5}`;
}
export function playInGraphEdgePath(edge) {
  const {columnWidth,gap,cardHeight}=PLAY_IN_GRAPH_GEOMETRY;
  const [sourceColumn,sourceSlot]=edge.from;
  const [targetColumn,targetSlot]=edge.to;
  const y0=playInMatchPosition(sourceColumn,sourceSlot)+cardHeight/2;
  const y1=playInMatchPosition(targetColumn,targetSlot)+cardHeight/2;
  const startX=sourceColumn*(columnWidth+gap)+columnWidth;
  const endX=targetColumn*(columnWidth+gap);
  // The official bracket leaves the upper area of column three empty.
  // Both final feeders join at one short vertical stem in the last gap.
  // Both final feeders must bend on the *same* x-coordinate. Previously the
  // upper route used endX-12 (660) while the lower used startX+gap/2 (658),
  // leaving two visually misaligned elbows next to the grand final.
  const turnX=targetColumn===3 ? endX-12 : targetColumn>sourceColumn+1 ? endX-12 : startX+gap/2;
  return `M ${startX} ${y0} H ${turnX} V ${y1} H ${endX}`;
}
export function provisionalSwissMatches(items,localDateKey) {
  const groups=new Map();
  for (const item of items) {
    if (!item?.id || !item?.startAt) continue;
    const sourceRound = Number(item.round);
    const sourceLabel = [item.roundName,item.phaseName,item.description].filter(Boolean).join(' ');
    const explicitRound = /\bround\s*([1-5])\b/i.exec(sourceLabel)?.[1];
    const round = Number.isInteger(sourceRound) && sourceRound>=1 && sourceRound<=5
      ? String(sourceRound) : (explicitRound || swissRoundByChicagoDate(localDateKey(item.startAt)));
    if (!groups.has(round)) groups.set(round, []);
    groups.get(round).push(item);
  }
  return ['1','2','3','4','5'].map(key=>({
    key, matches:(groups.get(key)||[]).sort((a,b)=>a.startAt.localeCompare(b.startAt)),
  }));
}
