import { computed } from "vue";
import { contextSearchLocation } from "@/utils/navigationSearch";

// One query owner lets header input, page resets and browser navigation stay in sync.
export const useContextSearch = (route, router) => computed({
  get: () => String(Array.isArray(route.query.q) ? route.query.q[0] || "" : route.query.q || "").trim(),
  set: (value) => { void router.replace(contextSearchLocation(route, value)); },
});
