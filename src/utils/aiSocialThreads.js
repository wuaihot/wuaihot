import {tiboResetCompletionKind} from './aiSocialSeries.js';
// Only explicit, same-author AT Protocol thread roots are grouped. Similar topics
// and quoted posts alone never prove that two announcements are the same event.
export function mergeAiSocialThreads(items){
  const groups=new Map(),others=[];
  for(const item of items){
    const post=item.extra?.socialPost,root=post?.threadRoot;
    if(!post?.authorDid||!root?.startsWith(`at://${post.authorDid}/app.bsky.feed.post/`)){others.push(item);continue;}
    const key=item.extra.aiSignal.primarySource+'|'+root;
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);
  }
  for(const rows of groups.values()){
    rows.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));const primary=rows[0];
    if(rows.length===1){others.push(primary);continue;}
    const confirmations=rows.slice(1).map(row=>({source:row.extra.aiSignal.primarySource,sourceLabel:row.extra.aiSignal.primarySourceLabel,title:row.title,url:row.url,publishedAt:row.publishedAt,role:'author',originalTitle:row.originalTitle}));
    others.push({...primary,extra:{...primary.extra,socialPost:{...primary.extra.socialPost,threadPosts:rows.length},aiSignal:{...primary.extra.aiSignal,confirmations:[...(primary.extra.aiSignal.confirmations||[]),...confirmations]}}});
  }
  return others;
}

