import { buildFixedLocalePath, normalizeLocale } from "@/utils/locale";

export const EVENT_SERIES = Object.freeze({
  "league-of-legends": Object.freeze({
    id: "league-of-legends",
    labels: Object.freeze({
      "zh-CN": "英雄联盟",
      en: "League of Legends",
      "zh-TW": "英雄聯盟",
      ja: "League of Legends",
      ko: "League of Legends",
    }),
  }),
});

export const EVENT_REGISTRY = [
  {
  "id": "worlds-2025",
  "path": "/event/worlds-2025",
  "routeNames": [
    "event",
    "event-locale"
  ],
  "seriesId": "league-of-legends",
  "archived": true,
  "seriesStartDate": "2025-10-14",
  "seriesEndDate": "2025-11-09",
  "labels": {
    "zh-CN": "2025 英雄联盟全球总决赛",
    "en": "League of Legends Worlds 2025",
    "zh-TW": "2025 英雄聯盟全球總決賽",
    "ja": "League of Legends Worlds 2025",
    "ko": "League of Legends Worlds 2025"
  },
  "titles": {
    "zh-CN": "2025 英雄联盟全球总决赛",
    "en": "League of Legends Worlds 2025",
    "zh-TW": "2025 英雄聯盟全球總決賽",
    "ja": "League of Legends Worlds 2025",
    "ko": "League of Legends Worlds 2025"
  }
},
  {
    id: "aichi-nagoya-2026",
    path: "/event/aichi-nagoya-2026",
    routeNames: ["event", "event-locale"],
    topicKey: "aichi-nagoya-2026",
    brandUrl: "https://www.aichi-nagoya2026.org/games-emblem-slogan-core-graphics/",
    watchPlatforms: [
      {
        id: "cctv-live",
        locales: ["zh-CN", "zh-TW"],
        label: { "zh-CN": "央视直播大厅", "zh-TW": "央視直播大廳" },
        url: "https://yayun.cctv.com/2026/epg/index.shtml",
        kind: "live",
      },
      {
        id: "cctv-video",
        locales: ["zh-CN", "zh-TW"],
        label: { "zh-CN": "央视赛后视频", "zh-TW": "央視賽後影片" },
        url: "https://yayun.cctv.com/2026/",
        kind: "replay",
      },
      {
        id: "unext",
        locales: ["ja", "en"],
        label: { ja: "U-NEXT ライブ・見逃し", en: "U-NEXT Live / Replay" },
        url: "https://video.unext.jp/freeword/live?query=%E3%82%A2%E3%82%B8%E3%82%A2%E5%A4%A7%E4%BC%9A",
        kind: "live-replay",
      },
    ],
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
        description: "聚合官方奖牌榜、日期范围赛程、真实比赛结果、即时赛事快报与官方动态，用一页视图持续追踪爱知·名古屋亚运会进展。",
        host: "爱知·名古屋",
        country: "日本",
        resultsLabel: "官方成绩",
        snapshotLabel: "赛事概览",
        scheduleSnapshotLabel: "当前赛程",
        scheduleKicker: "官方赛程与比赛结果",
        scheduleTitle: "赛程与比赛结果",
        sourceNote: "奖牌榜与赛程来自爱知·名古屋亚运会官方成绩系统；顶部赛事快报来自央视网，官方动态来自组委会官网。中文模式会对官方英文项目名、场馆与官方资讯进行本地化展示，并保留原文入口。观看入口仅提供权威平台导航，具体直播场次与可用性以平台实时节目单为准。",
      },
    },
  },
  {
    id: "demacia-cup-2026",
    path: "/event/demacia-cup-2026",
    routeNames: ["event", "event-locale"],
    seriesId: "league-of-legends",
    seriesOrder: 10,
    seriesPriority: 80,
    seriesStartDate: "2026-10-03",
    seriesEndDate: "2026-10-17",
    hero: { editionMark: "DCGI", logo: "https://static.lolesports.com/leagues/1788253732774_94x-81.png" },
    rulesUrl: "https://www.bilibili.com/video/BV1zWh16GEkB/",
    sourceReferences: [
      "https://lolesports.com/zh-CN/schedule?leagues=demacia_cup",
      "https://lolesports.com/zh-CN/results/117133773242499009/stage/117133805551803623",
      "https://www.bilibili.com/video/BV1zWh16GEkB/",
    ],
    watchPlatforms: [
      {
        id: "huya-lol",
        label: {
          "zh-CN": "虎牙官方直播",
          en: "Huya Official Live",
          "zh-TW": "虎牙官方直播",
          ja: "Huya 公式配信",
          ko: "Huya 공식 라이브",
        },
        replayLabel: {
          "zh-CN": "虎牙直播间 · 查找回放",
          en: "Huya channel · find replay",
          "zh-TW": "虎牙直播間 · 查找回放",
          ja: "Huya チャンネルでリプレイを探す",
          ko: "Huya 채널에서 다시보기 찾기",
        },
        url: "https://www.huya.com/lpl",
        kind: "live-replay",
      },
      {
        id: "bilibili-lol",
        label: {
          "zh-CN": "B站官方直播",
          en: "Bilibili Official Live",
          "zh-TW": "B站官方直播",
          ja: "Bilibili 公式配信",
          ko: "Bilibili 공식 라이브",
        },
        url: "https://live.bilibili.com/7734200",
        ownerMid: "50329118",
        roomId: "7734200",
        kind: "live",
      },
      {
        id: "bilibili-match",
        label: {
          "zh-CN": "B站赛事中心",
          en: "Bilibili Match Center",
          "zh-TW": "B站賽事中心",
          ja: "Bilibili LoL 大会センター",
          ko: "Bilibili LoL 경기 센터",
        },
        url: "https://www.bilibili.com/match/game?gid=2",
        kind: "match-center",
      },
    ],
    matchReplays: {
      "117133805552196841": [
        {
          id: "bilibili",
          label: {
            "zh-CN": "B站官方回放",
            en: "Bilibili Official Replay",
            "zh-TW": "B站官方回放",
            ja: "Bilibili 公式リプレイ",
            ko: "Bilibili 공식 다시보기",
          },
          url: "https://www.bilibili.com/video/BV1HxHv6ZEs7?p=1",
          verifiedAt: "2026-10-04",
        },
      ],
      "117133805552262379": [
        {
          id: "bilibili",
          label: {
            "zh-CN": "B站官方回放",
            en: "Bilibili Official Replay",
            "zh-TW": "B站官方回放",
            ja: "Bilibili 公式リプレイ",
            ko: "Bilibili 공식 다시보기",
          },
          url: "https://www.bilibili.com/video/BV1HxHv6ZEs7?p=2",
          verifiedAt: "2026-10-04",
        },
      ],
      "117133805552262381": [
        {
          id: "bilibili",
          label: {
            "zh-CN": "B站官方回放",
            en: "Bilibili Official Replay",
            "zh-TW": "B站官方回放",
            ja: "Bilibili 公式リプレイ",
            ko: "Bilibili 공식 다시보기",
          },
          url: "https://www.bilibili.com/video/BV1HxHv6ZEs7?p=3",
          verifiedAt: "2026-10-04",
        },
      ],
      "117133805552262383": [
        {
          id: "bilibili",
          label: {
            "zh-CN": "B站官方回放",
            en: "Bilibili Official Replay",
            "zh-TW": "B站官方回放",
            ja: "Bilibili 公式リプレイ",
            ko: "Bilibili 공식 다시보기",
          },
          url: "https://www.bilibili.com/video/BV1HxHv6ZEs7?p=4",
          verifiedAt: "2026-10-04",
        },
      ],
      "117133805552262385": [
        {
          id: "bilibili",
          label: {
            "zh-CN": "B站官方回放",
            en: "Bilibili Official Replay",
            "zh-TW": "B站官方回放",
            ja: "Bilibili 公式リプレイ",
            ko: "Bilibili 공식 다시보기",
          },
          url: "https://www.bilibili.com/video/BV1HxHv6ZEs7?p=5",
          verifiedAt: "2026-10-04",
        },
        {
          id: "huya",
          label: {
            "zh-CN": "虎牙完整回放",
            en: "Huya Full Replay",
            "zh-TW": "虎牙完整回放",
            ja: "Huya フルリプレイ",
            ko: "Huya 전체 다시보기",
          },
          url: "https://www.huya.com/video/play/1127921460.html",
          verifiedAt: "2026-10-04",
        },
      ],
      "117133805552262387": [
        {
          id: "bilibili",
          label: {
            "zh-CN": "B站官方回放",
            en: "Bilibili Official Replay",
            "zh-TW": "B站官方回放",
            ja: "Bilibili 公式リプレイ",
            ko: "Bilibili 공식 다시보기",
          },
          url: "https://www.bilibili.com/video/BV1HxHv6ZEs7?p=6",
          verifiedAt: "2026-10-04",
        },
      ],
      "117133805552262389": [
        {
          id: "bilibili",
          label: {
            "zh-CN": "B站官方回放",
            en: "Bilibili Official Replay",
            "zh-TW": "B站官方回放",
            ja: "Bilibili 公式リプレイ",
            ko: "Bilibili 공식 다시보기",
          },
          url: "https://www.bilibili.com/video/BV1KsHj62EW3",
          verifiedAt: "2026-10-04",
        },
      ],
      "117133805552262393": [
        {
          id: "bilibili",
          label: {
            "zh-CN": "B站官方回放",
            en: "Bilibili Official Replay",
            "zh-TW": "B站官方回放",
            ja: "Bilibili 公式リプレイ",
            ko: "Bilibili 공식 다시보기",
          },
          url: "https://www.bilibili.com/video/BV1zZHL6NEwW",
          verifiedAt: "2026-10-04",
        },
      ],
    },
    labels: {
      "zh-CN": "2026 德玛西亚杯",
      en: "Demacia Cup 2026",
      "zh-TW": "2026 德瑪西亞盃",
      ja: "Demacia Cup 2026",
      ko: "Demacia Cup 2026",
    },
    titles: {
      "zh-CN": "2026 德玛西亚杯国际邀请赛",
      en: "2026 Demacia Cup Global Invitational",
      "zh-TW": "2026 德瑪西亞盃國際邀請賽",
      ja: "2026 Demacia Cup Global Invitational",
      ko: "2026 Demacia Cup Global Invitational",
    },
    ui: {
      "zh-CN": {
        eyebrow: "LEAGUE OF LEGENDS · DEMACIA CUP GLOBAL INVITATIONAL",
        host: "北京亦庄",
        country: "中国",
        description: "六大赛区 12 支战队参加 2026 德玛西亚杯国际邀请赛；线上瑞士轮后，8 支队伍晋级北京线下单败 BO5 淘汰赛与总决赛。",
        standingsTitle: "阶段赛果与晋级对阵",
        standingsKicker: "当前战绩 · 六大赛区 · 12 支受邀战队",
        qualifiedLabel: "参赛",
        pendingLabel: "待确认",
        qualifiedTeamsShort: "支参赛战队",
        scheduleSnapshotLabel: "赛事日程",
        scheduleKicker: "德玛西亚杯国际邀请赛",
        scheduleTitle: "赛程列表",
        noScheduleTitle: "当日暂无已公布对阵",
        noSchedule: "请切换日期查看完整赛程；尚未确认的后续对阵将在官方公布后更新。",
        officialScheduleAction: "查看 LoL Esports 官方赛程",
        resultsLabel: "官方赛程与赛果",
        stageTitle: "赛制与阶段",
        stageKicker: "2026 德杯赛事路线",
        newsKicker: "英雄联盟赛事 / 主办方",
        newsTitle: "德杯赛事动态",
        rulesLabel: "官方赛制说明",
        stageLabels: { swiss: "线上瑞士轮", quarterfinal: "四分之一决赛", semifinal: "半决赛", final: "总决赛" },
        stageDescriptions: {
          swiss: "12 支战队参加 10 月 3–8 日线上瑞士轮；达到 2 胜的队伍晋级，最终产生 8 支线下淘汰赛队伍。",
          quarterfinal: "10 月 12–13 日进行四分之一决赛，系列赛采用 BO5。",
          semifinal: "10 月 14–15 日进行半决赛，系列赛采用 BO5。",
          final: "10 月 17 日进行总决赛，决出 2026 德玛西亚杯国际邀请赛冠军。",
        },
        sourceNote: "赛程、比分与队伍标识来自 LoL Esports 官方赛事数据；赛制依据英雄联盟赛事官方说明。虎牙与 Bilibili 仅作为观看入口，不作为赛果数据源；上游暂不可用时页面回退到已核实的静态赛事概览。",
      },
    },
    competitionGuide: {
      kicker: {
        "zh-CN": "官方赛制 · 前端可视化",
        en: "OFFICIAL FORMAT · VISUAL GUIDE",
        "zh-TW": "官方賽制 · 前端視覺化",
        ja: "公式フォーマット · ビジュアルガイド",
        ko: "공식 경기 방식 · 비주얼 가이드",
      },
      title: {
        "zh-CN": "赛事规则与日历",
        en: "Format, Rules & Calendar",
        "zh-TW": "賽事規則與日曆",
        ja: "大会ルールと日程",
        ko: "대회 규정 및 일정",
      },
      summary: {
        "zh-CN": "12 支战队通过线上瑞士轮争夺 8 个线下席位，之后以单败 BO5 决出冠军。这里用于解释赛制与赛事日历，实时对阵与比分仍以「赛程列表」为准。",
        en: "Twelve teams play an online Swiss stage for eight offline berths, followed by a single-elimination BO5 bracket. This guide explains the format and calendar; live pairings and results remain in the schedule list.",
        "zh-TW": "12 支戰隊透過線上瑞士輪爭奪 8 個線下席位，之後以單敗 BO5 決出冠軍。此區用於說明賽制與賽事日曆，即時對陣與比分仍以「賽程列表」為準。",
        ja: "12チームがオンラインのスイス方式で8つのオフライン出場枠を争い、その後はシングルエリミネーションのBO5で優勝を決めます。ここでは大会方式と日程を説明し、リアルタイムの対戦・結果はスケジュール一覧を参照します。",
        ko: "12개 팀이 온라인 스위스 스테이지에서 8개의 오프라인 진출권을 두고 경쟁한 뒤, 단판 토너먼트 BO5로 우승팀을 가립니다. 이 영역은 경기 방식과 일정을 설명하며 실시간 대진과 결과는 일정 목록을 기준으로 합니다.",
      },
      badge: {
        "zh-CN": "10.03—10.17",
        en: "OCT 03—17",
        "zh-TW": "10.03—10.17",
        ja: "10.03—10.17",
        ko: "10.03—10.17",
      },
      progressionLabel: {
        "zh-CN": "赛事晋级路径",
        en: "Tournament progression",
        "zh-TW": "賽事晉級路徑",
        ja: "大会進行フロー",
        ko: "대회 진행 경로",
      },
      progression: [
        {
          key: "teams",
          value: "12",
          label: { "zh-CN": "支参赛战队", en: "Invited teams", "zh-TW": "支參賽戰隊", ja: "参加チーム", ko: "참가 팀" },
        },
        {
          key: "swiss",
          value: "SWISS",
          label: { "zh-CN": "线上瑞士轮", en: "Online Swiss", "zh-TW": "線上瑞士輪", ja: "オンライン・スイス", ko: "온라인 스위스" },
        },
        {
          key: "qualified",
          value: "8",
          label: { "zh-CN": "支晋级线下", en: "Advance offline", "zh-TW": "支晉級線下", ja: "オフライン進出", ko: "오프라인 진출" },
        },
        {
          key: "playoffs",
          value: "BO5",
          label: { "zh-CN": "线下单败淘汰", en: "Single elimination", "zh-TW": "線下單敗淘汰", ja: "シングルエリミネーション", ko: "싱글 엘리미네이션" },
        },
        {
          key: "champion",
          value: "1",
          label: { "zh-CN": "最终冠军", en: "Champion", "zh-TW": "最終冠軍", ja: "チャンピオン", ko: "최종 우승" },
        },
      ],
      ruleGroups: [
        {
          key: "online",
          eyebrow: "10.03—10.08",
          title: { "zh-CN": "线上瑞士轮", en: "Online Swiss Stage", "zh-TW": "線上瑞士輪", ja: "オンライン・スイスステージ", ko: "온라인 스위스 스테이지" },
          summary: {
            "zh-CN": "12 支队伍以瑞士轮赛制进行线上赛，晋级 8 支队伍至线下淘汰赛。",
            en: "Twelve teams play an online Swiss stage, with eight advancing to the offline knockout stage.",
            "zh-TW": "12 支隊伍以瑞士輪賽制進行線上賽，晉級 8 支隊伍至線下淘汰賽。",
            ja: "12チームがオンラインのスイス方式で戦い、8チームがオフラインのノックアウトステージへ進出します。",
            ko: "12개 팀이 온라인 스위스 방식으로 경기하며 8개 팀이 오프라인 토너먼트에 진출합니다.",
          },
          facts: [
            { key: "teams", value: "12", label: { "zh-CN": "参赛队伍", en: "TEAMS", "zh-TW": "參賽隊伍", ja: "チーム", ko: "팀" } },
            { key: "advance", value: "8", label: { "zh-CN": "晋级线下", en: "ADVANCE", "zh-TW": "晉級線下", ja: "進出", ko: "진출" } },
            { key: "format", value: "BO1→BO3", label: { "zh-CN": "比赛形式", en: "FORMAT", "zh-TW": "比賽形式", ja: "形式", ko: "방식" } },
          ],
          rules: [
            {
              "zh-CN": "首轮对阵由 12 支队伍随机抽签配对，同赛区需要进行规避。",
              en: "Round one is drawn randomly among all 12 teams, with same-region matchups avoided.",
              "zh-TW": "首輪對陣由 12 支隊伍隨機抽籤配對，同賽區需要進行規避。",
              ja: "初戦は12チームからランダム抽選で組み合わせ、同一地域同士の対戦を回避します。",
              ko: "1라운드는 12개 팀을 무작위 추첨으로 배정하며 동일 지역 팀 간 대진을 피합니다.",
            },
            {
              "zh-CN": "首轮后，每轮对阵双方均由抽签决定。",
              en: "After round one, each subsequent matchup is decided by draw.",
              "zh-TW": "首輪後，每輪對陣雙方均由抽籤決定。",
              ja: "初戦以降の各ラウンドも抽選で対戦相手を決定します。",
              ko: "1라운드 이후 각 라운드의 대진도 추첨으로 결정합니다.",
            },
          ],
        },
        {
          key: "offline",
          eyebrow: "10.12—10.17",
          title: { "zh-CN": "线下淘汰赛", en: "Offline Knockout Stage", "zh-TW": "線下淘汰賽", ja: "オフライン・ノックアウト", ko: "오프라인 토너먼트" },
          summary: {
            "zh-CN": "八强队伍由抽签决定对阵，并以单败 BO5 赛制逐出冠军。",
            en: "The top eight are drawn into a single-elimination BO5 bracket to determine the champion.",
            "zh-TW": "八強隊伍由抽籤決定對陣，並以單敗 BO5 賽制逐出冠軍。",
            ja: "ベスト8は抽選で組み合わせを決め、シングルエリミネーションのBO5で優勝を争います。",
            ko: "8강은 추첨으로 대진을 정하고 싱글 엘리미네이션 BO5로 우승팀을 결정합니다.",
          },
          facts: [
            { key: "teams", value: "8", label: { "zh-CN": "八强队伍", en: "TEAMS", "zh-TW": "八強隊伍", ja: "ベスト8", ko: "8강" } },
            { key: "bracket", value: "单败", label: { "zh-CN": "淘汰方式", en: "BRACKET", "zh-TW": "淘汰方式", ja: "方式", ko: "토너먼트" } },
            { key: "format", value: "BO5", label: { "zh-CN": "全程赛制", en: "FORMAT", "zh-TW": "全程賽制", ja: "形式", ko: "방식" } },
          ],
          rules: [
            {
              "zh-CN": "八强阶段重新抽签决定对阵，10 月 12–15 日完成四分之一决赛与半决赛，10 月 17 日进行总决赛。",
              en: "The top eight are redrawn for the bracket; quarterfinals and semifinals run Oct 12–15, with the final on Oct 17.",
              "zh-TW": "八強階段重新抽籤決定對陣，10 月 12–15 日完成四分之一決賽與半決賽，10 月 17 日進行總決賽。",
              ja: "ベスト8で改めて抽選を行い、10月12〜15日に準々決勝・準決勝、10月17日に決勝を実施します。",
              ko: "8강에서 다시 추첨해 대진을 정하고 10월 12~15일에 8강과 4강, 10월 17일에 결승을 진행합니다.",
            },
          ],
        },
      ],
      calendarKicker: {
        "zh-CN": "赛事日历",
        en: "TOURNAMENT CALENDAR",
        "zh-TW": "賽事日曆",
        ja: "大会カレンダー",
        ko: "대회 일정",
      },
      calendarTitle: {
        "zh-CN": "从线上瑞士轮到北京线下决赛",
        en: "Online Swiss to the Beijing final",
        "zh-TW": "從線上瑞士輪到北京線下決賽",
        ja: "オンライン・スイスから北京オフライン決勝へ",
        ko: "온라인 스위스부터 베이징 오프라인 결승까지",
      },
      calendarHint: {
        "zh-CN": "规则日历用于理解赛制；具体开赛时间与对阵以赛程列表为准",
        en: "Format calendar only; use the schedule list for exact start times and pairings.",
        "zh-TW": "規則日曆用於理解賽制；具體開賽時間與對陣以賽程列表為準",
        ja: "大会方式の把握用です。正確な開始時刻と対戦はスケジュール一覧を参照してください。",
        ko: "경기 방식 이해를 위한 일정이며 정확한 시작 시각과 대진은 일정 목록을 확인하세요.",
      },
      calendar: [
        { key: "1003", date: "10.03", title: { "zh-CN": "瑞士轮 · 0-0", en: "Swiss · 0-0", "zh-TW": "瑞士輪 · 0-0", ja: "スイス · 0-0", ko: "스위스 · 0-0" }, note: { "zh-CN": "首轮", en: "Opening round", "zh-TW": "首輪", ja: "初戦", ko: "1라운드" }, format: "BO1", mode: "online" },
        { key: "1004", date: "10.04", title: { "zh-CN": "瑞士轮 · 1-0", en: "Swiss · 1-0", "zh-TW": "瑞士輪 · 1-0", ja: "スイス · 1-0", ko: "스위스 · 1-0" }, note: { "zh-CN": "胜者路径", en: "Winners path", "zh-TW": "勝者路徑", ja: "勝者側", ko: "승자 경로" }, format: "BO3", mode: "online" },
        { key: "1005", date: "10.05", title: { "zh-CN": "瑞士轮 · 0-1", en: "Swiss · 0-1", "zh-TW": "瑞士輪 · 0-1", ja: "スイス · 0-1", ko: "스위스 · 0-1" }, note: { "zh-CN": "生存路径", en: "Survival path", "zh-TW": "生存路徑", ja: "生存側", ko: "생존 경로" }, format: "BO3", mode: "online" },
        { key: "1006", date: "10.06", title: { "zh-CN": "瑞士轮 · 1-1", en: "Swiss · 1-1", "zh-TW": "瑞士輪 · 1-1", ja: "スイス · 1-1", ko: "스위스 · 1-1" }, note: { "zh-CN": "晋级关键轮", en: "Qualification round", "zh-TW": "晉級關鍵輪", ja: "進出決定戦", ko: "진출 결정전" }, format: "BO3", mode: "online" },
        { key: "1007", date: "10.07", title: { "zh-CN": "瑞士轮 · 1-1", en: "Swiss · 1-1", "zh-TW": "瑞士輪 · 1-1", ja: "スイス · 1-1", ko: "스위스 · 1-1" }, note: { "zh-CN": "淘汰关键轮", en: "Elimination round", "zh-TW": "淘汰關鍵輪", ja: "敗退決定戦", ko: "탈락 결정전" }, format: "BO3", mode: "online" },
        { key: "1008", date: "10.08", title: { "zh-CN": "瑞士轮收官", en: "Swiss finale", "zh-TW": "瑞士輪收官", ja: "スイス最終日", ko: "스위스 최종일" }, note: { "zh-CN": "1-2 / 积分赛", en: "1-2 / points match", "zh-TW": "1-2 / 積分賽", ja: "1-2 / ポイント戦", ko: "1-2 / 포인트전" }, format: "BO3", mode: "online" },
        { key: "1012", date: "10.12", title: { "zh-CN": "四分之一决赛", en: "Quarterfinals", "zh-TW": "四分之一決賽", ja: "準々決勝", ko: "8강" }, note: { "zh-CN": "线下 Day 1", en: "Offline Day 1", "zh-TW": "線下 Day 1", ja: "オフライン Day 1", ko: "오프라인 Day 1" }, format: "BO5", mode: "offline" },
        { key: "1013", date: "10.13", title: { "zh-CN": "四分之一决赛", en: "Quarterfinals", "zh-TW": "四分之一決賽", ja: "準々決勝", ko: "8강" }, note: { "zh-CN": "线下 Day 2", en: "Offline Day 2", "zh-TW": "線下 Day 2", ja: "オフライン Day 2", ko: "오프라인 Day 2" }, format: "BO5", mode: "offline" },
        { key: "1014", date: "10.14", title: { "zh-CN": "半决赛", en: "Semifinals", "zh-TW": "半決賽", ja: "準決勝", ko: "4강" }, note: { "zh-CN": "线下 Day 3", en: "Offline Day 3", "zh-TW": "線下 Day 3", ja: "オフライン Day 3", ko: "오프라인 Day 3" }, format: "BO5", mode: "offline" },
        { key: "1015", date: "10.15", title: { "zh-CN": "半决赛", en: "Semifinals", "zh-TW": "半決賽", ja: "準決勝", ko: "4강" }, note: { "zh-CN": "线下 Day 4", en: "Offline Day 4", "zh-TW": "線下 Day 4", ja: "オフライン Day 4", ko: "오프라인 Day 4" }, format: "BO5", mode: "offline" },
        { key: "1017", date: "10.17", title: { "zh-CN": "总决赛", en: "Grand Final", "zh-TW": "總決賽", ja: "決勝", ko: "결승" }, note: { "zh-CN": "决出冠军", en: "Crown the champion", "zh-TW": "決出冠軍", ja: "優勝決定", ko: "우승 결정" }, format: "BO5", mode: "offline", final: true },
      ],
      specialRule: {
        kicker: {
          "zh-CN": "线下特殊规则",
          en: "OFFLINE SPECIAL RULE",
          "zh-TW": "線下特殊規則",
          ja: "オフライン特別ルール",
          ko: "오프라인 특별 규정",
        },
        title: {
          "zh-CN": "教练语音沟通卡",
          en: "Coach Voice Communication Cards",
          "zh-TW": "教練語音溝通卡",
          ja: "コーチ音声コミュニケーションカード",
          ko: "코치 음성 커뮤니케이션 카드",
        },
        summary: {
          "zh-CN": "线下淘汰赛启用教练语音接入功能：BO5 的每个小局内，教练获得 3 张语音沟通卡；每张最多沟通 45 秒，完成沟通或达到时限后由裁判切断并消耗 1 张。未使用的沟通卡不得顺延至后续对局。",
          en: "The offline knockout stage enables coach voice access. In every game of a BO5, each coach receives three communication cards; each card allows up to 45 seconds of voice communication and is consumed when the exchange ends or the limit is reached. Unused cards do not carry over to later games.",
          "zh-TW": "線下淘汰賽啟用教練語音接入功能：BO5 的每個小局內，教練獲得 3 張語音溝通卡；每張最多溝通 45 秒，完成溝通或達到時限後由裁判切斷並消耗 1 張。未使用的溝通卡不得順延至後續對局。",
          ja: "オフラインのノックアウトではコーチ音声接続を使用します。BO5の各ゲームでコーチは3枚のコミュニケーションカードを受け取り、1枚につき最大45秒通話できます。通話終了または上限到達で1枚消費され、未使用分は次のゲームへ持ち越せません。",
          ko: "오프라인 토너먼트에서는 코치 음성 연결 기능을 사용합니다. BO5의 각 세트마다 코치는 음성 커뮤니케이션 카드 3장을 받고, 카드 1장당 최대 45초 동안 소통할 수 있습니다. 소통 종료 또는 제한 시간 도달 시 카드 1장이 소모되며, 사용하지 않은 카드는 다음 세트로 이월되지 않습니다.",
        },
        facts: [
          { key: "cards", value: "3", label: { "zh-CN": "张 / 每小局", en: "CARDS / GAME", "zh-TW": "張 / 每小局", ja: "枚 / 各ゲーム", ko: "장 / 세트" } },
          { key: "seconds", value: "45s", label: { "zh-CN": "每张上限", en: "MAX / CARD", "zh-TW": "每張上限", ja: "1枚あたり", ko: "카드당 최대" } },
        ],
      },
    },
    fallbackOverview: {
      today: "2026-10-03",
      event: {
        id: "demacia-cup-2026",
        title: "2026 德玛西亚杯国际邀请赛",
        startDate: "2026-10-03",
        endDate: "2026-10-17",
        timezone: "Asia/Shanghai",
        status: "active",
        host: "北京亦庄",
        country: "中国",
        primaryModule: "standings",
        officialUrl: "https://lolesports.com/zh-CN/schedule?leagues=demacia_cup",
        resultsUrl: "https://lolesports.com/zh-CN/results/117133773242499009/stage/117133805551803623",
        stages: [
          {
            key: "swiss",
            label: "线上瑞士轮",
            dateLabel: "10 月 3–8 日",
            venue: "线上",
            location: "六大赛区 · 12 支战队",
          },
          {
            key: "quarterfinal",
            label: "四分之一决赛",
            dateLabel: "10 月 12–13 日",
            venue: "北京智慧电竞赛事中心",
            location: "北京亦庄",
          },
          {
            key: "semifinal",
            label: "半决赛",
            dateLabel: "10 月 14–15 日",
            venue: "北京智慧电竞赛事中心",
            location: "北京亦庄",
          },
          {
            key: "final",
            label: "总决赛",
            dateLabel: "10 月 17 日",
            venue: "北京智慧电竞赛事中心",
            location: "北京亦庄",
          },
        ],
      },
      modules: {
        standings: {
          total: 12,
          pendingCount: 0,
          entries: [
            { id: "dc26-lpl-we", group: "LPL", code: "WE", name: "Xi'an Team WE", image: "https://static.lolesports.com/teams/1634763008788_220px-Team_WE_logo.png", record: "1-0", statusLabel: "1胜 0负", summary: "Xi'an Team WE" },
            { id: "dc26-lpl-jdg", group: "LPL", code: "JDG", name: "Beijing JDG Esports", image: "https://static.lolesports.com/teams/1627457924722_29.png", record: "0-1", statusLabel: "0胜 1负", summary: "Beijing JDG Esports" },
            { id: "dc26-lpl-lgd", group: "LPL", code: "LGD", name: "LGD GAMING", image: "https://static.lolesports.com/teams/LGD-FullonDark-1.png", record: "1-0", statusLabel: "1胜 0负", summary: "LGD GAMING" },
            { id: "dc26-lck-kt", group: "LCK", code: "KT", name: "kt Rolster", image: "https://static.lolesports.com/teams/kt_darkbackground.png", record: "1-0", statusLabel: "1胜 0负", summary: "kt Rolster" },
            { id: "dc26-lck-bfx", group: "LCK", code: "BFX", name: "BNK FEARX", image: "https://static.lolesports.com/teams/1734691810721_BFXfullcolorfordarkbg.png", record: "1-0", statusLabel: "1胜 0负", summary: "BNK FEARX" },
            { id: "dc26-lck-bro", group: "LCK", code: "BRO", name: "HANJIN BRION", image: "https://static.lolesports.com/teams/1716454325887_Nowyprojekt.png", record: "1-0", statusLabel: "1胜 0负", summary: "HANJIN BRION" },
            { id: "dc26-lec-navi", group: "LEC", code: "NAVI", name: "Natus Vincere", image: "https://static.lolesports.com/teams/1752746833620_NAVI_FullColor.png", record: "0-1", statusLabel: "0胜 1负", summary: "Natus Vincere" },
            { id: "dc26-lec-vit", group: "LEC", code: "VIT", name: "Team Vitality", image: "https://static.lolesports.com/teams/1675865863968_Vitality_FullColor.png", record: "0-1", statusLabel: "0胜 1负", summary: "Team Vitality" },
            { id: "dc26-lcs-sr", group: "LCS", code: "SR", name: "Shopify Rebellion", image: "https://static.lolesports.com/teams/1701424227458_Teams204_Shopify_1632869404072.png", record: "0-1", statusLabel: "0胜 1负", summary: "Shopify Rebellion" },
            { id: "dc26-lcs-fly", group: "LCS", code: "FLY", name: "FlyQuest", image: "https://static.lolesports.com/teams/flyquest-new-on-dark.png", record: "0-1", statusLabel: "0胜 1负", summary: "FlyQuest" },
            { id: "dc26-lcp-gam", group: "LCP", code: "GAM", name: "GAM Esports", image: "https://static.lolesports.com/teams/1643263093448_GAMyellow.png", record: "0-1", statusLabel: "0胜 1负", summary: "GAM Esports" },
            { id: "dc26-cblol-red", group: "CBLOL", code: "RED", name: "RED Kalunga", image: "https://static.lolesports.com/teams/1631820575924_red-2021-worlds.png", record: "1-0", statusLabel: "1胜 0负", summary: "RED Kalunga" },
          ],
        },
        schedule: {
          date: "2026-10-03",
          timezone: "Asia/Shanghai",
          total: 6,
          liveCount: 0,
          completedCount: 6,
          upcomingCount: 0,
          disciplines: [{ key: "LOL", name: "英雄联盟", count: 6 }],
          items: [
            {
              id: "117133805552196841",
              discipline: "LOL",
              disciplineName: "英雄联盟",
              event: "demacia-cup-2026",
              eventName: "2026 德玛西亚杯国际邀请赛",
              phase: "swiss",
              phaseName: "瑞士轮",
              unitName: "RED vs NAVI · BO1",
              startAt: "2026-10-03T08:00:00Z",
              status: "OFFICIAL",
              statusLabel: "已结束",
              isLive: false,
              venue: "线上",
              venueName: "线上",
              location: "线上赛",
              locationName: "线上赛",
              showResults: true,
              resultUrl: "https://lolesports.com/zh-CN/results/117133773242499009/stage/117133805551803623",
              home: { name: "RED", result: "1", winner: true },
              away: { name: "NAVI", result: "0", winner: false },
            },
            {
              id: "117133805552262379",
              discipline: "LOL",
              disciplineName: "英雄联盟",
              event: "demacia-cup-2026",
              eventName: "2026 德玛西亚杯国际邀请赛",
              phase: "swiss",
              phaseName: "瑞士轮",
              unitName: "FLY vs LGD · BO1",
              startAt: "2026-10-03T09:00:00Z",
              status: "OFFICIAL",
              statusLabel: "已结束",
              isLive: false,
              venue: "线上",
              venueName: "线上",
              location: "线上赛",
              locationName: "线上赛",
              showResults: true,
              resultUrl: "https://lolesports.com/zh-CN/results/117133773242499009/stage/117133805551803623",
              home: { name: "FLY", result: "0", winner: false },
              away: { name: "LGD", result: "1", winner: true },
            },
            {
              id: "117133805552262381",
              discipline: "LOL",
              disciplineName: "英雄联盟",
              event: "demacia-cup-2026",
              eventName: "2026 德玛西亚杯国际邀请赛",
              phase: "swiss",
              phaseName: "瑞士轮",
              unitName: "KT vs SR · BO1",
              startAt: "2026-10-03T10:00:00Z",
              status: "OFFICIAL",
              statusLabel: "已结束",
              isLive: false,
              venue: "线上",
              venueName: "线上",
              location: "线上赛",
              locationName: "线上赛",
              showResults: true,
              resultUrl: "https://lolesports.com/zh-CN/results/117133773242499009/stage/117133805551803623",
              home: { name: "KT", result: "1", winner: true },
              away: { name: "SR", result: "0", winner: false },
            },
            {
              id: "117133805552262383",
              discipline: "LOL",
              disciplineName: "英雄联盟",
              event: "demacia-cup-2026",
              eventName: "2026 德玛西亚杯国际邀请赛",
              phase: "swiss",
              phaseName: "瑞士轮",
              unitName: "BFX vs VIT · BO1",
              startAt: "2026-10-03T11:00:00Z",
              status: "OFFICIAL",
              statusLabel: "已结束",
              isLive: false,
              venue: "线上",
              venueName: "线上",
              location: "线上赛",
              locationName: "线上赛",
              showResults: true,
              resultUrl: "https://lolesports.com/zh-CN/results/117133773242499009/stage/117133805551803623",
              home: { name: "BFX", result: "1", winner: true },
              away: { name: "VIT", result: "0", winner: false },
            },
            {
              id: "117133805552262385",
              discipline: "LOL",
              disciplineName: "英雄联盟",
              event: "demacia-cup-2026",
              eventName: "2026 德玛西亚杯国际邀请赛",
              phase: "swiss",
              phaseName: "瑞士轮",
              unitName: "WE vs GAM · BO1",
              startAt: "2026-10-03T12:00:00Z",
              status: "OFFICIAL",
              statusLabel: "已结束",
              isLive: false,
              venue: "线上",
              venueName: "线上",
              location: "线上赛",
              locationName: "线上赛",
              showResults: true,
              resultUrl: "https://lolesports.com/zh-CN/results/117133773242499009/stage/117133805551803623",
              home: { name: "WE", result: "1", winner: true },
              away: { name: "GAM", result: "0", winner: false },
            },
            {
              id: "117133805552262387",
              discipline: "LOL",
              disciplineName: "英雄联盟",
              event: "demacia-cup-2026",
              eventName: "2026 德玛西亚杯国际邀请赛",
              phase: "swiss",
              phaseName: "瑞士轮",
              unitName: "JDG vs BRO · BO1",
              startAt: "2026-10-03T13:00:00Z",
              status: "OFFICIAL",
              statusLabel: "已结束",
              isLive: false,
              venue: "线上",
              venueName: "线上",
              location: "线上赛",
              locationName: "线上赛",
              showResults: true,
              resultUrl: "https://lolesports.com/zh-CN/results/117133773242499009/stage/117133805551803623",
              home: { name: "JDG", result: "0", winner: false },
              away: { name: "BRO", result: "1", winner: true },
            },
          ],
        },
        news: {
          total: 2,
          items: [
            {
              title: "DCGI 2026 官方赛程与赛果",
              url: "https://lolesports.com/zh-CN/results/117133773242499009/stage/117133805551803623",
              author: "LoL Esports",
              summary: "LoL Esports 官方德玛西亚杯国际邀请赛赛程、比分与赛果。",
              categories: ["Esports"],
            },
            {
              title: "2026 德玛西亚杯国际邀请赛赛制说明",
              url: "https://www.bilibili.com/video/BV1zWh16GEkB/",
              author: "英雄联盟赛事",
              summary: "官方赛事频道发布的 2026 德玛西亚杯国际邀请赛赛制说明。",
              categories: ["Esports"],
            },
          ],
        },
      },
    },
  },
  {
    id: "worlds-2026",
    path: "/event/worlds-2026",
    topicKey: "worlds-2026",
    routeNames: ["event", "event-locale"],
    seriesId: "league-of-legends",
    seriesOrder: 20,
    seriesPriority: 100,
    seriesStartDate: "2026-10-15",
    seriesEndDate: "2026-11-14",
    hero: { editionMark: "S16", logo: "/assets/lol-series/worlds-official.png" },
    rulesUrl: "https://competitiveops.riotgames.com/en-US/library?GAME=lol",
    ticketsUrl: "https://lolesports.com/tickets",
    watchPlatforms: [
      {
        id: "lolesports",
        label: {
          "zh-CN": "LOL Esports 世界赛赛程",
          en: "LoL Esports Worlds schedule",
          "zh-TW": "LOL Esports 世界賽賽程",
          ja: "LoL Esports 世界大会日程",
          ko: "LoL Esports 월즈 일정",
        },
        url: "https://lolesports.com/en-US/schedule?leagues=worlds",
        kind: "match-center",
      },
      {
        id: "bilibili-lol",
        label: {
          "zh-CN": "B站直播间",
          en: "Bilibili Live",
          "zh-TW": "B站直播間",
          ja: "Bilibili LoL Esports",
          ko: "Bilibili LoL Esports",
        },
        url: "https://live.bilibili.com/6",
        kind: "live",
      },
      {
        id: "bilibili-match",
        label: {
          "zh-CN": "B站赛事中心",
          en: "Bilibili Match Center",
          "zh-TW": "B站賽事中心",
          ja: "Bilibili LoL 大会センター",
          ko: "Bilibili LoL 경기 센터",
        },
        url: "https://www.bilibili.com/match/game?gid=2",
        kind: "match-center",
      },
    ],
    labels: {
      "zh-CN": "S16 全球总决赛",
      en: "Worlds 2026",
      "zh-TW": "S16 世界大賽",
      ja: "Worlds 2026",
      ko: "월즈 2026",
    },
    titles: {
      "zh-CN": "2026 英雄联盟全球总决赛 (S16)",
      en: "League of Legends Worlds 2026",
      "zh-TW": "2026 英雄聯盟全球總決賽 (S16)",
      ja: "League of Legends Worlds 2026",
      ko: "리그 오브 레전드 월드 챔피언십 2026",
    },
    ui: {
      "zh-CN": {
        eyebrow: "LEAGUE OF LEGENDS WORLD CHAMPIONSHIP 2026",
        host: "洛杉矶 · 艾伦 · 布鲁克林",
        country: "美国",
        description: "一页了解 Worlds 2026 赛制与对阵、参赛队伍、各地观赛时间、LPL 中文赛事资讯及官方直播入口。",
        standingsTitle: "Worlds 2026 参赛队伍",
        standingsKicker: "官方参赛阵容 · 赛区种子",
        qualifiedLabel: "取得参赛资格",
        pendingLabel: "席位待定",
        seedLabel: "赛区种子",
        seedPendingLabel: "种子待定",
        directQualifierLabel: "MSI 冠军直通",
        worldsSeedPendingNote: "入围赛 10/10 已抽签；LOS 为 CBLOL 一号种子，FUR 为二号种子；瑞士轮首轮抽签待举行",
        qualifiedTeamsShort: "支参赛队伍",
        pendingSlotsShort: "个待定席位",
        noScheduleTitle: "完整赛程数据待同步",
        noSchedule: "10/10 入围赛抽签已确认，上方展示首轮对阵；完整赛程接口仍待同步 LoL Esports 赛事数据。",
        officialScheduleAction: "前往 LoL Esports 官方赛程",
        sourceNote: "参赛队伍、赛制、官方赛程与场馆以 LoL Esports / Riot Games 为准；中文赛事资讯补充 LPL 赛事官网原文，保留对应英文官方来源。获得 Worlds 参赛资格不等于晋级瑞士轮，直播渠道以各平台节目单为准。",
        resultsLabel: "官方赛程",
        stageTitle: "赛制、阶段与场馆",
        stageKicker: "Worlds 2026 赛事路线",
        scheduleSnapshotLabel: "官方对阵",
        scheduleTitle: "比赛赛程与结果",
        newsKicker: "LPL / Riot Games / LoL Esports",
        newsTitle: "Worlds 官方动态",
        worldsHotTopicsTitle: "Worlds 热门话题",
        worldsHotTopicsDescription: "聚合 S16 赛事抽签、战队动态和全网讨论，热度随数据源刷新。",
        worldsNoTopics: "暂未发现符合条件的 S16 世界赛热门话题",
        worldsBriefLabel: "Worlds 资讯快报",
        worldsUpdatesTitle: "资讯动态",
        worldsOfficialTag: "官方",
        worldsTopicTag: "热议",
        worldsNoTopics: "暂未发现真实命中的 S16 热门话题",
        worldsNoNews: "暂无可显示的赛事资讯",
        worldsFormatDetail: "完整赛制与场馆",
        worldsBriefSource: "LoL Esports",
        rulesLabel: "官方赛事规则",
        ticketsLabel: "现场观赛 / 门票",
        stageLabels: { "play-in": "入围赛", swiss: "瑞士轮", knockout: "淘汰赛", final: "总决赛" },
        stageDescriptions: {
          "play-in": "4 支队伍进行 Bo5 双败淘汰赛，争夺 1 个瑞士轮席位。",
          swiss: "16 支队伍进行 5 轮瑞士轮；达到 3 胜晋级、3 负淘汰，最终 8 支队伍进入淘汰赛。",
          knockout: "8 支队伍进入单败淘汰赛；四分之一决赛 11 月 3–6 日，半决赛 11 月 7–8 日。",
          final: "11 月 14 日在纽约布鲁克林决出 2026 世界冠军。",
        },
        stageBroadcastTimes: {
          "play-in": "北京时间 10/16–19 02:00 · 当地 11:00 PDT",
          swiss: "北京时间次日：10/23–26、10/31 场次 01:00；10/28–30 场次 04:00",
          knockout: "北京时间次日 06:00 · 当地 16:00 CST",
          final: "北京时间 11/15 03:00 · 当地 11/14 14:00 EST",
        },
        stageDateLabels: {
          "play-in": "10 月 15–18 日",
          swiss: "10 月 23–26 日 · 10 月 28–31 日",
          knockout: "11 月 3–8 日",
          final: "11 月 14 日",
        },
        stageVenueLabels: {
          "play-in": "Riot Games Arena · 洛杉矶",
          swiss: "Credit Union of Texas Event Center · 艾伦",
          knockout: "Credit Union of Texas Event Center · 艾伦",
          final: "Barclays Center · 纽约布鲁克林",
        },
      },
      en: {
        eyebrow: "LEAGUE OF LEGENDS WORLD CHAMPIONSHIP 2026",
        host: "Los Angeles · Allen · Brooklyn",
        country: "United States",
        description: "Follow verified Worlds 2026 match brackets, team entry and advancement rules, local match times, official news and licensed viewing links in one place.",
        standingsTitle: "Worlds 2026 qualified teams",
        standingsKicker: "Official qualifiers · regional seeds",
        qualifiedLabel: "qualified",
        pendingLabel: "TBD slots",
        seedLabel: "regional seed",
        seedPendingLabel: "seed TBD",
        directQualifierLabel: "MSI champion berth",
        worldsSeedPendingNote: "Play-In draw completed Oct 10; LOS is CBLOL #1 and FUR is #2; initial Swiss draw still pending",
        qualifiedTeamsShort: "qualified",
        pendingSlotsShort: "TBD slot",
        noScheduleTitle: "Full match schedule is awaiting synchronization",
        noSchedule: "The Oct 10 Play-In draw is confirmed above. The full official schedule feed has not yet synchronized the matches.",
        officialScheduleAction: "Open the official LoL Esports schedule",
        sourceNote: "Qualified teams, format and phases come from the official LOL Esports event page; venue and broadcast times follow Riot / LOL Esports announcements. Confirmed regional seeds are labeled here; unresolved regions remain pending.",
        resultsLabel: "Official schedule",
        stageTitle: "Format, stages & venues",
        stageKicker: "Worlds 2026 event route",
        scheduleSnapshotLabel: "Official matchups",
        scheduleTitle: "Matches & results",
        newsKicker: "Riot Games / LoL Esports",
        newsTitle: "Worlds official updates",
        worldsHotTopicsTitle: "Worlds trending topics",
        worldsHotTopicsDescription: "Track verified Worlds 2026 conversations and updates across platforms.",
        worldsNoTopics: "No verified Worlds 2026 trending topics yet",
        worldsBriefLabel: "Worlds news brief",
        worldsUpdatesTitle: "Updates",
        worldsOfficialTag: "Official",
        worldsTopicTag: "Trending",
        worldsNoTopics: "No verified Worlds 2026 trending topics yet",
        worldsNoNews: "No event updates available",
        worldsFormatDetail: "Format and venues",
        worldsBriefSource: "LoL Esports",
        rulesLabel: "Official rules",
        ticketsLabel: "Attend / Tickets",
        stageLabels: { "play-in": "Play-In", swiss: "Swiss Stage", knockout: "Knockout Stage", final: "Grand Final" },
        stageDescriptions: {
          "play-in": "Four teams play a double-elimination best-of-five bracket for one Swiss Stage berth.",
          swiss: "Sixteen teams play up to five Swiss rounds; teams advance at three wins and are eliminated at three losses, leaving eight for Knockout.",
          knockout: "Eight teams enter a single-elimination bracket; quarterfinals run Nov 3–6 and semifinals Nov 7–8.",
          final: "The 2026 World Champion is decided in Brooklyn on Nov 14.",
        },
        stageBroadcastTimes: {
          "play-in": "11:00 PDT",
          swiss: "Oct 23–26 12:00 CDT · Oct 28–30 15:00 CDT · Oct 31 12:00 CDT",
          knockout: "16:00 CST",
          final: "14:00 EST",
        },
      },
      "zh-TW": {
        eyebrow: "LEAGUE OF LEGENDS WORLD CHAMPIONSHIP 2026",
        host: "洛杉磯 · 艾倫 · 布魯克林",
        country: "美國",
        description: "一次了解 Worlds 2026 賽制、對陣、參賽隊伍、在地賽事時間、官方動態與觀賽平台。",
        standingsTitle: "Worlds 2026 參賽隊伍",
        standingsKicker: "官方參賽隊伍 · 賽區種子",
        qualifiedLabel: "已晉級",
        pendingLabel: "席位待定",
        seedLabel: "賽區種子",
        seedPendingLabel: "種子待定",
        directQualifierLabel: "MSI 冠軍直通",
        worldsSeedPendingNote: "Worlds 分池與階段安排以官方後續公布為準",
        qualifiedTeamsShort: "支已晉級",
        pendingSlotsShort: "個待定席位",
        noScheduleTitle: "官方對戰尚未發布",
        noSchedule: "LoL Esports 尚未發布具體對戰，官方賽程更新後這裡會自動顯示比賽列表。",
        officialScheduleAction: "前往 LoL Esports 官方賽程",
        sourceNote: "參賽隊伍、賽制、場館與賽程參考 Riot / LoL Esports 官方來源。入圍賽隊伍仍需爭奪瑞士輪席位，觀賽入口依轉播地區和場次授權而異。",
        resultsLabel: "官方賽程",
        stageTitle: "賽制、階段與場館",
        stageKicker: "Worlds 2026 賽事路線",
        scheduleSnapshotLabel: "官方對戰",
        scheduleTitle: "比賽賽程與結果",
        newsKicker: "Riot Games / LoL Esports",
        newsTitle: "Worlds 官方動態",
        worldsHotTopicsTitle: "Worlds 熱門話題",
        worldsHotTopicsDescription: "聚合 S16 賽事抽籤、戰隊動態與全網討論，依資料來源持續更新。",
        worldsNoTopics: "暫無符合條件的 S16 世界賽熱門話題",
        worldsBriefLabel: "Worlds 資訊快報",
        worldsUpdatesTitle: "資訊動態",
        worldsOfficialTag: "官方",
        worldsTopicTag: "熱議",
        worldsNoTopics: "暫無已確認的 S16 熱門話題",
        worldsNoNews: "暫無賽事資訊",
        worldsFormatDetail: "賽制與場館詳情",
        worldsBriefSource: "LoL Esports",
        rulesLabel: "官方賽事規則",
        ticketsLabel: "現場觀賽 / 門票",
        stageLabels: { "play-in": "入圍賽", swiss: "瑞士輪", knockout: "淘汰賽", final: "總決賽" },
        stageDescriptions: {
          "play-in": "4 支隊伍進行 Bo5 雙敗淘汰賽，爭奪 1 個瑞士輪席位。",
          swiss: "16 支隊伍進行 5 輪瑞士輪；達到 3 勝晉級、3 負淘汰，最終 8 支隊伍進入淘汰賽。",
          knockout: "8 支隊伍進入單敗淘汰賽；八強 11 月 3–6 日，四強 11 月 7–8 日。",
          final: "11 月 14 日在紐約布魯克林決出 2026 世界冠軍。",
        },
        stageBroadcastTimes: {
          "play-in": "11:00 PDT",
          swiss: "10/23–26 12:00 CDT · 10/28–30 15:00 CDT · 10/31 12:00 CDT",
          knockout: "16:00 CST",
          final: "14:00 EST",
        },
      },
      ja: {
        eyebrow: "LEAGUE OF LEGENDS WORLD CHAMPIONSHIP 2026",
        host: "ロサンゼルス · アレン · ブルックリン",
        country: "アメリカ",
        description: "Worlds 2026 の公式対戦表、出場チーム、進出条件、現地時間に合わせた日程と配信先を一画面で確認。",
        standingsTitle: "Worlds 2026 出場確定チーム",
        standingsKicker: "公式出場情報 · 地域予選順位",
        qualifiedLabel: "出場確定",
        pendingLabel: "未確定枠",
        seedLabel: "地域シード",
        seedPendingLabel: "シード未定",
        directQualifierLabel: "MSI 優勝枠",
        worldsSeedPendingNote: "Worlds の最終シードは公式発表待ち",
        qualifiedTeamsShort: "チーム出場確定",
        pendingSlotsShort: "枠未確定",
        noScheduleTitle: "公式対戦カードは未発表です",
        noSchedule: "LoL Esports はまだ公式の対戦カードを公開していません。公開後、この欄は公式試合一覧へ自動的に切り替わります。",
        officialScheduleAction: "LoL Esports 公式日程を開く",
        sourceNote: "出場チーム、形式、各フェーズは LoL Esports 公式大会ページ、会場と配信開始時刻は Riot / LoL Esports 公式告知を参照します。ページでは確定済みの地域予選順位のみを表示し、Worlds の最終シードは公式発表に従います。",
        resultsLabel: "公式日程",
        stageTitle: "大会形式・フェーズ・会場",
        stageKicker: "Worlds 2026 大会ルート",
        scheduleSnapshotLabel: "公式対戦",
        scheduleTitle: "試合日程と結果",
        newsKicker: "Riot Games / LoL Esports",
        newsTitle: "Worlds 公式アップデート",
        worldsHotTopicsTitle: "Worlds 注目トピック",
        worldsHotTopicsDescription: "Worlds 2026 の対戦情報と話題を複数の情報源から追跡します。",
        worldsNoTopics: "Worlds 2026 の話題はまだありません",
        worldsBriefLabel: "Worlds 最新ニュース",
        worldsUpdatesTitle: "大会ニュース・話題",
        worldsOfficialTag: "公式",
        worldsTopicTag: "話題",
        worldsNoTopics: "確認済みの話題はありません",
        worldsNoNews: "ニュースはまだありません",
        worldsFormatDetail: "大会方式と会場の詳細",
        worldsBriefSource: "LoL Esports",
        rulesLabel: "公式大会ルール",
        ticketsLabel: "現地観戦 / チケット",
        stageLabels: { "play-in": "プレイイン", swiss: "スイスステージ", knockout: "ノックアウト", final: "決勝" },
        stageDescriptions: {
          "play-in": "4 チームによる Bo5 ダブルエリミネーションで、1 チームがスイスステージへ進出します。",
          swiss: "16 チームが最大 5 ラウンドを戦い、3 勝で進出、3 敗で敗退。8 チームがノックアウトへ進みます。",
          knockout: "8 チームによるシングルエリミネーション。準々決勝は 11 月 3–6 日、準決勝は 11 月 7–8 日です。",
          final: "11 月 14 日、ニューヨーク・ブルックリンで 2026 世界王者が決まります。",
        },
        stageBroadcastTimes: {
          "play-in": "11:00 PDT",
          swiss: "10/23–26 12:00 CDT · 10/28–30 15:00 CDT · 10/31 12:00 CDT",
          knockout: "16:00 CST",
          final: "14:00 EST",
        },
      },
      ko: {
        eyebrow: "LEAGUE OF LEGENDS WORLD CHAMPIONSHIP 2026",
        host: "로스앤젤레스 · 앨런 · 브루클린",
        country: "미국",
        description: "Worlds 2026 공식 대진, 참가 팀, 스위스 진출 조건, 한국 시간 경기 일정과 중계 플랫폼을 한 화면에서 확인하세요.",
        standingsTitle: "Worlds 2026 진출 확정 팀",
        standingsKicker: "공식 진출 정보 · 지역 예선 순위",
        qualifiedLabel: "진출 확정",
        pendingLabel: "미정 슬롯",
        seedLabel: "지역 시드",
        seedPendingLabel: "시드 미정",
        directQualifierLabel: "MSI 우승 직행",
        worldsSeedPendingNote: "Worlds 최종 시드는 공식 발표 대기",
        qualifiedTeamsShort: "팀 진출 확정",
        pendingSlotsShort: "개 미정 슬롯",
        noScheduleTitle: "공식 대진이 아직 공개되지 않았습니다",
        noSchedule: "LoL Esports가 아직 공식 대진을 공개하지 않았습니다. 공개되면 이 영역이 공식 경기 목록으로 자동 전환됩니다.",
        officialScheduleAction: "LoL Esports 공식 일정 열기",
        sourceNote: "진출 팀, 대회 형식과 단계는 LoL Esports 공식 대회 페이지를, 경기장과 방송 시작 시간은 Riot / LoL Esports 공식 공지를 기준으로 합니다. 페이지에는 확정된 지역 예선 순위만 표시하며 Worlds 최종 시드는 공식 발표를 따릅니다.",
        resultsLabel: "공식 일정",
        stageTitle: "대회 형식·단계·경기장",
        stageKicker: "Worlds 2026 대회 경로",
        scheduleSnapshotLabel: "공식 대진",
        scheduleTitle: "경기 일정과 결과",
        newsKicker: "Riot Games / LoL Esports",
        newsTitle: "Worlds 공식 업데이트",
        worldsHotTopicsTitle: "Worlds 화제의 주제",
        worldsHotTopicsDescription: "월즈 2026 대진과 팀 관련 화제를 여러 출처에서 추적합니다.",
        worldsNoTopics: "아직 확인된 월즈 2026 인기 화제가 없습니다",
        worldsBriefLabel: "Worlds 뉴스 속보",
        worldsUpdatesTitle: "대회 소식과 화제",
        worldsOfficialTag: "공식",
        worldsTopicTag: "화제",
        worldsNoTopics: "검증된 인기 화제가 없습니다",
        worldsNoNews: "관련 뉴스가 없습니다",
        worldsFormatDetail: "대회 방식 및 경기장",
        worldsBriefSource: "LoL Esports",
        rulesLabel: "공식 대회 규정",
        ticketsLabel: "현장 관람 / 티켓",
        stageLabels: { "play-in": "플레이-인", swiss: "스위스 스테이지", knockout: "녹아웃", final: "결승" },
        stageDescriptions: {
          "play-in": "4개 팀이 Bo5 더블 엘리미네이션으로 경쟁하며 1개 팀이 스위스 스테이지에 진출합니다.",
          swiss: "16개 팀이 최대 5라운드를 치르며 3승 시 진출, 3패 시 탈락합니다. 8개 팀이 녹아웃으로 진출합니다.",
          knockout: "8개 팀이 싱글 엘리미네이션으로 경쟁합니다. 8강은 11월 3–6일, 4강은 11월 7–8일입니다.",
          final: "11월 14일 뉴욕 브루클린에서 2026 세계 챔피언이 결정됩니다.",
        },
        stageBroadcastTimes: {
          "play-in": "11:00 PDT",
          swiss: "10/23–26 12:00 CDT · 10/28–30 15:00 CDT · 10/31 12:00 CDT",
          knockout: "16:00 CST",
          final: "14:00 EST",
        },
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

const parseSeriesBoundary = (date, endOfDay = false) => {
  const value = String(date || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return Number.NaN;
  return Date.parse(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
};

export const getEventSeriesPhase = (event, now = Date.now()) => {
  const current = Number(now);
  const start = parseSeriesBoundary(event?.seriesStartDate, false);
  const end = parseSeriesBoundary(event?.seriesEndDate, true);
  if (!Number.isFinite(current) || !Number.isFinite(start) || !Number.isFinite(end)) {
    return "unknown";
  }
  if (current < start) return "upcoming";
  if (current > end) return "completed";
  return "active";
};

const getEventSeriesDistance = (event, now = Date.now()) => {
  const current = Number(now);
  const start = parseSeriesBoundary(event?.seriesStartDate, false);
  const end = parseSeriesBoundary(event?.seriesEndDate, true);
  const phase = getEventSeriesPhase(event, current);
  if (phase === "active") return 0;
  if (phase === "upcoming" && Number.isFinite(start)) return Math.max(0, start - current);
  if (phase === "completed" && Number.isFinite(end)) return Math.max(0, current - end);
  return Number.POSITIVE_INFINITY;
};

export const getEventSeriesEvents = (seriesId, now = Date.now()) => {
  // Discovery priority: ongoing first, then temporal proximity, then curated series prominence.
  const normalizedSeriesId = String(seriesId || "").trim();
  if (!normalizedSeriesId) return [];
  const current = Number(now);
  return EVENT_REGISTRY.filter((item) => item.seriesId === normalizedSeriesId && !item.archived)
    .slice()
    .sort((left, right) => {
      const leftPhase = getEventSeriesPhase(left, current);
      const rightPhase = getEventSeriesPhase(right, current);
      const leftActiveRank = leftPhase === "active" ? 0 : leftPhase === "unknown" ? 2 : 1;
      const rightActiveRank = rightPhase === "active" ? 0 : rightPhase === "unknown" ? 2 : 1;
      if (leftActiveRank !== rightActiveRank) return leftActiveRank - rightActiveRank;

      const distanceDelta =
        getEventSeriesDistance(left, current) - getEventSeriesDistance(right, current);
      if (Number.isFinite(distanceDelta) && distanceDelta !== 0) return distanceDelta;

      const priorityDelta =
        Number(right.seriesPriority || 0) - Number(left.seriesPriority || 0);
      if (priorityDelta !== 0) return priorityDelta;

      const phaseOrder = { upcoming: 0, active: 0, completed: 1, unknown: 2 };
      const phaseDelta =
        Number(phaseOrder[leftPhase] ?? 9) - Number(phaseOrder[rightPhase] ?? 9);
      if (phaseDelta !== 0) return phaseDelta;

      return Number(left.seriesOrder || 999) - Number(right.seriesOrder || 999);
    });
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
