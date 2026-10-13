// Locale variants and fragment anchors of the same stage share one results page.
export const isSameResultsPage = (first, second) => {
  if (!first || !second) return false;
  try {
    const key = value => {
      const url = new URL(value);
      const path = url.pathname.replace(/^\/(?:[a-z]{2}-[A-Z]{2})\//, "/").replace(/\/$/, "");
      return url.origin + path + url.search;
    };
    return key(first) === key(second);
  } catch { return false; }
};
