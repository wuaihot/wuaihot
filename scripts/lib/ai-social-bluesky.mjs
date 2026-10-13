import {socialPostUrl} from '../../src/config/ai-social.js';
const MAX_BYTES=2000000;
export async function readBluesky(method,params,fetchImpl=fetch){
  const url=new URL('https://public.api.bsky.app/xrpc/'+method);
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
  const response=await fetchImpl(url.href,{headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});
  const text=await response.text();if(Buffer.byteLength(text)>MAX_BYTES)throw Error('bluesky_too_large');
  let payload;try{payload=JSON.parse(text);}catch{throw Error('bluesky_invalid_response');}
  if(!response.ok)throw Object.assign(Error('bluesky_http_'+response.status),{code:payload.error});
  return payload;
}
export function projectBlueskyFeed(payload,account,now=Date.now()){
  if(!Array.isArray(payload?.feed)||payload.feed.length>100)throw Error('bluesky_feed_invalid');
  const prefix=`at://${account.did}/app.bsky.feed.post/`;
  const data=payload.feed.flatMap(row=>{
    const p=row.post,r=p?.record,uri=String(p?.uri||''),postId=uri.slice(prefix.length);
    if(row.reason||p?.author?.did!==account.did||!uri.startsWith(prefix)||!/^\w{1,32}$/.test(postId)||r?.$type!=='app.bsky.feed.post')return [];
    const date=Date.parse(r.createdAt),text=String(r.text||'').trim();
    if(!date||date>now||now-date>7*86400000||!text||text.length>20000)return [];
    // Include self-authored threads, never an unverified reply to somebody else.
    const root=r.reply?.root?.uri,parent=row.reply?.parent;
    if(r.reply&&(!root?.startsWith(prefix)||parent?.author?.did!==account.did))return [];
    const embedded=p.embed?.record?.record||p.embed?.record;
    const q=embedded?.$type==='app.bsky.embed.record#viewRecord'?embedded:null;
    const match=q?.uri?.match(/^at:\/\/(did:[a-z0-9:]+)\/app.bsky.feed.post\/(\w{1,32})$/i);
    const quoted=match&&typeof q.value?.text==='string'?{url:`https://bsky.app/profile/${match[1]}/post/${match[2]}`,text:q.value.text.slice(0,20000),username:String(q.author?.handle||match[1])}:null;
    return [{id:account.source+':'+postId,postId,title:text.replace(/\s+/g,' ').slice(0,260),originalTitle:text.replace(/\s+/g,' ').slice(0,260),desc:text,originalDesc:text,url:socialPostUrl(account,postId),publishedAt:new Date(date).toISOString(),author:account.name+' (@'+account.username+')',
      ...(Number.isSafeInteger(p.likeCount)&&p.likeCount>=0?{displayMetric:{kind:'likes',value:p.likeCount,label:'Likes'}}:{}),
      extra:{aiSignal:{primarySource:account.source,primarySourceLabel:account.name+' · Bluesky',timestampKind:'published'},socialPost:{postId,uri,authorDid:account.did,sourceAccount:account.username,authorRole:account.role,claimScope:'personal',cid:String(p.cid||''),threadRoot:root||uri,...(quoted?{quoted}:{})},intake:{channel:'public-bluesky-api',observedAt:new Date(now).toISOString(),state:'observing'}}}];
  });
  return [...new Map(data.map(item=>[item.id,item])).values()];
}
export async function collectBluesky(account,now=Date.now(),fetchImpl=fetch){
  const posts=[];let cursor;
  // A bounded seven-day window. Follow the cursor so a busy day does not hide new posts.
  for(let page=0;page<3;page++){
    const payload=await readBluesky('app.bsky.feed.getAuthorFeed',{actor:account.did,filter:'posts_and_author_threads',limit:'50',...(cursor?{cursor}:{})},fetchImpl);
    posts.push(...projectBlueskyFeed(payload,account,now));
    const dates=(payload.feed||[]).map(r=>Date.parse(r.post?.record?.createdAt)).filter(Number.isFinite);
    if(!payload.cursor||payload.cursor===cursor||!dates.length||Math.min(...dates)<now-7*86400000)break;
    cursor=payload.cursor;
  }
  return [...new Map(posts.map(item=>[item.id,item])).values()];
}
export async function checkBlueskyOriginal(item,account,fetchImpl=fetch){
  try{
    const payload=await readBluesky('app.bsky.feed.getPostThread',{uri:item.extra.socialPost.uri,depth:'0',parentHeight:'1'},fetchImpl);
    if(payload.thread?.$type==='app.bsky.feed.defs#notFoundPost'&&payload.thread.uri===item.extra.socialPost.uri)return {state:'absent'};
    const post=payload.thread?.post;
    if(post?.author?.did!==account.did||post.uri!==item.extra.socialPost.uri)return {state:'unknown'};
    const projected=projectBlueskyFeed({feed:[{post,reply:{parent:payload.thread.parent?.post}}]},account);
    if(projected.length)return {state:'present',item:projected[0]};
    // Replies need their verified thread context from the feed; still check text/CID directly.
    if(post.record?.text&&Date.parse(post.record?.createdAt)===Date.parse(item.publishedAt))return {state:'present',item:{...item,originalDesc:post.record.text,desc:post.record.text,extra:{...item.extra,socialPost:{...item.extra.socialPost,cid:post.cid}}}};
    return {state:'unknown'};
  }catch(e){return {state:e.code==='NotFound'?'absent':'unknown'};}
}
