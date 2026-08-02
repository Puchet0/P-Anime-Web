/**
 * AniList metadata caching service.
 * Uses stale-while-revalidate: returns cached data immediately,
 * refreshes in the background when stale (6h) or expired (7 days).
 */
const fs = require("node:fs");
const path = require("node:path");
const axios = require("axios");

const ANILIST_URL = "https://graphql.anilist.co";
const CACHE_DIR = path.join(__dirname, "../../anilist-cache");
const MANIFEST_PATH = path.join(CACHE_DIR, "manifest.json");

const STALE_HOURS = 6;
const MAX_AGE_HOURS = 24 * 7;

let _manifest = null;

const ANILIST_QUERY = `
query ($search: String, $id: Int) {
  Media(search: $search, id: $id, type: ANIME) {
    id
    idMal
    title { romaji english native }
    coverImage { extraLarge large color }
    bannerImage
    description(asHtml: false)
    genres
    averageScore
    status
    season
    seasonYear
    studios(isMain: true) { nodes { name } }
    trailer { id site }
    characters(first: 10) {
      nodes { name { full } image { large } }
    }
  }
}
`;

function loadManifest() {
  if (_manifest !== null) return _manifest;
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      _manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
    } else {
      _manifest = {};
    }
  } catch (_) {
    _manifest = {};
  }
  return _manifest;
}

