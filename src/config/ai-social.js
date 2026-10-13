// Shared platform/person identities. Employee commentary is not an institutional promise.
export const AI_X_ACCOUNTS = Object.freeze([
  {username:'thsottiaux',name:'Tibo',source:'ai-author-thsottiaux',role:'employee',organization:'OpenAI',context:'Codex & ChatGPT at OpenAI'},
  {username:'OpenAIDevs',name:'OpenAI Developers',source:'openai-devs-x',role:'official',organization:'OpenAI',context:'OpenAI developer products'},
  {username:'OpenAI',name:'OpenAI',source:'openai-x',role:'official',organization:'OpenAI',context:'OpenAI'},
  {username:'AnthropicAI',name:'Anthropic',source:'anthropic-x',role:'official',organization:'Anthropic',context:'Anthropic'},
]);
export const AI_X_OPTIONS = Object.freeze([{value:'all',label:'全部动态'},...AI_X_ACCOUNTS.map(a=>({value:a.username.toLowerCase(),label:a.name}))]);
// Domain handles and fixed DIDs prevent a renamed/reassigned handle changing identity.
export const AI_BLUESKY_ACCOUNTS = Object.freeze([
  {platform:'bluesky',username:'simonwillison.net',did:'did:plc:kft6lu4trxowqmter2b6vg6z',name:'Simon Willison',source:'simon-bluesky',role:'author',identity:'https://simonwillison.net/',context:'Independent AI researcher; LLM and Datasette'},
  {platform:'bluesky',username:'eugeneyan.com',did:'did:plc:ilhs5ksfpze2l5rqgig4ycl6',name:'Eugene Yan',source:'eugene-bluesky',role:'author',identity:'https://eugeneyan.com/',context:'AI engineering and applied machine learning'},
]);
export const AI_BLUESKY_OPTIONS = Object.freeze([{value:'all',label:'全部动态'},...AI_BLUESKY_ACCOUNTS.map(a=>({value:a.username,label:a.name}))]);
export const AI_SOCIAL_ACCOUNTS = Object.freeze([...AI_X_ACCOUNTS,...AI_BLUESKY_ACCOUNTS]);
export const socialPlatform = account => account.platform==='bluesky'?'Bluesky':'X';
export const socialChannel = account => account.platform==='bluesky'?'public-bluesky-api':'public-x-profile';
export const socialAccountFor = item => AI_SOCIAL_ACCOUNTS.find(a=>a.source===item.extra?.aiSignal?.primarySource);
export function socialPostUrl(account,postId){return account.platform==='bluesky'?`https://bsky.app/profile/${account.username}/post/${postId}`:`https://x.com/${account.username}/status/${postId}`;}
