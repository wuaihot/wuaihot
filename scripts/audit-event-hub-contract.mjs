import assert from "node:assert/strict";
import "./audit-worlds-news-identity.mjs";
import "./audit-worlds-2026-bracket-layout.mjs";
import { isSameResultsPage } from "../src/utils/eventResults.js";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const localization = read("src/utils/eventHubLocalization.js");
const eventConfig = read("src/config/events.js");
const siteMetadata = read("src/config/site-metadata.mjs");
const eventHub = read("src/views/EventHub.vue");
const worldsBracket = read("src/components/Worlds2026Bracket.vue");
const worldsWatch = read("src/components/Worlds2026Watch.vue");
const worldsGuide = read("src/components/Worlds2026Guide.vue");
const eventRanking = read("src/components/EventHotRankList.vue");
for (const token of [
  "const worldsUpdateFilter = ref(\"topic\")",
  "const aichiUpdateFilter = ref('topic')",
  "return [{ key: \"topic\", label: topic }, { key: \"official\", label: official }]",
  "EventHotRankList v-else-if=\"worldsUpdateFilter === 'topic'",
  "EventHotRankList v-else-if=\"aichiUpdateFilter === 'topic'",
  "worldsUpdateFilter === 'official' && visibleWorldsUpdates.length",
  "aichiUpdateFilter === 'official' && visibleAichiUpdates.length",
]) assert.ok(eventHub.includes(token),"Event right column hot-first ranking + official timeline contract missing: "+token);
for (const token of ["event-hot-ranking__card","event-hot-ranking__place","scoreMethod","normalizedHelp","rel=\"nofollow noopener noreferrer\""]) {
  assert.ok(eventRanking.includes(token),"Shared event hot ranking card contract missing: "+token);
}

for (const token of [
  "worlds-main-tabs", "worlds-bracket-panel",
  "Worlds2026Bracket", "Worlds2026Watch",
  "worldsSection === 'schedule'",
  "loadWorldsUpdatesOnScroll",
  "worlds-insights__feed", "n-tooltip",
  "grid-template-columns:minmax(0,1fr) minmax(280px,30%)",
]) assert.ok(eventHub.includes(token), "Worlds visual two-column contract missing: " + token);
for (const token of [
  "getEventScheduleRange('worlds-2026'",
  "matchUrl(match)", "knockoutPairConfirmed",
  "is-knockout", "Swiss", "knockoutHeight",
  "TBD", "stageOptions", "format-slot-", "structural:true", "playInProjection", "provisionalSwissMatches",
]) assert.ok(worldsBracket.includes(token), "Worlds bracket source contract missing: " + token);
for (const token of [
  "https://live.bilibili.com/6", "https://www.huya.com/lpl",
  "worlds-watch-menu", "copy.more", "hovered = true",
  "在线观赛", "更多观赛平台", "https://www.bilibili.com/match/game?gid=2",
]) assert.ok(worldsWatch.includes(token), "Worlds banner watch-menu contract missing: " + token);
for (const token of ["playInTeams", "seedUnknown", "Worlds2026Primer", "localizedStageDate", "localizedStageVenue", "worlds-guide"]) assert.ok(worldsGuide.includes(token), "Worlds guide missing " + token);
for (const token of [
  "https://lolesports.com/en-US/tournament/115660540725177488/overview",
  "https://lolesports.com/en-US/schedule?leagues=worlds",
  "https://lpl.qq.com/", "children:[", "Worlds2026Watch",
]) assert.ok(eventHub.includes(token), "Worlds grouped banner sources missing: " + token);
assert.ok(!eventHub.includes("class=\"worlds-insights__links\""), "Worlds insights must not repeat banner sources");
assert.ok(!worldsBracket.includes('<div class="wb-head">'),"Bracket no longer repeats the hero heading");
assert.ok(!worldsGuide.includes('class="wg-kicker"'),"Guide no longer repeats the hero heading");
assert.ok(!worldsWatch.includes('class="ww-extra"'),"Watch menu must not nest a second disclosure");
assert.ok(eventHub.includes("getEventRegionalNews") && eventHub.includes("regionalNewsData"), "LPL regional evidence reader not wired");
assert.ok(!eventConfig.includes('url: "https://lolesports.com/",'), "Worlds watch must not use generic LoL Esports homepage as a live room");

const competitionGuide = read("src/components/EventCompetitionGuide.vue");
const header = read("src/components/Header.vue");
const appShell = read("src/App.vue");
const eventApi = read("src/api/index.js");
const eventHubAnimationPath = "public/animations/aichi-winner-medal.lottie";
const eventHubAnimationLicense = read(
  "public/animations/aichi-winner-medal.LICENSE.md",
);
if (!fs.existsSync(path.join(root, eventHubAnimationPath))) {
  throw new Error(`Event Hub animation asset missing: ${eventHubAnimationPath}`);
}
for (const token of [
  "The winner receives gold medal",
  "Abdul Latif",
  "Lottie Simple License",
  "https://lottiefiles.com/free-animation/the-winner-receives-gold-medal-pnDlDRP9I7",
  "full-width silk-ribbon motion atmosphere",
]) {
  if (!eventHubAnimationLicense.includes(token)) {
    throw new Error(`Event Hub animation license record missing: ${token}`);
  }
}

