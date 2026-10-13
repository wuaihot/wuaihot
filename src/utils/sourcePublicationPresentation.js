// First-party article routes use the vendor's verified hreflang scheme.
const OPENAI_LOCALES={'zh-CN':'zh-Hans-CN','zh-TW':'zh-Hant',ja:'ja-JP',ko:'ko-KR'};
const OFFICIAL_COVERS={
  'gpt-6-for-everyone':'https://images.ctfassets.net/kftzwdyauwt9/5frqtUAWccstAbVrCFraH6/5ae9b6bfbc3f3dff8001ed249812f97d/Intelligent-UI_Art-Card_16x9.png?w=640&h=360&fit=fill',
};
export function localizedPublicationUrl(value,locale='en') {
  try {const url=new URL(value);if(url.hostname!=='openai.com' || !/^\/(?:[a-z]{2}(?:-[A-Za-z]+)*\/)?index\//.test(url.pathname))return value;
    const article=url.pathname.replace(/^\/(?:[a-z]{2}(?:-[A-Za-z]+)*\/)?index\//,'');
    url.pathname='/'+(OPENAI_LOCALES[locale]?OPENAI_LOCALES[locale]+'/':'')+'index/'+article;return url.href;
  }catch{return value || '';}
}
export function publicationCover(item) {
  if(item.cover)return item.cover;
  try {const url=new URL(item.url);if(url.hostname==='openai.com')return OFFICIAL_COVERS[url.pathname.split('/').filter(Boolean).at(-1)] || ''; }catch{/* No cover without original evidence. */}
  return '';
}
