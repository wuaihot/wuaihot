import {normalizeRankingMetric} from './rankingMetricSemantics.js';
// Content topics are independent from provenance and upstream labels.
import { aiTimes } from "./aiTime.js";
export const AI_TOPICS = ["models", "products", "engineering", "research", "business", "safety", "practice", "opinion"];
export const AI_PRESETS = {
  general: AI_TOPICS,
  developer: ["engineering", "models", "practice", "research", "products", "safety", "business", "opinion"],
  researcher: ["research", "models", "safety", "engineering", "opinion", "business", "practice", "products"],
  industry: ["business", "products", "models", "safety", "opinion", "engineering", "research", "practice"],
  creator: ["products", "practice", "models", "opinion", "business", "safety", "engineering", "research"],
};
export const AI_BOARD_STORAGE = "wuaihot-ai-board-v1";
export const AI_BOARD_DEFAULTS = Object.freeze({ preset: "general", excluded: ["hf-models", "paperswithcode"], refined: true });
const meta = item => item?.extra?.aiSignal || {};
export const aiContentText = item => [item?.originalTitle || item?.title, item?.originalDesc || item?.desc || item?.summary || item?.description].filter(Boolean).join(" ");
// ASCII boundaries allow a brand adjoining Chinese, without matching inside other words.
const ENTITY_PATTERN = /LiquidAI|(?<![a-z0-9])LFM(?![a-z])|人工智能|大模型|机器学习|生成式|深度学习|多模态嵌入|智能体|通义千问|千问|智谱|文心(?:一言|助手)|豆包|(?<![a-z0-9])(?:AI|LLMs?|ChatGPT|OpenAI|Anthropic|Claude|DeepSeek|Gemini|DeepMind|Mistral|Grok|Codex|Qwen|Gemma|EmbeddingGemma|Nemotron|Ollama|vLLM|GGUF|MLX|RAG|MCP|Hugging\s*Face|Stable\s*Diffusion|Midjourney|DALL-E|Sora|GPT(?:[- ]?\d[\w.-]*)?)(?![a-z0-9])/iu;
export function matchAiContent(item) {
  const text = aiContentText(item);
  const entity = text.match(ENTITY_PATTERN)?.[0];
  if (entity) return entity;
  if (/artificial intelligence|machine learning|deep learning|fact[- ]storing transformers|model[- ]context[- ]protocol|retrieval[- ]augmented[- ]generation|large[- ]language[- ]model|reinforcement learning|neural networks?|diffusion language model|\b(?:code|coding)[- ]agent\b|llama\.cpp|\bGLM[- ]?\d|\b(?:foundation|image|world[- ]action) models?\b|robot training data|agentic workspace|\bFigma Agent\b|\bNano Banana\b|\bManus\s*\d/iu.test(text)) return "AI engineering";
  if (/(?:Kimi|Moonshot|智能体|agentic)/iu.test(text) && /模型|智能|推理|编程|人工|\bAI\b|\bLLM\b|\bagent\b|cod(e|ing)/iu.test(text)) return text.match(/Kimi|Moonshot|智能体|agentic/iu)?.[0] || "";
  return "";
}
// Broad personal feeds must discuss AI up front, rather than mention it in passing.
export function aiHasPrimarySubject(item) {
  return !!(matchAiContent({ title: item?.originalTitle || item?.title }) ||
    matchAiContent({ title: String(item?.originalDesc || item?.desc || item?.summary || item?.description || "").slice(0, 180) }));
}
export function aiContentTopic(item) {
  const source = meta(item).primarySource || "";
  const text = aiContentText(item);
  const title = String(item?.originalTitle || item?.title || "");
  const path = String(item?.url || "").replace(/[-_/]/g," ");
  const analysis=item?.extra?.aiAnalysis;
  // Source-backed Tibo quota updates are product usage/entitlement updates,
  // not unclassified gossip. A tentative usage plan remains opinion.
  if(source==='ai-author-thsottiaux' && analysis?.state==='evidence-grounded'
    &&analysis.facts?.some(f=>String(f.quote||'').length>=6
      &&String(item.originalDesc||'').includes(String(f.quote)))){
    if(analysis.kind==='quota-update')return 'products';
    if(analysis.kind==='discussion'&&/^Good plans are simple\.\s*I have one that should result in significantly more usage for everyone\./i.test(String(item.originalDesc||'')))return 'opinion';
  }
  // Verified source-side facts outrank generic short social titles. Unreviewed or
  // merely inferred author labels must never acquire a product identity.
  if(source==='ai-author-thsottiaux' && analysis?.state==='evidence-grounded' &&
    analysis.kind==='product-update' && Array.isArray(analysis.facts) &&
    analysis.facts.some(fact=>String(fact?.quote||'').trim().length>=18))return 'products';
  // Quotation-led journalism can have a generic title. Classify only when its
  // cited excerpt contains a concrete AI-agent incident and an attributable context.
  if(source==='simon-blog' && /^Quoting\s+/iu.test(title) &&
    /(?:A\.I\.|AI|artificial.intelligence).{0,26}agents?/iu.test(text) &&
    /(?:State Department|government website|visa applications?|cyberattacks?|security incident|政府网站|签证申请)/iu.test(text))return 'safety';
  if (["hf-papers","paperswithcode","arxiv-ai"].includes(source)) return "research";
  // Strong model/version identifiers and explicit paper/project tags should not become 'other'
  // solely because a feed uses terse titles. Do not use the source label as a model claim.
  if (source==="reddit-machinelearning" && /\[\s*P\s*\]/iu.test(title) && !/self.promotion/i.test(title)) return "engineering";
  if (source==="reddit-machinelearning" && (/(?:\[\s*R\s*\]|\[\s*\d{4}\.\d{4,5}\s*\])/iu.test(title))) return "research";
  // A [D] question about AI tooling is an explicit community viewpoint, not
  // a dated model announcement or a research paper. Preserve [P]/[R] above.
  if (source==="reddit-machinelearning" && /\[\s*D\s*\]/iu.test(title) &&
      /(?:\?|\b(?:outdated|obsolete|worth it|future of)\b|过时|取代)/iu.test(title) &&
      /\b(?:agentic|AI|LLM|ipynb|notebook|machine.learning)\b/iu.test(title))return "opinion";
  if (source==="simon-blog" && /^ttok(?:\s+v?\d[\w.]*)?$/iu.test(title))return "engineering";
  if (/\b(?:Qwen[-\s]?(?:Image[-\s]?)?\d+(?:\.\d+)*(?:[-\s]?(?:Flash|Turbo|Pro|Next))?|GLM[-\s]?\d+(?:\.\d+)*(?:\s+Flash)?|Mistral\s+(?:Large|Medium|Small)\s+\d+(?:\.\d+)?|Llama\s*\d+(?:\.\d+)?|Youtu[-/]Parsing[-/]Omni)\b/iu.test(title))return "models";
  if (/(?:\b\d[\d,.]*\s*(?:tok\/s|tokens?\/s|tok\/sec|tokens? per second)\b|prefill\b.{0,55}\b(?:tok|tokens)\/|\b(?:model|LLM|Qwen|GLM)\b.{0,50}\b(?:benchmark|eval|throughput)\b)/iu.test(title))return "research";
  // Technical prediction/forecasting and Ray-Ban product names are not opinions or bans.
  if (/leak|rumou?r|speculat|争议|泄露|爆料|传闻|观点|我认为|I think|(?:AI|Claude|人工智能).{0,35}(?:超越.{0,10}人类|取代|预测|will replace)|(?:predict|forecast).{0,35}(?:human|AGI|superintelligen)/iu.test(title)) return "opinion";
  if (["github-ai-trending","codex-releases","claude-code-releases"].includes(source)) return "engineering";
  if (/policy|regulat|safety|privacy|copyright|vulnerab|security|(?:^|\s)ban(?:ned|s)?(?:\s|$)|rogue.{0,35}agents?|agents?.{0,30}(?:abuse|misuse)|封号|账号封禁|政策|监管|安全|版权|隐私|谣言|诈骗|惩罚|处罚/iu.test(title)) return "safety";
  if (/教程|入门|提示词|指南|实战|(?:AI|Claude|GPT|模型).{0,15}(?:写小说|使用经验|实用经验)|(?:如何|how to).{0,35}(?:使用|部署|构建|实现|搭建|build|use|deploy)|tutorial|guide\b|prompting|academy/iu.test(title)) return "practice";
  if (/ARR|融资|营收|商业|合作|收购|上市|股价|芯片|算力|数据中心|成本|促就业|年化收入|investment|funding|revenue|\braises?\s*\$[\d,.]+|partnership|acquisition|datacenter|data center|GPU|chip\b|quant research|quant trading|enterprise|advertising|business|scales?\b/iu.test(title)) return "business";
  if (["hf-papers","paperswithcode","arxiv-ai"].includes(source) || /论文|研究|评测|基准|数学|数学成果|撤回.{0,12}数学|撤回.{0,15}论文|证明|benchmark|evaluation|papers?\b|mathematical|mathematics|theorem|ablation|arxiv|inferbench|novel enzyme|verification program/iu.test(title)) return "research";
  if (/\b(?:do you think|what do you think|how do you feel|would you rather)\b|你怎么看|大家觉得|你们认为/iu.test(title) && matchAiContent({title}))return "opinion";
  if (/Claude Code|Codex|Copilot|CLI\b|SDK\b|API\b|MCP\b|开源项目|编程|开发者|repository|decision memory.{0,20}AI|AI.{0,20}(?:agents?|tools?)(?:\b|[\u4e00-\u9fff])|open.source.{0,20}(project|tool|framework)|coding|computer use|计算机使用|工程/iu.test(title)) return "engineering";
  if (/Claude\s+(?:Haiku|Sonnet|Opus|Fable)|模型|LLMs?|GPT-?\d|Gemma|参数|weights|multimodal|reasoning|model\b|introducing (?:gpt|gemini|llama|claude)/iu.test(title+" "+path)) return "models";
  if (/发布|上线|产品|应用|工具|launch|release|introduc|app\b|product|tool\b|Sora|Midjourney|glasses/iu.test(title)) return "products";
  if (/工作流|workflow/iu.test(title)) return "practice";
  // Community reactions with an explicit AI subject are viewpoints/discussion,
  // not unidentified news; weakly related one-liners remain honestly unclassified.
  if (["reddit-localllama","reddit-machinelearning","reddit-artificial","hackernews-ai"].includes(source) &&
      title.length>=18 && matchAiContent({title})) return "opinion";
  // Broad provider labels are not enough to classify an individual story.
  return source==="hf-models" ? "models" : source==="producthunt-ai" ? "products" : "other";
}
export function normalizeAiBoard(value) {
  return {
    preset: Object.hasOwn(AI_PRESETS, value?.preset) ? value.preset : "general",
    excluded: Array.isArray(value?.excluded) ? [...new Set(value.excluded.filter(s => typeof s === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(s)))].slice(0,300) : [...AI_BOARD_DEFAULTS.excluded],
    refined: typeof value?.refined === "boolean" ? value.refined : true,
  };
}
export function aiOriginalRank(item) {
  const discovery=item?.extra?.discovery;
  const value = Number((discovery?.source===meta(item).primarySource ? discovery.originalRank : null) ?? meta(item).primaryRank ?? item?.rank);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}
