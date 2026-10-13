import { aiCanonicalUrl } from "./aiContent.js";
import { aiTimes } from "./aiEvidence.mjs";

// Only the exact primary article URL receives a first-party feed date.
export function applyAiPublication(item, index) {
  if (aiTimes(item).published) return item;
  const publication = index.get(aiCanonicalUrl(item?.url));
  if (!publication) return item;
  return { ...item, publishedAt: publication.publishedAt, extra: { ...item.extra,
    publicationEvidence: { url: publication.feedUrl, publishedAt: publication.publishedAt } } };
}
