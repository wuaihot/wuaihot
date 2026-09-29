const MUSIC_ARTIST_SOURCE_KEYS = new Set([
  "qq-music",
  "netease-music",
  "kugou-music",
  "kuwo-music",
  "apple-music",
]);

export const isMusicArtistSource = (sourceName) =>
  MUSIC_ARTIST_SOURCE_KEYS.has(String(sourceName || "").trim());
