import { buildFixedLocalePath, normalizeLocale } from "@/utils/locale";

export const EVENT_REGISTRY = [
  {
    id: "aichi-nagoya-2026",
    path: "/event/aichi-nagoya-2026",
    routeNames: ["event", "event-locale"],
    labels: {
      "zh-CN": "2026 亚运会",
      en: "Asian Games 2026",
      "zh-TW": "2026 亞運會",
      ja: "2026 アジア大会",
      ko: "2026 아시안게임",
    },
    titles: {
      "zh-CN": "2026 爱知·名古屋亚运会",
      en: "Aichi-Nagoya 2026 Asian Games",
      "zh-TW": "2026 愛知·名古屋亞運會",
      ja: "愛知・名古屋2026アジア競技大会",
      ko: "아이치·나고야 2026 아시안게임",
    },
    ui: {
      "zh-CN": {
        eyebrow: "第 20 届亚洲运动会 · 官方赛事数据",
        description: "聚合官方奖牌榜、当日赛程、比赛状态、成绩回链与赛事动态，用一页视图持续追踪爱知·名古屋亚运会进展。",
        host: "爱知·名古屋",
        country: "日本",
        resultsLabel: "官方成绩",
        snapshotLabel: "赛事概览",
        scheduleSnapshotLabel: "今日赛程",
        scheduleKicker: "官方赛程与比赛状态",
        scheduleTitle: "当日与指定日期赛程",
        sourceNote: "奖牌榜与赛程来自爱知·名古屋亚运会官方成绩系统；赛事动态来自组委会官网。中文模式会对官方英文项目名、场馆与资讯进行本地化展示，并保留原文入口。",
      },
    },
  },
  {
    id: "worlds-2026",
    path: "/event/worlds-2026",
    routeNames: ["event", "event-locale"],
    labels: {
      "zh-CN": "英雄联盟 S16 全球总决赛",
      en: "Worlds 2026",
      "zh-TW": "英雄聯盟 S16 世界大賽",
      ja: "Worlds 2026",
      ko: "월즈 2026",
    },
    titles: {
      "zh-CN": "2026 英雄联盟全球总决赛（Worlds 2026）",
      en: "League of Legends Worlds 2026",
      "zh-TW": "2026 英雄聯盟世界大賽（Worlds 2026）",
      ja: "League of Legends Worlds 2026",
      ko: "리그 오브 레전드 월드 챔피언십 2026",
    },
    ui: {
      "zh-CN": {
        description: "汇总官方已晋级队伍、赛事阶段、赛程状态与 Worlds 专属动态；具体对阵只在 LoL Esports 官方发布后展示。",
        standingsTitle: "已晋级队伍",
        standingsKicker: "官方晋级信息",
        qualifiedLabel: "已晋级",
        pendingLabel: "席位待定",
        noSchedule: "LoL Esports 尚未发布具体对阵；官方赛程发布后将在这里自动展示。",
        sourceNote: "已晋级队伍与赛制来自 LoL Esports 官方赛事页；资讯来自 Riot / LoL Esports 官方页面。具体对阵未发布前不会推断或补造赛程。",
        resultsLabel: "官方赛程",
        stageTitle: "赛事阶段与场馆",
        stageKicker: "官方赛程框架",
        scheduleSnapshotLabel: "官方对阵",
        scheduleTitle: "官方比赛赛程",
        stageLabels: { "play-in": "入围赛", swiss: "瑞士轮", knockout: "淘汰赛", final: "总决赛" },
      },
      en: {
        description: "Official qualified teams, event phases, schedule status and Worlds-specific updates. Matchups appear only after LoL Esports publishes them.",
        standingsTitle: "Qualified teams",
        standingsKicker: "Official qualification",
        qualifiedLabel: "qualified",
        pendingLabel: "TBD slots",
        noSchedule: "LoL Esports has not published the authoritative match list yet. It will appear here once released.",
        sourceNote: "Qualified teams and format come from the official LoL Esports event page; news comes from Riot / LoL Esports official pages. Matchups are never inferred before publication.",
        resultsLabel: "Official schedule",
        stageTitle: "Stages & venues",
        stageKicker: "Official event framework",
        scheduleSnapshotLabel: "Official matchups",
        scheduleTitle: "Official match schedule",
        stageLabels: { "play-in": "Play-In", swiss: "Swiss Stage", knockout: "Knockout Stage", final: "Grand Final" },
      },
      "zh-TW": {
        description: "彙整官方已晉級隊伍、賽事階段、賽程狀態與 Worlds 專屬動態；具體對戰只在 LoL Esports 官方發布後顯示。",
        standingsTitle: "已晉級隊伍",
        standingsKicker: "官方晉級資訊",
        qualifiedLabel: "已晉級",
        pendingLabel: "席位待定",
        noSchedule: "LoL Esports 尚未發布具體對戰；官方賽程發布後將在此自動顯示。",
        sourceNote: "已晉級隊伍與賽制來自 LoL Esports 官方賽事頁；資訊來自 Riot / LoL Esports 官方頁面。具體對戰未發布前不會推斷或補造賽程。",
        resultsLabel: "官方賽程",
        stageTitle: "賽事階段與場館",
        stageKicker: "官方賽程框架",
        scheduleSnapshotLabel: "官方對戰",
        scheduleTitle: "官方比賽賽程",
        stageLabels: { "play-in": "入圍賽", swiss: "瑞士輪", knockout: "淘汰賽", final: "總決賽" },
      },
      ja: {
        description: "公式の出場確定チーム、大会フェーズ、日程状況、Worlds 関連ニュースを集約します。対戦カードは LoL Esports 公式発表後のみ表示します。",
        standingsTitle: "出場確定チーム",
        standingsKicker: "公式出場情報",
        qualifiedLabel: "出場確定",
        pendingLabel: "未確定枠",
        noSchedule: "LoL Esports はまだ公式の対戦カードを公開していません。公開後にここへ表示します。",
        sourceNote: "出場チームと大会形式は LoL Esports 公式大会ページ、ニュースは Riot / LoL Esports 公式ページを参照します。未発表の対戦は推測しません。",
        resultsLabel: "公式日程",
        stageTitle: "大会フェーズと会場",
        stageKicker: "公式大会構成",
        scheduleSnapshotLabel: "公式対戦",
        scheduleTitle: "公式試合日程",
        stageLabels: { "play-in": "プレイイン", swiss: "スイスステージ", knockout: "ノックアウト", final: "決勝" },
      },
      ko: {
        description: "공식 진출 팀, 대회 단계, 일정 상태와 Worlds 전용 소식을 모아 봅니다. 대진은 LoL Esports 공식 발표 이후에만 표시합니다.",
        standingsTitle: "진출 확정 팀",
        standingsKicker: "공식 진출 정보",
        qualifiedLabel: "진출 확정",
        pendingLabel: "미정 슬롯",
        noSchedule: "LoL Esports가 아직 공식 대진을 공개하지 않았습니다. 공개 후 이곳에 표시됩니다.",
        sourceNote: "진출 팀과 대회 형식은 LoL Esports 공식 대회 페이지, 소식은 Riot / LoL Esports 공식 페이지를 기준으로 합니다. 미공개 대진은 추정하지 않습니다.",
        resultsLabel: "공식 일정",
        stageTitle: "대회 단계와 경기장",
        stageKicker: "공식 대회 구성",
        scheduleSnapshotLabel: "공식 대진",
        scheduleTitle: "공식 경기 일정",
        stageLabels: { "play-in": "플레이-인", swiss: "스위스 스테이지", knockout: "녹아웃", final: "결승" },
      },
    },
  },
];

