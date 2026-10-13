// Fixed public input registry; shared by category rankings and topic intake.
export const AI_VENDOR_MODELS = [
  ['qwen','Qwen','Qwen'],['deepseek','DeepSeek','deepseek-ai'],['kimi','Kimi','moonshotai'],['glm','智谱 GLM','zai-org'],
  ['minimax','MiniMax','MiniMaxAI'],['mistral','Mistral','mistralai'],['google','Google','google'],['nvidia','NVIDIA','nvidia'],
].map(([key,name,org])=>({key,name,org,url:'https://huggingface.co/'+org}));
export const AI_EXTRA_PUBLICATIONS = [
  {key:'minimax-blog',source:'minimax-blog',name:'MiniMax 官方发布',url:'https://www.minimax.io/blog',hosts:['www.minimax.io'],parser:'minimax-cards'},
  {key:'kimi-blog',source:'kimi-blog',name:'Kimi 官方研究',url:'https://www.kimi.com/en/blog/',hosts:['www.kimi.com'],parser:'kimi-cards'},
  {key:'qwen-blog',source:'qwen-blog',name:'Qwen 官方博客',url:'https://qwenlm.github.io/blog/index.xml',hosts:['qwenlm.github.io']},
  {key:'gemini-blog',source:'gemini-blog',name:'Google Gemini',url:'https://blog.google/products-and-platforms/products/gemini/rss/',hosts:['blog.google']},
  {key:'simon-blog',source:'simon-blog',name:'Simon Willison',url:'https://simonwillison.net/atom/everything/',hosts:['simonwillison.net']},
  {key:'lilian-blog',source:'lilian-blog',name:'Lilian Weng',url:'https://lilianweng.github.io/index.xml',hosts:['lilianweng.github.io']},
  {key:'chip-blog',source:'chip-blog',name:'Chip Huyen',url:'https://huyenchip.com/feed.xml',hosts:['huyenchip.com']},
];
export const AI_PEOPLE = [{key:'simon-bluesky',name:'Simon Willison · Bluesky',actor:'simonwillison.net',url:'https://bsky.app/profile/simonwillison.net',identity:'https://simonwillison.net/'}];
export const AI_INTAKE_OPTIONS = [
  {value:'all',label:'一手动态'},...AI_EXTRA_PUBLICATIONS.map(f=>({value:f.key,label:f.name})),
  ...AI_VENDOR_MODELS.map(f=>({value:f.key,label:f.name+' · 模型仓库'})),...AI_PEOPLE.map(f=>({value:f.key,label:f.name})),
];
export const AI_MODEL_OPTIONS = [
  {value:'consensus',label:'跨榜综合'}, {value:'livebench',label:'LiveBench 综合'}, {value:'coding',label:'LiveBench 编程'},
  {value:'reasoning',label:'LiveBench 推理'}, {value:'analysis',label:'LiveBench 数据分析'},
  {value:'aa',label:'Artificial Analysis'}, {value:'arena',label:'Arena 用户偏好'},
];
