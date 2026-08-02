const fs = require("node:fs");
const path = require("node:path");
const axios = require("axios");

const ANILIST_URL = "https://graphql.anilist.co";
const CACHE_DIR = path.join(__dirname, "../../covers");
const MANIFEST_PATH = path.join(CACHE_DIR, "manifest.json");

const HTTP_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
};

/** @type {Record<string, {filename:string,cachedAt:string,etag:string|null,lastModified:string|null,contentType:string,size:number}>} */
let _manifest = null;

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

function saveManifestEntry(sourceUrl, filename, meta = {}) {
  const manifest = loadManifest();
  manifest[sourceUrl] = {
    filename,
    cachedAt: new Date().toISOString(),
    etag: meta.etag || null,
    lastModified: meta.lastModified || null,
    contentType: meta.contentType || '',
    size: meta.size || 0,
  };
  saveManifest();
}

function hashUrl(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function extFromUrl(url) {
  try {
    const segs = new URL(url).pathname.split("/");
    const last = segs[segs.length - 1];
    const dot = last.lastIndexOf(".");
    if (dot > 0) {
      const e = last.slice(dot).toLowerCase();
      if ([".webp", ".png", ".jpg", ".jpeg", ".gif"].includes(e)) return e;
    }
  } catch (_) {}
  return ".jpg";
}

function extFromContentType(contentType) {
  if (!contentType) return ".jpg";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("gif")) return ".gif";
  return ".jpg";
}

function cleanTitle(title) {
  return String(title || "")
    .replace(/\s*-\s*Temporada\s*\d*/gi, "")
    .replace(/\s*-\s*Temp\s*\d*/gi, "")
    .replace(/\(\s*(Sub|Español|Latino|Castellano)\s*(Español|Latino|Castellano)?\s*\)/gi, "")
    .replace(/\[\s*(Sub|Español|Latino)\s*(Español|Latino)?\s*\]/gi, "")
    .replace(/\s*-\s*(Dub|sub)\s*(Español)?\s*$/gi, "")
    .replace(/\s*-\s*Completo\s*$/gi, "")
    .replace(/^\d+\s*[×x]\s*\d+\s*/g, "")
    .trim();
}

function buildVariants(title) {
  const cleaned = cleanTitle(title);
  const words = cleaned.split(/\s+/).filter(Boolean);
  return [
    title.trim(),
    cleaned,
    words.slice(0, 4).join(" "),
    words.slice(0, 3).join(" "),
    words.slice(0, 2).join(" "),
  ].filter((v) => v && v.length >= 2);
}

// ─── Image cache ──────────────────────────────────────────────────────────────

async function getCover(sourceUrl, options = {}) {
  if (!sourceUrl || typeof sourceUrl !== "string" || !sourceUrl.startsWith("http")) {
    return { url: null, error: "invalid_url" };
  }

  const url = sourceUrl.trim();
  const hash = hashUrl(url);
  const ext = extFromUrl(url);
  const filename = `${hash}${ext}`;
  const localPath = path.join(CACHE_DIR, filename);
  const baseUrl = options.baseUrl || "";
  const serveUrl = baseUrl ? `${baseUrl}/covers/${filename}` : `/covers/${filename}`;

  const manifest = loadManifest();
  if (manifest[url] && fs.existsSync(localPath)) {
    return { url: serveUrl, filename, error: null };
  }

  try {
    const response = await axios.get(url, {
      headers: HTTP_HEADERS,
      responseType: "arraybuffer",
      timeout: 20000,
      maxRedirects: 5,
    });

    fs.mkdirSync(CACHE_DIR, { recursive: true });

    const ct = response.headers["content-type"] || "";
    const actualExt = extFromContentType(ct);
    const finalFilename = `${hash}${actualExt}`;
    const finalPath = path.join(CACHE_DIR, finalFilename);

    fs.writeFileSync(finalPath, Buffer.from(response.data));

    manifest[url] = {
      filename: finalFilename,
      cachedAt: new Date().toISOString(),
      etag: response.headers["etag"] || null,
      lastModified: response.headers["last-modified"] || null,
      contentType: ct,
      size: Number(response.headers["content-length"]) || response.data.length,
    };
    saveManifest();

    const finalUrl = baseUrl ? `${baseUrl}/covers/${finalFilename}` : `/covers/${finalFilename}`;
    return { url: finalUrl, filename: finalFilename, error: null };
  } catch (err) {
    return { url: null, filename: null, error: err.message };
  }
}

