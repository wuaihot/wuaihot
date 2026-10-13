import {protectTranslationTerms} from "./translationTerms.mjs";
const records = response => Array.isArray(response?.data?.data) ? response.data.data : Array.isArray(response?.data) ? response.data : [];
export function restoreReadableBrands(original,translated) {
  let value=String(translated || "").trim();
  const pairs=[
    [/\bHaiku\b/i,/俳句|俳\s*句/g,"Haiku"],
    [/\bOpus\b/i,/作品(?=\s*\d+(?:\.\d+))|巨著(?=\s*\d+(?:\.\d+))/g,"Opus"],
    [/\bSonnet\b/i,/十四行诗(?=\s*\d+(?:\.\d+))|十四行詩(?=\s*\d+(?:\.\d+))/g,"Sonnet"],
    [/\bFable\b/i,/寓言(?=\s*\d+(?:\.\d+))/g,"Fable"],
    [/\bClaude Code\b/i,/(?:克劳德|克勞德|Claude|claude)(?:\s*代码|\s*代碼|\s*コード|\s*코드)/g,"Claude Code"],
    [/\bClaude\b/i,/克劳德|克勞德|クロード|클로드/g,"Claude"],
    [/\bGemini\b/i,/双子座|雙子座|ジェミニ|제미니/g,"Gemini"],
    [/\bAnthropic\b/i,/人类学|人類學|アンソロピック|앤트로픽/g,"Anthropic"],
    [/\bLLMs?\b/i,/法学硕士|法學碩士/g,"LLM"],
    [/\bFalcon-Emirati\b/i,/猎鹰[·\-\s]?阿联酋|獵鷹[·\-\s]?阿聯酋/g,"Falcon-Emirati"],
  ];
  for(const [pattern,alias,name] of pairs)if(pattern.test(original))value=value.replace(alias,name);
  return value.replace(/Claude(?=Haiku|Opus|Sonnet|Fable|Mythos)/g,'Claude ').replace(/(Haiku|Opus|Sonnet|Fable|Mythos)(?=\d)/g,'$1 ');
}
export function restoreAiReadableTerms(original,translated) {
  let value=restoreReadableBrands(original,translated);
  if(/\b(?:language|frontier|foundation|AI)\s+models?\b|\breal customer.{0,40}\bmodel\b/iu.test(original) || /\bmodels?\b/iu.test(original) && /\b(?:parameters?|tokens?|LLMs?|Claude|Mistral|GPT[- ]?\d|Gemini)\b/iu.test(original))value=value.replace(/模特/g,"模型");
  if(/\bopen[- ]weights?\b/iu.test(original))value=value.replace(/开放重量赛|開放重量賽|开放重量|開放重量|开放举重|開放舉重|开源举重|開源舉重/g,"开放权重");
  if(/\bAI harness\b/iu.test(original))value=value.replace(/(?:AI|人工智能|人工智慧)\s*安全带|(?:AI|人工智能|人工智慧)\s*安全帶/g,"AI 工具");
  if(/\btokens?\b/i.test(original) && /Claude|Haiku|GPT|tokenizer|input|output|context/i.test(original))value=value.replace(/代币|代幣/g,"Token");
  return value;
}
export async function readableBackendBatch(texts,locale,request,{allowRawFallback=false}={}) {
  const protectedItems=texts.map(text=>protectTranslationTerms(text));
  const map=new Map();
  const accept=(response,originals,sent,restore)=> {
    for(const [index,item] of records(response).entries()) {
      const found=sent.indexOf(String(item.original || ""));
      const position=found>=0 ? found : Number.isSafeInteger(item.id)&&item.id>=0&&item.id<originals.length ? item.id : index;
      const original=originals[position];if(!original)continue;
      const translated=restore(position,String(item.translated || "").trim());
      if(translated && translated!==original && !/DH\s*T(?:E)?\s*R\s*M\s*\d+\s*X/i.test(translated))map.set(original,translated);
    }
  };
  try {
    const sent=protectedItems.map(item=>item.protectedText);
    accept(await request(sent,locale),texts,sent,(index,value)=>protectedItems[index].restore(value).trim());
  }catch{/* The optional public-text fallback remains available. */}
  const missing=texts.filter(text=>!map.has(text));
  if(allowRawFallback && missing.length) {
    try {accept(await request(missing,locale,{rawFallback:true}),missing,missing,(_,value)=>value);}
    catch{/* Preserve originals when both transports fail. */}
    for(const text of missing)if(map.has(text))map.set(text,restoreReadableBrands(text,map.get(text)));
  }
  return map;
}
