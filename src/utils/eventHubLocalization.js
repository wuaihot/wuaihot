import { normalizeLocale } from "@/utils/locale";

const AICHI_EVENT_ID = "aichi-nagoya-2026";

const AICHI_DISCIPLINES_ZH_CN = {
  ARC: "射箭",
  ATH: "田径",
  BBL: "棒球",
  BDM: "羽毛球",
  BK3: "三人篮球",
  BKB: "篮球",
  BKG: "霹雳舞",
  BMF: "自由式小轮车",
  BMX: "小轮车竞速",
  BOX: "拳击",
  CKT: "板球",
  CLB: "攀岩",
  CRD: "公路自行车",
  CSL: "激流回旋",
  CSP: "静水皮划艇",
  CTR: "场地自行车",
  DIV: "跳水",
  ELS: "电子竞技",
  EQU: "马术",
  FBL: "足球",
  FEN: "击剑",
  GAR: "竞技体操",
  GLF: "高尔夫",
  GRY: "艺术体操",
  GTR: "蹦床",
  HBL: "手球",
  HOC: "曲棍球",
  JJI: "柔术",
  JUD: "柔道",
  KAB: "卡巴迪",
  KTE: "空手道",
  KUR: "克柔术",
  MMA: "综合格斗",
  MPN: "现代五项",
  MTB: "山地自行车",
  PDL: "板式网球",
  ROW: "赛艇",
  RU7: "七人制橄榄球",
  SAL: "帆船",
  SBL: "垒球",
  SHO: "射击",
  SKB: "滑板",
  SPK: "藤球",
  SQU: "壁球",
  SRF: "冲浪",
  SWA: "花样游泳",
  SWM: "游泳",
  TEN: "网球",
  TEQ: "台克球",
  TKW: "跆拳道",
  TRI: "铁人三项",
  TST: "软式网球",
  TTE: "乒乓球",
  VBV: "沙滩排球",
  VVO: "排球",
  WLF: "举重",
  WPO: "水球",
  WRE: "摔跤",
  WSU: "武术",
};

const AICHI_NOC_ZH_CN = {
  AFG: "阿富汗",
  BAN: "孟加拉国",
  BHU: "不丹",
  BRN: "巴林",
  BRU: "文莱",
  CAM: "柬埔寨",
  CHN: "中国",
  HKG: "中国香港",
  INA: "印度尼西亚",
  IND: "印度",
  IRI: "伊朗",
  IRQ: "伊拉克",
  JOR: "约旦",
  JPN: "日本",
  KAZ: "哈萨克斯坦",
  KGZ: "吉尔吉斯斯坦",
  KOR: "韩国",
  KSA: "沙特阿拉伯",
  KUW: "科威特",
  LAO: "老挝",
  LBN: "黎巴嫩",
  MAC: "中国澳门",
  MAS: "马来西亚",
  MDV: "马尔代夫",
  MGL: "蒙古",
  MYA: "缅甸",
  NEP: "尼泊尔",
  OMA: "阿曼",
  PAK: "巴基斯坦",
  PHI: "菲律宾",
  PLE: "巴勒斯坦",
  PRK: "朝鲜",
  QAT: "卡塔尔",
  SGP: "新加坡",
  SRI: "斯里兰卡",
  SYR: "叙利亚",
  THA: "泰国",
  TJK: "塔吉克斯坦",
  TKM: "土库曼斯坦",
  TLS: "东帝汶",
  TPE: "中华台北",
  UAE: "阿联酋",
  UZB: "乌兹别克斯坦",
  VIE: "越南",
  YEM: "也门",
};