async function fetchMany(sources, options = {}) {
  const results = {};
  const pending = [];

  const manifest = loadManifest();
  for (const src of sources) {
    if (!src || typeof src !== "string" || !src.startsWith("http")) continue;
    const url = src.trim();
    const hash = hashUrl(url);
    const ext = extFromUrl(url);
    const filename = `${hash}${ext}`;
    const localPath = path.join(CACHE_DIR, filename);

    if (manifest[url] && fs.existsSync(localPath)) {
      const baseUrl = options.baseUrl || "";
      results[url] = baseUrl ? `${baseUrl}/covers/${filename}` : `/covers/${filename}`;
    } else {
      pending.push(url);
    }
  }

  const BATCH = 5;
  for (let i = 0; i < pending.length; i += BATCH) {
    const batch = pending.slice(i, i + BATCH);
    const settled = await Promise.allSettled(batch.map((u) => getCover(u, options)));
    for (let j = 0; j < batch.length; j++) {
      const result = settled[j];
      if (result.status === "fulfilled" && result.value.url) {
        results[batch[j]] = result.value.url;
      }
    }
  }

  return results;
}

function invalidate(sourceUrl) {
  if (!sourceUrl) return;
  const manifest = loadManifest();
  const entry = manifest[sourceUrl];
  if (entry) {
    try {
      const filePath = path.join(CACHE_DIR, entry.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_) {}
    delete manifest[sourceUrl];
    saveManifest();
  }
}

function getOriginalUrl(filename) {
  const manifest = loadManifest();
  for (const [sourceUrl, meta] of Object.entries(manifest)) {
    if (meta.filename === filename) return sourceUrl;
  }
  return null;
}

function listAll() {
  const manifest = loadManifest();
  return Object.entries(manifest).map(([sourceUrl, meta]) => {
    const filePath = path.join(CACHE_DIR, meta.filename);
    return {
      sourceUrl,
      filename: meta.filename,
      cachedAt: meta.cachedAt,
      size: meta.size,
      exists: fs.existsSync(filePath),
    };
  });
}

// ─── Metadata cache ───────────────────────────────────────────────────────────

const META_DIR = path.join(__dirname, "../../metadata");
const META_MANIFEST = path.join(META_DIR, "manifest.json");

/** @type {Record<string, {data:object,cachedAt:string}>} */
let _metaManifest = null;

function loadMetaManifest() {
  if (_metaManifest !== null) return _metaManifest;
  try {
    if (fs.existsSync(META_MANIFEST)) {
      _metaManifest = JSON.parse(fs.readFileSync(META_MANIFEST, "utf-8"));
    } else {
      _metaManifest = {};
    }
  } catch (_) {
    _metaManifest = {};
  }
  return _metaManifest;
}

function saveMetaManifest() {
  try {
    fs.mkdirSync(META_DIR, { recursive: true });
    fs.writeFileSync(META_MANIFEST, JSON.stringify(_metaManifest, null, 2), "utf-8");
  } catch (_) {}
}

async function anilistQuery(query, variables) {
  try {
    const response = await axios.post(
      ANILIST_URL,
      { query, variables },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );
    if (response.data.errors) return null;
    return response.data.data;
  } catch (_) {
    return null;
  }
}

async function fetchAniListByTitle(title, malIdHint) {
  // Try MAL ID first if available
  if (malIdHint) {
    const data = await anilistQuery(
      `query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
          id idMal title { romaji english native }
          description(asHtml: false)
          coverImage { extraLarge large color }
          bannerImage averageScore genres seasonYear status
          studios(isMain: true) { nodes { name } }
          trailer { id site }
          characters(sort: ROLE, perPage: 6) {
            nodes { name { full } image { large } }
          }
        }
      }`,
      { idMal: malIdHint }
    );
    if (data?.Media) return data.Media;
  }

  // Try title variants
  for (const variant of buildVariants(title)) {
    const data = await anilistQuery(
      `query ($search: String) {
        Media(search: $search, type: ANIME) {
          id idMal title { romaji english native }
          description(asHtml: false)
          coverImage { extraLarge large color }
          bannerImage averageScore genres seasonYear status
          studios(isMain: true) { nodes { name } }
          trailer { id site }
          characters(sort: ROLE, perPage: 6) {
            nodes { name { full } image { large } }
          }
        }
      }`,
      { search: variant }
    );
    if (data?.Media) return data.Media;
  }

  return null;
}

/**
 * Get metadata for a title — cached in metadata/ directory.
 * Returns AniList data (cover, description, genres, etc.) if found.
 */
async function getMetadata(title, options = {}) {
  if (!title || title.length < 2) return { data: null, fromCache: false, coverUrl: null };

  const cacheKey = cleanTitle(title).toLowerCase();
  const cacheFile = path.join(META_DIR, `${hashUrl(cacheKey)}.json`);
  const manifest = loadMetaManifest();

  // Check cache
  if (manifest[cacheKey]) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      if (cached.data) {
        // Extract cover URL from cached data
        const coverUrl = cached.data.coverImage?.extraLarge || cached.data.coverImage?.large || null;
        return { data: cached.data, fromCache: true, coverUrl };
      }
    } catch (_) {}
  }

  // Fetch from AniList
  const malIdHint = options.malId || null;
  const media = await fetchAniListByTitle(title, malIdHint);
  const coverUrl = media?.coverImage?.extraLarge || media?.coverImage?.large || null;

  if (media) {
    const entry = { data: media, cachedAt: new Date().toISOString() };
    try {
      fs.mkdirSync(META_DIR, { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(entry, null, 2), "utf-8");
    } catch (_) {}
    manifest[cacheKey] = { filename: `${hashUrl(cacheKey)}.json`, cachedAt: entry.cachedAt };
    saveMetaManifest();
  }

  return { data: media, fromCache: false, coverUrl };
}

