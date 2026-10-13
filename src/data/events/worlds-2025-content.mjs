export const WORLDS_2025_PRIMER="https://lolesports.com/en-US/news/worlds-2025-primer";
export const WORLDS_2025_BILIBILI="https://www.bilibili.com/list/ml3656165318";
export const WORLDS_2025_FINAL_BILIBILI="https://www.bilibili.com/video/BV1oskQBLEA6/";
export const WORLDS_2025_CHAMPION_LOGO="https://game.gtimg.cn/images/lpl/act/a20250822s15/team-logo/t1_2.png";
// Colored team identity from the official LPL TeamList captured with this archive.
// The official year hub's def/hov assets are monochrome and must not replace these defaults.
export const WORLDS_2025_LOGOS={
  "IG": "https://img.crawler.qq.com/lolwebvideo/20230103152918/562affbb9f99b0e472644f93a19291e7/0",
  "FNC": "https://img.crawler.qq.com/lolwebvideo/20240920155645/fbec83b1d67134a4d40e53c9bc655e00/0",
  "HLE": "https://img.crawler.qq.com/lolwebvideo/20260616155358/f02db445598fb600c52482f71e5ec842/0",
  "KT": "https://img.crawler.qq.com/lolwebvideo/20230921143325/57ec5a9a5fbacf3d2bf132484e8426a6/0",
  "TES": "https://img.crawler.qq.com/lolwebvideo/20240920155538/5beb948638f00bcda68fc4942e3f0a51/0",
  "BLG": "https://img.crawler.qq.com/lolwebvideo/20250618144525/49342dadcecf162e8ac94fad6eb91540/0",
  "G2": "https://img.crawler.qq.com/lolwebvideo/20260616155410/e84fff0c6ffe4612378c54470bdd64ec/0",
  "GEN": "https://img.crawler.qq.com/lolwebvideo/20250618115826/f8c9046000eaa71e3f5743a9165067b8/0",
  "AL": "https://img.crawler.qq.com/lolwebvideo/20250618145633/b8741548f37b60a6693cdb6f4949a7fd/0",
  "100T": "https://img.crawler.qq.com/lolwebvideo/20220914142315/9defa9b7574726dc041c5c25e88ed0d7/0",
  "T1": "https://game.gtimg.cn/images/lpl/act/a20250822s15/team-logo/t1_2.png",
  "FLY": "https://img.crawler.qq.com/lolwebvideo/20250618120228/aeaad1a2f8aa54e3bddc69f5a2c7ae29/0",
  "PSG": "https://img.crawler.qq.com/lolwebvideo/20240918145707/b3a166af76b4dee448b8eca0309e783a/0",
  "CFO": "https://img.crawler.qq.com/lolwebvideo/20250618120200/14009fc922630e26db9294f16be9c156/0",
  "TSW": "https://img.crawler.qq.com/lolwebvideo/20260616155621/d5120c8e3bda96d0b6b70e22a47ec32b/0",
  "MKOI": "https://img.crawler.qq.com/lolwebvideo/20260714173644/dc9026dff0fa3d6ffb9715dd625f4010/0",
  "VKS": "https://img.crawler.qq.com/lolwebvideo/20260916191034/bb329e9c30ccc30297ba2e3cf21cae81/0"
};
// White official variant only for the black TSW identity on dark surfaces.
export const WORLDS_2025_DARK_LOGOS={TSW:"https://game.gtimg.cn/images/lpl/act/a20250822s15/team-logo/tsw-def.png"};
export const WORLDS_2025_PROFILES=[
["BLG","Bilibili Gaming","LPL"],["AL","Anyone’s Legend","LPL"],["TES","Top Esports","LPL"],["IG","Invictus Gaming","LPL"],
["GEN","Gen.G","LCK"],["HLE","Hanwha Life Esports","LCK"],["KT","KT Rolster","LCK"],["T1","T1","LCK"],
["G2","G2 Esports","LEC"],["MKOI","Movistar KOI","LEC"],["FNC","Fnatic","LEC"],
["FLY","FlyQuest","LTA"],["VKS","Vivo Keyd Stars","LTA"],["100T","100 Thieves","LTA"],
["CFO","CTBC Flying Oyster","LCP"],["TSW","Team Secret Whales","LCP"],["PSG","PSG Talon","LCP"]
].map(([name,fullName,region])=>({name,fullName,region,sourceUrl:WORLDS_2025_PRIMER}));
export const WORLDS_2025_NEWS=[
{date:"2025-11-04",title:"Worlds 2025 Final Opening Ceremony Trailer",zhTitle:"2025 全球总决赛决赛开幕式预告",twTitle:"2025 全球總決賽決賽開幕式預告",kind:"ceremony",source:"LoL Esports",url:"https://lolesports.com/en-US/news/worlds-2025-final-opening-ceremony-trailer"},
{date:"2025-09-30",title:"Worlds 2025 Primer",zhTitle:"2025 全球总决赛观赛指南",twTitle:"2025 全球總決賽觀賽指南",kind:"guide",source:"LoL Esports",url:WORLDS_2025_PRIMER},
{date:"2025-09-30",title:"Worlds 2025 Format Explainer",zhTitle:"2025 全球总决赛赛制说明",twTitle:"2025 全球總決賽賽制說明",kind:"format",source:"LoL Esports",url:"https://lolesports.com/en-US/news/worlds-2025-format-explainer"}
];
export const WORLDS_ARCHIVE_COPY={
"zh-CN":{results:"赛果",teams:"战队",news:"资讯",replay:"回放",collection:"回放合集",tencent:"LPL官网",bilibili:"B站",runner:"亚军",won:"战胜",teamIntro:"2025 参赛队伍",profileSource:"官方参赛资料",profileNote:"全称与赛区为2025官方资料；当届表现按官方赛果整理。队徽采用LPL官方公开队伍标识。",region:"赛区",record:"系列赛战绩",wins:"胜",losses:"负",matches:"查看赛程",newsIntro:"2025 官方资讯",newsNote:"历史精选 · 按发布日期排列",empty:"没有符合搜索条件的内容",champion:"冠军",topics:{ceremony:"开幕式",guide:"观赛指南",format:"赛制"}},
"zh-TW":{results:"賽果",teams:"戰隊",news:"資訊",replay:"回放",collection:"回放合集",tencent:"LPL官網",bilibili:"B站",runner:"亞軍",won:"戰勝",teamIntro:"2025 參賽隊伍",profileSource:"官方參賽資料",profileNote:"全稱與賽區為2025官方資料；當屆表現依官方賽果整理。隊徽採用LPL官方公開隊伍標識。",region:"賽區",record:"系列賽戰績",wins:"勝",losses:"負",matches:"查看賽程",newsIntro:"2025 官方資訊",newsNote:"歷史精選 · 依發布日期排列",empty:"沒有符合搜尋條件的內容",champion:"冠軍",topics:{ceremony:"開幕式",guide:"觀賽指南",format:"賽制"}},
en:{results:"Results",teams:"Teams",news:"News",replay:"Replay",collection:"Replay collection",tencent:"LPL",bilibili:"Bilibili",runner:"Runner-up",won:"defeated",teamIntro:"2025 participants",profileSource:"Official team guide",profileNote:"Names and regions use the 2025 official primer; performance uses official results. Logos use official LPL team identities.",region:"Region",record:"Series record",wins:"W",losses:"L",matches:"View matches",newsIntro:"2025 official news",newsNote:"Archive selections · By publication date",empty:"No content for this search",champion:"Champion",topics:{ceremony:"Ceremony",guide:"Viewer guide",format:"Format"}},
ja:{results:"結果",teams:"チーム",news:"ニュース",replay:"リプレイ",collection:"リプレイ一覧",tencent:"LPL",bilibili:"Bilibili",runner:"準優勝",won:"勝利",teamIntro:"2025出場チーム",profileSource:"公式チーム資料",profileNote:"名称と地域は2025公式資料、成績は公式結果です。ロゴはLPLの公式チーム資料です。",region:"地域",record:"シリーズ成績",wins:"勝",losses:"敗",matches:"試合を見る",newsIntro:"2025公式ニュース",newsNote:"過去の特集 · 公開日順",empty:"検索に一致する項目はありません",champion:"優勝",topics:{ceremony:"開幕式",guide:"観戦ガイド",format:"大会形式"}},
ko:{results:"결과",teams:"팀",news:"뉴스",replay:"다시보기",collection:"다시보기 모음",tencent:"LPL",bilibili:"Bilibili",runner:"준우승",won:"승리",teamIntro:"2025 참가 팀",profileSource:"공식 팀 자료",profileNote:"명칭과 지역은 2025 공식 자료, 성적은 공식 결과입니다. 로고는 LPL 공식 팀 자료입니다.",region:"지역",record:"시리즈 전적",wins:"승",losses:"패",matches:"경기 보기",newsIntro:"2025 공식 뉴스",newsNote:"지난 대회 특집 · 게시일 순",empty:"검색과 일치하는 콘텐츠가 없습니다",champion:"우승",topics:{ceremony:"개막식",guide:"관람 가이드",format:"대회 방식"}}
};

export const WORLDS_2025_HERO_COPY={
 "zh-CN":{host:"北京 · 上海 · 成都 · 中国",stages:"3 阶段",description:"回顾 2025 全球总决赛的完整赛程、参赛战队、官方资讯与全场回放。",guide:"官方观赛指南"},
 "zh-TW":{host:"北京 · 上海 · 成都 · 中國",stages:"3 階段",description:"回顧2025全球總決賽的完整賽程、參賽戰隊、官方資訊與全場回放。",guide:"官方觀賽指南"},
 en:{host:"Beijing · Shanghai · Chengdu · China",stages:"3 stages",description:"Explore the 2025 schedule, teams, official news and full-match replays.",guide:"Official viewer guide"},
 ja:{host:"北京 · 上海 · 成都 · 中国",stages:"3ステージ",description:"2025年の全試合、出場チーム、公式ニュースとリプレイを振り返る。",guide:"公式観戦ガイド"},
 ko:{host:"베이징 · 상하이 · 청두 · 중국",stages:"3단계",description:"2025 전체 일정, 참가 팀, 공식 소식과 경기 다시보기를 확인하세요.",guide:"공식 관람 가이드"}
};
