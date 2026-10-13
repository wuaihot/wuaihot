// Time is a facet of a content ranking, never a separate split-card identity.
const PERIODS = {
  today: ['今日', 'Today'], yesterday: ['昨日', 'Yesterday'],
  '3d': ['近3日', 'Last 3 days'], week: ['周榜', 'Weekly'],
  '7d': ['近7日', 'Last 7 days'], '14d': ['近14日', 'Last 14 days'],
  month: ['月榜', 'Monthly'], '30d': ['近30日', 'Last 30 days'],
  quarter: ['季度榜', 'Quarterly'], 'half-year': ['半年榜', 'Half-year'],
  year: ['年度榜', 'Yearly'], alltime: ['总榜', 'All time'],
  '1h':['近1小时','Last hour'], '3h':['近3小时','Last 3 hours'], '6h':['近6小时','Last 6 hours'],
};
const aliases = { day:'today', daily:'today', today:'today', yesterday:'yesterday', week:'week', weekly:'week', month:'month', monthly:'month', quarterly:'quarter', 'half-year':'half-year', annual:'year', all:'alltime', overall:'alltime', alltime:'alltime', 'three-days':'3d', '3d':'3d', '7d':'7d', '14d':'14d', '30d':'30d' };
const suffixSources = new Set(['tieba','github','acfun','lanren-audio','openrouter-rankings','vscode-marketplace','autohome-sales']);
const singleSources = new Set(['ithome','smzdm','linuxdo','maoer-drama','jjwxc-books']);
const defaultLabels = {ithome:'热门榜',smzdm:'热门榜',linuxdo:'热门榜',github:'全语言', 'maoer-drama':'广播剧打赏榜', 'jjwxc-books':'排行榜'};
const stripPeriod = label => String(label || '').replace(/^近(?:3|7|14|30)日/, '').replace(/\s*·\s*(?:今日|昨日|日榜|周榜|月榜|总榜|本周|三日)$/, '').replace(/(?:日榜|周榜|月榜)$/, '榜').replace(/月销榜$/, '销量榜').trim();
export const describeRankingPeriod = (source, option = {}) => {
  const value = String(option.value || '');
  const dimensions = option.dimensionValues || {};
  let period = aliases[dimensions.period || dimensions.range];
  let content = value;
  let label = String(option.label || value);
  if (period) {
    const other = Object.entries(dimensions).filter(([key])=>!['period','range'].includes(key));
    content = other.length ? other.map(([key,v])=>`${key}:${v}`).join('|') : value.replace(/-(?:3d|7d|14d|30d|day|week|month)$/, '') || 'ranking';
    label = stripPeriod(label);
  } else if (source === 'xiaohongshu') {
    const match = value.match(/^(read|like|collect)-(3d|7d|14d|30d)$/);
    if (match) { content=match[1];period=match[2];label=stripPeriod(label); }
  } else if (source === 'china-film-boxoffice' && ['realtime','annual','alltime'].includes(value)) {
    content='film-boxoffice';period=value==='realtime'?'today':aliases[value];label='电影票房榜';
  } else if (source === 'greasy-fork' && ['daily-installs','total-installs'].includes(value)) {
    content='installs';period=value==='daily-installs'?'today':'alltime';label='安装榜';
  } else if (suffixSources.has(source)) {
    const match = value.match(/^(.*)-(three-days|today|yesterday|day|week|month|daily|weekly|monthly|all)$/);
    if (match) {content=match[1];period=aliases[match[2]];label=stripPeriod(label);}
    else if (source === 'github' && aliases[value]) {content='ranking';period=aliases[value];label=defaultLabels.github;}
  } else if (source === 'super-deals' && /^(1h|3h|6h)$/.test(value)) {
    content='hour-ranking';period=value;label='小时排行';
  } else if (singleSources.has(source) && aliases[value]) {
    content='ranking';period=aliases[value];label=defaultLabels[source];
  }
  return {content, label:label || defaultLabels[source] || value, period:period || null};
};
export const rankingContentOptions = (source, options = []) => {
  const families = new Map();
  for (const option of options) {
    const info = describeRankingPeriod(source, option);
    if (!families.has(info.content)) families.set(info.content, []);
    families.get(info.content).push({option,info});
  }
  return [...families.values()].map(entries => {
    const chosen = entries.find(x=>x.info.period==='today') || entries[0];
    return {...chosen.option, label:chosen.info.label,
      ...(chosen.info.period && chosen.option.projectionLabel ? {projectionLabel:chosen.info.label} : {}),
      contentOnly:Boolean(chosen.info.period), contentKey:chosen.info.content};
  });
};
export const rankingPeriodOptions = (source, options, active) => {
  const current = options.find(o=>o.value===active) || options[0] || {value:active};
  const info = describeRankingPeriod(source,current);
  return options.filter(o=>describeRankingPeriod(source,o).content===info.content)
    .map(o=>({...o,period:describeRankingPeriod(source,o).period}))
    .filter(o=>o.period).sort((a,b)=>Object.keys(PERIODS).indexOf(a.period)-Object.keys(PERIODS).indexOf(b.period));
};
export const rankingPeriodLabel = (period,locale='zh-CN') => PERIODS[period]?.[locale.startsWith('zh')?0:1] || (locale.startsWith('zh')?'实时榜':'Live');
export const contentVariantFor = (source, options, value) => {
  const option = options.find(o=>o.value===value);
  if (!option) return value;
  const content = describeRankingPeriod(source,option).content;
  return rankingContentOptions(source,options).find(o=>o.contentKey===content)?.value || value;
};
export const rankingFamilyVariants = (source, options, allowed = []) => {
  const contents = new Set(allowed.map(value=>describeRankingPeriod(source,options.find(o=>o.value===value)||{value}).content));
  return options.filter(o=>contents.has(describeRankingPeriod(source,o).content));
};
export const contentControls = (source,groups,options,active) => {
  const period = describeRankingPeriod(source,options.find(o=>o.value===active)||{}).period;
  const seen = new Set();
  return groups.filter(g=>!['period','range'].includes(g.key) || !g.items?.every(o=>describeRankingPeriod(source,o).period))
    .map(group=>({...group,items:rankingContentOptions(source,group.items).filter(o=>{
      const id=describeRankingPeriod(source,o).content;
      if(seen.has(id))return false;seen.add(id);return true;
    }).map(o=>{
      const family=rankingPeriodOptions(source,options,o.value);
      const matched=family.find(x=>x.period===period);
      return {...o,value:matched?.value || o.value};
    })})).filter(g=>g.items.length);
};
