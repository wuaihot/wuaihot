import { aiPrimarySource } from './aiEvidence.mjs';

// Explicitly vetted one-to-one release references. This is an evidence link,
// never a reassignment of a community item's original source or publisher.
const REFERENCES = Object.freeze([{
  id: 'qwen-image-2.1-turbo',
  publisher: 'Qwen',
  officialUrl: 'https://huggingface.co/Qwen/Qwen-Image-2.1-Turbo',
  announcedOn: '2026-10-09',
  title: /\bqwen[-\s]?image[-\s]?2\.1[-\s]?turbo\b/iu,
}]);

export function aiOfficialReleaseReference(item) {
  const source = aiPrimarySource(item);
  if (!['reddit-localllama', 'reddit-artificial', 'hackernews-ai'].includes(source)) return null;
  const title = String(item?.originalTitle || item?.title || '');
  const matching = REFERENCES.find(reference => reference.title.test(title));
  if (!matching) return null;
  return {
    id: matching.id,
    publisher: matching.publisher,
    url: matching.officialUrl,
    announcedOn: matching.announcedOn,
    role: 'official-reference',
    // Original community attribution remains untouched.
  };
}
