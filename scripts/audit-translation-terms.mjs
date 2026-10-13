import {readableBackendBatch,restoreReadableBrands,restoreAiReadableTerms} from "../src/utils/readableTranslationProtocol.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import { protectTranslationTerms as protectClientTerms } from "../src/utils/translationTerms.mjs";
import { protectTranslationTerms as protectServerTerms } from "../api/_translation-terms.js";

const source =
  "Statement on access to Fable 5, Claude Opus 4.8, GLM-5.2 and AI APIs";
const protectedValue = protectClientTerms(source, "AUDITTERM");
const serverProtectedValue = protectServerTerms(source, "AUDITTERM");
assert.equal(serverProtectedValue.protectedText, protectedValue.protectedText);
assert.equal(serverProtectedValue.restore(serverProtectedValue.protectedText), source);

assert.ok(!protectedValue.protectedText.includes("Fable 5"));
assert.ok(!protectedValue.protectedText.includes("Claude Opus 4.8"));
assert.ok(!protectedValue.protectedText.includes("GLM-5.2"));
assert.ok(!protectedValue.protectedText.includes("AI"));

const modelVersionCases = [
  ["如何评价GLM-5.2？", "如何评价AUDITTERM0X？"],
  ["Introducing Claude Opus 4.8", "Introducing AUDITTERM0X"],
  ["GPT-5.6 Sol release notes", "AUDITTERM0X release notes"],
  ["Fable 5 access", "AUDITTERM0X access"],
];
for (const [modelSource, expectedProtected] of modelVersionCases) {
  const clientProtected = protectClientTerms(modelSource, "AUDITTERM");
  const serverProtected = protectServerTerms(modelSource, "AUDITTERM");
  assert.equal(clientProtected.protectedText, expectedProtected);
  assert.equal(serverProtected.protectedText, expectedProtected);
  assert.equal(clientProtected.restore(clientProtected.protectedText), modelSource);
  assert.equal(serverProtected.restore(serverProtected.protectedText), modelSource);
}

const translated = protectedValue.protectedText.replace("Statement on access to", "关于访问");
const restored = protectedValue.restore(translated);
assert.match(restored, /Fable 5/);
assert.match(restored, /Claude Opus 4\.8/);
assert.match(restored, /GLM-5\.2/);
assert.match(restored, /AI APIs/);

