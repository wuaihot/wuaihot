// A checked translation is content, not a machine-translation cache entry.
export const reviewedTranslationFor = (item, locale) =>
  item?.extra?.editorial?.reviewState === 'original-checked'
    ? item.extra.editorial.locales?.[locale] || null
    : item?.extra?.aiAnalysis?.state==='evidence-grounded' ? item.extra.aiAnalysis.locales?.[locale]||null : null;

export function applyReviewedTranslation(item, locale) {
  // A verified multi-post event already has a locale-specific state summary;
  // reapplying the root post's translation would replace its current status.
  if(item?.extra?.socialPost?.eventGroup?.kind==='verified-day-reset')return item;
  const localized = reviewedTranslationFor(item, locale);
  if (!localized) return item;
  return {
    ...item,
    ...(localized.title ? { originalTitle: item.originalTitle || item.title, title: localized.title } : {}),
    ...(localized.desc ? { originalDesc: item.originalDesc || item.desc, desc: localized.desc } : {}),
  };
}
