import { inject } from "vue";
import { useRoute, useRouter } from "vue-router";
export const RANKING_READER_CONTEXT = Symbol("ranking-reader-context");
export const useRankingReaderContext = () => {
  const local = inject(RANKING_READER_CONTEXT, null);
  return local || { route: useRoute(), router: useRouter(), isQuickPreview: false };
};