export function aiSourceMetric(item) {
  item=normalizeRankingMetric(item,meta(item).primarySource);
  const today = Number(item?.todayStars);
  if (item?.todayStars !== undefined && Number.isFinite(today) && today >= 0) return {kind:"stars-today",value:today};
  const raw = item?.displayMetric || item?.metric;
  if (raw && raw.value !== null && raw.value !== "" && Number.isFinite(Number(raw.value)) && Number(raw.value) >= 0)
    return {kind:String(raw.kind || "value"),label:String(raw.label || ""),value:Number(raw.value)};
  if (item?.hot !== undefined && item.hot !== null && item.hot !== "" && Number.isFinite(Number(item.hot)) && Number(item.hot) >= 0)
    return {kind:"value",value:Number(item.hot)};
  return null;
}
export function aiCanonicalUrl(value) {
  try {
    const url = new URL(value);
    if (!["https:","http:"].includes(url.protocol) || url.username || url.password) return "";
    url.hash="";
    if (/^www\.(openai\.com|anthropic\.com|deepmind\.google|about\.fb\.com|github\.com)$/u.test(url.hostname))url.hostname=url.hostname.slice(4);
    for (const key of [...url.searchParams.keys()]) if (/^utm_|^(spm|from|ref|source)$/iu.test(key)) url.searchParams.delete(key);
    return url.href.replace(/\/$/, "");
  } catch { return ""; }
}
const officialHosts={'openai-news':['openai.com'],'openai-research':['openai.com'],'anthropic-news':['anthropic.com'],'deepmind-blog':['deepmind.google'],'gemini-blog':['blog.google'],'qwen-blog':['qwenlm.github.io'],'qwen-model-updates':['platform.qianwenai.com'],'minimax-blog':['www.minimax.io'],'kimi-blog':['www.kimi.com']};
export function mergeAiArticles(...lists) {
  const seen = new Map();
  for (const item of lists.flat()) {
    const canonical=aiCanonicalUrl(item?.url);
    const key=item?.extra?.verifiedReleaseId && meta(item).primarySource==='qwen-model-updates'
      ? canonical+'::'+item.extra.verifiedReleaseId+'::'+String(item.publishedAt||'')
      : canonical || String(item?.id || "");
    if (!key) continue;
    const previous=seen.get(key);
    if (!previous) { seen.set(key,item); continue; }
    // A discussion can link to the official article before its first-party feed arrives.
    // The verified publication owns its title/summary/date; discussion metrics cannot become official heat.
    const firstParty=row=>Boolean(row.extra?.publicationEvidence && aiTimes(row).published && aiCanonicalUrl(row.url) && officialHosts[meta(row).primarySource]?.includes(new URL(row.url).hostname));
    if(firstParty(item) && !firstParty(previous)) {
      const confirmations=[...(meta(item).confirmations || []),...(meta(previous).confirmations || [])];
      seen.set(key,{...item,extra:{...previous.extra,...item.extra,aiSignal:{...meta(item),confirmations:confirmations.slice(0,20)}}});
      continue;
    }
    // Exact original URL only; retain verified fields from the native ranking.
    const sameSource=meta(previous).primarySource===meta(item).primarySource;
    const metrics = sameSource ? Object.fromEntries(["metric","displayMetric","hot","todayStars"].filter(key=>item[key]!==undefined).map(key=>[key,item[key]])) : {};
    const published = sameSource && !aiTimes(previous).published ? aiTimes(item).published : null;
    const discovery = item.extra?.discovery || previous.extra?.discovery;
    seen.set(key,{...previous,...metrics,...(published ? {publishedAt:new Date(published).toISOString()} : {}),extra:{...previous.extra,...(discovery ? {discovery} : {})}});
  }
  return [...seen.values()];
}
export function aiRefinedItem(item) {
  const text=aiContentText(item);
  if (/AI美女|AI换脸.{0,10}(明星|搞笑)|纯娱乐|薅羊毛|无限白嫖|早起.{0,20}福利|代充|成品号|账号出售|AI\s*(girlfriend|waifu)/iu.test(text)) return false;
  if (["producthunt-ai","sina-ai"].includes(meta(item).primarySource) && !matchAiContent(item)) return false;
  return true;
}
export function selectAiBoardItems(items,limit=4) {
  const counts=new Map(),chosen=[];
  const rankScore=item=>["codex-releases","claude-code-releases"].includes(meta(item).primarySource) ? Date.parse(item.updatedAt || "") || 0 : 0;
  for(const item of [...items].sort((a,b)=>rankScore(b)-rankScore(a) || aiCuratedScore(b)-aiCuratedScore(a))) {
    const source=meta(item).primarySource || "unknown";
    const cap=["codex-releases","claude-code-releases"].includes(source)?1:2;
    if((counts.get(source)||0)>=cap)continue;
    chosen.push(item);counts.set(source,(counts.get(source)||0)+1);
    if(chosen.length>=limit)break;
  }
  return chosen;
}
export function aiCuratedScore(item, now = Date.now()) {
  const source=meta(item).primarySource || "";
  const text=aiContentText(item), title=String(item.originalTitle || item.title || "");
  let score = aiContentTopic(item)==="other" ? -10 : 0;
  if (/^(openai-|anthropic-|deepmind-|meta-ai-|mistral-|cohere-|qwen-blog|qwen-model-updates|gemini-blog|ai-vendor-|codex-releases|claude-code-releases)/u.test(source)) score+=8;
  if (/发布|上线|开源|突破|launch|release|introduc|open.weights/iu.test(title)) score+=5;
  if(source==="github-ai-trending" && Number(item.todayStars)>0)score+=10;
  const rank=aiOriginalRank(item); if (rank) score+=Math.max(0,4-Math.log2(rank+1));
  const published=aiTimes(item,now).published;
  if (published) {
    const age=now-published;
    if(age<86400000)score+=6;
    else if(age<3*86400000)score+=3;
    else if(age>30*86400000)score-=8;
    else if(age>7*86400000)score-=3;
  }
  if (/泄露|传闻|leak|rumou?r/iu.test(title)) score-=5;
  if (aiContentTopic(item)==="opinion") score-=2;
  if (!aiRefinedItem(item)) score-=30;
  const datePath=String(item.url || "").match(/\/(20\d{2})\/(\d{2})(?:\/|$)/);
  if(datePath) {const age=Date.now()-Date.UTC(Number(datePath[1]),Number(datePath[2])-1,1);if(age>120*86400000)score-=12;if(age>365*86400000)score-=12;}
  if (text.length<16) score-=3;
  return score;
}
