import { aiCanonicalUrl } from "../src/utils/aiContent.js";
import { aiTime } from "../src/utils/aiTime.js";

// Fixed first-party feeds only. Original-link matching never fetches arbitrary article URLs.
export const AI_PUBLICATION_FEEDS = [
  { key: "openai", source: "openai-news", name: "OpenAI", url: "https://openai.com/news/rss.xml", hosts: ["openai.com"] },
  { key: "deepmind", source: "deepmind-blog", name: "DeepMind", url: "https://deepmind.google/blog/rss.xml", hosts: ["deepmind.google"] },
  { key: "huggingface", source: "huggingface-blog", name: "Hugging Face", url: "https://huggingface.co/blog/feed.xml", hosts: ["huggingface.co"] },
  { key: "anthropic", source: "anthropic-news", name: "Anthropic", url: "https://www.anthropic.com/news", hosts: ["anthropic.com"], format: "dated-html" },
];
const MAX_BYTES = 2000000, MAX_ITEMS = 2000, CACHE_MS = 300000;
const cache = new WeakMap();
const decode = value => String(value || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => {
    const cp = n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n);
    return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : "";
  }).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, "&").trim();
export function parseAiPublications(xml, feed, now = Date.now()) {
  if(feed.format==='dated-html')return parseDatedPublicationCards(xml,feed,now);
  if (typeof xml !== "string" || Buffer.byteLength(xml) > MAX_BYTES || !/<(?:rss|feed)\b/i.test(xml) || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("invalid_publication_feed");
  const publications = [], seen = new Set();
  for (const [, entry] of xml.matchAll(/<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi)) {
    const field = tag => decode(entry.match(new RegExp("<" + tag + "\\b[^>]*>([\\s\\S]*?)<\\/" + tag + ">", "i"))?.[1]);
    const links = [...entry.matchAll(/<link\b([^>]+)>/gi)];
    const attrs = links.find(([, a]) => /rel=["']alternate["']/i.test(a))?.[1] || links[0]?.[1] || "";
    const url = aiCanonicalUrl(field("link") || decode(attrs.match(/href=["']([^"']+)["']/i)?.[1]));
    const publishedAt = aiTime(field("pubDate") || field("published"), now);
    if (!url || !publishedAt || seen.has(url) || !feed.hosts.includes(new URL(url).hostname)) continue;
    seen.add(url);
    const media=entry.match(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*(?:url|href)=["']([^"']+)["']/i)?.[1];
    const candidateCover=decode(media);let cover='';try{if(new URL(candidateCover).protocol==='https:')cover=candidateCover;}catch{}
    publications.push({ cover,url, publishedAt: new Date(publishedAt).toISOString(), feedUrl: feed.url, source: feed.source, sourceLabel: feed.name,
      title: field("title").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,500),
      desc: (field("description") || field("summary")).replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,1000) });
    if (publications.length >= MAX_ITEMS) break;
  }
  return publications;
}
// Some first-party model announcements live at the site root, outside /news/.
// Only dated cards on this fixed index qualify; never guess dates from fetch time.
export function parseDatedPublicationCards(html,feed,now=Date.now()) {
  if(typeof html!=='string' || Buffer.byteLength(html)>MAX_BYTES || /<!ENTITY/i.test(html))throw Error('invalid_publication_index');
  const text=value=>decode(value).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(),rows=[],seen=new Set();
  for(const [,attrs,body] of html.matchAll(/<a\b([^>]+)>([\s\S]*?)<\/a>/gi)) {
    const href=decode(attrs.match(/href=["']([^"']+)["']/i)?.[1]);let url='';try{url=aiCanonicalUrl(new URL(href,feed.url).href);}catch{}
    const title=text(body.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1] || body.match(/<span\b[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]),date=text(body.match(/<time\b[^>]*>([\s\S]*?)<\/time>/i)?.[1]);
    const parts=date.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})$/),month=parts?['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(parts[1].slice(0,3).toLowerCase()):-1;
    const calendar=parts&&month>=0?parts[3]+'-'+String(month+1).padStart(2,'0')+'-'+parts[2].padStart(2,'0'):'';
    const published=aiTime(calendar,now);if(!title || !published || !url || seen.has(url) || !feed.hosts.includes(new URL(url).hostname))continue;
    seen.add(url);rows.push({url,title:title.slice(0,500),desc:text(body.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]).slice(0,1000),publishedAt:calendar,feedUrl:feed.url,source:feed.source,sourceLabel:feed.name});
    if(rows.length>=100)break;
  }
  return rows;
}
async function readFeed(response) {
  if (!response.ok || Number(response.headers?.get("content-length")) > MAX_BYTES) throw new Error("publication_read_failed");
  if (!response.body?.getReader) {
    const text = await response.text();
    if (Buffer.byteLength(text) > MAX_BYTES) throw new Error("publication_too_large");
    return text;
  }
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let text = "", bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BYTES) throw new Error("publication_too_large");
      text += decoder.decode(chunk.value, { stream: true });
    }
    return text + decoder.decode();
  } finally { await reader.cancel().catch(() => {}); }
}
export function recentAiPublicationItems(publications, now=Date.now()) {
  const counts=new Map();
  return [...publications].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).flatMap(entry=>{
    const published=aiTime(entry.publishedAt,now);
    if(!published || now-published>7*86400000 || !entry.title || !entry.source || (counts.get(entry.source)||0)>=20)return [];
    counts.set(entry.source,(counts.get(entry.source)||0)+1);
    return [{id:"ai-rss:"+entry.url,title:entry.title,desc:entry.desc,cover:entry.cover,url:entry.url,publishedAt:entry.publishedAt,
      extra:{aiSignal:{primarySource:entry.source,primarySourceLabel:entry.sourceLabel,timestampKind:"published"},
        publicationEvidence:{url:entry.feedUrl,publishedAt:entry.publishedAt}}}];
  });
}
// The reader needs dates for current articles, not the full historical RSS text.
export function compactAiPublicationIndex(publications, now=Date.now()) {
  return publications.filter(entry=>{
    const time=aiTime(entry.publishedAt,now);
    return time && now-time<=90*86400000;
  }).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,300)
    .map(({url,publishedAt,feedUrl})=>({url,publishedAt,feedUrl}));
}
export async function loadAiPublicationFeed(feed,fetchImpl=fetch) {
  let entries = cache.get(fetchImpl);
  if (!entries) { entries = new Map(); cache.set(fetchImpl, entries); }
    let entry = entries.get(feed.url);
    if (!entry || Date.now() - entry.at >= CACHE_MS) {
      const promise = (async () => {
        const response = await fetchImpl(feed.url, { headers: { Accept: feed.format==='dated-html'?'text/html':"application/rss+xml, application/atom+xml" }, signal: AbortSignal.timeout(4500) });
        return parseAiPublications(await readFeed(response), feed);
      })();
      entry = { at: Date.now(), promise }; entries.set(feed.url, entry);
      promise.catch(() => { if (entries.get(feed.url) === entry) entries.delete(feed.url); });
    }
    return entry.promise;
}
export async function loadAiPublications(fetchImpl = fetch) {
  const results = await Promise.allSettled(AI_PUBLICATION_FEEDS.map(feed=>loadAiPublicationFeed(feed,fetchImpl)));
  return { publications: results.flatMap(result => result.status === "fulfilled" ? result.value : []),
    publicationFeeds: results.map((result, index) => ({ source: AI_PUBLICATION_FEEDS[index].key,
      status: result.status === "fulfilled" ? "ok" : "failed", count: result.status === "fulfilled" ? result.value.length : 0 })) };
}
