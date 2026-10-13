// Verified account metadata is authoritative; generated prose cannot invent affiliations.
export function socialAttributionIsValid(text,item,account){
  const material=[item.originalDesc,item.extra?.socialPost?.quoted?.text,account.organization].filter(Boolean).join(' ').toLowerCase();
  for(const name of ['OpenAI','Anthropic','Google','Microsoft','Meta','xAI'])if(new RegExp('\\b'+name+'\\b','i').test(text)&&!new RegExp('\\b'+name+'\\b','i').test(material))return false;
  if(account.role==='employee' && /(?:工程师|高管|负责人|首席|总裁|创始人|开发者|engineer|founder|CEO).{0,15}Tibo|Tibo.{0,15}(?:工程师|高管|负责人|首席|总裁|创始人)/i.test(text))return false;
  return true;
}