const worldsVisualAssets = [
  "public/assets/worlds-2026/summoners-rift-map.png",
];
const worldsVisualSource = read("public/assets/worlds-2026/SOURCE.md");
for (const asset of worldsVisualAssets) {
  if (!fs.existsSync(path.join(root, asset))) {
    throw new Error(`Worlds 2026 visual asset missing: ${asset}`);
  }
}
for (const token of [
  "Riot Data Dragon map asset",
  "Data Dragon version: `16.19.1`",
  "https://ddragon.leagueoflegends.com/cdn/16.19.1/img/map/map11.png",
  "Riot Developer Policy",
  "#785a28",
  "#c8aa6e",
  "does not embed Riot / League / Worlds logos",
  "https://lol.qq.com/doc/frontend/dist/",
  "CodePen/Cloudflare",
]) {
  if (!worldsVisualSource.includes(token)) {
    throw new Error(`Worlds 2026 visual source record missing: ${token}`);
  }
}

const lolSeriesHeroAssets = [
  {file:"public/assets/lol-series/lol-champions-portrait-v1-640.webp",maxBytes:160 * 1024},
  {file:"public/assets/lol-series/lol-champions-portrait-v1-960.webp",maxBytes:240 * 1024},
  {
    file: "public/assets/lol-series/lol-champions-hero-v2-1920.webp",
    maxBytes: 160 * 1024,
  },
  {
    file: "public/assets/lol-series/lol-champions-compact-v1-1280.webp",
    maxBytes: 120 * 1024,
  },
  {
    file: "public/assets/lol-series/lol-champions-compact-v1-640.webp",
    maxBytes: 48 * 1024,
  },
];
const lolSeriesHeroSource = read("public/assets/lol-series/SOURCE.md");
for (const { file, maxBytes } of lolSeriesHeroAssets) {
  const assetPath = path.join(root, file);
  if (!fs.existsSync(assetPath)) {
    throw new Error(`LoL Event Series Hero asset missing: ${file}`);
  }
  const size = fs.statSync(assetPath).size;
  if (size > maxBytes) {
    throw new Error(
      `LoL Event Series Hero asset too large: ${file} is ${size} bytes; max ${maxBytes}`,
    );
  }
}
for (const token of [
  "ChatGPT image generation",
  "de6c4eac-6b33-4517-a215-b56b2f920de6",
  "1942 × 809",
  "lol-series-hero-1024.webp",
  "45,494 bytes",
  "lol-series-hero-640.webp",
  "20,802 bytes",
  "original ~2.31 MB PNG is deliberately excluded",
  "not Riot Games, Worlds, LPL, LCK, MSI, or Demacia Cup official artwork",
]) {
  if (!lolSeriesHeroSource.includes(token)) {
    throw new Error(`LoL Event Series Hero source record missing: ${token}`);
  }
}
if (eventHub.includes("/assets/worlds-2026/summoners-rift-map.png")) {
  throw new Error("LoL Event Series Hero must not regress to Data Dragon map as the primary background");
}

const disciplineCodes = [
  "ARC","ATH","BBL","BDM","BK3","BKB","BKG","BMF","BMX","BOX",
  "CKT","CLB","CRD","CSL","CSP","CTR","DIV","ELS","EQU","FBL",
  "FEN","GAR","GLF","GRY","GTR","HBL","HOC","JJI","JUD","KAB",
  "KTE","KUR","MMA","MPN","MTB","PDL","ROW","RU7","SAL","SBL",
  "SHO","SKB","SPK","SQU","SRF","SWA","SWM","TEN","TEQ","TKW",
  "TRI","TST","TTE","VBV","VVO","WLF","WPO","WRE","WSU",
];

const missingDisciplines = disciplineCodes.filter(
  (code) => !new RegExp(`\\b${code}\\s*:`).test(localization),
);
if (missingDisciplines.length) {
  throw new Error(
    `Event Hub Aichi discipline localization missing: ${missingDisciplines.join(", ")}`,
  );
}

