import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const localization = read("src/utils/eventHubLocalization.js");
const eventConfig = read("src/config/events.js");
const eventHub = read("src/views/EventHub.vue");

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
  'CHN: "中国"',
  'JPN: "日本"',
  'KOR: "韩国"',
  'TPE: "中国台北"',
  'HKG: "中国香港"',
  "normalizeEventTranslatedText",
  "shouldTranslateEventFreeText",
]) {
  if (!localization.includes(token)) {
    throw new Error(`Event Hub localization contract missing: ${token}`);
  }
}

for (const token of [
  'id: "aichi-nagoya-2026"',
  'eyebrow: "第 20 届亚洲运动会 · 官方赛事数据"',
  'host: "爱知·名古屋"',
  'country: "日本"',
  'scheduleKicker: "官方赛程与比赛状态"',
  "官方成绩系统",
]) {
  if (!eventConfig.includes(token)) {
    throw new Error(`Aichi Event UI contract missing: ${token}`);
  }
}

for (const token of [
  "localizeEventDiscipline",
  "localizeEventNoc",
  "localizeEventStatus",
  "translateReadableTitles",
  "localizedScheduleTitle(item)",
  "localizedScheduleSubtitle(item)",
  "localizedNewsTitle(item)",
  "localizedNewsSummary(item)",
  "translateVisibleEventText",
]) {
  if (!eventHub.includes(token)) {
    throw new Error(`Event Hub localized rendering contract missing: ${token}`);
  }
}

console.log(
  `[event-hub-contract] Aichi zh-CN localization covers ${disciplineCodes.length} disciplines, NOC/status semantics, cached free-text translation and localized Event UI`,
);