export const EVENT_NAV_LABELS = {
  "zh-CN": "赛事",
  en: "Events",
  "zh-TW": "賽事",
  ja: "大会",
  ko: "대회",
};

export const getEventLabel = (event, locale = "zh-CN") => {
  const normalizedLocale = normalizeLocale(locale);
  return event?.labels?.[normalizedLocale] || event?.labels?.["zh-CN"] || "";
};

export const getEventTitle = (event, locale = "zh-CN") => {
  const normalizedLocale = normalizeLocale(locale);
  return event?.titles?.[normalizedLocale] || event?.titles?.["zh-CN"] || "";
};

export const getEventNavLabel = (locale = "zh-CN") => {
  const normalizedLocale = normalizeLocale(locale);
  return EVENT_NAV_LABELS[normalizedLocale] || EVENT_NAV_LABELS["zh-CN"];
};

export const buildEventPath = (event, locale = "zh-CN") =>
  buildFixedLocalePath(locale, event?.path || "/event/aichi-nagoya-2026");

export const getEventByRoute = (route) => {
  const slug = String(route?.params?.eventSlug || "");
  return (
    EVENT_REGISTRY.find(
      (event) =>
        event.id === slug ||
        event.routeNames.includes(String(route?.name || "")) &&
          event.path.endsWith(`/${slug}`),
    ) || null
  );
};
