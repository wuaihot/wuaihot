// Retain retryable verified discoveries even after they leave a bounded profile window.
// Never bypass the per-post evidence validator; this only selects work for it.
export const selectSocialAnalysisQueue = (
  discovered,
  records,
  {now = Date.now(), limit = 24, reserved = 8, eligibleSources = new Set(), contentHash} = {},
) => {
  const fresh = [];
  const seen = new Set();
  for (const item of discovered) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    fresh.push(item);
  }

  const retained = Object.entries(records || {})
    .filter(([id, row]) => {
      const item = row?.item;
      const publishedAt = Date.parse(item?.publishedAt || '');
      const source = item?.extra?.aiSignal?.primarySource;
      return id === item?.id
        && row.analysis == null
        && !row.withdrawnAt
        && item?.extra?.socialPost?.originalState !== 'absent'
        && !seen.has(id)
        && eligibleSources.has(source)
        && typeof item?.extra?.socialPost?.sourceAccount === 'string'
        && typeof item.originalDesc === 'string'
        && item.originalDesc.length >= 6
        && typeof row.hash === 'string'
        && typeof contentHash === 'function'
        && row.hash === contentHash(item)
        && Number.isFinite(publishedAt)
        && publishedAt <= now
        && now - publishedAt <= 7 * 86400000
        && Number(row.nextAnalyzeAt || 0) <= now;
    })
    .map(([, row]) => row.item)
    .sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt));

  const quota = Math.min(Math.max(0, reserved), Math.max(0, limit), retained.length);
  const freshFirst = fresh.slice(0, Math.max(0, limit - quota));
  return [
    ...freshFirst,
    ...retained.slice(0, quota),
    ...fresh.slice(freshFirst.length),
    ...retained.slice(quota),
  ].slice(0, Math.max(0, limit));
};
