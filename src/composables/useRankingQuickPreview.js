import { inject, shallowRef, ref } from "vue";
export const RANKING_QUICK_PREVIEW = Symbol("ranking-quick-preview");
export const createRankingQuickPreview = () => {
  const show = ref(false);
  const target = shallowRef(null);
  const generation = ref(0);
  let trigger = null;
  const open = (location, element) => {
    trigger = element instanceof HTMLElement ? element : document.activeElement;
    target.value = location;
    generation.value++;
    show.value = true;
  };
  const close = () => { show.value = false; };
  const finishClose = () => {
    if (show.value) return;
    target.value = null;
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    trigger = null;
  };
  return { show, target, generation, open, close, finishClose };
};
export const useRankingQuickPreview = () => inject(RANKING_QUICK_PREVIEW, null);
