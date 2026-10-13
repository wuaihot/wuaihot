// Keep the original Tencent article identity: its docid query parameter is the document ID.
export const worldsOfficialUrlIdentity = (url) => {
  try {
    const parsed = new URL(String(url || ""));
    if (!['https:', 'http:'].includes(parsed.protocol)) return '';
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const path = parsed.pathname.toLowerCase().replace(/\/$/, '');
    if (host === 'lol.qq.com' && path === '/news/detail.shtml') {
      const docid = parsed.searchParams.get('docid') || '';
      if (!/^\d{12,24}$/.test(docid)) return '';
      return host + path + '?docid=' + docid;
    }
    return host + path;
  } catch { return ''; }
};

// Deliberately narrow editorial equivalence: pairing is not fuzzy-title similarity.
const guideTopic = (title) => {
  const normalized = String(title || '').replace(/\s+/g, '').replace(/英雄联盟/g, '');
  return /2026.*(?:全球总决赛|世界赛).*观赛指南/.test(normalized);
};

export const mergeWorldsOfficialStories = (rawItems, locale = 'en') => {
  const stories = new Map();
  const ids = new Set();
  for (const item of rawItems || []) {
    const identity = worldsOfficialUrlIdentity(item?.url);
    const title = String(item?.title || '').trim();
    if (!identity || !title) continue;
    // URL identity always wins for exact duplicates. Two translated guides with
    // independent official article IDs get a single cluster only in zh-CN.
    const topic = locale === 'zh-CN' && guideTopic(title) ? 'worlds-2026:guide' : identity;
    const isChineseOriginal = locale === 'zh-CN' && identity.startsWith('lol.qq.com/news/detail.shtml?docid=');
    const next = {...item, key:topic, kind:'official', localOfficial:isChineseOriginal};
    const previous = stories.get(topic);
    if (!previous) {
      stories.set(topic, next);
      ids.add(identity);
      continue;
    }
    // Prefer verified Chinese LPL editorial original in simplified Chinese.
    const preferNext = isChineseOriginal && !previous.localOfficial;
    const preferred = preferNext ? next : previous;
    const secondary = preferNext ? previous : next;
    const sameDocument = worldsOfficialUrlIdentity(secondary.url) === worldsOfficialUrlIdentity(preferred.url);
    const alternate = !sameDocument && !secondary.localOfficial
      ? secondary.url : preferred.alternateOfficialUrl || '';
    const precise = (date) => /T\d{2}:\d{2}/.test(String(date || ''));
    const publishedAt = sameDocument && precise(secondary.publishedAt) && !precise(preferred.publishedAt)
      ? secondary.publishedAt : preferred.publishedAt;
    stories.set(topic, {
      ...preferred,
      publishedAt,
      // Use translated global summary only when the Chinese original does not have one.
      summary: preferred.summary || secondary.summary || '',
      alternateOfficialUrl: alternate,
    });
    ids.add(identity);
  }
  return [...stories.values()];
};
