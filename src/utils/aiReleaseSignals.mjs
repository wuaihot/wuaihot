import {aiTimes} from './aiTime.js';
const OFFICIAL=new Set(['openai-news','openai-research','anthropic-news','openai-devs-x','openai-x','anthropic-x','deepmind-blog','gemini-blog','qwen-blog','qwen-model-updates','minimax-blog','kimi-blog','meta-ai-blog','xai-news','mistral-news','cohere-blog']);
const MODEL=/\b(?:GPT[-‑ ]?\d|Claude\s+(?:Opus|Sonnet|Haiku|Fable)|Gemini\s*\d|(?:DeepSeek|Qwen|GLM|Kimi|MiniMax|Mistral|Grok|Llama|EmbeddingGemma|Nemotron)[- .\w]*\d)/iu;
const AVAILABLE=/发布|上线|开放|推出|现已|已提供|\b(?:introducing|launch(?:ed|ing)?|release[ds]?|now available|rolling out|rollout|available today|open[- ]weights)\b/iu;
const SPECULATION=/传闻|据传|即将|将于|预计|疑似|rumou?r|leak|will (?:launch|release)|expected to|coming soon/iu;
const GUIDE=/^(?:how\b|using\b|building\b|a guide\b)|\b(?:model guide|pricing guide|release notes)\b|模型指南|如何使用|使用教程|选型指南/iu;
const MODEL_SUBJECT=/^(?:llm-|I(?:’ve|'ve| have)? released (?:an?|my) (?:LLM )?plugin)/iu;
const titleIsRelease=(title,desc)=>{const match=title.match(MODEL);return !!match && match.index<80 && !MODEL_SUBJECT.test(title) && (AVAILABLE.test(title+' '+desc) || /^Claude\s+(?:Opus|Sonnet|Haiku|Fable)\s+\d+(?:\.\d+)*$/iu.test(title.trim()));};
export function aiOfficialModelRelease(item,now=Date.now()) {
  const source=item?.extra?.aiSignal?.primarySource || '';
  const title=String(item?.originalTitle || item?.title || '');
  const desc=String(item?.originalDesc || item?.desc || '').slice(0,320);
  const published=aiTimes(item,now).published;
  return OFFICIAL.has(source) && !!published && now-published<=72*3600000 && !SPECULATION.test(title) && !GUIDE.test(title) && titleIsRelease(title,desc);
}

// Reports still belong in the model lane; dedicated emphasis is official-only.
export function aiModelReleaseReport(item,now=Date.now()) {
 const title=String(item?.originalTitle || item?.title || ''),desc=String(item?.originalDesc || item?.desc || '').slice(0,320),published=aiTimes(item,now).published;
 return !!published && now-published<=72*3600000 && !SPECULATION.test(title) && !GUIDE.test(title) && titleIsRelease(title,desc);
}