const AICHI_NOC_ENGLISH_ALIASES = {
  AFG: ["afghanistan"],
  BAN: ["bangladesh"],
  BHU: ["bhutan"],
  BRN: ["bahrain"],
  BRU: ["brunei", "brunei darussalam"],
  CAM: ["cambodia"],
  CHN: ["china", "people's republic of china"],
  HKG: ["hong kong", "hong kong, china", "hong kong china"],
  INA: ["indonesia"],
  IND: ["india"],
  IRI: ["iran", "islamic republic of iran"],
  IRQ: ["iraq"],
  JOR: ["jordan"],
  JPN: ["japan"],
  KAZ: ["kazakhstan"],
  KGZ: ["kyrgyzstan"],
  KOR: ["korea", "republic of korea"],
  KSA: ["saudi arabia"],
  KUW: ["kuwait"],
  LAO: ["laos", "lao people's democratic republic"],
  LBN: ["lebanon"],
  MAC: ["macao, china", "macau, china", "macao china", "macau china"],
  MAS: ["malaysia"],
  MDV: ["maldives"],
  MGL: ["mongolia"],
  MYA: ["myanmar"],
  NEP: ["nepal"],
  OMA: ["oman"],
  PAK: ["pakistan"],
  PHI: ["philippines"],
  PLE: ["palestine"],
  PRK: ["north korea", "dpr korea", "democratic people's republic of korea"],
  QAT: ["qatar"],
  SGP: ["singapore"],
  SRI: ["sri lanka"],
  SYR: ["syria", "syrian arab republic"],
  THA: ["thailand"],
  TJK: ["tajikistan"],
  TKM: ["turkmenistan"],
  TLS: ["timor-leste"],
  TPE: ["chinese taipei"],
  UAE: ["united arab emirates"],
  UZB: ["uzbekistan"],
  VIE: ["vietnam", "viet nam"],
  YEM: ["yemen"],
};

const AICHI_STATUS_ZH_CN = {
  OFFICIAL: "已结束",
  UNOFFICIAL: "已结束",
  CANCELLED: "已取消",
  CANCELED: "已取消",
  SCHEDULED: "待进行",
  START_LIST: "待开赛",
  RESCHEDULED: "已改期",
  GETTING_READY: "准备中",
  DELAYED: "延迟",
  INTERRUPTED: "已中断",
  RUNNING: "进行中",
};

const AICHI_VENUES_ZH_CN = new Map([
  ["岡崎中央総合公園多目的広場", "冈崎中央综合公园多功能广场"],
  ["愛知県武道館", "爱知县武道馆"],
  ["愛知国際アリーナ", "爱知国际竞技场"],
  ["名古屋市東山公園テニスセンター", "名古屋市东山公园网球中心"],
  ["名古屋市稲永スポーツセンター", "名古屋市稻永体育中心"],
  ["海陽ヨットハーバー", "海阳游艇港"],
  ["伊豆ベロドローム", "伊豆自行车馆"],
  ["西尾市総合体育館", "西尾市综合体育馆"],
  ["田原市赤羽根町大石海岸[太平洋ロングビーチ]", "田原市赤羽根町大石海岸（太平洋长滩）"],
  ["名古屋金城ふ頭アリーナ", "名古屋金城码头竞技场"],
  ["名古屋市瑞穂公園陸上競技場", "名古屋市瑞穗公园田径场"],
  ["一宮市総合体育館", "一宫市综合体育馆"],
  ["名古屋市東スポーツセンター", "名古屋市东体育中心"],
  ["碧南緑地ビーチコート", "碧南绿地沙滩球场"],
  ["愛知県総合射撃場", "爱知县综合射击场"],
  ["安城市総合運動公園ソフトボール場", "安城市综合运动公园垒球场"],
  ["小牧市スポーツ公園総合体育館", "小牧市体育公园综合体育馆"],
  ["岡崎中央総合公園総合体育館", "冈崎中央综合公园综合体育馆"],
  ["名古屋市中小企業振興会館", "名古屋市中小企业振兴会馆"],
  ["東京アクアティクスセンター", "东京水上运动中心"],
  ["矢作川カヌースラロームコース", "矢作川皮划艇激流回旋赛道"],
  ["名古屋市総合体育館［レインボープール］", "名古屋市综合体育馆［彩虹泳池］"],
  ["名古屋市瑞穂公園ラグビー場", "名古屋市瑞穗公园橄榄球场"],
  ["名古屋競輪場　BMXレースコース", "名古屋赛车场 BMX 竞速赛道"],
  ["春日井カントリークラブ 東コース", "春日井乡村俱乐部东球场"],
  ["愛知県口論義運動公園", "爱知县口论义运动公园"],
  ["豊橋市総合体育館", "丰桥市综合体育馆"],
  ["岐阜県グリーンスタジアム", "岐阜县绿色体育场"],
]);