for (const token of [
  'CANCELED: "已取消"',
  'INTERRUPTED: "已中断"',
  'return `预赛 ${match[1].toUpperCase()} 组`',
  'return `${gender}四人赛预赛 ${match[2].toUpperCase()} 组`',
  'CHN: "中国"',
  'JPN: "日本"',
  'KOR: "韩国"',
  'TPE: "中华台北"',
  'HKG: "中国香港"',
  "normalizeEventTranslatedText",
  "normalizeAichiScheduleText",
  "isEventNocAlias",
  '["愛知県武道館", "爱知县武道馆"]',
  '["豊橋市総合体育館", "丰桥市综合体育馆"]',
  '.replace(/クラブとリボン/g, "棒和带")',
  '.replace(/ボルダー/g, "攀石")',
  '.replace(/3位決定戦/g, "铜牌赛")',
  '.replace(/オムニアム/g, "全能赛")',
  "Contest for Bronze Medal",
  'eventId === "aichi-nagoya-2026" && locale === "zh-CN"',
  '.replace(/準々決勝/g, "四分之一决赛")',
  '.replace(/ヒート\\s*(\\d+)/g, "第$1组")',
  '.replace(/順位決定戦\\s*(\\d+)位[～〜-](\\d+)位/g, "$1至$2名排位赛")',
  '.replace(/レスリング/g, "摔跤")',
  '.replace(/(\\d+(?:\\.\\d+)?)\\s*kg\\b/gi, "$1公斤")',
  '.replace(/比赛\\s*(\\d+)/g, "第$1场")',
  '.replace(/半决赛轮/g, "半决赛")',
  '.replace(/决赛轮/g, "决赛")',
  '.replace(/プムセ/g, "品势")',
  '.replace(/\\bPool\\s+([A-Z])\\b/gi, "$1组")',
  "shouldTranslateEventFreeText",
]) {
  if (!localization.includes(token)) {
    throw new Error(`Event Hub localization contract missing: ${token}`);
  }
}

for (const token of [
  'id: "aichi-nagoya-2026"',
  'topicKey: "aichi-nagoya-2026"',
  'eyebrow: "第 20 届亚洲运动会 · 官方赛事数据"',
  'host: "爱知·名古屋"',
  'country: "日本"',
  'scheduleKicker: "官方赛程与比赛结果"',
  'brandUrl: "https://www.aichi-nagoya2026.org/games-emblem-slogan-core-graphics/"',
  'url: "https://yayun.cctv.com/2026/epg/index.shtml"',
  'url: "https://yayun.cctv.com/2026/"',
  'kind: "live"',
  'kind: "replay"',
  'kind: "live-replay"',
  'url: "https://video.unext.jp/freeword/live?query=%E3%82%A2%E3%82%B8%E3%82%A2%E5%A4%A7%E4%BC%9A"',
  "顶部赛事快报来自央视网",
  "官方成绩系统",
]) {
  if (!eventConfig.includes(token)) {
    throw new Error(`Aichi Event UI contract missing: ${token}`);
  }
}

for (const token of [
  'id: "worlds-2026"',
  'path: "/event/worlds-2026"',
  'topicKey: "worlds-2026"',
  'worldsBriefLabel: "Worlds 资讯快报"',
  'worldsHotTopicsTitle: "Worlds 热门话题"',
  'rulesUrl: "https://competitiveops.riotgames.com/en-US/library?GAME=lol"',
  'ticketsUrl: "https://lolesports.com/tickets"',
  'id: "lolesports"',
  'kind: "live-replay"',
  'id: "bilibili-lol"',
  'url: "https://live.bilibili.com/6"',
  'id: "bilibili-match"',
  '"zh-CN": "LOL Esports 世界赛赛程"',
  '"zh-CN": "B站直播间"',
  '"zh-CN": "B站赛事中心"',
  'url: "https://www.bilibili.com/match/game?gid=2"',
  'eyebrow: "LEAGUE OF LEGENDS WORLD CHAMPIONSHIP 2026"',
  'host: "洛杉矶 · 艾伦 · 布鲁克林"',
  'country: "美国"',
  'standingsTitle: "Worlds 2026 参赛队伍"',
  'standingsKicker: "官方参赛阵容 · 赛区种子"',
  'qualifiedLabel: "取得参赛资格"',
  'pendingLabel: "席位待定"',
  'seedLabel: "赛区种子"',
  'seedPendingLabel: "种子待定"',
  'worldsSeedPendingNote: "入围赛 10/10 已抽签；LOS 为 CBLOL 一号种子，FUR 为二号种子；瑞士轮首轮抽签待举行"',
  'noScheduleTitle: "完整赛程数据待同步"',
  "完整赛程接口仍待同步 LoL Esports 赛事数据",
  'stageTitle: "赛制、阶段与场馆"',
  'newsTitle: "Worlds 官方动态"',
  'stageLabels: { "play-in": "入围赛", swiss: "瑞士轮", knockout: "淘汰赛", final: "总决赛" }',
  '"play-in": "11:00 PDT"',
  'knockout: "16:00 CST"',
  'final: "14:00 EST"',
  "获得 Worlds 参赛资格不等于晋级瑞士轮",
]) {
  if (!eventConfig.includes(token)) {
    throw new Error(`Worlds Event UI contract missing: ${token}`);
  }
}

