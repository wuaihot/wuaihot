// Search discovery is a bounded navigation index, independent of ranking fetches.
export const normalizeSearchText = value => String(value || '').normalize('NFKC').toLocaleLowerCase().trim();
export const matchNavigationEntries = (entries, query, limit = 24) => {
 const normalized = normalizeSearchText(query);
 const tokens = normalized.split(/\s+/).filter(Boolean);
 if (!tokens.length) return [];
 return entries.map((entry,index)=>{
  const label=normalizeSearchText(entry.label), detail=normalizeSearchText(entry.detail), name=normalizeSearchText(entry.name);
  const score=tokens.reduce((total,token)=>{
   if(total<0)return -1;
   if(label===token)return total+100;
   if(label.includes(token))return total+40;
   if(detail.includes(token))return total+10;
   const shortLatin=/^[a-z]{1,2}$/.test(token);
   const aliasMatch=shortLatin ? name.split(/[^a-z0-9]+/).includes(token) : name.includes(token);
   return aliasMatch ? total+5 : -1;
  },0);
  return {entry,index,score:score<0?-1:score+(label===normalized?200:0)};
 }).filter(item=>item.score>=0).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,limit).map(item=>item.entry);
};
export const contextSearchLocation = (route, value) => {
 const query = { ...route.query };
 const text = String(value || '').trim();
 if (text) query.q = text; else delete query.q;
 delete query.page;
 return { path:route.path, query, hash:route.hash };
};
