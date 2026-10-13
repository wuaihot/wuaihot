import fs from "node:fs";
import assert from "node:assert/strict";
import { knockoutGraph, swissRecords, swissGroups } from "../src/utils/lolArchiveSchedule.mjs";
const data=JSON.parse(fs.readFileSync("src/data/events/worlds-2025.json","utf8"));
const matches=data.stages.flatMap(s=>s.rounds.flatMap(r=>r.matches));
assert.equal(data.season,2025);assert.equal(data.timeZone,"Asia/Shanghai");
assert.equal(matches.length,41);assert.equal(new Set(matches.map(m=>m.id)).size,41);
assert.equal(Object.keys(data.teams).length,17);
assert.deepEqual(data.stages.map(s=>s.rounds.map(r=>r.matches.length)),[[1],[8,8,8,6,3],[4,2,1]]);
for(const stage of data.stages){
 assert.match(stage.sha256,/^[a-f0-9]{64}$/);
 assert.match(stage.url,/^https:\/\/lpl\.qq\.com\/web201612\/data\/LOL_MATCH2_GAME_PROCDATA_229_/);
 for(const round of stage.rounds)for(const [slot,m] of round.matches.entries()){
  assert.equal(m.slot,slot);assert.equal(m.status,"3");assert.match(m.start,/^2025-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/);
  assert.ok(Number.isFinite(Date.parse(m.start))); assert.ok([1,2].includes(m.winner));
  assert.ok(["BO1","BO3","BO5"].includes(m.bo));assert.equal(m.score[m.winner-1],(Number(m.bo.slice(2))+1)/2);
  assert.ok(m.score[2-m.winner]<m.score[m.winner-1]);assert.equal(m.names.split(/\s+vs\s+/i).length,2);
  for(const id of m.teams){assert.ok(data.teams[id]);assert.match(data.teams[id].logo,/^https:\/\//);}
  assert.match(m.id,/^\d+$/);assert.match(m.vod,/^\d+$/);
 }
}
const final=matches.find(m=>m.id==="12879");assert.equal(final.names,"T1 vs KT");assert.deepEqual(final.score,[3,2]);assert.equal(final.winner,1);
const editionNav=fs.readFileSync("src/components/LolSeriesNavigation.vue","utf8");
for(const token of ['year:2026','year:2025','buildEventPath','@keydown.esc','@mouseenter','@focusout','pointerdown'])assert.ok(editionNav.includes(token),token);
const config=fs.readFileSync("src/config/events.js","utf8");
assert.match(config,/item.seriesId === normalizedSeriesId && !item.archived/);
const wrapper=fs.readFileSync("src/views/EventPage.vue","utf8");assert.match(wrapper,/eventSlug === "worlds-2025"/);
const view=fs.readFileSync("src/views/WorldsArchive.vue","utf8");assert.doesNotMatch(view,/getEventOverview|getEventScheduleRange|setInterval/);
assert.match(view,/match.winner === index \+ 1/);assert.match(view,/route.query.q/);
for(const token of ['--archive-win:#277256','--archive-loss:#a84752','--archive-trace:#29329e','--archive-win:#8ac6af','--archive-loss:#e6a1a8','--archive-trace:#b7c1ff','.archive-team.is-winner>span','.archive-team.is-loser>span','.archive-match.is-traced { border-color:var(--archive-trace)'])assert.ok(view.includes(token),'Archive outcome/trace layer: '+token);
assert.ok(view.includes("'is-loser': Boolean(match.winner && match.winner !== index + 1)"));
assert.match(fs.readFileSync('src/components/LolArchiveSchedule.vue','utf8'),/path\.is-active \{ stroke:var\(--archive-trace,var\(--archive-accent\)\)/);
assert.match(fs.readFileSync("src/views/EventHub.vue","utf8"),/item.seriesId === seriesId && !item.archived/);
const {WORLDS_2025_LOGOS:logos,WORLDS_2025_PROFILES:profiles,WORLDS_2025_NEWS:news,WORLDS_2025_FINAL_BILIBILI:finalBili,WORLDS_ARCHIVE_COPY:copy}=await import("../src/data/events/worlds-2025-content.mjs");
assert.equal(profiles.length,17);
assert.deepEqual(new Set(Object.keys(logos)),new Set(profiles.map(x=>x.name)));
for(const [name,logo] of Object.entries(logos)){assert.match(logo,/^https:\/\//);if(name!=="T1")assert.equal(logo,Object.values(data.teams).find(t=>t.name===name).logo);}
assert.ok(Object.values(logos).every(logo=>!/-hov\\.png|-def\\.png/.test(logo)));
assert.deepEqual(new Set(profiles.map(x=>x.name)),new Set(Object.values(data.teams).map(x=>x.name)));
assert.deepEqual(["LPL","LCK","LEC","LTA","LCP"].map(region=>profiles.filter(x=>x.region===region).length),[4,4,3,3,3]);
assert.equal(profiles.find(x=>x.name==="VKS").fullName,"Vivo Keyd Stars");
for(const item of news){assert.match(item.date,/^2025-/);assert.match(item.url,/^https:\/\/lolesports.com\//);assert.ok(item.title && item.source);}
assert.ok(news.every((x,i)=>!i || news[i-1].date>=x.date));
assert.equal(finalBili,"https://www.bilibili.com/video/BV1oskQBLEA6/");
for(const locale of ["zh-CN","zh-TW","en","ja","ko"])assert.ok(copy[locale].champion && copy[locale].profileNote && copy[locale].newsNote);
assert.match(view,/finalMatch.winner - 1/);assert.match(view,/2 - finalMatch.winner/);

console.log("WORLDS_2025_ARCHIVE_OK: 41 official matches,17 teams,all rounds/BO/winners/IDs,archive separated from live priority");

const replays=JSON.parse(fs.readFileSync("src/data/events/worlds-2025-bilibili.json","utf8"));
assert.equal(replays.records.length,41);
assert.equal(new Set(replays.records.map(r=>r.matchId)).size,41);
assert.equal(new Set(replays.records.map(r=>r.url)).size,41);
for(const replay of replays.records){
 const match=matches.find(m=>m.id===replay.matchId);assert.ok(match);
 assert.equal(replay.date,match.start.slice(0,10));
 assert.deepEqual(new Set(replay.teams),new Set(match.names.split(/\s+vs\s+/i)));
 assert.match(replay.url,/^https:\/\/www\.bilibili\.com\/video\/BV[a-zA-Z0-9]{10}\/$/);
}
assert.equal(replays.records.find(r=>r.matchId===final.id).url,finalBili);
assert.match(view,/<LolEventHero active-id="worlds-2025"/);
assert.match(view,/:href="bilibiliUrl\(match\)"/);
assert.doesNotMatch(view,/logo\/platforms\/tencent|archive-hero__edition|background:#f2f5f5/);
assert.match(view,/2025 英雄联盟全球总决赛/);
console.log("WORLDS_2025_MEDIA_OK: 41 verified Bilibili/date/opponent mappings; official team identities; shared hero");

const knockout=data.stages.find(stage=>stage.key==="knockout");
const graph=knockoutGraph(knockout.rounds);
assert.equal(graph.nodes.length,7);
assert.deepEqual(graph.edges.map(e=>[e.from,e.to,e.team]),[
 ["12876","12877","692"],["12875","12877","42"],
 ["12873","12878","137"],["12874","12878","21"],
 ["12877","12879","692"],["12878","12879","21"],
]);
assert.equal(graph.nodes.find(n=>n.id==="12878").slot,2.5,"GEN–KT must center its two quarterfinal feeders");
assert.equal(graph.nodes.find(n=>n.id==="12879").slot,1.5,"final must center its two semifinals");
const sourceBefore=JSON.stringify(data);
const swiss=data.stages.find(stage=>stage.key==="swiss");
const {before,outcomes}=swissRecords(swiss.rounds);
assert.deepEqual(swiss.rounds.map(r=>swissGroups(r.matches,before).map(g=>g.key)),[["0–0"],["1–0","0–1"],["2–0","1–1","0–2"],["2–1","1–2"],["2–2"]]);
for(const record of before.values())assert.deepEqual(record[0],record[1],"Swiss opponents enter each round with the same series record");
assert.equal([...outcomes.values()].flat().filter(x=>x==="qualified").length,8);
assert.equal([...outcomes.values()].flat().filter(x=>x==="eliminated").length,8);
assert.deepEqual(before.get("12872"),[[2,2],[2,2]]);
assert.equal(JSON.stringify(data),sourceBefore,"projection must not mutate the official snapshot");
console.log("Worlds archive schedule: 6 advancement edges, feeder centers, 33 Swiss pre-round records and 8/8 outcomes passed.");