for (const token of [
  'EVENT_SERIES = Object.freeze',
  '"league-of-legends"',
  'id: "demacia-cup-2026"',
  'path: "/event/demacia-cup-2026"',
  'seriesId: "league-of-legends"',
  'seriesPriority: 80',
  'seriesStartDate: "2026-10-03"',
  'seriesEndDate: "2026-10-17"',
  'seriesPriority: 100',
  'seriesStartDate: "2026-10-15"',
  'seriesEndDate: "2026-11-14"',
  'export const getEventSeriesPhase',
  'export const getEventSeriesEvents',
  'hero: { editionMark: "DCGI"',
  'startDate: "2026-10-03"',
  'endDate: "2026-10-17"',
  'fallbackOverview',
  'code: "WE"',
  'code: "KT"',
  'code: "NAVI"',
  'code: "FLY"',
  'code: "GAM"',
  'code: "RED"',
  'https://lolesports.com/zh-CN/schedule?leagues=demacia_cup',
  'https://lolesports.com/zh-CN/results/117133773242499009/stage/117133805551803623',
  'standingsTitle: "阶段赛果与晋级对阵"',
  'scheduleTitle: "赛程列表"',
  'noScheduleTitle: "当日暂无已公布对阵"',
  'matchReplays: {',
  'url: "https://live.bilibili.com/7734200"',
  'ownerMid: "50329118"',
  'roomId: "7734200"',
  '"zh-CN": "虎牙官方直播"',
  '"zh-CN": "B站官方直播"',
  '"zh-CN": "虎牙直播间 · 查找回放"',
  'https://www.bilibili.com/video/BV1HxHv6ZEs7?p=1',
  'https://www.bilibili.com/video/BV1HxHv6ZEs7?p=6',
  'https://www.bilibili.com/video/BV1KsHj62EW3',
  'https://www.bilibili.com/video/BV1zZHL6NEwW',
  'https://www.huya.com/video/play/1127921460.html',
  'competitionGuide: {',
  'title: {',
  '"zh-CN": "赛事规则与日历"',
  '"zh-CN": "首轮对阵由 12 支队伍随机抽签配对，同赛区需要进行规避。"',
  '"zh-CN": "八强队伍由抽签决定对阵，并以单败 BO5 赛制逐出冠军。"',
  '"zh-CN": "教练语音沟通卡"',
  'value: "45s"',
  'stageLabels: { swiss: "线上瑞士轮", quarterfinal: "四分之一决赛", semifinal: "半决赛", final: "总决赛" }',
  'record: "1-0"',
  'image: "https://static.lolesports.com/teams/LGD-FullonDark-1.png"',
  'unitName: "RED vs NAVI · BO1"',
  'unitName: "JDG vs BRO · BO1"',
  'total: 6',
  'completedCount: 6',
  '赛程、比分与队伍标识来自 LoL Esports 官方赛事数据',
]) {
  if (!eventConfig.includes(token)) {
    throw new Error(`LoL event-series config contract missing: ${token}`);
  }
}

for (const token of [
  "competition-guide__progression",
  "competition-guide__rules",
  "competition-guide__calendar-grid",
  "competition-guide__special",
  "--guide-blue: var(--demacia-blue, #29329e)",
  "grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))",
  "--guide-surface: var(--event-surface)",
  "--guide-line: var(--event-border)",
  "v-for=\"day in guide.calendar\"",
]) {
  if (!competitionGuide.includes(token)) {
    throw new Error(`Event competition-guide contract missing: ${token}`);
  }
}

for (const token of [
  'id: "demacia-cup-2026"',
  'path: "/event/demacia-cup-2026"',
  "2026德玛西亚杯国际邀请赛",
  "2026 Demacia Cup Global Invitational",
]) {
  if (!siteMetadata.includes(token)) {
    throw new Error(`Demacia Cup SEO contract missing: ${token}`);
  }
}

for (const token of [
  'eventUi.worldsBriefLabel || copy.liveBriefs',
  'eventUi.worldsBriefSource || copy.briefSource',
  'eventUi.worldsHotTopicsTitle || copy.hotTopics',
  'eventUi.worldsHotTopicsDescription || copy.topicDescription',
  'eventSlug.value !== "worlds-2026"',
]) assert.ok(eventHub.includes(token), 'Worlds 2026 briefs/topics contract: '+token);
for (const token of [
  "class=\"event-dashboard\" :class=\"{ 'worlds-workspace': eventSlug === 'worlds-2026', 'is-worlds-schedule-view':" ,
  "class=\"event-panel worlds-main-shell\"",
  "v-show=\"worldsSection === 'bracket'\"",
  "v-show=\"worldsSection === 'guide'\"",,
  "class=\"worlds-route-compact\"",
  "class=\"event-panel worlds-insights\"",
  "worldsUnifiedUpdates",
  "worldsUpdateUrlIdentity",
  "worldsUpdatesCanExpand",
  "worldsUpdateFilter",
  "formatWorldsUpdateDate",
  "eventSlug !== 'worlds-2026' && eventSlug !== 'aichi-nagoya-2026'",
  "v-if=\"eventSlug !== 'worlds-2026' && eventSlug !== 'aichi-nagoya-2026'\"",
  "isAichiArchived",
  "worldsNoTopics",
  "worldsFormatDetail",
  ".worlds-workspace > .schedule-panel { order: 0; }",
  ".worlds-workspace > .worlds-insights { order: 1; }",
  ".worlds-workspace > .primary-panel { order: 2; }",
  "grid-template-columns: minmax(260px,.83fr) minmax(410px,1.45fr) minmax(278px,.93fr)",
]) {
  if (!eventHub.includes(token)) {
    throw new Error(`Worlds / Aichi unified event-workspace contract missing: ${token}`);
  }
}

