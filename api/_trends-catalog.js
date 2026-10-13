const value = v => String(Array.isArray(v) ? v[0] || "" : v || "");
const base = v => value(v).replace(/\/$/, "");
const getCatalogEndpoint = (surface, env) => {
  const directory = base(env.VITE_TRENDS_DIRECTORY_API || env.TRENDS_DIRECTORY_API);
  const publicApi = base(env.VITE_TRENDS_PUBLIC_API || env.TRENDS_PUBLIC_API);
  const display = base(env.VITE_TRENDS_DISPLAY_API || env.TRENDS_DISPLAY_API ||
    (publicApi.endsWith("/public/v1") ? publicApi.replace(/\/public\/v1$/, "/display/v1") : directory ? directory + "/display/v1" : ""));
  return {
    directory: directory ? directory + "/catalog.json" : "",
    public: publicApi ? publicApi + "/catalog" : "",
    display: display ? display + "/catalog" : "",
    status: display ? display + "/status" : "",
  }[surface] || "";
};
const handleTrendsCatalogProxy = async ({req,res,pathValue,fetchImpl=fetch,env=process.env}) => {
  if (pathValue !== "trends-catalog") return false;
  const fail = (status, message) => {
    res.setHeader("cache-control", "no-store");
    res.status(status).json({code:status,message});
    return true;
  };
  if (!["GET","HEAD"].includes(req.method)) {
    res.setHeader("allow","GET, HEAD"); return fail(405,"Method not allowed");
  }
  const surface = value(req.query.surface);
  if (!["directory","public","display","status"].includes(surface)) return fail(400,"Unknown catalog surface");
  const endpoint = getCatalogEndpoint(surface,env);
  if (!endpoint) return fail(503,"Catalog is not configured");
  try {
    const url = new URL(endpoint);
    if (!["https:","http:"].includes(url.protocol)) return fail(503,"Catalog is not configured");
    const force = value(req.query.force) === "1" || surface === "status";
    url.searchParams.set(surface === "status" ? "_status" : "_catalog", String(force ? Date.now() : Math.floor(Date.now()/300000)));
    const upstream = await fetchImpl(url,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(3500),cache:force?"no-store":"default"});
    if (!upstream.ok) return fail(502,"Catalog read unavailable");
    const payload = await upstream.json();
    if (!payload || (surface !== "status" && !Array.isArray(payload.sources))) return fail(502,"Invalid catalog response");
    res.setHeader("cache-control", force ? "no-store" : "public, max-age=30, stale-while-revalidate=60");
    res.setHeader("vercel-cdn-cache-control", force ? "no-store" : "public, max-age=60, stale-while-revalidate=120");
    res.status(200).json(payload); return true;
  } catch { return fail(502,"Catalog read unavailable"); }
};
const catalogCache = new Map();
const catalogRequests = new Map();
const readSurfaceCatalog = async (endpoint, fetchImpl, force = false) => {
  const cached = catalogCache.get(endpoint);
  if (!force && cached && Date.now() - cached.at < 300000) return cached.data;
  if (catalogRequests.has(endpoint)) return catalogRequests.get(endpoint);
  const request = (async () => {
    const response = await fetchImpl(endpoint,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(3500)});
    if (!response.ok) throw new Error("catalog_read_failed");
    const data = await response.json();
    if (!Array.isArray(data?.sources)) throw new Error("catalog_invalid");
    catalogCache.set(endpoint,{at:Date.now(),data});return data;
  })();
  catalogRequests.set(endpoint,request);
  try { return await request; } finally { catalogRequests.delete(endpoint); }
};
const rankingCache = new Map();
const rankingRequests = new Map();
const RANKING_FRESH_MS = 20000;
const RANKING_FALLBACK_MS = 300000;
const readRankingSnapshot = async (url, fetchImpl, force) => {
  const key = String(url);
  const cached = rankingCache.get(key);
  if (!force && cached && Date.now()-cached.at < RANKING_FRESH_MS) return cached.data;
  if (rankingRequests.has(key)) return rankingRequests.get(key);
  const request = (async () => {
    try {
      const response = await fetchImpl(url,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(5000)});
      if (!response.ok) {
        const error = new Error("ranking_read_failed"); error.status=response.status; throw error;
      }
      const data = await response.json();
      if (!data?.data?.source || !Array.isArray(data?.data?.items)) throw new Error("ranking_invalid");
      rankingCache.delete(key); rankingCache.set(key,{at:Date.now(),data});
      if (rankingCache.size > 250) rankingCache.delete(rankingCache.keys().next().value);
      return data;
    } catch (error) {
      if ([403,404].includes(error.status)) rankingCache.delete(key);
      if (cached && Date.now()-cached.at < RANKING_FALLBACK_MS && ![403,404].includes(error.status)) {
        return {...cached.data,refreshFallback:true};
      }
      throw error;
    }
  })();
  rankingRequests.set(key,request);
  try {return await request;} finally {rankingRequests.delete(key);}
};
const handleTrendsRankingProxy = async ({req,res,pathValue,fetchImpl=fetch,env=process.env}) => {
  if (!pathValue.startsWith("trends-ranking/")) return false;
  const fail = (code,message) => {res.setHeader("cache-control","no-store");res.status(code).json({code,message});return true};
  if (!["GET","HEAD"].includes(req.method)) {res.setHeader("allow","GET, HEAD");return fail(405,"Method not allowed")}
  const source = pathValue.slice("trends-ranking/".length);
  const surface = value(req.query.surface);
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(source) || !["public","display"].includes(surface)) return fail(400,"Invalid ranking request");
  const endpoint = getCatalogEndpoint(surface,env);
  if (!endpoint) return fail(503,"Ranking provider is not configured");
  try {
    if (!["https:","http:"].includes(new URL(endpoint).protocol)) return fail(503,"Ranking provider is not configured");
    const force = value(req.query.force) === "1";
    const catalog = await readSurfaceCatalog(endpoint,fetchImpl);
    const entry = catalog.sources.find(s=>s.key===source);
    if (!entry) return fail(404,"Ranking is not admitted on this surface");
    const variant = value(req.query.variant) || value(entry.defaultVariant);
    const variants = new Set((entry.variantGroups||[]).flatMap(g=>(g.options||[]).filter(o=>!o.runtimeAvailability||o.runtimeAvailability==="available").map(o=>value(o.key))));
    if (entry.defaultVariant) variants.add(value(entry.defaultVariant));
    if (variant && !variants.has(variant)) return fail(404,"Ranking variant is not admitted");
    const url = new URL(endpoint.replace(/\/catalog$/, "/rankings/") + encodeURIComponent(source));
    const limit = Math.min(100,Math.max(1,Math.floor(Number(value(req.query.limit))||20)));
    url.searchParams.set("limit",String(limit));
    if (variant) url.searchParams.set("variant",variant);
    const data = await readRankingSnapshot(url,fetchImpl,force);
    res.setHeader("cache-control",force || data.refreshFallback ? "no-store" : "public, max-age=20, stale-while-revalidate=40");
    res.setHeader("vercel-cdn-cache-control",force || data.refreshFallback ? "no-store" : "public, max-age=30, stale-while-revalidate=60");
    res.status(200).json(data);return true;
  } catch (error) { return fail([403,404].includes(error.status) ? error.status : 502,"Ranking read unavailable"); }
};
module.exports = {handleTrendsCatalogProxy,handleTrendsRankingProxy,getCatalogEndpoint};

