import {parse} from 'acorn';

export const isThinSocialAnnouncement=text=>/^(?:Today[,\s]*)?(?:we are|we're)\s+announcing\s+(?:ChatGPT|Claude)[.!]?\s*(?:It is here:)?\s*(?:https?:\/\/\S+)?$/i.test(String(text).replace(/\s+/g,' ').trim());

// Read only the literal data in the anonymous server-rendered page. Never execute scripts.
export function publicProfilePosts(html,account,now=Date.now(),originalId='') {
  if(typeof html!=='string'||Buffer.byteLength(html)>2*1024*1024)throw Error('profile_payload_invalid');
  const tweets=[], refs=new Map(); let budget=200000;
  function literal(n,depth=0) {
    if(!n||depth>80||--budget<0)return undefined;
    if(n.type==='Literal')return n.value;
    if(n.type==='UnaryExpression'&&['!','-','+'].includes(n.operator)) {
      const v=literal(n.argument,depth+1); return n.operator==='!'?!v:n.operator==='-'?-v:+v;
    }
    if(n.type==='ArrayExpression')return n.elements.map(v=>literal(v,depth+1));
    if(n.type==='ObjectExpression') {
      const out=Object.create(null);
      for(const p of n.properties) {
        if(p.type!=='Property'||p.kind!=='init'||p.method||p.computed)continue;
        const key=p.key.name??p.key.value;
        if(['__proto__','constructor','prototype'].includes(key))continue;
        out[key]=literal(p.value,depth+1);
      }
      return out;
    }
    if(n.type==='MemberExpression'&&n.object?.type==='Identifier'&&n.object.name==='$R'&&n.computed)return refs.get(literal(n.property,depth+1));
    if(n.type==='AssignmentExpression'&&n.operator==='='&&n.left.type==='MemberExpression'&&n.left.object?.name==='$R') {
      const value=literal(n.right,depth+1);refs.set(literal(n.left.property,depth+1),value);return value;
    }
    return undefined;
  }
  function walk(n,depth=0) {
    if(!n||typeof n!=='object'||depth>100||--budget<0)return;
    for(const [k,v] of Object.entries(n))if(!['start','end'].includes(k)) {
      if(Array.isArray(v))v.forEach(c=>walk(c,depth+1));else if(v&&typeof v==='object')walk(v,depth+1);
    }
    if(n.type==='AssignmentExpression'&&n.left?.object?.name==='$R') {
      const value=literal(n); if(['Tweet','TweetTombstone','TweetUnavailable'].includes(value?.__isTweetResult))tweets.push(value);
    }
  }
  for(const [,script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if(!script.includes('TimelineTimelineItem')||!script.includes('$R['))continue;
    refs.clear();walk(parse(script,{ecmaVersion:'latest'}));
  }
  if(budget<0||!tweets.length)throw Error('profile_structure_changed');
  if(originalId&&tweets.some(t=>String(t.rest_id||t.tweet_id||'')===originalId&&t.__isTweetResult==='TweetUnavailable'&&t.reason==='Deleted'))return {state:'absent'};
  const data=tweets.flatMap(tweet=>{
    const user=tweet.core?.user_results?.result, username=user?.core?.screen_name;
    if(username?.toLowerCase()!==account.username.toLowerCase()||user.privacy?.protected)return [];
    const id=String(tweet.rest_id||''), date=Number(tweet.details?.created_at_ms);
    const text=String(tweet.note_tweet_results?.result?.text||tweet.note_tweet?.note_tweet_results?.result?.text||tweet.details?.full_text||'').trim();
    if(!/^\d{1,24}$/.test(id)||!text||text.length>20000||!Number.isFinite(date)||date>now||now-date>7*86400000)return [];
    const quote=tweet.quoted_tweet_results?.result||tweet.quoted_status_result?.result,quoteUser=quote?.core?.user_results?.result?.core?.screen_name;
    const quoteId=String(quote?.rest_id||'');
    const quoted=quoteUser&&/^[\w]{1,15}$/.test(quoteUser)&&/^\d{1,24}$/.test(quoteId)?{url:`https://x.com/${quoteUser}/status/${quoteId}`,text:String(quote.details?.full_text||'').slice(0,20000),username:quoteUser}:null;
    return [{id:account.source+':'+id,postId:id,title:text.replace(/\s+/g,' ').slice(0,260),desc:text,originalTitle:text.replace(/\s+/g,' ').slice(0,260),originalDesc:text,url:`https://x.com/${account.username}/status/${id}`,publishedAt:new Date(date).toISOString(),author:account.name+' (@'+account.username+')',
      ...(Number.isFinite(Number(tweet.views?.count))?{displayMetric:{kind:'views',value:Number(tweet.views.count),label:'Views'}}:{}),
      extra:{aiSignal:{primarySource:account.source,primarySourceLabel:account.name+' · X',timestampKind:'published'},socialPost:{postId:id,sourceAccount:account.username,authorRole:account.role,claimScope:account.role==='official'?'institutional':'employee-statement',...(quoted?{quoted}:{}),editHistory:(tweet.edit_control?.edit_tweet_ids||[id]).filter(x=>/^\d{1,24}$/.test(x))},intake:{channel:'public-x-profile',observedAt:new Date(now).toISOString(),state:'observing'}}}];
  });
  const posts=[...new Map(data.map(p=>[p.id,p])).values()].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
  if(originalId)return posts.some(p=>p.postId===originalId)?{state:'present',item:posts.find(p=>p.postId===originalId)}:{state:'unknown'};
  return posts;
}

// The X profile's recent-post window omits replies. A Day N reset seed can
// link to its public thread, whose server-rendered data includes the same-
// author clarification (e.g. the Day 8 EOD announcement). Require the
// original seed in that thread; do not trust arbitrary HTML or third parties.
export async function expandResetAnnouncementThreads(posts,account,readPage,now=Date.now()) {
  if(account?.username?.toLowerCase()!=='thsottiaux')
    return {posts,checked:0,failures:0};
  const seeds=posts.filter(item=>
    /^Day\s+\d{1,3}\s*[/:-]\s*Reset\b/i.test(String(item.originalDesc||''))
    && now-Date.parse(item.publishedAt)<=48*3600000
  ).slice(0,2);
  const all=[...posts];let failures=0;
  for(const seed of seeds) {
    try{
      const related=publicProfilePosts(await readPage(seed.url),account,now);
      if(!related.some(item=>item.id===seed.id))throw Error('thread_anchor_missing');
      all.push(...related.filter(item=>Date.parse(item.publishedAt)>=Date.parse(seed.publishedAt)));
    }catch{failures++;}
  }
  return {
    posts:[...new Map(all.map(item=>[item.id,item])).values()]
      .sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)),
    checked:seeds.length,failures,
  };
}
