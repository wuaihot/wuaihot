// Editorial presentation only: preserve the original source and reading archive.
// A live popularity rank without an article publication date is not new reporting.
const MIXED_FEEDS=new Set(['sina','sina-ai','36kr','36kr-ai','weibo','baidu','ithome','ithome-ai','hackernews','hackernews-ai']);
const ENTERTAINMENT_RECREATION=/(?:\bAI\b|人工智能).{0,12}(?:还原|生成|合成|绘制|制作|画).{0,30}(?:足坛|球星|足球|奥运|明星|表情|玩梗|搞笑|段子)|(?:奥运|足坛|球星|足球|明星).{0,32}(?:AI图|AI.{0,8}玩梗|AI.{0,8}还原|AI.{0,8}生成)/iu;
const SENSATIONAL=/太震撼|刚刚[，,:：]|黑手|一夜之间|彻底颠覆|杀器|惊呆|炸裂|史诗级|\b(?:shocking|bombshell|mind.blowing)\b/iu;
const RUMOR=/曝光|传闻|据传|疑似|被曝|爆料|\b(?:rumou?r|leak|unconfirmed|speculat)\b/iu;
const EVERGREEN=/解密什么是|由浅入深|基础科普|科普入门|如何理解什么是/iu;
const UNVERIFIED_WINDfall=/(?:用|靠|凭|依赖|借助)\s*(?:AI|人工智能).{0,20}(?:赚了?|狂赚|挣了?|营收|暴赚).{0,18}(?:亿|万|billion|million)/iu;
const CUSTOMER_STORY=/(?:how .{1,55}(?:uses?|using)|cuts? .{0,55}(?:costs?|time)|customer stor(?:y|ies)|case stud(?:y|ies)|turns .{0,55}into campaigns|客户案例|成功案例)/iu;
export function aiBoardPresentationDecision(item,evidence){
 const title=String(item?.originalTitle||item?.title||'');
 const source=item?.extra?.aiSignal?.primarySource||item?.extra?.discovery?.source||'';
 const rankOnly=MIXED_FEEDS.has(source)&&!evidence?.published&&
   Array.isArray(evidence?.reasons)&&evidence.reasons.length>0&&
   evidence.reasons.every(r=>r.code==='ranked')&&evidence.snapshot?.valid;
 // Explicitly peripheral AI-generated entertainment does not belong in the
 // compact intelligence board, even if the upstream mixed-topic rank is #1.
 // No geopolitical/political or vendor preference is considered.
 if(rankOnly&&ENTERTAINMENT_RECREATION.test(title))return {admit:false,adjustment:0,reason:'incidental-entertainment'};
 if(rankOnly&&UNVERIFIED_WINDfall.test(title))return {admit:false,adjustment:0,reason:'unsupported-economic-claim'};
 let adjustment=0;
 if(rankOnly){
   adjustment-=70;
   if(SENSATIONAL.test(title))adjustment-=12;
   if(RUMOR.test(title))adjustment-=10;
   if(EVERGREEN.test(title))adjustment-=12;
 }
 if(evidence?.official&&CUSTOMER_STORY.test(title)&&
   !/(?:official release|new model|critical vulnerability|data breach|安全漏洞|正式发布)/iu.test(title))adjustment-=30;
 return {admit:true,adjustment,reason:rankOnly?'rank-only-undated':'normal'};
}
