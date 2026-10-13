// A calendar date has no clock time or time zone; keep that precision in every view.
export function calendarPublicationDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value ? value : '';
}
export function formatCalendarPublicationDate(value, locale='zh-CN', options={year:'numeric',month:'2-digit',day:'2-digit'}) {
  const day = calendarPublicationDate(value);
  return day ? new Intl.DateTimeFormat(locale,{...options,timeZone:'UTC'}).format(new Date(day+'T00:00:00.000Z')) : '';
}
