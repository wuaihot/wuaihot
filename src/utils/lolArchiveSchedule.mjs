// Pure archive projection; official source matches are never changed.
export function knockoutGraph(rounds) {
  const nodes = [], edges = [];
  let previous = [];
  rounds.forEach((round, column) => {
    const current = round.matches.map((match, index) => {
      const feeders = previous.filter(node => match.teams.includes(node.match.teams[node.match.winner - 1]));
      const slot = feeders.length ? feeders.reduce((sum,node)=>sum+node.slot,0)/feeders.length : index;
      const node = {id:match.id, match, column, slot};
      nodes.push(node);
      for (const from of feeders) edges.push({from:from.id,to:node.id,team:from.match.teams[from.match.winner - 1]});
      return node;
    });
    previous = current;
  });
  return {nodes,edges,leafCount:rounds[0]?.matches.length || 0};
}
export function swissRecords(rounds) {
  const records = new Map(), before = new Map(), outcomes = new Map();
  for (const round of rounds) {
    // Capture the entire round BEFORE applying any result.
    for (const match of round.matches) {
      before.set(match.id,match.teams.map(id=>[...(records.get(id) || [0,0])]));
    }
    for (const match of round.matches) {
      const result = match.teams.map((id,index)=>{
        const next = [...(records.get(id) || [0,0])];
        next[match.winner === index + 1 ? 0 : 1]++;
        records.set(id,next);
        return next[0] === 3 ? "qualified" : next[1] === 3 ? "eliminated" : "";
      });
      outcomes.set(match.id,result);
    }
  }
  return {before,outcomes};
}
export function swissGroups(matches, before) {
  const groups = new Map();
  for (const match of matches) {
    const record = before.get(match.id)?.[0] || [0,0];
    const key = record.join("–");
    if (!groups.has(key)) groups.set(key,{key,record,matches:[]});
    groups.get(key).matches.push(match);
  }
  return [...groups.values()].sort((a,b)=>b.record[0]-a.record[0] || a.record[1]-b.record[1]);
}
