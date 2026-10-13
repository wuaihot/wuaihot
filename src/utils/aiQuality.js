import { aiCanonicalUrl, aiContentText, matchAiContent, aiHasPrimarySubject } from './aiContent.js';
import { aiTimes } from './aiTime.js';

// Independent editorial heuristics over public fields. A decision is not fact verification.
export const AI_QUALITY_VERSION = 2;
const DAY=86400000;
const OFFICIAL=new Set(['minimax-blog','kimi-blog','qwen-blog','qwen-model-updates','gemini-blog','openai','openai-news','openai-research','anthropic','anthropic-news','deepmind-blog','meta-ai','meta-ai-blog','xai-news','mistral','mistral-news','cohere','cohere-blog','codex-releases','claude-code-releases']);
const COMMUNITY=new Set(['tieba','linuxdo','v2ex','nodeseek','52pojie','hackernews','hackernews-ai','reddit-localllama','reddit-artificial','reddit-machinelearning','stackoverflow','lobsters','csdn','juejin','devto','zhihu','newsmth','ngabbs','hostloc']);
const VIDEO=new Set(['bilibili','acfun','douyin','kuaishou','xiaohongshu']);
const PROMOTION=/账号出售|成品号|代充|代验证|代认证|买号|卖号|收号|拼车|车找人|找车|四人车|无限白嫖|薅羊毛|社区公益推广|公益站|公益.{0,12}(?:站|上新|模型)|求.{0,12}(?:充值渠道|课程|网盘|资源)|会员认证|优惠券|红包|抽福利|(?:求购|出|收).{0,12}(?:Claude|GPT|Gemini).{0,12}(?:号|账号)|(?:affiliate|referral|coupon)\s*(?:link|code)|free.{0,20}(?:account|giveaway)/iu;
const ACTIONABLE=/实测|对比|机制|研究|分析|调试|复现|源码|示例|开源|评测|教程|指南|实践|部署|安全|权限|版权|监管|营收|融资|合作|价格|计费|额度|用量|API|MCP|RAG|发布|推出|上线|更新|bug|fix|test|benchmark|eval|research|compar|debug|reproduc|source code|tutorial|how to|pricing|quota|limit|release|launch|memory|reasoning|inference|agent|workflow|paper|study|policy|regulat|funding|partnership|acquisition|revenue|security|safety|privacy/iu;
const ENTERTAINMENT=/AI美女|AI\s*(girlfriend|waifu)|AI\s*MV|AI音乐|AI换脸|世界巡演|AI全民制作人|AI主播|AI zombie hug|cute.{0,12}AI|AI.{0,12}cute/iu;
const ROUTINE_MARKET=/(?:股票|A股|股市|股价|涨幅|涨停|跌停|复盘|交易如何|交易策略|all\s*in|stock|share price).{0,40}(?:排行榜|大盘|展望|涨|跌|走势|选股|泡沫|pick|rally|gain|fall)|(?:大盘|股市|A股).{0,25}(?:走势|怎么走)|节后展望/iu;
const HYPE=/数学大爆炸|(?:黎曼|哥德巴赫)猜想.{0,14}(?:已被证明|被攻克)|攻克\s*\d+\s*个数学难题|AI跨过菲尔兹奖终点线/iu;
const THIN_SEO=/(?:20\d{2}).{0,18}(?:工具选型|工具推荐|必备工具)|最全.{0,20}(?:AI|大模型)|从.{0,12}到.{0,12}终局/iu;

export function aiQualityProfile(item) {
  const source=item?.extra?.aiSignal?.primarySource || item?.extra?.discovery?.source || '';
  const variant=item?.extra?.discovery?.variant || '';
  if(['hf-models','paperswithcode','artificialanalysis','openrouter-rankings','arena-ai','designarena','aicpb-rankings','clawhub-skills','vscode-marketplace','greasy-fork','chrome-web-store','apple-app-store'].includes(source) || source==='huggingface' && variant==='models')return 'inventory';
  if(OFFICIAL.has(source) || /^ai-vendor-(qwen|deepseek|kimi|glm|minimax|mistral|google|nvidia)$/.test(source))return 'official';
  if(['hf-papers','arxiv-ai'].includes(source) || source==='huggingface' && variant==='papers')return 'research';
  if(['github-ai-trending','github','hellogithub'].includes(source))return 'repository';
  if(['producthunt-ai','producthunt'].includes(source))return 'product';
  if(['huggingface-blog','ai-author-thsottiaux','simon-blog','lilian-blog','chip-blog','simon-bluesky','eugene-bluesky'].includes(source) || source==='huggingface' && variant==='blog')return 'author';
  if(COMMUNITY.has(source))return 'community';
  if(VIDEO.has(source))return 'video';
  return 'news';
}