for (const token of [
  "class=\"event-panel worlds-insights aichi-insights\"",
  "aichiUnifiedUpdates",
  "aichiUpdateFilter",
  "visibleAichiUpdates",
  "loadAichiUpdatesOnScroll",
  "event-dashboard > .aichi-insights",
  "aichiArchiveCopy.noHistory",
  "archiveTopicData.value?.events",
  "getTopicArchive",
  "loadAichiArchive",
  "archiveTopicData.value = data",
  "archiveTopicError",
  "aichiArchiveSupplement.windowLabel",
  "eventSlug !== 'worlds-2026' && eventSlug !== 'aichi-nagoya-2026'",
]) assert.ok(eventHub.includes(token), 'Aichi archive must reuse the S16 right-column feed without inventing historical topics: '+token);
assert.ok(!eventHub.includes('class="event-panel aichi-archive-note"'), 'archive must not create a full-width standalone disclaimer');
if (eventHub.includes("worlds-section-nav")) {
  throw new Error("Worlds internal section-nav row must stay removed");
}
for (const forbidden of [
  "⌘K",
  "lol-hero__vector",
  "lol-hero__objective",
  "class=\"lol-hero__positions\"",
  "/assets/worlds-2026/position-top.svg",
  "/assets/worlds-2026/position-jungle.svg",
  "/assets/worlds-2026/position-middle.svg",
  "/assets/worlds-2026/position-bottom.svg",
  "/assets/worlds-2026/position-utility.svg",
  "/assets/worlds-2026/dragon.svg",
  "/assets/worlds-2026/chess-rook.svg",
]) {
  if (eventHub.includes(forbidden)) {
    throw new Error(`Worlds compact hero must not regress: found ${forbidden}`);
  }
}

for (const forbidden of [
  "不推断",
  "不补造",
  "never inferred",
  "sectionNavLabel",
  "teamsNav",
  "scheduleNav",
  "stagesNav",
  "newsNav",
]) {
  if (eventConfig.includes(forbidden)) {
    throw new Error(`Worlds front-end copy/navigation must stay concise: found ${forbidden}`);
  }
}

for (const forbidden of [
  "event-series-nav__label",
  "event-series-menu__trigger",
  "eventSeriesMenuOptions",
  "selectEventSeriesItem",
]) {
  if (eventHub.includes(forbidden)) {
    throw new Error(`LoL banner series navigation must stay as tabs without redundant series suffix: found ${forbidden}`);
  }
}

