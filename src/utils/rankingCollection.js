import { getHotListsWithFallback } from "@/api";

const resultCache = new Map();
const pendingRequests = new Map();

// Cards and reader share one bounded queue; loading a large directory cannot flood the provider.
const MAX_CONCURRENT_REQUESTS = 6;
let activeRequests = 0;
const requestQueue = [];
const scheduleRankingRequest = task => new Promise((resolve,reject) => {
  const run = () => {
    activeRequests += 1;
    Promise.resolve().then(task).then(resolve,reject).finally(() => {
      activeRequests -= 1;
      requestQueue.shift()?.();
    });
  };
  if (activeRequests < MAX_CONCURRENT_REQUESTS) run();
  else requestQueue.push(run);
});

const DEFAULT_TTL_MS = 5 * 60_000;
const DEFAULT_STALE_RETENTION_MS = 30 * 60_000;

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value)
    .filter((key) => key !== "translate_nonce")
    .sort()
    .reduce((output, key) => {
      output[key] = stableValue(value[key]);
      return output;
    }, {});
};

const buildCacheKey = (source, params = {}, options = {}) =>
  JSON.stringify({
    source,
    params: stableValue(params),
    useApi2: Boolean(options.useApi2),
    rankingLimit: Math.min(100, Math.max(1, Math.floor(Number(options.rankingLimit) || 20))),
  });

const isSuccessfulResponse = (response) =>
  response?.result?.code === 200 &&
  Array.isArray(response?.result?.data);

export const isRankingAdmissionFailure = (error) => {
  const status = Number(error?.status || error?.response?.status || error?.result?.code);
  return [403,404].includes(status) || /(?:(?:http|response)_(?:403|404)|variant_not_enabled|not.admitted)/i.test(String(error?.message || ''));
};

export const clearRankingCollection = (source = "") => {
  if (!source) {
    resultCache.clear();
    pendingRequests.clear();
    return;
  }
  const prefix = `{"source":"${source}"`;
  [...resultCache.keys()]
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => resultCache.delete(key));
  [...pendingRequests.keys()]
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => pendingRequests.delete(key));
};

const startRankingRequest = ({
  source,
  isNew,
  params,
  options,
  cacheKey,
  pendingKey,
}) => {
  const request = scheduleRankingRequest(() => getHotListsWithFallback(source, isNew, params, options))
    .then((response) => {
      if (isSuccessfulResponse(response) && !response.result.refreshFallback) {
        const cachedAt = Date.now();
        const ttlMs = Math.max(
          1_000,
          Number(options.collectionTtlMs) || DEFAULT_TTL_MS,
        );
        const staleRetentionMs = Math.max(
          ttlMs,
          Number(options.collectionStaleRetentionMs) ||
            DEFAULT_STALE_RETENTION_MS,
        );
        resultCache.set(cacheKey, {
          response,
          expiresAt: cachedAt + ttlMs,
          staleUntil: cachedAt + staleRetentionMs,
        });
      }
      if (!isSuccessfulResponse(response)) throw new Error(`ranking_response_${response?.result?.code || 'invalid'}`);
      return response;
    })
    .catch(error => {
      const cached = resultCache.get(cacheKey);
      const admissionFailure = isRankingAdmissionFailure(error);
      if (admissionFailure) resultCache.delete(cacheKey);
      if (!admissionFailure && cached && Date.now() < cached.expiresAt) {
        return {...cached.response,result:{...cached.response.result,refreshFallback:true}};
      }
      throw error;
    })
    .finally(() => {
      if (pendingRequests.get(pendingKey) === request) pendingRequests.delete(pendingKey);
    });

  pendingRequests.set(pendingKey, request);
  return request;
};

export const getSharedRanking = async (
  source,
  isNew = false,
  params = {},
  options = {},
) => {
  const cacheKey = buildCacheKey(source, params, options);
  const fresh = Boolean(isNew || options.forceNoCache);
  const now = Date.now();
  const cached = resultCache.get(cacheKey);

  if (!fresh && cached && cached.expiresAt > now) {
    return cached.response;
  }

  const pendingKey = `${cacheKey}::fresh=${fresh ? 1 : 0}`;
  if (
    !fresh &&
    cached &&
    (cached.staleUntil || cached.expiresAt) > now
  ) {
    if (!pendingRequests.has(pendingKey)) {
      void startRankingRequest({
        source,
        isNew: false,
        params,
        options,
        cacheKey,
        pendingKey,
      }).catch(() => {
        // Stale data is already visible; refresh failure is non-blocking.
      });
    }
    return cached.response;
  }

  const pending = pendingRequests.get(`${cacheKey}::fresh=1`) || pendingRequests.get(`${cacheKey}::fresh=0`);
  if (pending) return pending;

  return startRankingRequest({
    source,
    isNew,
    params,
    options,
    cacheKey,
    pendingKey,
  });
};

export const getRankingCollectionStats = () => {
  const now = Date.now();
  let fresh = 0;
  let stale = 0;
  for (const cached of resultCache.values()) {
    if (cached.expiresAt > now) fresh += 1;
    else if ((cached.staleUntil || cached.expiresAt) > now) stale += 1;
  }
  return {
    cached: resultCache.size,
    fresh,
    stale,
    pending: pendingRequests.size,
  };
};