const readableTitlesSource = fs.readFileSync(
  new URL("../src/utils/readableTitles.js", import.meta.url),
  "utf8",
);
assert.match(
  fs.readFileSync(new URL("../src/utils/readableTranslationProtocol.mjs", import.meta.url), "utf8"),
  /Array\.isArray\(response\?\.data\?\.data\)/,
  "readable title translation must accept the current API envelope response.data.data",
);
assert.match(
  fs.readFileSync(new URL("../src/utils/readableTranslationProtocol.mjs", import.meta.url), "utf8"),
  /Array\.isArray\(response\?\.data\)/,
  "readable title translation must keep legacy array response compatibility",
);
assert.match(
  readableTitlesSource,
  /BACKEND_TRANSLATION_CHUNK_CONCURRENCY\s*=\s*2/,
  "readable title backend chunks must use bounded concurrency",
);
assert.match(
  readableTitlesSource,
  /\{ priority = 0, allowClientFallback = false, allowRawFallback = false \}/,
  "readable title translation must expose an explicit per-call client fallback opt-in",
);
assert.match(
  readableTitlesSource,
  /clientTranslationAllowed\s*=\s*[\s\S]{0,120}ALLOW_CLIENT_READABLE_TRANSLATION\s*\|\|\s*Boolean\(allowClientFallback\)/,
  "explicit client fallback must augment rather than replace the existing environment default",
);
assert.match(
  readableTitlesSource,
  /::client:\$\{clientTranslationAllowed \? 1 : 0\}::/,
  "pending translation batches must isolate client-fallback and backend-only modes",
);
assert.match(
  readableTitlesSource,
  /await Promise\.all\([\s\S]{0,500}Math\.min\([\s\S]{0,300}BACKEND_TRANSLATION_CHUNK_CONCURRENCY/,
  "readable title backend chunks must execute through the bounded worker pool instead of serially",
);

const clientApiSource = fs.readFileSync(
  new URL("../src/api/index.js", import.meta.url),
  "utf8",
);
assert.match(
  clientApiSource,
  /Array\.from\(new Set\(\[PUBLIC_API2_BASE, "\/api"\]\.filter\(Boolean\)\)\)/,
  "readable translation API bases must be deduplicated before fallback attempts",
);

const proxySource = fs.readFileSync(new URL("../api/[...path].js", import.meta.url), "utf8");
assert.match(proxySource, /prepareReadableTranslationProxyBody/);
assert.match(
  proxySource,
  /payload\.texts\.map\(\(text\) =>[\s\S]{0,100}protectTranslationTerms\(text\)/,
  "serverless term protection must be deterministic and independent of batch position",
);
assert.doesNotMatch(
  proxySource,
  /DHTERM\$\{index\}N/,
  "serverless term protection must not fragment backend cache keys by batch index",
);
assert.match(proxySource, /READABLE_TRANSLATION_PROXY_TIMEOUT_MS\s*=\s*12000/);
assert.match(proxySource, /AbortSignal\.timeout\(timeoutMs\)/);
assert.match(
  proxySource,
  /JSON\.parse\(result\.text\)\?\.success\s*===\s*false/,
  "HTTP 200 translation-unavailable responses must fall through to the next upstream",
);
assert.match(proxySource, /body: proxyBody/);
assert.match(proxySource, /item\.original = restore\(item\.original\)/);
assert.match(proxySource, /item\.translated = restore\(item\.translated\)/);
assert.match(proxySource, /readableTranslationProtection\.restoreResponse\(text\)/);

console.log("[translation-terms] shared term protection and serverless wiring verified");

const translationCalls=[];
const requested=["Claude frontier academy","Gemini model released"];
const translatedBatch=await readableBackendBatch(requested,"zh-CN",async(texts,locale,options)=>{
  translationCalls.push({texts,options});
  if(!options?.rawFallback)return {data:{data:texts.map(original=>({original,translated:original}))}};
  return {data:{data:[{id:1,original:texts[1],translated:"双子座模型发布"},{id:0,original:texts[0],translated:"克劳德前沿学院"}]}};
},{allowRawFallback:true});
assert.equal(translationCalls.length,2);
assert.deepEqual(translationCalls[1].texts,requested,"raw fallback uses public original text, not opaque placeholders");
assert.equal(translatedBatch.get(requested[0]),"Claude前沿学院");
assert.equal(translatedBatch.get(requested[1]),"Gemini模型发布","response order must not misassign titles");
let rawAttempts=0;
await readableBackendBatch(requested,"zh-CN",async(texts,locale,options)=>{if(options?.rawFallback)rawAttempts++;return {data:[]};});
assert.equal(rawAttempts,0,"raw public-text fallback requires an explicit caller opt-in");
assert.equal((await readableBackendBatch(requested,"zh-CN",async()=>{throw Error("offline")},{allowRawFallback:true})).size,0,"all failures preserve original content");
assert.equal(restoreReadableBrands("ordinary person","克劳德"),"克劳德","unrelated names are not overwritten");
assert.equal(restoreAiReadableTerms("Falcon-Emirati: When an LLM learns the dialect","猎鹰阿联酋：当法学硕士学习方言"),"Falcon-Emirati：当LLM学习方言");
assert.equal(restoreAiReadableTerms("The real customer is the model","真正的客户是模特"),"真正的客户是模型");
assert.equal(restoreAiReadableTerms("Mistral: open weights at the end of the month","Mistral：月底开放重量赛"),"Mistral：月底开放权重");
assert.equal(restoreAiReadableTerms("Mistral: open weights","Mistral：开放举重"),"Mistral：开放权重");
assert.equal(restoreAiReadableTerms("The design language that makes your AI harness better at design.","使您的 AI 安全带更擅长设计的设计语言。"),"使您的 AI 工具更擅长设计的设计语言。");
assert.equal(restoreAiReadableTerms("AI improves seat belt safety","AI 改进安全带"),"AI 改进安全带","literal seat belts must not be rewritten");
assert.equal(restoreAiReadableTerms("Fashion model wins award","模特获奖"),"模特获奖","human models are not overwritten");
assert.equal(restoreAiReadableTerms("Master of Laws graduation","法学硕士毕业"),"法学硕士毕业","law degrees without an original LLM acronym are not overwritten");
assert.match(clientApiSource,/rawFallback \? \["\/api"\]/,"raw fallback stays on the authorized same-origin proxy");
assert.match(proxySource,/x-readable-raw-fallback/);
console.log("[translation-protocol] protected failure, public-text fallback, brand identity, shuffled envelopes and opt-in boundaries verified");
