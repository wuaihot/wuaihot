// A single observer limits full card trees to the viewport neighbourhood.
// Once entered, cards keep their instance, data and internal scroll position.
const pending = new Map();
let observer = null;
export const observeCatalogCard = (element, enter) => {
  if (typeof IntersectionObserver === "undefined") { enter(); return () => {}; }
  if (!observer) observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const callback = pending.get(entry.target);
      pending.delete(entry.target);
      observer?.unobserve(entry.target);
      callback?.();
    }
    if (!pending.size) { observer?.disconnect(); observer = null; }
  }, { rootMargin: "700px 0px" });
  pending.set(element, enter);
  observer.observe(element);
  return () => {
    pending.delete(element);
    observer?.unobserve(element);
    if (!pending.size) { observer?.disconnect(); observer = null; }
  };
};
