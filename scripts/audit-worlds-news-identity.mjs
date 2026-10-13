import assert from 'node:assert/strict';
import {worldsOfficialUrlIdentity,mergeWorldsOfficialStories} from '../src/utils/worldsOfficialNews.mjs';
const lpl=(id,title,date)=>({url:'https://lol.qq.com/news/detail.shtml?&docid='+id,title,summary:'',source:'英雄联盟赛事官方',publishedAt:date});
const riot=(path,title,summary='')=>({url:'https://lolesports.com/en-US/news/'+path,title,summary,source:'LoL Esports',publishedAt:'2026-10-05'});
const l=[
 lpl('639240151287296662','2026全球总决赛规则','2026-10-09T20:37:46+08:00'),
 lpl('15912365862926497711','2026英雄联盟全球总决赛观赛指南','2026-10-06T15:25:51+08:00'),
 lpl('7818032783099519865','2026全球总决赛赛程日历','2026-10-05T23:57:32+08:00'),
 lpl('2612890167898180652','2026全球总决赛LPL赛区四支参赛队伍全部出炉','2026-09-19T22:02:23+08:00'),
];
const r=[
 riot('worlds-2026-primer','2026 全球总决赛观赛指南','已翻译的官方观赛说明'),
 riot('worlds-2026-ticket-sales','2026 全球总决赛门票发售'),
 riot('worlds-2026-venue-event-policies','2026 全球总决赛场馆观赛规定'),
 riot('worlds-anthem-presented-by-true-damage','True Damage 呈献全球总决赛主题曲'),
 riot('introducing-the-worlds-2026-merch-collection','2026 全球总决赛周边系列发布'),
 riot('msi-and-worlds-updates','MSI 与全球总决赛赛事安排更新'),
];
assert.notEqual(worldsOfficialUrlIdentity(l[0].url),worldsOfficialUrlIdentity(l[1].url),'Tencent docid must be part of identity');
assert.equal(worldsOfficialUrlIdentity('https://lol.qq.com/news/detail.shtml?docid=15912365862926497711&x=tracking'),
worldsOfficialUrlIdentity(l[1].url),'tracking and redundant ampersands must not change identity');
assert.equal(worldsOfficialUrlIdentity('javascript:alert(1)'),'');
assert.equal(worldsOfficialUrlIdentity('https://lol.qq.com/news/detail.shtml?docid=__missing__'),'');
const chinese=mergeWorldsOfficialStories([...l,...r,l[0]],'zh-CN');
assert.equal(chinese.length,9,'four LPL and six Riot original reports with one verified same-topic pair');
assert.equal(chinese.filter(x=>x.localOfficial).length,4);
const guide=chinese.find(x=>x.title.includes('观赛指南'));
assert.equal(guide.url,l[1].url,'prefer official Chinese original');
assert.equal(guide.publishedAt,l[1].publishedAt,'retain the original Chinese report timestamp');
assert.equal(guide.alternateOfficialUrl,r[0].url,'retain Riot international original as secondary source');
assert.equal(guide.summary,r[0].summary,'preserve useful global summary as fallback');
assert.equal(chinese.find(x=>x.url===l[0].url)?.alternateOfficialUrl||'', '');
const international=mergeWorldsOfficialStories(r,'en');
assert.equal(international.length,6);
assert.equal(international.find(x=>x.url===r[0].url).alternateOfficialUrl,undefined);
assert.equal(mergeWorldsOfficialStories([r[0],r[0]],'zh-CN').length,1);
const sameRiotStory=mergeWorldsOfficialStories([
 {...r[4],url:'https://lolesports.com/en-us/news/introducing-the-worlds-2026-merch-collection',publishedAt:'2026-10-07'},
 {...r[4],url:'https://lolesports.com/en-US/news/introducing-the-worlds-2026-merch-collection',publishedAt:'2026-10-07T18:00:00.000Z'}
],'zh-CN');
assert.equal(sameRiotStory.length,1);
assert.equal(sameRiotStory[0].alternateOfficialUrl,'','same official URL case variations are not separate source translations');
assert.equal(sameRiotStory[0].publishedAt,'2026-10-07T18:00:00.000Z','retain the precise official publication timestamp');
console.log('WORLDS_OFFICIAL_SOURCE_IDENTITY_OK',JSON.stringify({selectedChinese:chinese.length,lplOriginals:chinese.filter(x=>x.localOfficial).length,relatedGuideOriginals:2}));
