// Read-only presentation projections. Original ranking, scoring and full-detail API stay unchanged.
export const MODEL_BOARD_INITIAL_ROWS = 12;
export const MODEL_BOARD_PAGE_SIZE = 16;
export const MODEL_BOARD_MAX_PAGE_SIZE = 40;

export const parseModelBoardView = (query = {}) => {
  const view = String(query.view || 'full');
  if (!['full','summary','page'].includes(view)) return {error:'Unsupported model-board view'};
  if (view !== 'page') {
    if (query.offset !== undefined || query.limit !== undefined) return {error:'Paging parameters require page view'};
    return {view};
  }
  const rawOffset=String(query.offset ?? '0'),rawLimit=String(query.limit ?? MODEL_BOARD_PAGE_SIZE);
  if (!/^(0|[1-9]\d{0,5})$/.test(rawOffset)||Number(rawOffset)>100000 ||
      !/^[1-9]\d{0,2}$/.test(rawLimit)||Number(rawLimit)>MODEL_BOARD_MAX_PAGE_SIZE) {
    return {error:'Invalid model-board page window'};
  }
  return {view,offset:Number(rawOffset),limit:Number(rawLimit)};
};

export const summarizeModelBoards = payload => ({
  code:200,
  boards:(payload.boards || []).map(board=>({
    ...board,
    total:board.items?.length || 0,
    hasMore:(board.items?.length || 0)>MODEL_BOARD_INITIAL_ROWS,
    items:(board.items || []).slice(0,MODEL_BOARD_INITIAL_ROWS),
  })),
  consensus:(payload.consensus || []).slice(0,MODEL_BOARD_INITIAL_ROWS),
  consensusTotal:payload.consensus?.length || 0,
  checkedAt:payload.checkedAt,
  methodVersion:payload.methodVersion,
  composition:payload.composition,
});

export const modelBoardPage = (payload,{type,offset,limit}) => {
  const rows=type==='consensus'?payload.consensus:payload.boards?.find(board=>board.key===type)?.items;
  if (!Array.isArray(rows)) return null;
  const items=rows.slice(offset,offset+limit);
  return {code:200,type,offset,limit,total:rows.length,items,
    hasMore:offset+items.length<rows.length,checkedAt:payload.checkedAt};
};
