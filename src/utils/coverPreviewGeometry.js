import {
  COVER_PRESENTATION_MODES,
  classifyCoverPresentationRatio,
} from "./coverPresentation.js";

const PREVIEW_TARGETS = {
  portrait: {
    detail: { maxWidth: 96, maxHeight: 128, previewWidth: 420 },
    mediaOnly: { maxWidth: 168, maxHeight: 224 },
  },
  square: {
    detail: { maxWidth: 112, maxHeight: 112, previewWidth: 430 },
    mediaOnly: { maxWidth: 200, maxHeight: 200 },
  },
  landscape: {
    detail: { maxWidth: 148, maxHeight: 96, previewWidth: 460 },
    mediaOnly: { maxWidth: 240, maxHeight: 144 },
  },
};

const PRESENTATION_MODE_TO_PREVIEW_KIND = {
  [COVER_PRESENTATION_MODES.PORTRAIT]: "portrait",
  [COVER_PRESENTATION_MODES.SQUARE]: "square",
  [COVER_PRESENTATION_MODES.LANDSCAPE]: "landscape",
};

export const classifyCoverPreviewRatio = (width, height) =>
  PRESENTATION_MODE_TO_PREVIEW_KIND[
    classifyCoverPresentationRatio(width, height)
  ] || "square";
export const fitCoverPreviewSize = (width, height, maxWidth, maxHeight) => {
  const sourceWidth = Number(width || 0);
  const sourceHeight = Number(height || 0);
  if (!sourceWidth || !sourceHeight || !maxWidth || !maxHeight) {
    return { width: 0, height: 0 };
  }
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  };
};

export const resolveCoverPreviewLayout = (width, height) => {
  const naturalWidth = Number(width || 0);
  const naturalHeight = Number(height || 0);
  if (!naturalWidth || !naturalHeight) return null;
  const kind = classifyCoverPreviewRatio(naturalWidth, naturalHeight);
  const preset = PREVIEW_TARGETS[kind];
  return {
    kind,
    naturalWidth,
    naturalHeight,
    ratio: naturalWidth / naturalHeight,
    detail: {
      ...fitCoverPreviewSize(
        naturalWidth,
        naturalHeight,
        preset.detail.maxWidth,
        preset.detail.maxHeight,
      ),
      previewWidth: preset.detail.previewWidth,
    },
    mediaOnly: fitCoverPreviewSize(
      naturalWidth,
      naturalHeight,
      preset.mediaOnly.maxWidth,
      preset.mediaOnly.maxHeight,
    ),
  };
};
