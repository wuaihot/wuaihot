import {aiCanonicalUrl} from '../src/utils/aiContent.js';
import {aiTime} from '../src/utils/aiTime.js';
import {calendarPublicationDate} from '../src/utils/publicationDates.js';
const clean=value=>String(value || '').replace(/<[^>]*>/g,' ').replace(/&#x27;|&#39;|&apos;/g,"'").replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
// Parse only fixed, dated official card indexes. Never infer publication from image paths or page modification.
export function parseAiOfficialPage(html,feed,now=Date.now()) {
  if(typeof html!=='string' || Buffer.byteLength(html)>2000000)throw Error('invalid_official_index');
  const rows=[],seen=new Set();
  const append=(href,title,desc,date)=>{
    const url=aiCanonicalUrl(new URL(href,feed.url).href),day=calendarPublicationDate(date),published=aiTime(day,now);
    if(!url || !feed.hosts.includes(new URL(url).hostname) || !published || !title || seen.has(url))return;
    seen.add(url);rows.push({url,title:clean(title).slice(0,500),desc:clean(desc).slice(0,1000),publishedAt:day,feedUrl:feed.url,format:'HTML',source:feed.source,sourceLabel:feed.name});
  };
  if(feed.parser==='minimax-cards')for(const [,href,body] of html.matchAll(/<a\b[^>]*href="([^"<>]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    if(!/\/blog\/[\w-]+$/.test(href))continue;
    const title=body.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1];
    if(!title)continue;
    append(href,title,body.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1],clean(body).match(/\b20\d{2}-\d{2}-\d{2}\b/)?.[0]);
  }
  else if(feed.parser==='kimi-cards')for(const match of html.matchAll(/<a\b[^>]*href="(\/en\/blog\/[\w-]+)"[^>]*>\s*<\/a>/g)) {
    const body=html.slice(match.index+match[0].length).split('<a ')[0].slice(0,4000);
    append(match[1],body.match(/<h4\b[^>]*>([\s\S]*?)<\/h4>/)?.[1],'',body.match(/<p\b[^>]*class="[^"]*card-date[^"]*"[^>]*>(20\d{2}-\d{2}-\d{2})<\/p>/)?.[1]);
  }
  if(!rows.length)throw Error('official_index_contract_changed');
  return rows.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,30);
}