for (const token of [
  "'is-worlds-event': eventSlug === 'worlds-2026'",
  "'is-demacia-event': eventSlug === 'demacia-cup-2026'",
  "'is-lol-event': isLolEvent",
  '<LolEventHero v-if="isLolEvent"',
  "applyEventFallback",
  "const applyEventFallback = ({ seedDate = false } = {}) =>",
  "applyEventFallback({ seedDate: true })",
  "eventSlug}-teams",
  "eventSlug}-schedule",
  "eventSlug}-stages",
  "eventSlug}-news",
  "lol-schedule-empty",
  "lol-schedule-empty__action",
  "lol-stage-index",
  "lol-stage-broadcast",
  "stageDescription(stage)",
  "stageBroadcastTime(stage)",
  "stageDateLabel(stage)",
  "stageVenueLabel(stage)",
  "--worlds-ink: #010a13",
  "--worlds-deep-blue: #0a142b",
  "--worlds-rift-blue: #005a82",
  "--worlds-cyan: #0ac8b9",
  "--worlds-teal: #0a96aa",
  "--worlds-hot: #d13639",
  "--worlds-gold-base: #785a28",
  "--worlds-gold: #c8aa6e",
  "--worlds-cream: #f0e6d2",
  "--lol-action-start: #075b78",
  "--lol-action-end: #164e6d",
  "--lol-action-hover: #08677c",
  "--lol-action-text: #f2ffff",
  "--n-primary-color: #0bc4e2",
  "--n-primary-color-hover: #00c8c8",
  ".event-hub.is-lol-event.is-demacia-event",
  "--demacia-blue: #29329e",
  "--demacia-blue-deep: #0d164f",
  "--demacia-ivory: #f5eedc",
  "--demacia-gold: #d3b45f",
  "--lol-action-start: #3147bd",
  "--lol-action-hover: #445bd3",
  "lol-schedule-empty__action:hover",
  "white-space: nowrap",
  "event-refresh-button > span",
  ".event-hub.is-aichi-event .event-refresh-button__icon",
  ".event-hub.is-aichi-event .event-refresh-button:hover",
  "standings-team__logo",
  "v-if=\"isLolEvent && entry.record\"",
  "standings-team__record",
  ".event-hub.is-lol-event:not(.is-dark) .standings-team__record",
  "background: #e9f8fb",
  ".event-hub.is-lol-event:not(.is-dark) .standings-team__seed",
  ".event-hub.is-lol-event:not(.is-dark) .standings-team__seed.is-direct",
  ".event-hub.is-lol-event:not(.is-dark) .standings-team__seed.is-pending",
  "standings-team__qualifier",
  ".event-hub.is-lol-event:not(.is-dark) .standings-team__qualifier",
  "standings-team__seed",
  "WORLDS_2026_REGIONAL_SEEDS",
  "WORLDS_2026_DIRECT_QUALIFIERS",
  "GEN: 1, HLE: 2, T1: 3, DK: 4",
  "AL: 1, BLG: 2, TES: 3, IG: 4",
  "CBLOL: Object.freeze({ LOS: 1, FUR: 2 })",
  "G2: 1, MKOI: 2, KC: 3",
  "TSW: 1, CFO: 2, MVK: 3",
  'HLE: "msi-champion"',
  "worldsSeedLabel(entry)",
  "worldsSeedTitle(entry)",
  "const worldsSeedSortValue",
  "lol-riot-disclaimer",
  "doesn't reflect the views or opinions of Riot Games",
  'import { Fire, Refresh } from "@icon-park/vue-next";',
  "event-refresh-button__icon",
  ':component="Refresh"',
  "worldsSeedNumberLabel",
]) {
  if (!eventHub.includes(token)) {
    throw new Error(`Worlds Event Hub visual/product contract missing: ${token}`);
  }
}

const globalNavigation = read("src/composables/useRankingNavigation.js");
for (const token of ["EVENT_SERIES", "getEventSeriesEvents", "event-series:", "seen.has(event.seriesId)", "buildEventPath"]) {
  if (!globalNavigation.includes(token)) throw new Error(`Shared Event Hub navigation contract missing: ${token}`);
}
if (!read("src/App.vue").includes("<RankingNavigation")) throw new Error("Event entries must remain reachable in the shared desktop/mobile navigation");

for (const token of [
  "isEventNocAlias",
  "localizeEventDiscipline",
  "localizeEventNoc",
  "localizeEventStatus",
  "translateReadableTitles",
  "allowClientFallback: true",
  "locale: locale.value",
  "localizedScheduleTitle(item)",
  "localizedScheduleSubtitle(item)",
  "localizedNewsTitle(item)",
  "localizedNewsSummary(item)",
  "getTopicFeed",
  "topicPrimarySource",
  "localizedTopicTitle(item)",
  "localizedTopicSummary(item)",
  "topicTrendLabel",
  "translateVisibleEventText",
  'primaryModule === "standings"',
  "standingsData?.entries?.length",
  "eventUi.noSchedule || copy.noSchedule",
  "eventUi.stageKicker || copy.officialSchedule",
  "eventUi.stageTitle || copy.schedule",
  "eventData.stages.length",
]) {
  if (!eventHub.includes(token)) {
    throw new Error(`Event Hub localized rendering contract missing: ${token}`);
  }
}

for (const token of [
  "locale,",
  "{ date, discipline, locale, limit }",
  "{ locale, limit }",
  "getEventScheduleRange",
  "getEventDisciplineCatalog",
  "getEventBriefs",
  'if (force) url.searchParams.set("_", String(Date.now()))',
  '...(force ? { cache: "no-store" } : {})',
]) {
  if (!eventApi.includes(token)) {
    throw new Error(`Event Hub API locale/refresh contract missing: ${token}`);
  }
}
if (eventApi.includes('"Cache-Control": "no-cache"')) {
  throw new Error(
    "Event Hub force refresh must not send Cache-Control request headers because the cross-origin Display API does not allow that preflight header",
  );
}