const normalizeAichiScheduleText = (input) => {
  const text = String(input || "").trim();
  if (!text) return text;
  if (AICHI_VENUES_ZH_CN.has(text)) return AICHI_VENUES_ZH_CN.get(text);

  let value = text
    .replace(/Identity V\s*第五人格\s*-\s*Asian Games Version/gi, "第五人格（亚运会版本）")
    .replace(/PUBG MOBILE\s*-\s*Asian Games Version/gi, "PUBG MOBILE（亚运会版本）")
    .replace(/Asian Games Version/gi, "亚运会版本")
    .replace(/リーグ・オブ・レジェンド/g, "英雄联盟")
    .replace(/グレコローマンスタイル/g, "古典式")
    .replace(/クラブとリボン/g, "棒和带")
    .replace(/フープとボール/g, "圈和球")
    .replace(/ボルダー/g, "攀石")
    .replace(/リード/g, "难度攀岩")
    .replace(/スピード/g, "速度攀岩")
    .replace(/3位決定戦/g, "铜牌赛")
    .replace(/オムニアム/g, "全能赛")
    .replace(/ポイントレース/g, "记分赛")
    .replace(/オープニングシリーズ/g, "开幕系列赛")
    .replace(/予選シリーズ/g, "预赛系列赛")
    .replace(/決勝トーナメント/g, "淘汰赛")
    .replace(/ストロークプレー/g, "比杆赛")
    .replace(/コンパウンド/g, "复合弓")
    .replace(/リカーブ/g, "反曲弓")
    .replace(/シングルス/g, "单打")
    .replace(/ダブルス/g, "双打")
    .replace(/ダブル/g, "双打")
    .replace(/ショートボード/g, "短板")
    .replace(/スプリント/g, "争先赛")
    .replace(/ミックス/g, "混合")
    .replace(/クワッド/g, "四人赛")
    .replace(/プムセ/g, "品势")
    .replace(/エペ/g, "重剑")
    .replace(/準々決勝/g, "四分之一决赛")
    .replace(/準決勝/g, "半决赛")
    .replace(/敗者復活戦/g, "复活赛")
    .replace(/順位決定戦（(\d+)位[～〜-](\d+)位）/g, "$1至$2名排位赛")
    .replace(/順位決定戦\s*(\d+)位[～〜-](\d+)位/g, "$1至$2名排位赛")
    .replace(/レスリング/g, "摔跤")
    .replace(/予選/g, "预赛")
    .replace(/団体/g, "团体")
    .replace(/個人/g, "个人")
    .replace(/プール\s*([A-Z])/gi, "$1组")
    .replace(/グループ\s*([A-Z])/gi, "$1组")
    .replace(/マッチ\s*(\d+)/g, "第$1场")
    .replace(/第?(\d+)ラウンド/g, "第$1轮")
    .replace(/ラウンド/g, "轮")
    .replace(/第?(\d+)回戦/g, "第$1轮")
    .replace(/第(\d+)試合/g, "第$1场")
    .replace(/試合/g, "比赛")
    .replace(/第(\d+)ヒート/g, "第$1组")
    .replace(/ヒート\s*(\d+)/g, "第$1组")
    .replace(/\bHeat\s*(\d+)\b/gi, "第$1组")
    .replace(/レース\s*(\d+)/g, "第$1场")
    .replace(/ファイナル/g, "决赛")
    .replace(/ステージ/g, "阶段")
    .replace(/決勝/g, "决赛")
    .replace(/級/g, "级");

  value = value
    .replace(/\bCompound\b/gi, "复合弓")
    .replace(/\bRecurve\b/gi, "反曲弓")
    .replace(/\bWomen's\b/gi, "女子")
    .replace(/\bMen's\b/gi, "男子")
    .replace(/\bWomen\b/gi, "女子")
    .replace(/\bMen\b/gi, "男子")
    .replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, "$1公斤")
    .replace(/\bkg\b/gi, "公斤")
    .replace(/\bMixed\b/gi, "混合")
    .replace(/\bSingles\b/gi, "单打")
    .replace(/\bDoubles\b/gi, "双打")
    .replace(/\bPairs\b/gi, "双人")
    .replace(/\bTeam\b/gi, "团体")
    .replace(/\bIndividual\b/gi, "个人")
    .replace(/\bShortboard\b/gi, "短板")
    .replace(/\bGreco-Roman\b/gi, "古典式")
    .replace(/\bÉpée\b/gi, "重剑")
    .replace(/\bSprint\b/gi, "争先赛")
    .replace(/\bPreliminary Round\b/gi, "预赛")
    .replace(/\bPreliminary\b/gi, "预赛")
    .replace(/\bPool\s+([A-Z])\b/gi, "$1组")
    .replace(/\bGroup\s+([A-Z])\b/gi, "$1组")
    .replace(/\bElimination Round of\s+(\d+)\b/gi, "$1强淘汰赛")
    .replace(/\bRound of\s+(\d+)\b/gi, "$1强赛")
    .replace(/\bQuarterfinals?\b/gi, "四分之一决赛")
    .replace(/\bSemifinals?\b/gi, "半决赛")
    .replace(/\bContest for Bronze Medal(?:\s+([AB]))?\b/gi, (_, group) =>
      group ? `铜牌赛 ${group}` : "铜牌赛",
    )
    .replace(/\bContest for Gold Medal\b/gi, "金牌赛")
    .replace(/\bBronze Medal Match\b/gi, "铜牌赛")
    .replace(/\bGold Medal Match\b/gi, "金牌赛")
    .replace(/\bFinals?\b/gi, "决赛")
    .replace(/\bFirst Round\b/gi, "第一轮")
    .replace(/\bSecond Round\b/gi, "第二轮")
    .replace(/\bThird Round\b/gi, "第三轮")
    .replace(/\bRound\s+(\d+)\b/gi, "第$1轮")
    .replace(/\bMatch\s+(\d+)\b/gi, "第$1场")
    .replace(/\bBout\s+(\d+)\b/gi, "第$1场")
    .replace(/\bTable of\s+(\d+)\b/gi, "$1强赛")
    .replace(/^1\/4\s+Final$/i, "四分之一决赛")
    .replace(/^1\/8\s+Final$/i, "八分之一决赛")
    .replace(/比赛\s*(\d+)/g, "第$1场")
    .replace(/(四分之一决赛|半决赛|决赛)\s*比赛(?=$|[ ·])/g, "$1")
    .replace(/四分之一决赛轮/g, "四分之一决赛")
    .replace(/半决赛轮/g, "半决赛")
    .replace(/决赛轮/g, "决赛")
    .replace(/预赛轮/g, "预赛")
    .replace(/([男女]子)\s+([A-Z]组)/g, "$1$2")
    .replace(/([男女]子)\s+(?=-?\d)/g, "$1")
    .replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, "$1")
    .replace(/([赛轮组])-(?=第\d)/g, "$1 · ")
    .replace(/\s+-\s+/g, " · ")
    .replace(/\s+/g, " ")
    .trim();

  return value;
};

