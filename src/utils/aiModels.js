// Identity keeps version, reasoning effort, date and fallback configuration.
export function aiModelIdentity(name) {
  return String(name||'').toLowerCase().replace(/\beffort\b/g,'').match(/[a-z]+|\d+/g)?.join(':') || '';
}
// Version grouping is deliberately separate from exact test-configuration identity.
// Only known model families allow effort/fallback suffixes to be removed. Dates stay.
export function aiModelVersion(name) {
  const raw=String(name||'').trim();
  if(!/^(claude|gpt|gemini|deepseek|qwen|glm|grok|muse|mistral|llama|kimi|nova)[ -]/i.test(raw))return {id:aiModelIdentity(raw),label:raw};
  let base=raw.replace(/(\d)-(\d{1,2})(?=[-\s)]|$)/g,'$1.$2');
  base=base.replace(/[\s(\-]+(?:max|xhigh|high|medium|low|effort|thinking|non[- ]?reasoning|reasoning|with fallback|no fallback|default|auto)(?:[\s)-].*)?$/i,'').trim();
  const label=base.replace(/-/g,' ').replace(/^claude\b/i,'Claude').replace(/\b(opus|sonnet|haiku|fable)\b/gi,s=>s[0].toUpperCase()+s.slice(1).toLowerCase()).replace(/^gpt[ -]/i,'GPT-').replace(/\b(astra|sol|spark)\b/gi,s=>s[0].toUpperCase()+s.slice(1).toLowerCase()).replace(/^(deepseek|qwen|glm|grok|muse|mistral|llama|kimi|nova)\b/i,s=>({deepseek:'DeepSeek',qwen:'Qwen',glm:'GLM',grok:'Grok',muse:'Muse',mistral:'Mistral',llama:'Llama',kimi:'Kimi',nova:'Nova'}[s.toLowerCase()])).replace(/^gemini\b/i,'Gemini');
  return {id:aiModelIdentity(base),label};
}
export function parseAiCsv(text) {
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"'){if(quoted && text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(!quoted && c===','){row.push(field);field='';}
    else if(!quoted && (c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(Boolean))rows.push(row);row=[];field='';}
    else field+=c;
  }
  if(quoted)throw Error('invalid_csv');row.push(field);if(row.some(Boolean))rows.push(row);
  const header=rows.shift();if(!header?.includes('model') || new Set(header).size!==header.length)throw Error('invalid_columns');
  return rows.map(values=>Object.fromEntries(header.map((key,i)=>[key,values[i] ?? ''])));
}
export function scoreLiveBench(rows,categories,scope='livebench') {
  if(!categories || Object.keys(categories).length<2)throw Error('invalid_categories');
  const selected=scope==='coding'?['Coding','Agentic Coding']:scope==='reasoning'?['Reasoning']:scope==='analysis'?['Data Analysis']:Object.keys(categories);
  const mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
  return rows.flatMap(row=>{
    const scores=selected.map(category=>{
      const columns=categories[category];if(!Array.isArray(columns)||!columns.length)return null;
      const values=columns.map(k=>row[k]==='' || row[k]===undefined || row[k]===null?null:Number(row[k]));
      return values.some(v=>v===null||!Number.isFinite(v)||v<0||v>100)?null:mean(values);
    });
    if(!row.model || scores.some(v=>v===null))return [];
    return [{model:row.model,score:mean(scores),categoryScores:Object.fromEntries(selected.map((key,i)=>[key,scores[i]]))}];
  }).sort((a,b)=>b.score-a.score || a.model.localeCompare(b.model)).map((r,i,all)=>({...r,rank:all.findIndex(x=>x.score===r.score)+1}));
}
export function buildModelConsensus(boards) {
  const sourceKeys=new Set();
  const healthy=boards.filter(b=>{if(['coding','reasoning','analysis'].includes(b.key)||sourceKeys.has(b.key)||b.role!=='capability'||b.status!=='ok'||!b.items?.length)return false;sourceKeys.add(b.key);return true;});
  // A single source, popularity board or failed board cannot manufacture consensus.
  if(healthy.length<2)return [];
  const indexed=healthy.map(b=>{const m=new Map();for(const item of b.items){if(!Number.isFinite(item.rank)||item.rank<=0||typeof item.model!=='string')continue;const id=aiModelVersion(item.model).id;if(id && (!m.has(id)||item.rank<m.get(id).rank))m.set(id,item);}return {board:b,items:m};});
  const common=[...indexed[0].items.keys()].filter(id=>indexed.every(s=>s.items.has(id)));
  if(common.length<2)return [];
  const ranked=indexed.map(({board,items})=>{
    const rows=common.map(id=>({id,item:items.get(id)})).sort((a,b)=>a.item.rank-b.item.rank);
    return {board,rows:rows.map(row=>({...row,cohortRank:rows.findIndex(x=>x.item.rank===row.item.rank)+1}))};
  });
  return common.map(id=>{
    const evidence=ranked.map(({board,rows})=>{const row=rows.find(r=>r.id===id);return {source:board.key,label:board.label,url:board.url,version:board.version,checkedAt:board.checkedAt,originalRank:row.item.rank,originalScore:row.item.score,model:row.item.model,cohortRank:row.cohortRank,percentile:100*(common.length-row.cohortRank)/(common.length-1)};});
    const selected=indexed[0].items.get(id);
    return {model:aiModelVersion(selected.model).label,modelVersionId:id,url:selected.url||indexed[0].board.url,score:Math.round(evidence.reduce((a,b)=>a+b.percentile,0)/evidence.length*1e10)/1e10,coverage:evidence.length,cohortSize:common.length,configurationVaries:new Set(evidence.map(e=>aiModelIdentity(e.model))).size>1,evidence};
  }).sort((a,b)=>b.score-a.score || a.model.localeCompare(b.model)).map((row,i,all)=>({...row,rank:all.findIndex(r=>r.score===row.score)+1}));
}
export function modelCoverageGaps(boards=[],consensus=[],limit=10) {
  const common=new Set(consensus.map(row=>row.modelVersionId||aiModelVersion(row.model).id));
  return boards.filter(board=>['livebench','aa'].includes(board.key) && board.status==='ok').map(board=>({
    key:board.key,label:board.label,total:board.items.length,url:board.url,
    items:board.items.filter(row=>row.rank<=limit && !common.has(aiModelVersion(row.model).id)),
  }));
}