for (const token of [
  "mainStore",
  "store.siteTheme === 'dark'",
  "--event-surface-soft",
  "--event-hover",
  "--event-accent-soft",
  "--aichi-jonetsu-red: #e83220",
  "--aichi-kakitsubata-purple: #4e3a93",
  "--aichi-shinrin-green: #079a3e",
  "--aichi-kinshachi-gold: #d5b100",
  "--aichi-dento-ocher: #c18e46",
  'import { Fire, Refresh } from "@icon-park/vue-next";',
  ':component="Fire"',
  "nocFlag(",
  "medal-head",
  "scheduleScopeOptions",
  "schedule-scope",
  "getEventScheduleRange",
  "getEventDisciplineCatalog",
  "event-brief-ticker",
  "event-brief-ticker__track",
  "tickerBriefItems",
  "filteredBriefItems",
  "newBriefUrls",
  "scheduleStatusOptions",
  "schedule-status-filter",
  "schedule-status-row",
  "schedule-status-count",
  "scheduleSortDirection",
  "orderedScheduleItems",
  "setScheduleSortDirection",
  "timeAscending",
  "timeDescending",
  "scheduleStatusCount",
  "scheduleTextInformationScore",
  "isScheduleTextCovered",
  "returnToCurrentSchedule",
  "schedule-order-filter",
  "eventSearchQuery",
  "event-hero__ops",
  "const eventSearchQuery = computed",
  "route.query.q",
  "filteredMedalStandings",
  "filteredTopicEvents",
  "filteredNewsItems",
  "isCurrentScheduleContext",
  "scheduleBrowseSnapshot",
  "restoreScheduleBrowse",
  "restoreFilters",
  "event-refresh-button",
  "event-refresh-spin",
  "event-hero__topbar",
  "event-hero__identity",
  "--event-control-height",
  "--event-panel-title-size",
  "--event-table-head-size",
  "font-size: var(--event-table-head-size)",
  "Event Hub design baseline v9",
  "refreshEventHubNow",
  "refreshError",
  "if (overview.value)",
  "force && scheduleData.value",
  "!force || !briefData.value",
  "localizedWatchPlatforms",
  "event-service-nav",
  "event-service-nav__links",
  "eventServices",
  "newBriefUrls",
  "event-hero__backdrop",
  "event-hero__motion-ribbons",
  "event-hero__motion-ribbon",
  "event-hero__winner",
  "event-hero__backdrop-wash",
  "event-hero-ribbon-drift",
  "mask-image: linear-gradient",
  "aichi-winner-medal.lottie",
  "@lottiefiles/dotlottie-vue",
  "prefersReducedMotion",
  "animation: event-brief-ticker-scroll 112s linear infinite",
  "nocFlagImage",
  "NOC_SPECIAL_FLAG_URLS",
  "medalLimit: 100",
  "topic-card__tooltip",
  "topic-card__tooltip-media",
  "topic-card__tooltip-content",
  "topic-card__tooltip-meta",
  "topic-card__preview-image",
  "topic-heat__icon",
  "cursor: zoom-in",
  "getCoverFullSrc",
  "event-hero__meta-row",
  "event-hero__meta-icon",
  "event-hero__meta-metric",
  "grid-template-columns: repeat(5, minmax(0, 1fr))",
  "schedule-watch-link",
  "rank >= 900",
  "scheduleLiveLinks",
  "replayWatchPlatform",
  "scheduleReplayLinks",
  "replayDisplayLabel",
  "scheduleSideImage",
  '<EventWatchLinks :platforms="scheduleLiveLinks(item)"',
  "{{ platform.displayLabel }}",
  'findReplay: "查找回看"',
  'scheduleBucket(item) === "completed"',
  "Event Hub live-dashboard v4",
  "hasHeadToHeadSides",
  "hasHeadToHeadResult",
  "schedule-result",
  "schedule-team-logo",
  "schedule-result__versus",
  "hasPlacementResults",
  "schedule-placements",
  "placementRankLabel",
  "scheduleStatusIcon",
  'if (item?.isLive) return "live";',
  'UPCOMING_SCHEDULE_STATUSES.has(status) || status === "RUNNING"',
  'if (String(item?.status || "").toUpperCase() === "RUNNING")',
  "topic-grid",
  "topic-source-chip",
  "topic-more",
  "height: clamp(560px, 68vh, 720px)",
  "color-scheme: dark",
  ":focus-visible",
  "border-inline-start",
]) {
  if (!eventHub.includes(token)) {
    throw new Error(`Event Hub professional visual contract missing: ${token}`);
  }
}

for (const token of [
  'routeName === "event" || routeName === "event-locale"',
  'return currentRoute?.path || "/"',
]) {
  if (!appShell.includes(token)) {
    throw new Error(`Event route query updates must not remount the page: missing ${token}`);
  }
}

const scheduleSortHandler = eventHub.match(
  /const setScheduleSortDirection = \(direction\) => \{([\s\S]*?)\n\};/,
);
if (!scheduleSortHandler) {
  throw new Error("Event Hub schedule sort handler is missing");
}
if (/loadAll|loadSchedule|applyScheduleFilters/.test(scheduleSortHandler[1])) {
  throw new Error(
    "Event Hub schedule sort must stay local/computed and must not refetch the page or schedule",
  );
}

