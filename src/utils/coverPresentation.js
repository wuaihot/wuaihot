export const COVER_PRESENTATION_MODES = Object.freeze({
  AUTO: "auto-fill",
  LEGACY_CONTAIN: "auto-contain",
  MIXED: "mixed",
  PORTRAIT: "portrait-uniform",
  SQUARE: "square-uniform",
  LANDSCAPE: "landscape-uniform",
});

const COVER_PRESENTATION_MODE_VALUES = new Set(
  Object.values(COVER_PRESENTATION_MODES),
);

export const classifyCoverPresentationRatio = (width, height) => {
  const sourceWidth = Number(width || 0);
  const sourceHeight = Number(height || 0);
  if (!sourceWidth || !sourceHeight) return null;
  const ratio = sourceWidth / sourceHeight;
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  if (ratio < 0.8) return COVER_PRESENTATION_MODES.PORTRAIT;
  if (ratio < 1.25) return COVER_PRESENTATION_MODES.SQUARE;
  return COVER_PRESENTATION_MODES.LANDSCAPE;
};

export const inferCoverPresentationMode = (
  samples = [],
  {
    minSamples = 3,
    dominanceThreshold = 0.75,
  } = {},
) => {
  const normalized = (Array.isArray(samples) ? samples : [])
    .map((sample) =>
      typeof sample === "string"
        ? sample
        : classifyCoverPresentationRatio(sample?.width, sample?.height),
    )
    .filter((mode) =>
      [
        COVER_PRESENTATION_MODES.PORTRAIT,
        COVER_PRESENTATION_MODES.SQUARE,
        COVER_PRESENTATION_MODES.LANDSCAPE,
      ].includes(mode),
    );

  if (normalized.length < Math.max(1, Number(minSamples) || 1)) {
    return COVER_PRESENTATION_MODES.AUTO;
  }

  const counts = normalized.reduce((result, mode) => {
    result[mode] = (result[mode] || 0) + 1;
    return result;
  }, {});
  const [dominantMode, dominantCount] = Object.entries(counts)
    .sort((left, right) => right[1] - left[1])[0] || [];

  if (
    !dominantMode ||
    dominantCount / normalized.length < Number(dominanceThreshold || 0)
  ) {
    return COVER_PRESENTATION_MODES.MIXED;
  }
  return dominantMode;
};

export const resolveCoverPresentationMode = (source, fallbackSource = null) => {
  const mode = String(
    source?.coverPresentationMode || fallbackSource?.coverPresentationMode || "",
  ).trim();
  return COVER_PRESENTATION_MODE_VALUES.has(mode)
    ? mode
    : COVER_PRESENTATION_MODES.AUTO;
};
