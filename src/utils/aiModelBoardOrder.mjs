// Pure presentation-order helpers. Never mutate API ranking payloads or source metrics.
export const DEFAULT_MODEL_BOARD_KEYS = Object.freeze(['livebench', 'aa', 'arena', 'consensus']);

export const normalizeModelBoardSelections = (input, available = DEFAULT_MODEL_BOARD_KEYS) => {
  const allowed = new Set(available);
  const chosen = [];
  const add = key => {
    if (typeof key === 'string' && allowed.has(key) && !chosen.includes(key) && chosen.length < 4) {
      chosen.push(key);
    }
  };
  if (Array.isArray(input)) input.forEach(add);
  DEFAULT_MODEL_BOARD_KEYS.forEach(add);
  available.forEach(add);
  return chosen;
};

export const reorderModelBoardSelections = (current, ordered) => {
  if (!Array.isArray(current) || current.length !== 4 || !Array.isArray(ordered) || ordered.length !== 4) return null;
  if (new Set(ordered).size !== 4 || ordered.some(key => !current.includes(key))) return null;
  return ordered.slice();
};

export const moveModelBoardSelection = (current, key, direction) => {
  if (!Array.isArray(current) || current.length !== 4) return null;
  const from = current.indexOf(key), to = from + direction;
  if (!Number.isInteger(direction) || Math.abs(direction) !== 1 || from < 0 || to < 0 || to >= 4) return null;
  const ordered = current.slice();
  [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
  return ordered;
};