for (const [label, pattern] of [
  ["duplicate edition color bars", /event-theme-bars/],
  ["redundant Worlds internal section nav", /worlds-section-nav/],
  ["retired generic Worlds vector masks", /lol-hero__asset|lol-hero__vector|lol-hero__objective|game-icons\.net|dragon-head\.svg|crystal-shrine\.svg|watchtower\.svg|\/assets\/worlds-2026\/dragon\.svg|\/assets\/worlds-2026\/chess-rook\.svg/],
  ["decorative hero pseudo-element", /\.event-hero::(?:before|after)/],
  ["glass blur", /backdrop-filter\s*:/],
  ["decorative shadow", /box-shadow\s*:/],
  ["legacy full-width brief strip", /class="event-brief-strip"/],
  ["legacy brief middle column", /class="event-brief-compact"/],
  ["duplicate event auto-refresh controls", /class="event-refresh-controls"/],
  ["schedule-local search after search moved to the hero", /class="schedule-search"/],
  ["legacy undersized topic hover preview", /class="topic-card__hover-preview"/],
  ["legacy hand-drawn sport motif", /class="event-hero__sport-motif"/],
  ["legacy isolated hero visual column", /class="event-hero__visual"/],
  ["legacy isolated hero lottie", /class="event-hero__lottie"/],
  ["truncated medal standings request", /medalLimit:\s*20/],
  [
    "raw RUNNING status overriding the effective live contract",
    /item\?\.isLive\s*\|\|\s*status\s*===\s*["']RUNNING["']/,
  ],
  [
    "redundant hero snapshot block after metrics moved to their owning panels",
    /<div class="event-hero__snapshot">/,
  ],
  [
    "duplicated core-panel kicker above the primary medal title",
    /class="panel-head core-panel-head"[\s\S]{0,260}?class="panel-kicker"/,
  ],
  [
    "visible topic trend/rank meta row above the headline",
    /class="topic-card__meta"/,
  ],
  [
    "visible topic summary trigger instead of whole-card hover detail",
    /class="topic-summary-trigger"/,
  ],
  [
    "ambiguous current-priority schedule sort control",
    /currentFirst|当前优先/,
  ],
  [
    "separate schedule summary strip after counts moved into status tabs",
    /class="schedule-summary"/,
  ],
  [
    "redundant NOC code below the localized medal delegation name",
    /<span class="delegation-copy">\s*<strong>\{\{ localizedNocName\(row\) \}\}<\/strong>\s*<span>\{\{ row\.noc \}\}<\/span>/,
  ],
  [
    "NOC code rendered as a fake flag fallback",
    /normalizedNoc\s*===\s*["']TPE["']\s*\)\s*return\s*["']TPE["']/,
  ],
]) {
  if (pattern.test(eventHub)) {
    throw new Error(`Event Hub professional visual contract forbids ${label}`);
  }
}

console.log(
  `[event-hub-contract] Aichi zh-CN localization covers ${disciplineCodes.length} disciplines; Worlds 2026 standings/stages/no-inference contracts verified; Event Hub also enforces theme-safe professional visual tokens and rejects landing-page decoration`,
);

assert.equal(isSameResultsPage("https://lolesports.com/en-US/results/event/stage/one", "https://lolesports.com/zh-CN/results/event/stage/one#top"), true);
assert.equal(isSameResultsPage("https://lolesports.com/en-US/results/event/stage/two", "https://lolesports.com/zh-CN/results/event/stage/one"), false);
assert.equal(isSameResultsPage("https://example.org/results/event", "https://lolesports.com/results/event"), false);
assert.equal(isSameResultsPage("bad", ""), false);
assert.ok(eventHub.includes("hasDistinctScheduleResult(item)"));
assert.ok(eventHub.includes("isSameResultsPage(item.resultUrl, eventData.value?.resultsUrl)"), "schedule dedup must compare the data destination actually rendered in the hero");
assert.ok(eventHub.includes('kind="replay"'));

assert.equal(eventHub.includes("event-hero__official-identity"), false);
assert.ok(eventConfig.includes("https://static.lolesports.com/leagues/1788253732774_94x-81.png"));
const watchLinks = read("src/components/EventWatchLinks.vue");
assert.ok(watchLinks.includes("platform.fallback"));
assert.ok(watchLinks.includes('platform.fallback ? "list" : "replay"'));
assert.equal(watchLinks.includes("event-watch-links__label"), false);

const lolHero=read("src/components/LolEventHero.vue");
for(const token of ["<h1>{{ title }}</h1>","LolSeriesNavigation","lol-event-hero__watermark",'--hero-watermark-opacity:.065','--hero-watermark-opacity:.055','lol-event-hero__identity-art','lol-champions-portrait-v1-640.webp','lol-champions-portrait-v1-960.webp','--hero-accent:#29329e','z-index:3','@media(max-width:820px)','/assets/lol-series/lol-champions-hero-v2-1920.webp','/assets/lol-series/lol-champions-compact-v1-1280.webp','/assets/lol-series/lol-champions-compact-v1-640.webp'])assert.ok(lolHero.includes(token),token);
assert.doesNotMatch(lolHero,/<h1>[^<]*<img/);
assert.ok(eventHub.includes('data.status !== "completed"'));
assert.ok(eventConfig.includes('logo: "/assets/lol-series/worlds-official.png"'));
