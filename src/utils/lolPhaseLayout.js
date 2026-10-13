export const OFFICIAL_PLAYOFF_ROW = 84;

export function officialStartTime(value) {
  if(typeof value!=='string')return '';
  const p=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if(!p||Number(p[4])>23||Number(p[5])>59||Number(p[6])>59)return '';
  const date=new Date(Date.UTC(Number(p[1]),Number(p[2])-1,Number(p[3])));
  if(date.toISOString().slice(0,10)!==value.slice(0,10)||!Number.isFinite(Date.parse(value)))return '';
  return new Date(value).toISOString();
}

export function officialMatchTime(match, locale='zh-CN') {
  const dateTime=officialStartTime(match.startTime);
  if(!dateTime)return null;
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date(dateTime)).map(p=>[p.type,p.value]));
  const label=`${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
  return {dateTime,label,title:`${locale.startsWith('zh')?'北京时间':'UTC+8'} · ${parts.year}/${label}`};
}

export function officialTeamOutcome(match,team,{qualification=false,knockout=false,chinese=true}={}) {
  if(match.state!=='completed'||team.code==='TBD'||!['win','loss'].includes(team.outcome))return null;
  const won=team.outcome==='win',final=knockout&&match.description==='Finals';
  const kind=final?(won?'champion':'runner-up'):qualification||knockout?(won?'advance':'eliminated'):won?'win':'loss';
  const labels=chinese?{win:'胜',loss:'负',advance:'晋级',eliminated:'淘汰',champion:'冠军','runner-up':'亚军'}:{win:'W',loss:'L',advance:'ADV',eliminated:'OUT',champion:'1st','runner-up':'2nd'};
  return {kind,won,label:labels[kind]};
}

export function officialMatchLabel(match, chinese = true) {
  const code = match.description || '';
  const swiss = /^R([1-5])M(\d+)(?:\s*\(([^)]+)\))?/.exec(code);
  if (swiss) return (chinese ? `第 ${swiss[2]} 场` : `Match ${swiss[2]}`) + (swiss[3] ? ` · ${swiss[3].replace('-', '–')}` : '');
  if (/^Q[1-4]$/.test(code)) return chinese ? `1/4 决赛 ${code.slice(1)}` : `Quarterfinal ${code.slice(1)}`;
  if (/^SF[12]$/.test(code)) return chinese ? `半决赛 ${code.slice(2)}` : `Semifinal ${code.slice(2)}`;
  return code === 'Finals' ? (chinese ? '决赛' : 'Final') : code;
}

// Geometry is shared with the CSS row grid; card height must remain below two rows.
export function officialPlayoffLayout(matches = []) {
  const rounds = [/^Q[1-4]$/, /^SF[12]$/, /^Finals$/].map((pattern, column) => ({
    column,
    matches: matches.filter(m => pattern.test(m.description)).sort((a, b) => a.description.localeCompare(b.description, 'en', {numeric: true}))
      .map((match, index) => ({match, start: index * 2 ** (column + 1) + 1, span: 2 ** (column + 1), y: (index * 2 ** (column + 1) + 2 ** column) * OFFICIAL_PLAYOFF_ROW})),
  }));
  const nodes = rounds.flatMap(r => r.matches.map(node => ({...node, column:r.column})));
  const edges = nodes.flatMap(from => {
    const to = nodes.find(n => n.match.structuralId && n.match.structuralId === from.match.next?.structuralId);
    if (!to || to.column !== from.column + 1 || ![1, 2].includes(from.match.next?.slot)) return [];
    const x = from.column === 0 ? 306.6667 : 653.3333;
    return [{from:from.match.structuralId, to:to.match.structuralId, slot:from.match.next.slot,
      path:`M ${x} ${from.y} H ${x + 20} V ${to.y} H ${x + 40}`}];
  });
  return {rounds, edges, rowHeight:OFFICIAL_PLAYOFF_ROW,height:OFFICIAL_PLAYOFF_ROW*8};
}

export function officialTeamPath(matches, code) {
  const ids = new Set(), slots = new Set(), edges=new Set();
  if (!code || code === 'TBD') return {ids, slots,edges};
  for (const match of matches || []) {
    const participant = match.teams.find(t => t.code === code);
    if (!participant) continue;
    ids.add(match.structuralId);
    if (match.state === 'completed' && !participant.winner) continue;
    let from = match;
    const seen = new Set();
    while (from.next && !seen.has(from.structuralId)) {
      seen.add(from.structuralId);
      const target = matches.find(m => m.structuralId === from.next.structuralId);
      if (!target) break;
      const entry = target.teams[from.next.slot - 1];
      if (!entry || (entry.code !== 'TBD' && entry.code !== code)) break;
      slots.add(`${target.structuralId}:${from.next.slot}`);
      edges.add(`${from.structuralId}>${target.structuralId}:${from.next.slot}`);
      ids.add(target.structuralId);
      if (target.state === 'completed' && !entry.winner) break;
      from = target;
    }
  }
  return {ids, slots,edges};
}