export function isAiPopularitySurface(source,variant='',kind='ranking') {
  if(kind!=='ranking' || /^(?:new|latest|list|created|updated|newthread|recently-published)$/.test(variant))return false;
  if(source==='tieba')return variant==='hot';
  if(source==='v2ex')return variant==='hot' || !variant;
  if(source==='hackernews')return ['', 'top','best','hot','front'].includes(variant);
  return new Set(['weibo','baidu','zhihu','sina','sina-ai','ithome','36kr','csdn','juejin','linuxdo','hackernews-ai','reddit-localllama','reddit-artificial','reddit-machinelearning','github-ai-trending','hf-papers','hf-models','producthunt-ai']).has(source);
}

export function evaluateAiQuality(item,{now=Date.now()}={}) {
  const profile=aiQualityProfile(item),source=item?.extra?.aiSignal?.primarySource || '';
  const title=String(item?.originalTitle || item?.title || '').trim(),text=aiContentText(item);
  const desc=String(item?.originalDesc || item?.desc || item?.summary || '');
  const reject=reason=>({eligible:false,score:0,profile,reasons:[reason],version:AI_QUALITY_VERSION});
  if(['public-x-profile','public-bluesky-api'].includes(item.extra?.intake?.channel) && item.extra.aiAnalysis?.state!=='evidence-grounded')return reject('processing');
  if(!aiCanonicalUrl(item?.url) || title.length<4)return reject('incomplete');
  if(profile==='author' && ['simon-blog','chip-blog','simon-bluesky','eugene-bluesky'].includes(source) && !aiHasPrimarySubject(item))return reject('incidental');
  if(profile==='inventory' || ['market_quote','dataset','alert'].includes(item?.extra?.discovery?.dataKind))return reject('inventory');
  if(source==='tieba' && item.extra?.discovery?.variant!=='hot')return reject('directory');
  if(/Transformers.{0,20}(?:电影|movie)|星座|horoscope/iu.test(text))return reject('unrelated');
  const relevant=matchAiContent(item),titleRelevant=matchAiContent({title});
  if(!relevant && !['official','research','author'].includes(profile))return reject('unrelated');
  // Passing mentions of the production tool do not turn unrelated articles into AI reading.
  if(!titleRelevant && ['news','video','community'].includes(profile) &&
    (!matchAiContent({title:desc.slice(0,100)}) || /使用(?:了)?.{0,20}(?:生成的)?AI.{0,12}(?:素材|音乐)|AI时代纯手搓|AI太好用了/iu.test(desc)))return reject('incidental');
  if(PROMOTION.test(text) && profile!=='official')return reject('promotion');
  if(source==='52pojie' && /注册版|破解版|资源合集|网盘下载|激活码/iu.test(title))return reject('promotion');
  if(ENTERTAINMENT.test(title) && !/产业|行业|版权|监管|市场|营收|教程|实测|研究|how to|tutorial|research|industry|copyright|regulat/iu.test(title))return reject('entertainment');
  if(profile!=='official' && HYPE.test(title))return reject('unsupported');
  if(profile==='news' && ROUTINE_MARKET.test(title) && !/发布|推出|上线|融资|收购|产品|launch|release|funding|acqui/iu.test(title))return reject('market-noise');
  if(profile==='community' && THIN_SEO.test(title) && desc.length<80)return reject('thin');
  if(profile==='community' && title.length<12 && desc.length<50 && !ACTIONABLE.test(title))return reject('thin');
  if(profile==='community' && ['nodeseek','linuxdo','csdn'].includes(source) && desc.length<80 && !ACTIONABLE.test(title+' '+desc) && !/体验|性能|故障|封号/iu.test(title))return reject('thin');
  if(profile==='video' && !ACTIONABLE.test(title) && /(?:体验|剑客).{0,25}(?:AI|取代)|不会被AI取代/iu.test(title))return reject('incidental');
  if(profile==='news' && /经济大盘点.{0,25}交易如何|(?:交易|选股).{0,12}复盘/iu.test(title))return reject('market-noise');
  if(profile==='community' && /(?:weekly|monthly|daily).{0,16}(?:thread|megathread)|招聘|求邀请码|签到|打卡|meme|shitpost|looking for (?:a job|an invite)|hiring|buy.{0,15}account/iu.test(title) && !/实测|评测|benchmark|research|debug|security/iu.test(title))return reject('community-noise');
  const created=item.extra?.modelRepository?.createdAt ? Date.parse(item.extra.modelRepository.createdAt) : null;
  if(created && now-created>30*DAY)return reject('old');
  const published=aiTimes(item,now).published;
  if(published && now-published>30*DAY && profile!=='repository')return reject('old');
  const path=String(item?.url || '').match(/\/(20\d{2})\/(\d{2})(?:\/|$)/);
  if(path && now-Date.UTC(Number(path[1]),Number(path[2])-1,1)>120*DAY && profile!=='repository')return reject('old-path');
  const concrete=ACTIONABLE.test(title+' '+desc.slice(0,400));
  const reasons=[relevant?'relevant':'dedicated',...(concrete?['substance']:[])];
  const score=50+(titleRelevant?10:0)+(concrete?20:0)+(['official','research','repository'].includes(profile)?8:0)+(desc.length>=80?4:0)- (published ? Math.min(20,Math.max(0,now-published)/DAY*2) : 5);
  return {eligible:true,score,profile,reasons,version:AI_QUALITY_VERSION};
}
