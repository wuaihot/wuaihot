export const READING_WIDTH = Object.freeze({ min: 1080, max: 1600, step: 40, default: 1360 });
export function clampReadingWidth(value, fallback = READING_WIDTH.default) {
  const number = value == null || value === "" ? NaN : Number(value);
  return Math.min(READING_WIDTH.max, Math.max(READING_WIDTH.min, Number.isFinite(number) ? number : fallback));
}
export function resolveReadingWidth(preferences, scope) {
  const key = scope === "topic" ? "topicContainerWidth" : "rankingContainerWidth";
  // Inherit the old shared preference only until this scope is explicitly changed.
  return clampReadingWidth(preferences[key] ?? preferences.focusContainerWidth);
}
