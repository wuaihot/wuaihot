import { reactive, shallowRef } from "vue";
const READER_ROUTES = new Set(["list", "list-locale", "list-legacy"]);
export const createRankingPreviewContext = (actualRouter, target) => {
  const initial = actualRouter.resolve(target);
  if (!READER_ROUTES.has(initial.name)) throw new Error("Preview requires a ranking route");
  const route = reactive({ ...initial });
  const currentRoute = shallowRef(route);
  const navigate = target => {
    const next = actualRouter.resolve(target);
    if (!READER_ROUTES.has(next.name)) return Promise.reject(new Error("Preview navigation must stay in the ranking reader"));
    Object.assign(route, next);
    return Promise.resolve();
  };
  return { route, isQuickPreview: true, router: { currentRoute, resolve: actualRouter.resolve, push: navigate, replace: navigate } };
};
