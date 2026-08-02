const express = require("express");
const { requireApiKey } = require("../middlewares/auth");
const { dailyRateLimit } = require("../middlewares/rate-limit");
const animeService = require("../services/anime.service");
const downloadService = require("../services/download.service");
const coverCache = require("../services/coverCache.service");
const anilistCache = require("../services/anilistCache.service");
const { ApiError } = require("../utils/api-error");

const router = express.Router();

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

router.use(requireApiKey, dailyRateLimit);

router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const forwardedHost = req.get("X-Forwarded-Host") || req.get("host");
    const baseUrl = `${req.protocol}://${forwardedHost}`;
    const query = req.query.q || "";
    const domain = req.query.domain;

    // When domain=all or not specified, search ALL providers (multi-source)
    // with query variants for English + Spanish to find translated titles
    const useMultiSource = !domain || domain === 'all';

    let results = [];
    if (useMultiSource) {
      // Build query variants: original + English + Spanish
      const qLower = query.toLowerCase();
      const variants = [query];
      // Add English translation attempt (very simple heuristics)
      if (/[áéíóúñü¿¡]/i.test(query)) {
        // Spanish-influenced query — also search English
        variants.push(query);
      }
      // Always add basic English form (strip accents)
      const normalizeAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const baseQuery = normalizeAccents(query).trim();
      if (!variants.includes(baseQuery)) variants.push(baseQuery);

      // Search all variants in parallel, deduplicate by normalized title
      const allResults = [];
      await Promise.allSettled(
        variants.map(async (v) => {
          try {
            const r = await animeService.searchAnimeMultiSource(v);
            if (r.success && r.data?.results) {
              allResults.push(...r.data.results);
            }
          } catch (_) {}
        })
      );

      // Deduplicate by normalized title key
      const seen = new Set();
      for (const r of allResults) {
        const key = (r.title || r.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!seen.has(key)) {
          seen.add(key);
          results.push(r);
        }
      }

      // Sort: exact/starts-with match first, then prefer English titles (no Japanese chars)
      results.sort((a, b) => {
        const ta = a.title || a.name || "";
        const tb = b.title || b.name || "";
        const q = baseQuery.toLowerCase();
        const scoreA = ta.toLowerCase().includes(q) ? (ta.toLowerCase().startsWith(q) ? 2 : 1) : 0;
        const scoreB = tb.toLowerCase().includes(q) ? (tb.toLowerCase().startsWith(q) ? 2 : 1) : 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        const hasJP = (s) => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(s);
        if (hasJP(ta) !== hasJP(tb)) return hasJP(ta) ? 1 : -1;
        return 0;
      });
    } else {
      const r = await animeService.searchAnime(query, domain);
      results = r.success && r.data?.results ? r.data.results : [];
    }

    if (results.length > 0) {
      // Enrich with AniList metadata (cover, score, genres, etc.)
      const enriched = await anilistCache.enrichResults(results, { baseUrl });
      results = enriched;
    }

    res.status(200).json({ success: true, data: { query, results } });
  })
);

router.post(
  "/search-multi",
  asyncHandler(async (req, res) => {
    const forwardedHost = req.get("X-Forwarded-Host") || req.get("host");
    const baseUrl = `${req.protocol}://${forwardedHost}`;
    const { q, metadata } = req.body || {};
    if (!q) {
      throw new ApiError(400, "Se requiere el parametro 'q'");
    }

    const response = await animeService.searchAnimeMultiSource(q, metadata);

    if (response.success && response.data?.results) {
      // Sort: exact/starts-with match first, then prefer English titles
      response.data.results.sort((a, b) => {
        const ta = a.title || a.name || "";
        const tb = b.title || b.name || "";
        const qLower = q.toLowerCase();
        const scoreA = ta.toLowerCase().includes(qLower) ? (ta.toLowerCase().startsWith(qLower) ? 2 : 1) : 0;
        const scoreB = tb.toLowerCase().includes(qLower) ? (tb.toLowerCase().startsWith(qLower) ? 2 : 1) : 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        const hasJP = (s) => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(s);
        if (hasJP(ta) !== hasJP(tb)) return hasJP(ta) ? 1 : -1;
        return 0;
      });

      const enriched = await anilistCache.enrichResults(response.data.results, { baseUrl });
      response.data.results = enriched;
    }

    res.status(200).json(response);
  })
);

