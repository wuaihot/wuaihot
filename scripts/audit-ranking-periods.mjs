import assert from 'node:assert/strict';
import {rankingContentOptions,rankingPeriodOptions,describeRankingPeriod,contentVariantFor,contentControls,rankingFamilyVariants} from '../src/utils/rankingPeriods.mjs';
const opts = values => values.map(([value,label,dimensionValues])=>({value,label,dimensionValues}));
const tieba=opts([['hot','热议榜'],...['software','music'].flatMap(k=>['today','yesterday','week','month'].map(p=>[`${k}-${p}`,`${k} · ${{today:'今日',yesterday:'昨日',week:'周榜',month:'月榜'}[p]}`]))]);
assert.equal(rankingContentOptions('tieba',tieba).length,3,'time must not create split cards');
assert.equal(contentVariantFor('tieba',tieba,'software-month'),'software-today','old month split migrates to same content family');
assert.equal(rankingPeriodOptions('tieba',tieba,'software-week').length,4);
assert.equal(rankingFamilyVariants('tieba',tieba,['software-today']).length,4);
const projected=rankingContentOptions('tieba',tieba.map(o=>({...o,projectionLabel:o.label})));
assert.equal(projected.find(o=>o.value==='software-today').projectionLabel,'software','split titles must not retain a default period after switching');
assert.equal(contentControls('tieba',[{key:'ranking',items:tieba}],tieba,'software-week')[0].items.find(o=>o.contentKey==='music').value,'music-week','change content preserves supported period');
const xhs=opts(['read','like','collect'].flatMap(k=>['3d','7d','14d','30d'].map(p=>[`${k}-${p}`,`近${p.slice(0,-1)}日${k}榜`,{ranking:k,period:p}])));
assert.equal(rankingContentOptions('xiaohongshu',xhs).length,3);
assert.deepEqual(rankingPeriodOptions('xiaohongshu',xhs,'read-3d').map(o=>o.period),['3d','7d','14d','30d']);
assert.ok(!rankingPeriodOptions('xiaohongshu',xhs,'read-3d').some(o=>o.period==='today'),'no fabricated daily ranking');
assert.equal(describeRankingPeriod('jjwxc-books',{value:'monthly',label:'月度排行榜'}).period,'month');
const jinjiang=opts([['monthly','月度排行榜'],['quarterly','季度排行榜'],['half-year','半年排行榜'],['new-author','新晋作者榜']]);
assert.equal(rankingContentOptions('jjwxc-books',jinjiang).length,2,'quarter and half-year are periods, not content');
assert.deepEqual(rankingPeriodOptions('jjwxc-books',jinjiang,'monthly').map(o=>o.period),['month','quarter','half-year']);
const audio=opts([['hot-week','热播 · 周榜'],['hot-month','热播 · 月榜'],['hot-all','热播 · 总榜']]);
assert.equal(rankingContentOptions('lanren-audio',audio).length,1,'all-time remains a period in the same content family');
for (const [source,variants] of [['china-film-boxoffice',[['realtime','当日实时票房榜'],['annual','本年度票房榜'],['alltime','中国电影票房总榜']]],['greasy-fork',[['daily-installs','日安装榜'],['total-installs','总安装榜']]]]) {
 assert.equal(rankingContentOptions(source,opts(variants)).length,1);
 assert.equal(rankingPeriodOptions(source,opts(variants),variants[0][0]).length,variants.length);
}
for (const [source,value,label] of [['qidian-books','yuepiao','月票榜'],['bilibili-manga','japan','日漫榜'],['douban-movie','tv_japanese','近期热门日剧']]) assert.equal(describeRankingPeriod(source,{value,label}).period,null,'content words are not periods');
const git=opts([['day','全语言 · 日榜'],['week','全语言 · 周榜'],['python-day','Python · 日榜'],['python-week','Python · 周榜']]);
assert.equal(rankingContentOptions('github',git).length,2);
assert.equal(rankingPeriodOptions('github',git,'python-day')[1].value,'python-week');
const ithome=opts([['day','日榜'],['week','周榜'],['month','月榜'],['comments','热评榜']]);
assert.equal(contentControls('ithome',[{key:'period',items:ithome}],ithome,'week')[0].items.length,2,'mixed period group retains hot-comments content');
console.log('RANKING_PERIODS_OK: native cycles, content identity, period preservation, legacy split migration and no invented history');
const {createServer}=await import('vite');
const vite=await createServer({server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try {
 const subtypes=await vite.ssrLoadModule('/src/utils/sourceSubtypes.js');
 subtypes.applyTrendsSourceCatalog({sources:[{key:'tieba',defaultVariant:'hot',variantGroups:[{key:'ranking',options:tieba.map(o=>({key:o.value,label:o.label}))}]},{key:'xiaohongshu',defaultVariant:'read-3d',variantGroups:[{key:'ranking',options:xhs.map(o=>({key:o.value,label:o.label,dimensionValues:o.dimensionValues}))}]}]});
 assert.equal(subtypes.getSourceContentOptions('tieba').length,3);
 assert.equal(subtypes.getSourceContentVariant('xiaohongshu','read-30d'),'read-3d');
 assert.equal(subtypes.getSourceContentControlGroups('tieba','music-month')[0].items.find(o=>o.contentKey==='software').value,'software-month');
 assert.equal(subtypes.expandSourceContentVariants('xiaohongshu',['read-3d']).length,4);
 const labels=await vite.ssrLoadModule('/src/utils/sourceLabels.js');
 assert.equal(labels.getSubtypeLabel(subtypes.getSourceContentOptions('xiaohongshu')[0],'zh-CN'),'read榜');
 console.log('RANKING_PERIOD_INTEGRATION_OK: Catalog, content controls, transport variants and localized labels');
} finally {await vite.close();}
