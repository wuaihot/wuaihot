// Shared client/server time semantics. Use .js for the serverless CommonJS transpilation boundary.
import {calendarPublicationDate} from './publicationDates.js';
export function aiTime(value, now = Date.now()) {
  if (value === null || value === undefined || typeof value === "boolean" || String(value).trim() === "") return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !calendarPublicationDate(value)) return null;
  const numeric = typeof value === "number" || /^\d{10,13}$/.test(String(value));
  const raw = numeric ? Number(value) : Date.parse(value);
  const time = numeric && raw < 1e11 ? raw * 1000 : raw;
  return Number.isFinite(time) && time >= Date.UTC(2000, 0, 1) && time <= now ? time : null;
}
export function aiPublicationDisplayTime(item, now=Date.now()) {
  const published=aiTimes(item,now).published;
  if (!published) return null;
  const value=[item?.publishedAt,item?.datePublished,item?.publishTime,item?.pubDate,item?.extra?.aiSignal?.publishedAt].find(value=>aiTime(value,now)!==null);
  return calendarPublicationDate(value) || published;
}
export function aiTimes(item, now = Date.now()) {
  const meta = item?.extra?.aiSignal || {};
  const kind = meta.timestampKind;
  const first = (...values) => values.map(value => aiTime(value, now)).find(value => value !== null) ?? null;
  return {
    published: first(item?.publishedAt, item?.datePublished, item?.publishTime, item?.pubDate,
      meta.publishedAt, kind === "published" ? item?.timestamp : null),
    observed: first(item?.observedAt, meta.observedAt, kind === "observed" ? item?.timestamp : null),
    fetched: first(item?.fetchedAt, meta.fetchedAt, kind === "fetched" ? item?.timestamp : null),
    updated: first(item?.updatedAt, meta.updatedAt, kind === "updated" ? item?.timestamp : null),
    sourceTime: !kind ? aiTime(item?.timestamp, now) : null,
  };
}