export const shouldTranslateEventFreeText = (eventId, locale) =>
  eventId === AICHI_EVENT_ID && normalizeLocale(locale) === "zh-CN";

export const localizeEventDiscipline = (
  eventId,
  disciplineCode,
  fallback,
  locale,
) => {
  if (!shouldTranslateEventFreeText(eventId, locale)) return fallback || disciplineCode || "";
  return AICHI_DISCIPLINES_ZH_CN[String(disciplineCode || "").toUpperCase()] || fallback || disciplineCode || "";
};

export const localizeEventNoc = (eventId, noc, fallback, locale) => {
  if (!shouldTranslateEventFreeText(eventId, locale)) return fallback || noc || "";
  return AICHI_NOC_ZH_CN[String(noc || "").toUpperCase()] || fallback || noc || "";
};

export const isEventNocAlias = (eventId, noc, value, locale) => {
  if (!shouldTranslateEventFreeText(eventId, locale)) return false;
  const aliases = AICHI_NOC_ENGLISH_ALIASES[String(noc || "").toUpperCase()] || [];
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(normalized && aliases.includes(normalized));
};

export const localizeEventStatus = (eventId, status, fallback, locale) => {
  if (!shouldTranslateEventFreeText(eventId, locale)) return fallback || status || "";
  return AICHI_STATUS_ZH_CN[String(status || "").toUpperCase()] || fallback || status || "";
};