function saveManifest() {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(_manifest, null, 2), "utf-8");
  } catch (_) {}
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function cleanTitle(title) {
  return String(title || "")
    .replace(/\s*-\s*Temporada\s*\d*/gi, "")
    .replace(/\s*-\s*Temp\s*\d*/gi, "")
    .replace(/\(\s*(Sub|Español|Latino|Castellano)\s*(Español|Latino|Castellano)?\s*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cacheKey(title, malId) {
  if (malId) return `mal:${malId}`;
  return `title:${hashString(cleanTitle(title).toLowerCase())}`;
}

function isStale(entry) {
  if (!entry?.cachedAt) return true;
  return Date.now() - new Date(entry.cachedAt).getTime() > STALE_HOURS * 3600000;
}

function isExpired(entry) {
  if (!entry?.cachedAt) return true;
  return Date.now() - new Date(entry.cachedAt).getTime() > MAX_AGE_HOURS * 3600000;
}

function readCacheFile(filename) {
  try {
    const filePath = path.join(CACHE_DIR, filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (_) {}
  return null;
}

/**
 * Get cached metadata. Returns immediately if available (even stale).
 * Returns { data, coverUrl, fromCache, stale }.
 */
async function getMetadata(title, options = {}) {
  if (!title || title.length < 2) return { data: null, coverUrl: null, fromCache: false, stale: false };

  const key = cacheKey(title, options.malId);
  const manifest = loadManifest();
  const entry = manifest[key];

  if (entry && !isExpired(entry)) {
    const data = entry.data || readCacheFile(entry.filename);
    if (data) {
      const stale = isStale(entry);
      return { data, coverUrl: entry.coverUrl || null, fromCache: true, stale };
    }
  }

  return { data: null, coverUrl: null, fromCache: false, stale: false };
}

/**
 * Fetch from AniList and cache. Safe to call even if already cached.
 * Returns { data, coverUrl, stale }.
 */
async function fetchAndCache(title, options = {}) {
  const key = cacheKey(title, options.malId);
  const manifest = loadManifest();
  const entry = manifest[key];

  // Already fresh — skip
  if (entry && !isStale(entry)) {
    const data = entry.data || readCacheFile(entry.filename);
    return { data, coverUrl: entry.coverUrl || null, stale: false };
  }

  const vars = options.malId ? { id: options.malId } : { search: title };
  let data = null;

  try {
    const response = await axios.post(
      ANILIST_URL,
      { query: ANILIST_QUERY, variables: vars },
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 12000,
      }
    );
    data = response.data?.data?.Media;
  } catch (_) {}

  if (data) {
    const filename = `${key}.json`;
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(path.join(CACHE_DIR, filename), JSON.stringify(data, null, 2), "utf-8");
    } catch (_) {}

    const coverUrl = data.coverImage?.extraLarge || data.coverImage?.large || null;
    manifest[key] = {
      filename,
      cachedAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      etag: null,
      contentType: "application/json",
      size: JSON.stringify(data).length,
      stale: false,
      coverUrl,
      data,
      _title: title,
      _malId: options.malId || null,
    };
    saveManifest();
    return { data, coverUrl, stale: false };
  } else if (entry) {
    entry.lastCheckedAt = new Date().toISOString();
    entry.stale = true;
    saveManifest();
    return { data: entry.data || readCacheFile(entry.filename), coverUrl: entry.coverUrl || null, stale: true };
  }

  return { data: null, coverUrl: null, stale: false };
}

/**
 * Enrich search results with AniList metadata.
 * Returns immediately from cache, refreshes stale entries in background.
 */
async function enrichResults(results, options = {}) {
  const baseUrl = options.baseUrl || "";
  const enriched = [];

  for (const item of results) {
    const { data, coverUrl, stale } = await getMetadata(item.title || item.name, {
      malId: item.malId,
    });

    // Background refresh if stale, or populate cache if miss
    if (stale || !data) {
      fetchAndCache(item.title || item.name, { malId: item.malId }).catch(() => {});
    }

    // Fetch cover image if we have a cover URL
    if (coverUrl && baseUrl) {
      const { getCover } = require("./coverCache.service");
      getCover(coverUrl, { baseUrl }).catch(() => {});
    }

    enriched.push({
      ...item,
      // Ensure malId is always present (fallback to anilistMalId if not set by provider)
      malId: item.malId || data?.idMal || null,
      anilistId: item.anilistId || data?.id || null,
      anilistMalId: item.anilistMalId || data?.idMal || null,
      anilistTitle: data?.title || null,
      anilistCoverImage: item.anilistCoverImage || coverUrl,
      anilistBannerImage: data?.bannerImage || null,
      anilistColor: data?.coverImage?.color || null,
      anilistFullDescription: data?.description || null,
      anilistGenres: data?.genres || [],
      anilistScore: data?.averageScore ? data.averageScore / 10 : null,
      anilistStatus: data?.status || null,
      anilistSeasonYear: data?.seasonYear || null,
      anilistStudios: (data?.studios?.nodes || []).map((s) => s.name),
      anilistTrailer: data?.trailer || null,
      anilistCharacters: (data?.characters?.nodes || []).map((c) => ({
        name: c.name.full,
        image: c.image.large,
      })),
      _anilistCached: !!data,
    });
  }

  return enriched;
}

/**
 * Pre-warm cache for an array of titles (fire and forget).
 */
function prewarm(titles) {
  const CHUNK = 3;
  (async () => {
    for (let i = 0; i < titles.length; i += CHUNK) {
      await Promise.allSettled(
        titles.slice(i, i + CHUNK).map((t) => {
          const opts = typeof t === "object" ? t : { title: String(t) };
          return fetchAndCache(opts.title || opts, opts).catch(() => null);
        })
      );
    }
  })();
}

/**
 * Refresh all stale entries (call on startup).
 */
async function refreshStale() {
  const manifest = loadManifest();
  const staleEntries = Object.entries(manifest).filter(([, v]) => isStale(v));
  if (staleEntries.length === 0) return;

  for (let i = 0; i < staleEntries.length; i += 2) {
    const chunk = staleEntries.slice(i, i + 2);
    await Promise.allSettled(
      chunk.map(([key, entry]) => {
        const opts = entry._malId ? { malId: entry._malId } : { title: entry._title };
        return fetchAndCache(entry._title || "", opts);
      })
    );
  }
}

module.exports = { getMetadata, fetchAndCache, enrichResults, prewarm, refreshStale };
