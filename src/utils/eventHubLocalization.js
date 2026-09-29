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
  TPE: "中国台北",
  UAE: "阿联酋",
  UZB: "乌兹别克斯坦",
  VIE: "越南",
  YEM: "也门",
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
  RUNNING: "进行中",
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
    ["News", "新闻"],
    ["Sports", "体育"],
    ["Official", "已结束"],
    ["Cancelled", "已取消"],
    ["Canceled", "已取消"],
  ]);
  if (direct.has(text)) return direct.get(text);

  let match = text.match(/^Match\s+(\d+)$/i);
  if (match) return `第 ${match[1]} 场`;

  match = text.match(/^Round of (\d+)(?: Bout (\d+))?$/i);
  if (match) return `${match[1]} 强赛${match[2] ? `第 ${match[2]} 场` : ""}`;

  match = text.match(/^(Men's|Women's) Quarterfinal(?:s)?(?:\s+(\d+))?$/i);
  if (match) return `${match[1].toLowerCase().startsWith("men") ? "男子" : "女子"}四分之一决赛${match[2] ? `第 ${match[2]} 场` : ""}`;

  match = text.match(/^(Men's|Women's) Singles Second Round(?: Match (\d+))?$/i);
  if (match) return `${match[1].toLowerCase().startsWith("men") ? "男子" : "女子"}单打第二轮${match[2] ? `第 ${match[2]} 场` : ""}`;

  match = text.match(/^(.+?) Group ([A-Z])$/i);
  if (match) return `${match[1].replace(/Asian Games Version/gi, "亚运会版本")} ${match[2].toUpperCase()}组`;

  match = text.match(/^(.+?) Finals?$/i);
  if (match) return `${match[1].replace(/Asian Games Version/gi, "亚运会版本")} 决赛`;

  return text;
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

  return value;
};