/**
 * Enrich search results with AniList metadata (cover, score, genres, etc.).
 * Caches metadata and returns enriched results.
 */
async function enrichResults(results, options = {}) {
  const baseUrl = options.baseUrl || "";
  const enriched = [];

  for (const item of results) {
    const { data, fromCache, coverUrl } = await getMetadata(item.title || item.name, {
      malId: item.malId,
    });

    if (coverUrl) {
      // Ensure cover is cached locally
      await getCover(coverUrl, { baseUrl });
    }

    enriched.push({
      ...item,
      // Enrich with AniList data
      anilistId: data?.id || null,
      anilistMalId: data?.idMal || null,
      anilistTitle: data?.title || null,
      anilistCoverImage: coverUrl,
      anilistBannerImage: data?.bannerImage || null,
      anilistColor: data?.coverImage?.color || null,
      anilistFullDescription: data?.description || null,
      anilistGenres: data?.genres || [],
      anilistScore: data?.averageScore || null,
      anilistStatus: data?.status || null,
      anilistSeasonYear: data?.seasonYear || null,
      anilistStudios: (data?.studios?.nodes || []).map((s) => s.name),
      anilistTrailer: data?.trailer || null,
      anilistCharacters: (data?.characters?.nodes || []).map((c) => ({
        name: c.name.full,
        image: c.image.large,
      })),
      _anilistCached: fromCache,
      _anilistCoverFetched: !!coverUrl,
    });
  }

  return enriched;
}

module.exports = {
  getCover,
  fetchMany,
  getMetadata,
  enrichResults,
  invalidate,
  listAll,
  getOriginalUrl,
  saveManifestEntry,
  CACHE_DIR,
  META_DIR,
};