export const localizeKnownScheduleText = (eventId, value, locale) => {
  const text = String(value || "").trim();
  if (!text || !shouldTranslateEventFreeText(eventId, locale)) return text;

  const direct = new Map([
    ["Gold Medal Match", "金牌赛"],
    ["Men's", "男子"],
    ["Women's", "女子"],
    ["Men", "男子"],
    ["Women", "女子"],
    ["Women's Double", "女子双人赛"],
    ["Women's Double Final", "女子双人赛决赛"],
    ["Men's Singles", "男子单打"],
    ["Women's Singles", "女子单打"],
    ["Men's Quadrant", "男子四人赛"],
    ["Women's Quadrant", "女子四人赛"],
    ["Compound Women's Team", "女子复合弓团体"],
    ["25m Rapid Fire Pistol Men Individual", "男子25米手枪速射个人"],
    ["25m Rapid Fire Pistol Men Team", "男子25米手枪速射团体"],
    ["News", "新闻"],
    ["Sports", "体育"],
    ["Official", "已结束"],
    ["Cancelled", "已取消"],
    ["Canceled", "已取消"],
  ]);
  if (direct.has(text)) return direct.get(text);

  let match = text.match(/^Match\s+(\d+)$/i);
  if (match) return `第 ${match[1]} 场`;

  match = text.match(/^Round (\d+)$/i);
  if (match) return `第 ${match[1]} 轮`;

  match = text.match(/^Round of (\d+)(?: Bout (\d+))?$/i);
  if (match) return `${match[1]} 强赛${match[2] ? `第 ${match[2]} 场` : ""}`;

  match = text.match(/^Preliminary(?: Group)?\s+([A-Z])(?:组)?$/i);
  if (match) return `预赛 ${match[1].toUpperCase()} 组`;

  match = text.match(
    /^(Men's|Women's) Quadrant Preliminary(?: Group)?\s+([A-Z])(?:组)?$/i,
  );
  if (match) {
    const gender = match[1].toLowerCase().startsWith("men") ? "男子" : "女子";
    return `${gender}四人赛预赛 ${match[2].toUpperCase()} 组`;
  }

  match = text.match(/^(Men's|Women's) Quarterfinal(?:s)?(?:\s+(\d+))?$/i);
  if (match) return `${match[1].toLowerCase().startsWith("men") ? "男子" : "女子"}四分之一决赛${match[2] ? `第 ${match[2]} 场` : ""}`;

  match = text.match(/^(Men's|Women's) Singles Second Round(?: Match (\d+))?$/i);
  if (match) return `${match[1].toLowerCase().startsWith("men") ? "男子" : "女子"}单打第二轮${match[2] ? `第 ${match[2]} 场` : ""}`;

  const localizePrefix = (value) =>
    direct.get(value) ||
    normalizeAichiScheduleText(value) ||
    value.replace(/Asian Games Version/gi, "亚运会版本");

  match = text.match(/^(.+?) Group ([A-Z])$/i);
  if (match) return `${localizePrefix(match[1])} ${match[2].toUpperCase()}组`;

  match = text.match(/^(.+?) Quarter-finals?$/i);
  if (match) return `${localizePrefix(match[1])} 四分之一决赛`;

  match = text.match(/^(.+?) Semifinals?$/i);
  if (match) return `${localizePrefix(match[1])} 半决赛`;

  match = text.match(
    /^(Men's|Women's)\s+(.+?)\s+Contest for (Bronze|Gold) Medal(?:\s+([A-Z]))?$/i,
  );
  if (match) {
    const gender = match[1].toLowerCase().startsWith("men") ? "男子" : "女子";
    const medal = match[3].toLowerCase() === "gold" ? "金牌赛" : "铜牌赛";
    return `${gender} ${match[2]} ${medal}${match[4] ? ` ${match[4].toUpperCase()}` : ""}`;
  }

  match = text.match(/^(.+?) Bronze Medal Match$/i);
  if (match) return `${localizePrefix(match[1])} 铜牌赛`;

  match = text.match(/^(.+?) Gold Medal Match$/i);
  if (match) return `${localizePrefix(match[1])} 金牌赛`;

  match = text.match(/^(.+?) Finals?$/i);
  if (match) return `${localizePrefix(match[1])} 决赛`;

  match = text.match(/^(.+?) Qualification$/i);
  if (match) return `${localizePrefix(match[1])} 资格赛`;

  const normalized = normalizeAichiScheduleText(text);
  return normalized || text;
};

export const normalizeEventTranslatedText = (
  eventId,
  source,
  translated,
  locale,
) => {
  const raw = String(source || "").trim();
  let value = String(translated || "").trim();
  if (!value || !shouldTranslateEventFreeText(eventId, locale)) return value;

  if (/Asian Games|Aichi[-· ]Nagoya/i.test(raw)) {
    value = value
      .replace(/2026\s*年?爱知[·・\-]?名古屋奥运会/g, "2026 爱知·名古屋亚运会")
      .replace(/爱知[·・\-]?名古屋奥运会/g, "爱知·名古屋亚运会")
      .replace(/亚洲奥运会/g, "亚运会")
      .replace(/奥运会/g, "亚运会");
  }

  if (eventId === "aichi-nagoya-2026" && locale === "zh-CN") {
    value = normalizeAichiScheduleText(value);
  }

  return value;
};
