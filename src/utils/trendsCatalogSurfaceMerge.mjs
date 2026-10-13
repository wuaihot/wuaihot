const sourceMap = (catalog) =>
  new Map(
    (catalog?.sources || [])
      .filter((source) => source?.key)
      .map((source) => [source.key, source]),
  );

const cachedSurfaceKeys = (catalog, surface) =>
  new Set(
    (catalog?.sources || [])
      .filter((source) => source?.[surface] === true)
      .map((source) => source.key),
  );

const catalogVariantCount = (sources = []) =>
  sources.reduce(
    (total, source) =>
      total +
      (source?.variantGroups || []).reduce(
        (groupTotal, group) => groupTotal + (group?.options || []).length,
        0,
      ),
    0,
  );

const statusCounts = (status) => {
  const sources = Number(status?.sources);
  const variants = Number(status?.variants);
  if (!Number.isFinite(sources) || !Number.isFinite(variants)) return null;
  return { sources, variants };
};

export const catalogMatchesSurfaceStatus = (catalog, status) => {
  const expected = statusCounts(status);
  if (!catalog || !expected) return true;
  const sources = Array.isArray(catalog.sources) ? catalog.sources : [];
  const actualSources = Number.isFinite(Number(catalog.total))
    ? Number(catalog.total)
    : sources.length;
  const actualVariants = Number.isFinite(Number(catalog.variants))
    ? Number(catalog.variants)
    : catalogVariantCount(sources);
  return actualSources === expected.sources && actualVariants === expected.variants;
};

export const mergedCatalogSurfaceMatchesStatus = (
  catalog,
  status,
  availabilityKey = "displayAvailable",
) => {
  const expected = statusCounts(status);
  if (!catalog || !expected) return true;
  const sources = (catalog.sources || []).filter(
    (source) => source?.[availabilityKey] === true,
  );
  return sources.length === expected.sources && catalogVariantCount(sources) === expected.variants;
};

const mergeCatalogSources = (publicCatalog, displayCatalog) => {
  const sources = new Map();
  for (const catalog of [displayCatalog, publicCatalog]) {
    for (const source of catalog?.sources || []) {
      if (!source?.key) continue;
      sources.set(source.key, {
        ...(sources.get(source.key) || {}),
        ...source,
      });
    }
  }
  return [...sources.values()];
};

export const mergeDirectoryAndReadCatalogs = ({
  directoryCatalog = null,
  publicCatalog = null,
  displayCatalog = null,
  cachedCatalog = null,
} = {}) => {
  const baseCatalog = directoryCatalog || publicCatalog || displayCatalog;
  if (!baseCatalog) return null;

  const publicKeys = publicCatalog
    ? new Set(publicCatalog.sources.map((source) => source.key))
    : cachedSurfaceKeys(cachedCatalog, "publicAvailable");
  const displayKeys = displayCatalog
    ? new Set(displayCatalog.sources.map((source) => source.key))
    : cachedSurfaceKeys(cachedCatalog, "displayAvailable");
  const publicSources = sourceMap(publicCatalog);
  const displaySources = sourceMap(displayCatalog);
  const cachedSources = sourceMap(cachedCatalog);
  const sources =
    directoryCatalog?.sources ||
    mergeCatalogSources(publicCatalog, displayCatalog);

  return {
    ...baseCatalog,
    sources: sources.map((source) => {
      const publicAvailable = publicKeys.has(source.key);
      const displayAvailable = displayKeys.has(source.key);
      const readableSurfaceSource = publicAvailable
        ? publicSources.get(source.key) || cachedSources.get(source.key)
        : displayAvailable
          ? displaySources.get(source.key) || cachedSources.get(source.key)
          : null;

      return {
        ...source,
        ...(readableSurfaceSource || {}),
        publicAvailable,
        displayAvailable,
      };
    }),
  };
};
