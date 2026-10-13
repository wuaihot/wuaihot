import {AI_PUBLICATION_FEEDS,loadAiPublicationFeed} from './_ai-publications.js';
import {aiRankingQueryError} from './_ai-intake.js';
// Independent first-party index: root-level model announcements and /news/ articles.
export async function handleAiOfficialPublications({req,res,pathValue,fetchImpl=fetch}) {
 if(pathValue!=='anthropic-news')return false;
 const fail=(code,message)=>{res.setHeader('cache-control','no-store');res.status(code).json({code,message});return true;};
 if(!['GET','HEAD'].includes(req.method)){res.setHeader('allow','GET, HEAD');return fail(405,'Method not allowed');}
 const error=aiRankingQueryError(req.query);if(error)return fail(400,error);
 if(!['','all','news'].includes(String(req.query.type || '')))return fail(400,'Unknown ranking');
 try {
  const feed=AI_PUBLICATION_FEEDS.find(f=>f.key==='anthropic'),entries=await loadAiPublicationFeed(feed,fetchImpl);
  const data=[...entries].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).map((entry,index)=>({id:'ai-official:'+entry.url,title:entry.title,originalTitle:entry.title,desc:entry.desc,originalDesc:entry.desc,url:entry.url,publishedAt:entry.publishedAt,rank:index+1,extra:{aiSignal:{primarySource:feed.source,primarySourceLabel:feed.name,timestampKind:'published'},publicationEvidence:{url:feed.url,publishedAt:entry.publishedAt}}}));
  if(!data.length)return fail(503,'Official index temporarily unavailable');
  res.setHeader('cache-control','public,max-age=60,stale-while-revalidate=120');res.status(200).json({code:200,name:feed.source,title:feed.name,type:'官方公告',link:feed.url,description:'官方新闻目录，包含根路径模型发布；日期精度保留到日。',updateTime:new Date().toISOString(),total:data.length,data});return true;
 }catch{return fail(503,'Official index temporarily unavailable');}
}