router.get(
  "/info",
  asyncHandler(async (req, res) => {
    if (!req.query.url) {
      throw new ApiError(400, "Se requiere el parametro url");
    }

    const forwardedHost = req.get("X-Forwarded-Host") || req.get("host");
    const baseUrl = `${req.protocol}://${forwardedHost}`;
    const response = await animeService.getAnimeInfo(req.query.url);

    if (response.success && response.data) {
      // Enrich with full AniList metadata + cache covers
      const { data, coverUrl, fromCache } = await anilistCache.getMetadata(
        response.data.title,
        { malId: response.data.malId }
      );

      if (data) {
        // Ensure cover is cached
        if (coverUrl) {
          coverCache.getCover(coverUrl, { baseUrl }); // fire-and-forget
        }

        // Also cache banner if present
        if (data.bannerImage) {
          coverCache.getCover(data.bannerImage, { baseUrl });
        }

        response.data = {
          ...response.data,
          anilistId: data.id,
          anilistMalId: data.idMal,
          anilistTitle: data.title,
          anilistCoverImage: coverUrl,
          anilistBannerImage: data.bannerImage,
          anilistColor: data.coverImage?.color || null,
          anilistFullDescription: data.description,
          anilistGenres: data.genres || [],
          anilistScore: data.averageScore ? data.averageScore / 10 : null,
          anilistStatus: data.status,
          anilistSeasonYear: data.seasonYear,
          anilistStudios: (data.studios?.nodes || []).map((s) => s.name),
          anilistTrailer: data.trailer,
          anilistCharacters: (data.characters?.nodes || []).map((c) => ({
            name: c.name.full,
            image: c.image.large,
          })),
          _anilistCached: fromCache,
        };

        // Use AniList cover as primary if scraper has no image
        if (!response.data.image && coverUrl) {
          response.data.image = coverUrl;
        }
        if (!response.data.backdrop && data.bannerImage) {
          response.data.backdrop = data.bannerImage;
        }
      } else {
        // Populate cache in background for next time
        anilistCache.fetchAndCache(response.data.title, { malId: response.data.malId }).catch(() => {});
      }
    }

    res.status(200).json(response);
  })
);

router.post(
  "/info-multi",
  asyncHandler(async (req, res) => {
    const forwardedHost = req.get("X-Forwarded-Host") || req.get("host");
    const baseUrl = `${req.protocol}://${forwardedHost}`;
    const { url, metadata } = req.body || {};

    let response;
    if (url) {
      // Has direct URL — use standard path but can merge later
      response = await animeService.getAnimeInfo(url);
    } else if (metadata) {
      // No URL — search all providers using metadata
      try {
        response = await animeService.getAnimeInfoMultiSource(metadata, baseUrl);
      } catch (err) {
        console.error(`[info-multi] getAnimeInfoMultiSource error:`, err.message, metadata);
        throw err;
      }
    } else {
      throw new ApiError(400, "Se requiere 'url' o 'metadata'");
    }

    if (response.success && response.data) {
      const { data, coverUrl } = await anilistCache.getMetadata(
        response.data.title,
        { malId: response.data.malId }
      );
      if (data) {
        response.data = {
          ...response.data,
          anilistId: data.id,
          anilistCoverImage: coverUrl || data.coverImage?.extraLarge || data.coverImage?.large || null,
          anilistBannerImage: data.bannerImage || null,
          anilistColor: data.coverImage?.color || null,
          anilistScore: data.averageScore ? data.averageScore / 10 : null,
          anilistGenres: data.genres || [],
          anilistMalId: data.idMal || response.data.malId,
        };
      } else {
        anilistCache.fetchAndCache(response.data.title, { malId: response.data.malId }).catch(() => {});
      }
    }

    res.status(200).json(response);
  })
);

// Fetch anime info from multiple URLs (from different providers) and merge
router.post(
  "/info-multi-url",
  asyncHandler(async (req, res) => {
    const forwardedHost = req.get("X-Forwarded-Host") || req.get("host");
    const baseUrl = `${req.protocol}://${forwardedHost}`;
    const { urls } = req.body || {};
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new ApiError(400, "Se requiere un array 'urls' con {provider, url}");
    }

    const response = await animeService.getAnimeInfoMultiUrl(urls);

    if (response.success && response.data) {
      const { data, coverUrl } = await anilistCache.getMetadata(
        response.data.title,
        { malId: response.data.malId }
      );
      if (data) {
        if (coverUrl) coverCache.getCover(coverUrl, { baseUrl });
        if (data.bannerImage) coverCache.getCover(data.bannerImage, { baseUrl });
        response.data = {
          ...response.data,
          anilistId: data.id,
          anilistMalId: data.idMal,
          anilistTitle: data.title,
          anilistCoverImage: coverUrl,
          anilistBannerImage: data.bannerImage,
          anilistColor: data.coverImage?.color || null,
          anilistFullDescription: data.description,
          anilistGenres: data.genres || [],
          anilistScore: data.averageScore ? data.averageScore / 10 : null,
          anilistStatus: data.status,
          anilistSeasonYear: data.seasonYear,
          anilistStudios: (data.studios?.nodes || []).map((s) => s.name),
          anilistTrailer: data.trailer,
          anilistCharacters: (data.characters?.nodes || []).map((c) => ({
            name: c.name.full,
            image: c.image.large,
          })),
        };
        if (!response.data.image && coverUrl) {
          response.data.image = coverUrl;
        }
      } else {
        anilistCache.fetchAndCache(response.data.title, { malId: response.data.malId }).catch(() => {});
      }
    }

    res.status(200).json(response);
  })
);