// Evidence-bound grouping. A verified Day N announcement is a new event,
// and only matching same-author reset progress within twelve hours can join.
// Never group by calendar date, buzzwords, or unverified AI summaries.
export function mergeAiVerifiedResetEvents(items,locale='zh-CN'){
  if(!Array.isArray(items))return [];
  const source='ai-author-thsottiaux',author='thsottiaux';
  const DAY=/^Day\s+(\d{1,3})\s*[/:-]\s*Reset\b/i;
  const ETA=/^Global reset (?:landing )?by EOD(?: PST time)?\b/i;
  const DONE=/^(?:Put the reset in the bag\.\s*All propagated\.?|What would you like with your side of reset\?\s*It's done\.?)$/i;
  const verified=row=>row?.extra?.aiSignal?.primarySource===source
    &&row?.extra?.socialPost?.sourceAccount?.toLowerCase()===author
    &&row?.extra?.aiAnalysis?.state==='evidence-grounded'
    &&row?.url==='https://x.com/'+author+'/status/'+row.postId
    &&/^\d{1,24}$/.test(String(row.postId||''))
    &&Number.isFinite(Date.parse(row.publishedAt));
  // ai-x-updates and ai-tools now publish the same verified event projection.
  // A browser is permitted to call this merge again after joining feeds, but
  // it must never downgrade the newer state to the translated root post.
  const preserved=items.filter(row=>{
    const group=row?.extra?.socialPost?.eventGroup;
    return verified(row)&&group?.kind==='verified-day-reset'
      &&Number.isSafeInteger(group.day)&&group.day>=1&&group.day<=100
      &&Array.isArray(group.posts)&&group.posts.length>=2&&group.posts.length<=12
      &&group.posts.some(p=>p.postId===String(row.postId))
      &&group.posts.every(p=>/^\d{1,24}$/.test(String(p.postId||''))
        &&p.url==='https://x.com/'+author+'/status/'+p.postId);
  });
  if(preserved.length){
    const covered=new Set(preserved.flatMap(row=>row.extra.socialPost.eventGroup.posts.map(p=>source+':'+p.postId)));
    const remaining=items.filter(row=>!covered.has(row.id) && !preserved.includes(row));
    return [...mergeAiVerifiedResetEvents(remaining,locale),...preserved].sort((a,b)=>{
      const at=row=>Date.parse(row.extra?.socialPost?.eventGroup?.latestAt||row.publishedAt)||0;
      return at(b)-at(a);
    });
  }
  const roots=items.flatMap(row=>{
    if(!verified(row))return [];
    const match=String(row.originalDesc||'').trim().match(DAY);
    const day=Number(match?.[1]||0);
    return day>=1&&day<=100?[{row,day,time:Date.parse(row.publishedAt),members:[row]}]:[];
  });
  const owner=new Map(roots.map(root=>[root.row.id,root]));
  // Evaluate progress chronologically: a confirmation may quote an earlier ETA.
  for(const row of [...items].sort((a,b)=>Date.parse(a.publishedAt)-Date.parse(b.publishedAt))){
    if(!verified(row)||owner.has(row.id))continue;
    const original=String(row.originalDesc||'').trim();
    const progress=ETA.test(original)?'eta':DONE.test(original)&&tiboResetCompletionKind(original,row.extra?.socialPost?.quoted)?'completed':null;
    if(!progress)continue;
    const when=Date.parse(row.publishedAt);
    const candidates=roots.filter(root=>when>=root.time&&when-root.time<=12*3600000);
    if(candidates.length!==1)continue; // uncertain identity: do not merge
    const root=candidates[0];
    if(progress==='completed'){
      const quote=row.extra.socialPost.quoted;
      if(quote?.username?.toLowerCase()!==author
        ||!root.members.some(member=>member.url===quote.url&&ETA.test(String(member.originalDesc||''))))continue;
    }
    root.members.push(row);owner.set(row.id,root);
  }
  const grouped=roots.filter(root=>root.members.length>1).map(root=>{
    const members=[...root.members].sort((a,b)=>Date.parse(a.publishedAt)-Date.parse(b.publishedAt));
    const posts=members.map((member,index)=>({
      postId:member.postId,url:member.url,publishedAt:member.publishedAt,
      title:String(member.title||member.originalTitle||'').slice(0,180),
      originalText:String(member.originalDesc||'').slice(0,800),
      stage:index===0?'announced':DONE.test(String(member.originalDesc||''))?'completed':'expected',
      ...(member.displayMetric?.kind==='views'&&Number.isFinite(member.displayMetric.value)
        ?{views:member.displayMetric.value}:{}),
    }));
    const completed=posts.some(p=>p.stage==='completed');
    const doneDeclared=members.some(member=>tiboResetCompletionKind(member.originalDesc,member.extra?.socialPost?.quoted)==='declared-done');
    const expected=posts.some(p=>p.stage==='expected');
    const stage=completed?'completed':expected?'expected':'announced';
    const tw=String(locale).toLowerCase()==='zh-tw',zh=String(locale).startsWith('zh'),day=root.day;
    const title=tw
      ?'Tibo · Day '+day+'：全球額度重置'+(completed?(doneDeclared?'已宣告完成':'已確認推送'):expected?'預計美西當天結束前落地':'已宣布')
      :zh
        ?'Tibo · Day '+day+'：全球额度重置'+(completed?(doneDeclared?'已宣告完成':'已确认推送'):expected?'预计美西当天结束前落地':'已宣布')
        :'Tibo · Day '+day+': global reset '+(completed?(doneDeclared?'declared complete':'confirmed propagated'):expected?'expected by end of Pacific day':'announced');
    const desc=tw
      ?completed
        ?(doneDeclared?'Tibo 引述自己此前的預告並表示本輪重置已完成；個人帳戶實際到帳、額度及方案資格仍待核實。共 '+posts.length+' 則原帖。':'Tibo 隨後確認本輪全球重置已全部推送；各帳戶實際額度與方案資格仍需自行核對。共 '+posts.length+' 則原帖。')
        :'Tibo 宣布本輪重置，隨後預告美西當天結束前落地；本輪尚無全部到帳的確認。共 '+posts.length+' 則原帖。'
      :zh
        ?completed
          ?(doneDeclared?'Tibo 引用自己此前的重置预告并表示本轮已完成；个人账户实际到账、额度与套餐资格仍需自行核实。共 '+posts.length+' 条原帖。':'Tibo 随后确认本轮全球重置已全部推送；各账户实际额度与套餐资格仍需自行核对。共 '+posts.length+' 条原帖。')
          :'Tibo 宣布本轮重置，随后预告美西当天结束前落地；本轮尚无全部到账的确认。共 '+posts.length+' 条原帖。'
        :completed
          ?(doneDeclared?'Tibo quoted his own global reset notice and declared the reset done. Individual balances, quotas and plan eligibility remain unverified. ':'Tibo subsequently confirmed this reset was propagated. Account balances and plan eligibility are not verified. ')+posts.length+' original posts.'
          :'Tibo announced this reset with rollout expected by the end of the Pacific day. Completion is not confirmed. '+posts.length+' original posts.';
    return {...root.row,title,desc,extra:{...root.row.extra,socialPost:{...root.row.extra.socialPost,
      eventGroup:{kind:'verified-day-reset',day,status:stage,
        completionKind:completed?(doneDeclared?'declared-done':'propagated'):null,
        latestAt:posts.at(-1).publishedAt,
        sourceCount:posts.length,posts}}}};
  });
  const collapsed=new Set(grouped.flatMap(g=>g.extra.socialPost.eventGroup.posts.map(p=>source+':'+p.postId)));
  const ungrouped=items.filter(row=>!collapsed.has(row.id));
  // Never sum per-post views or rewrite the root's original publication time.
  return [...ungrouped,...grouped].sort((a,b)=>{
    const time=row=>Date.parse(row.extra?.socialPost?.eventGroup?.latestAt||row.publishedAt)||0;
    return time(b)-time(a);
  });
}