router.get(
  "/episode",
  asyncHandler(async (req, res) => {
    if (!req.query.url) {
      throw new ApiError(400, "Se requiere el parametro url");
    }

    const response = await animeService.getEpisodeLinks(
      req.query.url,
      req.query.includeMega,
      req.query.excludeServers
    );
    res.status(200).json(response);
  })
);

// Multi-source episode: given an anime URL + episode number, fetch episode info
// from all providers that have this anime, then merge all servers
// Also supports episodeUrl directly when animeUrl is not available
router.get(
  "/episode-multi",
  asyncHandler(async (req, res) => {
    let animeUrl = req.query.animeUrl || req.query.url;
    const episodeNum = req.query.episodeNum || req.query.num;
    const episodeUrl = req.query.episodeUrl;

    // If animeUrl is empty but episodeUrl is provided, extract animeUrl from episodeUrl
    if ((!animeUrl || animeUrl === 'undefined') && episodeUrl) {
      // Remove episode number from URL to get anime base URL
      // e.g., https://tioanime.com/ver/one-piece-1 -> https://tioanime.com/ver/one-piece
      // e.g., https://jkanime.net/one-piece/1 -> https://jkanime.net/one-piece
      const urlWithoutNum = episodeUrl.replace(/\/\d+(\?.*)?$/, '');
      animeUrl = urlWithoutNum;
    }

    if (!animeUrl || !episodeNum) {
      throw new ApiError(400, "Se requieren animeUrl y episodeNum");
    }

    const forwardedHost = req.get("X-Forwarded-Host") || req.get("host");
    const baseUrl = `${req.protocol}://${forwardedHost}`;
    const response = await animeService.getEpisodeMulti(animeUrl, Number(episodeNum));

    if (response.success && response.data) {
      const { data, coverUrl } = await anilistCache.getMetadata(
        response.data.title,
        { malId: response.data.malId }
      );
      if (data) {
        if (coverUrl) coverCache.getCover(coverUrl, { baseUrl });
        if (data.bannerImage) coverCache.getCover(data.bannerImage, { baseUrl });
        response.data = {
          ...response.data,
          anilistId: data.id,
          anilistMalId: data.idMal,
          anilistTitle: data.title,
          anilistCoverImage: coverUrl,
          anilistBannerImage: data.bannerImage,
          anilistColor: data.coverImage?.color || null,
          anilistFullDescription: data.description,
          anilistGenres: data.genres || [],
          anilistScore: data.averageScore ? data.averageScore / 10 : null,
          anilistStatus: data.status,
          anilistSeasonYear: data.seasonYear,
          anilistStudios: (data.studios?.nodes || []).map((s) => s.name),
          anilistTrailer: data.trailer,
          anilistCharacters: (data.characters?.nodes || []).map((c) => ({
            name: c.name.full,
            image: c.image.large,
          })),
          _anilistCached: !!coverUrl,
        };
        if (!response.data.image && coverUrl) {
          response.data.image = coverUrl;
        }
        if (!response.data.backdrop && data.bannerImage) {
          response.data.backdrop = data.bannerImage;
        }
      } else {
        anilistCache.fetchAndCache(response.data.title, { malId: response.data.malId }).catch(() => {});
      }
    }

    res.status(200).json(response);
  })
);

router.post(
  "/download",
  asyncHandler(async (req, res) => {
    const forwardedHost = req.get("X-Forwarded-Host") || req.get("host");
    const baseUrl = `${req.protocol}://${forwardedHost}`;
    const data = downloadService.createDownload(req.body || {}, baseUrl);
    res.status(200).json({ success: true, data });
  })
);

router.get(
  "/download/:id",
  asyncHandler(async (req, res) => {
    const data = downloadService.getDownload(req.params.id);
    res.status(200).json({ success: true, data });
  })
);

router.post(
  "/batch-download",
  asyncHandler(async (req, res) => {
    const forwardedHost = req.get("X-Forwarded-Host") || req.get("host");
    const baseUrl = `${req.protocol}://${forwardedHost}`;
    const data = downloadService.createBatch(req.body || {}, baseUrl);
    res.status(200).json({ success: true, data });
  })
);

router.get(
  "/batch/:id",
  asyncHandler(async (req, res) => {
    const data = downloadService.getBatch(req.params.id);
    res.status(200).json({ success: true, data });
  })
);

module.exports = router;