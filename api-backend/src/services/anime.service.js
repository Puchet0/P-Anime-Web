const { URL } = require("node:url");
const { ApiError } = require("../utils/api-error");
const animeav1Service = require("./animeav1.service");
const jkanimeService = require("./jkanime.service");
const tioanimeService = require("./tioanime.service");
// const hentailaService = require("./hentaila.service");
const coverCache = require("./coverCache.service");
const axios = require("axios");

const DEFAULT_ANIME_DOMAIN = process.env.DEFAULT_ANIME_DOMAIN || "animeav1.com";

/**
 * Normalize a title for fuzzy comparison:
 * - lowercase, trim
 * - remove special chars (colons, dashes, parentheses, etc.)
 * - remove common suffixes/subtitles
 * - extract significant words (3+ chars)
 */
function normalizeTitleForMatch(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[:\-–—()[\]{}!?,.'"·;]/g, " ")
    .replace(/\b(season|part|cour|arc|saga|movie|film|ova|ona|special|episode|ep)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titlesMatch(titleA, titleB) {
  const a = normalizeTitleForMatch(titleA);
  const b = normalizeTitleForMatch(titleB);
  if (!a || !b) return false;
  // Exact match after normalization
  if (a === b) return true;
  // One contains the other
  if (a.includes(b) || b.includes(a)) return true;
  // Word overlap: at least 60% of significant words match
  const wordsA = new Set(a.split(" ").filter(w => w.length >= 3));
  const wordsB = new Set(b.split(" ").filter(w => w.length >= 3));
  if (wordsA.size === 0 || wordsB.size === 0) return false;
  const overlap = [...wordsA].filter(w => wordsB.has(w)).length;
  const minSize = Math.min(wordsA.size, wordsB.size);
  return overlap / minSize >= 0.6;
}

const PROVIDERS = [
  {
    id: "animeav1",
    label: "AnimeAV1",
    domains: [DEFAULT_ANIME_DOMAIN, "animeav1.com", "www.animeav1.com"],
    service: animeav1Service,
  },
  {
    id: "jkanime",
    label: "JKAnime",
    domains: ["jkanime.net", "www.jkanime.net"],
    service: jkanimeService,
  },
  {
    id: "tioanime",
    label: "TioAnime",
    domains: ["tioanime.com", "www.tioanime.com"],
    service: tioanimeService,
  },
  // {
  //   id: "hentaila",
  //   label: "HentaiLA",
  //   domains: ["hentaila.com", "www.hentaila.com"],
  //   service: hentailaService,
  // },
];

const MULTI_SOURCE_PROVIDERS = PROVIDERS;

// Spanish/to-english title mappings for common cases
const TITLE_TRANSLATIONS = {
  'demon slayer': 'kimetsu no yaiba',
  'cazador de demonios': 'demon slayer',
  'ataque a los titanes': 'attack on titan',
  'attack on titan': 'shingeki no kyojin',
  'my hero academy': 'boku no hero academia',
  'heroes': 'boku no hero academia',
  'one piece': 'one piece',
  'dragon ball': 'dragon ball',
  'naruto': 'naruto',
  'boruto': 'boruto',
  'bleach': 'bleach',
  'fairy tail': 'fairy tail',
  'sword art online': 'sword art online',
  'sao': 'sword art online',
  'tokyo ghoul': 'tokyo ghoul',
  'violet evergarden': 'violet evergarden',
  'violetta': 'violet evergarden',
  'haikyuu': 'haikyuu',
  'haikyu': 'haikyuu',
  'hunter x hunter': 'hunter x hunter',
  'hunterxhunter': 'hunter x hunter',
  'chainsaw man': 'chainsaw man',
  'csm': 'chainsaw man',
  'jujutsu kaisen': 'jujutsu kaisen',
  'jjk': 'jujutsu kaisen',
  'spy x family': 'spy x family',
  'spyxfamily': 'spy x family',
  'chobits': 'chobits',
  'frieren': 'sousou no frieren',
  'sousou no frieren': 'sousou no frieren',
  'nier': 'nier automata',
  'kaguya': 'kaguya sama love is war',
  'kaguya sama': 'kaguya sama love is war',
};

function normalizeTextForSearch(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function cleanSearchTitle(title) {
  return String(title || "")
    .replace(/\s*-\s*Temporada\s*\d*/gi, "")
    .replace(/\s*-\s*Temp\s*\d*/gi, "")
    .replace(/\(\s*(Sub|Español|Latino|Castellano)\s*(Español|Latino|Castellano)?\s*\)/gi, "")
    .replace(/\[\s*(Sub|Español|Latino)\s*(Español|Latino)?\s*\]/gi, "")
    .replace(/[📺👁️]*/g, "")
    .replace(/\s*-\s*(Dub|sub)\s*(Español)?\s*$/gi, "")
    .replace(/\s*-\s*Completo\s*$/gi, "")
    .replace(/^\d+\s*[×x]\s*\d+\s*/g, "")
    .replace(/\d+\s*°?\s*(Temporada|Season|temp)\s*\d*/gi, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build search variants from a query: exact, cleaned, partial phrases, words, and translations.
 */
function buildQueryVariants(query) {
  const seen = new Set();
  const variants = [];

  function addVariant(v) {
    if (!v || typeof v !== 'string') return;
    const norm = normalizeTextForSearch(v);
    if (!norm || norm.length < 2 || seen.has(norm)) return;
    seen.add(norm);
    variants.push(v.trim());
  }

  // 1. Exact original
  addVariant(query);

  // 2. Cleaned (remove Spanish suffixes, season numbers, etc.)
  addVariant(cleanSearchTitle(query));

  // 3. Translate if recognized
  const normQuery = normalizeTextForSearch(query);
  const translated = TITLE_TRANSLATIONS[normQuery];
  if (translated) {
    addVariant(translated);
    addVariant(cleanSearchTitle(translated));
  }

  // 4. Individual words (for partial match)
  const words = query.split(/\s+/).filter((w) => w.length >= 2);
  for (const w of words) {
    addVariant(w);
  }

  // 5. Partial phrases (first N words)
  const cleaned = cleanSearchTitle(query);
  const cleanedWords = cleaned.split(/\s+/).filter(Boolean);
  if (cleanedWords.length >= 3) {
    addVariant(cleanedWords.slice(0, 3).join(' '));
  }
  if (cleanedWords.length >= 2) {
    addVariant(cleanedWords.slice(0, 2).join(' '));
  }

  // 6. Reverse words order (common mistake)
  if (words.length >= 2) {
    addVariant([...words].reverse().join(' '));
  }

  return [...new Set(variants)].slice(0, 10);
}

function buildSearchVariants(metadata) {
  const variants = [];
  const seen = new Set();

  function addVariant(v) {
    const str = typeof v === "string" ? v.trim() : null;
    const norm = normalizeTextForSearch(str);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      variants.push(str);
    }
  }

  if (metadata?.title) addVariant(metadata.title);
  if (metadata?.titleJapanese) addVariant(metadata.titleJapanese);
  if (Array.isArray(metadata?.synonyms)) {
    for (const s of metadata.synonyms) addVariant(s);
  }

  // Always add lowercase variant (animeav1 doesn't handle ALL-CAPS well)
  const lowercase = variants.map((v) => (typeof v === "string" ? v.toLowerCase() : v));
  for (const v of lowercase) {
    addVariant(v);
  }

  return variants;
}

// Score how well a title matches the query (higher = better)
function computeMatchScore(title, normQuery) {
  if (!title || !normQuery) return 0;
  const normTitle = normalizeTextForSearch(title);
  // Exact match gets highest score
  if (normTitle === normQuery) return 100;
  // Starts with query
  if (normTitle.startsWith(normQuery)) return 80;
  // Contains query as word
  const words = normQuery.split(' ');
  if (words.every(w => normTitle.includes(w))) return 60;
  // Partial word match — count how many query words appear in title
  const queryWords = normQuery.split(' ').filter(Boolean);
  const titleWords = normTitle.split(' ').filter(Boolean);
  if (queryWords.length > 0 && titleWords.length > 0) {
    const matched = queryWords.filter(qw =>
      titleWords.some(tw => tw.includes(qw) || qw.includes(tw))
    ).length;
    const ratio = matched / queryWords.length;
    if (ratio >= 0.8) return 50;
    if (ratio >= 0.5) return 30;
    if (ratio >= 0.25) return 15;
  }
  // Contains query
  if (normTitle.includes(normQuery)) return 40;
  return 10;
}

function mergeSearchResults(resultsByProvider, query = '') {
  const merged = new Map();
  const normQuery = normalizeTextForSearch(query);

  for (const [providerId, results] of Object.entries(resultsByProvider)) {
    for (const result of results) {
      if (!result) continue;
      // Use malId as primary key for cross-provider deduplication
      const malId = result.malId || result.anilistMalId || null;
      const titleKey = normalizeTextForSearch(result.title);
      if (!titleKey && !malId) continue;

      // Find existing entry by malId first, then by title
      let existing = malId ? merged.get(`mal:${malId}`) : null;
      if (!existing && titleKey) {
        existing = merged.get(`title:${titleKey}`);
      }

      if (!existing) {
        const entry = {
          ...result,
          _matchScore: computeMatchScore(result.title, normQuery),
          _sources: [{ provider: providerId, url: result.url, slug: result.slug, image: result.image }],
        };
        if (malId) {
          merged.set(`mal:${malId}`, entry);
        } else {
          merged.set(`title:${titleKey}`, entry);
        }
      } else {
        const existingKey = malId ? `mal:${malId}` : `title:${titleKey}`;
        // Prefer entry with malId already set
        if (!existing.malId && malId) {
          existing.malId = malId;
        }
        // Prefer better image
        if (!existing.image && result.image) {
          existing.image = result.image;
        }
        if (!existing.backdrop && result.backdrop) {
          existing.backdrop = result.backdrop;
        }
        if (!existing.score && result.score) {
          existing.score = result.score;
        }
        // Prefer English title over Japanese
        const existingHasJP = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(existing.title || '');
        const resultHasJP = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(result.title || '');
        if (existingHasJP && !resultHasJP && result.title) {
          existing.title = result.title;
          existing.image = result.image || existing.image;
        }
        // Keep the result with better match score
        const candidateScore = computeMatchScore(result.title, normQuery);
        if (candidateScore > existing._matchScore) {
          Object.assign(existing, result);
          existing._matchScore = candidateScore;
        }
        existing._sources.push({ provider: providerId, url: result.url, slug: result.slug, image: result.image });
        // Update key if we now have malId and were under title key
        if (malId && existingKey.startsWith('title:')) {
          merged.delete(existingKey);
          merged.set(`mal:${malId}`, existing);
        }
      }
    }
  }

  // Sort: higher match score first, then prefer English title over Japanese
  const results = Array.from(merged.values());
  results.sort((a, b) => {
    if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore;
    // Boost: prefer titles NOT starting with Japanese characters (Hiragana/Kanji/Katakana)
    const aHasJP = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(a.title || '');
    const bHasJP = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(b.title || '');
    if (aHasJP !== bHasJP) return aHasJP ? 1 : -1;
    return 0;
  });

  return results;
}

async function getAniListTitles(query) {
  try {
    const res = await axios.post(
      "https://graphql.anilist.co",
      {
        query: `query ($search: String) { Media(search: $search, type: ANIME) { id idMal title { romaji english native } synonyms } }`,
        variables: { search: query },
      },
      { headers: { "Content-Type": "application/json" }, timeout: 10000 }
    );
    const media = res.data?.data?.Media;
    if (!media) return null;
    const titles = [];
    const add = (t) => { const c = (t || "").trim(); if (c && c.toLowerCase() !== query.toLowerCase()) titles.push(c); };
    if (media.title?.romaji) add(media.title.romaji);
    if (media.title?.english) add(media.title.english);
    if (media.title?.native) add(media.title.native);
    if (Array.isArray(media.synonyms)) media.synonyms.forEach(add);
    return { titles, malId: media.idMal || null };
  } catch (_) {
    return null;
  }
}

async function anilistSearch(query, { limit = 30 } = {}) {
  try {
    const res = await axios.post(
      "https://graphql.anilist.co",
      {
        query: `query ($search: String, $limit: Int) {
  Page(page: 1, perPage: $limit) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      id
      idMal
      title { romaji english native userPreferred }
      synonyms
      relations {
        edges {
          relationType
          node {
            id
            idMal
            title { romaji english }
            seasonYear
            season
            coverImage { extraLarge large }
          }
        }
      }
      coverImage { extraLarge large color }
      bannerImage
      averageScore
      genres
      format
      episodes
      status
      season
      seasonYear
      description(asHtml: false)
    }
  }
}`,
        variables: { search: query, limit },
      },
      { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );
    const media = res.data?.data?.Page?.media ?? [];
    return media.map((m) => ({
      malId: m.idMal,
      anilistId: m.id,
      title: m.title?.romaji || m.title?.english || m.title?.native,
      titleEnglish: m.title?.english,
      titleRomaji: m.title?.romaji,
      titleNative: m.title?.native,
      synonyms: m.synonyms || [],
      relations: (m.relations?.edges || []).map((e) => ({
        relationType: e.relationType,
        malId: e.node?.idMal,
        anilistId: e.node?.id,
        title: e.node?.title?.romaji || e.node?.title?.english,
        seasonYear: e.node?.seasonYear,
        season: e.node?.season,
        coverImage: e.node?.coverImage?.extraLarge || e.node?.coverImage?.large,
      })),
      coverImage: m.coverImage?.extraLarge || m.coverImage?.large,
      bannerImage: m.bannerImage,
      score: m.averageScore ? m.averageScore / 10 : null,
      genres: m.genres || [],
      format: m.format,
      episodes: m.episodes,
      status: m.status,
      season: m.season,
      seasonYear: m.seasonYear,
      description: m.description,
    }));
  } catch (err) {
    console.error('[anilistSearch] error:', err.message);
    return [];
  }
}

async function searchAnimeMultiSource(query, metadata) {
  const normQuery = normalizeTextForSearch(query);
  const limit = 30;

  // Step 1: Primary search via AniList GraphQL
  let anilistResults = await anilistSearch(query, { limit });

  // Step 2: If AniList returns < 3 results, try variant query translations
  if (anilistResults.length < 3) {
    const translations = TITLE_TRANSLATIONS[normQuery];
    if (translations && translations.toLowerCase() !== query.toLowerCase()) {
      const extra = await anilistSearch(translations, { limit });
      // Merge and dedupe by malId
      const seen = new Set(anilistResults.map((r) => r.malId || r.title));
      for (const r of extra) {
        const key = r.malId || normalizeTextForSearch(r.title);
        if (!seen.has(key)) {
          seen.add(key);
          anilistResults.push(r);
        }
      }
    }
  }

  if (anilistResults.length === 0) {
    // Fallback to scrapers if AniList is down
    return fallbackSearchToScrapers(query, normQuery);
  }

  // Step 3: Format AniList results (no scraper lookup at search time — too slow)
  // Scraper sources are fetched on-demand when user clicks an anime (getAnimeInfoMultiSource)
  const enriched = anilistResults.map((anime) => {
    // Cache AniList cover image
    if (anime.coverImage) {
      coverCache.getCover(anime.coverImage).catch(() => {});
    }

    const searchTitles = [anime.title, anime.titleEnglish, anime.titleRomaji, anime.titleNative, ...anime.synonyms].filter(Boolean);
    const matchScore = Math.max(...searchTitles.map((t) => computeMatchScore(t, normQuery)), 0);

    return {
      id: null,
      malId: anime.malId || null,
      anilistId: anime.anilistId || null,
      title: anime.title,
      titleEnglish: anime.titleEnglish,
      titleRomaji: anime.titleRomaji,
      titleNative: anime.titleNative,
      synonyms: anime.synonyms,
      relations: anime.relations,
      coverImage: anime.coverImage,
      anilistCoverImage: anime.coverImage,
      bannerImage: anime.bannerImage,
      anilistBannerImage: anime.bannerImage,
      score: anime.score,
      genres: anime.genres,
      format: anime.format,
      episodes: anime.episodes,
      status: anime.status,
      season: anime.season,
      seasonYear: anime.seasonYear,
      description: anime.description,
      _matchScore: matchScore,
      _sources: [],
      _anilistResult: true,
    };
  });

  // Filter by match score (AniList search already returns relevant results)
  const filtered = enriched.filter((a) => a._matchScore >= 10 || a.anilistId);

  // Also include related animes (sequels, prequels, etc.) as separate results
  const relatedAnimes = [];
  const seenRelatedIds = new Set(filtered.map((a) => a.malId || a.anilistId));

  for (const anime of enriched) {
    for (const rel of anime.relations || []) {
      if (!rel.malId || seenRelatedIds.has(rel.malId)) continue;
      if (!rel.title) continue;
      seenRelatedIds.add(rel.malId);

      const relScore = Math.max(
        computeMatchScore(rel.title, normQuery),
        0
      );
      // Only include relations that somewhat match the query
      if (relScore < 5) continue;

      // Cache relation cover
      if (rel.coverImage) {
        coverCache.getCover(rel.coverImage).catch(() => {});
      }

      relatedAnimes.push({
        id: null,
        malId: rel.malId,
        anilistId: rel.anilistId || null,
        title: rel.title,
        titleEnglish: null,
        titleRomaji: null,
        titleNative: null,
        synonyms: [],
        relations: [],
        image: rel.coverImage || null,
        coverImage: rel.coverImage || null,
        anilistCoverImage: rel.coverImage || null,
        bannerImage: null,
        anilistBannerImage: null,
        type: '',
        score: null,
        genres: [],
        format: null,
        episodes: null,
        status: null,
        season: rel.season || null,
        seasonYear: rel.seasonYear || null,
        description: null,
        backdrop: null,
        year: null,
        slug: '',
        _matchScore: relScore,
        _sources: [],
        _anilistResult: true,
        _isRelated: true,
        _relatedTo: anime.title,
        url: null,
      });
    }
  }

  // Combine main results + related animes, sort together
  const allResults = [...filtered, ...relatedAnimes];
  allResults.sort((a, b) => {
    if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore;
    const aHasJP = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(a.title || "");
    const bHasJP = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(b.title || "");
    if (aHasJP !== bHasJP) return aHasJP ? 1 : -1;
    return 0;
  });

  return {
    success: true,
    data: {
      query,
      metadata,
      results: allResults.slice(0, 20),
    },
  };
}

async function findScraperSources(searchTitles, malId) {
  const sources = [];
  const seen = new Set();

  for (const title of searchTitles) {
    if (!title || seen.has(title)) continue;
    seen.add(title);

    const results = await Promise.allSettled(
      PROVIDERS.map((p) =>
        p.service.searchAnime(title, p.domains[0]).catch(() => null)
      )
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status !== "fulfilled" || !result.value?.data?.results) continue;
      const provider = PROVIDERS[i];
      for (const r of result.value.data.results) {
        if (!r?.url) continue;
        // Check if this result's title matches one of our search titles
        const normRTitle = normalizeTextForSearch(r.title);
        const isMatch = searchTitles.some(
          (st) => normalizeTextForSearch(st) === normRTitle
        );
        if (!isMatch) {
          // Also accept partial match if there's high overlap
          const rScore = Math.max(
            ...searchTitles.map((st) =>
              computeMatchScore(r.title, normalizeTextForSearch(st))
            )
          );
          if (rScore < 50) continue;
        }
        // Dedupe by provider
        if (!sources.some((s) => s.provider === provider.id)) {
          sources.push({
            provider: provider.id,
            url: r.url,
            slug: r.slug,
            image: r.image,
          });
        }
      }
    }

    // If we already have all 3 providers, stop
    if (sources.length >= 3) break;
  }

  return sources;
}

async function fallbackSearchToScrapers(query, normQuery) {
  const resultsByProvider = {};
  const variants = buildQueryVariants(query);

  await Promise.all(
    variants.flatMap((variant) =>
      PROVIDERS.map(async (provider) => {
        try {
          const result = await provider.service.searchAnime(variant, provider.domains[0]);
          const results = result?.data?.results ?? [];
          if (results.length > 0) {
            if (!resultsByProvider[provider.id]) resultsByProvider[provider.id] = [];
            const seenLocal = new Set(resultsByProvider[provider.id].map((r) => normalizeTextForSearch(r.title)));
            for (const r of results) {
              const key = normalizeTextForSearch(r.title);
              if (!key) continue;
              const normTitle = normalizeTextForSearch(r.title);
              const hasOverlap = variants.some((st) => {
                const stNorm = normalizeTextForSearch(st);
                const queryWords = stNorm.split(/\s+/).filter((w) => w.length >= 3);
                const titleWords = normTitle.split(/\s+/).filter((w) => w.length >= 3);
                if (queryWords.length === 0) return false;
                const matched = queryWords.filter((qw) =>
                  titleWords.some((tw) => tw.includes(qw) || qw.includes(tw))
                );
                if (queryWords.length === 1) return matched.length >= 1;
                return matched.length >= 2;
              });
              if (!hasOverlap) continue;
              if (!seenLocal.has(key)) {
                seenLocal.add(key);
                resultsByProvider[provider.id].push(r);
              }
            }
          }
        } catch (_) {}
      })
    )
  );

  const merged = mergeSearchResults(resultsByProvider, query);
  return {
    success: true,
    data: { query, results: merged.slice(0, 20) },
  };
}

/**
 * When search returns few results, query AniList for the anime's alternative titles
 * and retry each provider with those titles.
 */
async function searchWithAniListAlternatives(query, providers) {
  const altResults = {};
  for (const provider of providers) altResults[provider.id] = [];

  try {
    const ANILIST_URL = "https://graphql.anilist.co";
    const ANILIST_SEARCH_Q = `
      query ($search: String) {
        Media(search: $search, type: ANIME) {
          id
          idMal
          title { romaji english native }
          synonyms
        }
      }
    `;

    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: ANILIST_SEARCH_Q, variables: { search: query } }),
    });
    if (!res.ok) return {};

    const json = await res.json();
    const media = json?.data?.Media;
    if (!media) return {};

    // Build list of alternative titles to search
    const altTitles = new Set();
    const addTitle = (t) => {
      const clean = (t || "").trim();
      if (clean && clean.toLowerCase() !== query.toLowerCase()) altTitles.add(clean);
    };

    if (media.title?.romaji) addTitle(media.title.romaji);
    if (media.title?.english) addTitle(media.title.english);
    if (media.title?.native) addTitle(media.title.native);
    if (Array.isArray(media.synonyms)) {
      for (const s of media.synonyms) addTitle(s);
    }

    // Search each alternative title across all providers
    for (const altTitle of altTitles) {
      for (const provider of providers) {
        try {
          const result = await provider.service.searchAnime(altTitle, provider.domains[0]);
          const results = result?.data?.results ?? [];
          for (const r of results) {
            // Tag with the anilist malId for proper dedup
            const tagged = { ...r, malId: r.malId || media.idMal || null };
            altResults[provider.id].push(tagged);
          }
        } catch (_) {}
      }
    }
  } catch (_) {}

  return altResults;
}

function normalizeDomain(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  try {
    if (trimmed.includes("://")) {
      return new URL(trimmed).hostname.toLowerCase();
    }
    return new URL(`https://${trimmed}`).hostname.toLowerCase();
  } catch (_error) {
    return trimmed.split("/")[0];
  }
}

function domainMatches(domain, candidate) {
  if (!domain || !candidate) {
    return false;
  }

  if (domain === candidate) {
    return true;
  }

  return domain.endsWith(`.${candidate}`);
}

function findProviderByDomain(domainCandidate) {
  const domain = normalizeDomain(domainCandidate);
  if (!domain) {
    return null;
  }

  return (
    PROVIDERS.find((provider) => provider.domains.some((candidate) => domainMatches(domain, candidate))) || null
  );
}

function findProviderById(providerId) {
  if (!providerId || typeof providerId !== "string") {
    return null;
  }

  const normalized = providerId.trim().toLowerCase();
  return PROVIDERS.find((provider) => provider.id === normalized) || null;
}

function findProviderForUrl(urlCandidate) {
  if (!urlCandidate || typeof urlCandidate !== "string") {
    return null;
  }

  try {
    const host = new URL(urlCandidate).hostname;
    return findProviderByDomain(host);
  } catch (_error) {
    return null;
  }
}

async function searchAnime(query, domainCandidate) {
  const forcedProvider = findProviderByDomain(domainCandidate) || findProviderById(domainCandidate);
  const providersToTry = forcedProvider ? [forcedProvider] : PROVIDERS;

  // Build search variants from the query
  const queryVariants = buildQueryVariants(query);

  let lastEmpty = null;
  const errors = [];

  for (const variant of queryVariants) {
    for (const provider of providersToTry) {
      try {
        const result = await provider.service.searchAnime(variant, provider.domains[0]);
        const count = result?.data?.count ?? 0;
        if (count > 0 || forcedProvider) {
          return {
            ...result,
            source: result?.source || provider.id,
          };
        }

        if (!lastEmpty) {
          lastEmpty = {
            ...result,
            source: result?.source || provider.id,
          };
        }
      } catch (error) {
        errors.push({ provider: provider.id, error });
      }
    }
  }

  if (lastEmpty) {
    return lastEmpty;
  }

  if (errors.length === providersToTry.length && errors[0]?.error) {
    throw errors[0].error;
  }

  throw new ApiError(502, "No se pudo completar la busqueda en proveedores");
}

async function getAnimeInfo(urlCandidate) {
  const provider = findProviderForUrl(urlCandidate) || PROVIDERS[0];
  if (!provider) {
    throw new ApiError(400, "Proveedor no soportado");
  }

  const result = await provider.service.getAnimeInfo(urlCandidate);
  return {
    ...result,
    source: result?.source || provider.id,
  };
}

// Fetch anime info from multiple URLs (from different providers) and merge episodes
async function getAnimeInfoMultiUrl(urls) {
  const infosByProvider = {};

  for (const { provider, url } of urls) {
    try {
      const result = await getAnimeInfo(url);
      if (result.success && result.data) {
        infosByProvider[provider] = {
          ...result.data,
          _provider: provider,
        };
      }
    } catch (err) {
      // skip failed providers
    }
  }

  if (Object.keys(infosByProvider).length === 0) {
    throw new ApiError(502, "No se pudo obtener info de anime de ningun proveedor");
  }

  // Use the first provider's base data
  const firstKey = Object.keys(infosByProvider)[0];
  const base = { ...infosByProvider[firstKey] };
  delete base._provider;
  delete base.episodes;

  // Merge episodes from all sources, tagging with provider
  const allEpisodes = [];
  const sources = [];
  let globalEpId = 1;

  for (const [providerId, info] of Object.entries(infosByProvider)) {
    sources.push({ provider: providerId, url: info._url || info.url, episodeCount: (info.episodes || []).length });
    for (const ep of info.episodes || []) {
      allEpisodes.push({
        ...ep,
        id: globalEpId++,
        source: providerId,
      });
    }
  }

  // Sort by episode number
  allEpisodes.sort((a, b) => a.number - b.number);

  return {
    success: true,
    data: {
      ...base,
      episodes: allEpisodes,
      sources,
      _url: urls[0]?.url || '',
    },
  };
}

// Build episode URL for a provider by matching its URL pattern
function buildEpisodeUrlForProvider(baseAnimeUrl, providerId, episodeNum) {
  // jkanime: append /{num}
  if (providerId === "jkanime") {
    const stripped = baseAnimeUrl.replace(/\/$/, "");
    return `${stripped}/${episodeNum}`;
  }
  // tioanime: /ver/{slug}-{num}
  if (providerId === "tioanime") {
    return `${baseAnimeUrl.replace(/\/$/, "")}-${episodeNum}`;
  }
  // Default: try to replace last segment with episode number
  const match = baseAnimeUrl.match(/^(.+\/)(\d+)$/);
  if (match) return `${match[1]}${episodeNum}`;
  return `${baseAnimeUrl.replace(/\/$/, "")}/${episodeNum}`;
}

async function getEpisodeMulti(animeUrl, episodeNum) {
  // Identify which provider owns this URL
  const sourceProvider = findProviderForUrl(animeUrl);
  if (!sourceProvider) {
    throw new ApiError(400, 'Proveedor no soportado para la URL proporcionada');
  }

  // Get the anime title from the source provider
  let animeTitle = '';
  let sourceMalId = null;
  try {
    const infoResult = await getAnimeInfo(animeUrl);
    if (infoResult.success && infoResult.data) {
      animeTitle = infoResult.data.title || '';
      sourceMalId = infoResult.data.malId || null;
    }
  } catch (_) {}

  if (!animeTitle) {
    // Fallback: just fetch the single provider's episode
    return getEpisodeLinks(animeUrl, false, null);
  }

  // Search all providers for the same title (first hit per provider is enough)
  const providersFound = new Set([sourceProvider.id]);
  const titleVariants = buildQueryVariants(animeTitle);

  for (const variant of titleVariants) {
    for (const provider of PROVIDERS) {
      if (providersFound.has(provider.id)) continue;
      try {
        const result = await provider.service.searchAnime(variant, provider.domains[0]);
        const count = result?.data?.count ?? 0;
        if (count > 0) {
          providersFound.add(provider.id);
        }
      } catch (_) {}
    }
    // Once we have at least 2 providers, we can proceed
    if (providersFound.size >= 2) break;
  }

  // Build episode URLs for each found provider
  const episodeUrlsByProvider = [];
  for (const provider of PROVIDERS) {
    if (!providersFound.has(provider.id)) continue;
    // Try to get a base anime URL from search results
    try {
      const result = await provider.service.searchAnime(animeTitle, provider.domains[0]);
      const results = result?.data?.results ?? [];
      const match = results.find(
        (r) => normalizeTextForSearch(r.title) === normalizeTextForSearch(animeTitle)
      );
      if (match && match.url) {
        episodeUrlsByProvider.push({
          provider: provider.id,
          url: buildEpisodeUrlForProvider(match.url, provider.id, episodeNum),
        });
      }
    } catch (_) {}
  }

  if (episodeUrlsByProvider.length === 0) {
    // No multi-source found — return single provider result
    return getEpisodeLinks(animeUrl, false, null);
  }

  // Fetch episode info from all providers in parallel
  const resultsByProvider = {};
  await Promise.all(
    episodeUrlsByProvider.map(async ({ provider, url }) => {
      try {
        const result = await getEpisodeLinks(url, false, null);
        if (result.success && result.data) {
          resultsByProvider[provider] = result.data;
        }
      } catch (_) {}
    })
  );

  // Merge servers from all providers
  const mergedSub = [];
  const mergedDub = [];
  const mergedDownloads = [];
  let firstTitle = '';
  let totalSub = 0;
  let totalDub = 0;

  const seenSub = new Set();
  const seenDub = new Set();
  const seenDl = new Set();

  for (const [providerId, data] of Object.entries(resultsByProvider)) {
    if (!firstTitle && data.title) firstTitle = data.title;
    for (const s of data.servers?.sub ?? []) {
      const key = `${s.server}::${s.url}`;
      if (!seenSub.has(key)) {
        seenSub.add(key);
        mergedSub.push({ ...s, _provider: providerId });
      }
    }
    for (const s of data.servers?.dub ?? []) {
      const key = `${s.server}::${s.url}`;
      if (!seenDub.has(key)) {
        seenDub.add(key);
        mergedDub.push({ ...s, _provider: providerId });
      }
    }
    for (const dl of data.downloadLinks?.SUB ?? []) {
      const key = `${dl.server}::${dl.url}`;
      if (!seenDl.has(key)) {
        seenDl.add(key);
        mergedDownloads.push(dl);
      }
    }
    for (const dl of data.downloadLinks?.DUB ?? []) {
      const key = `${dl.server}::${dl.url}`;
      if (!seenDl.has(key)) {
        seenDl.add(key);
        mergedDownloads.push(dl);
      }
    }
    totalSub += data.servers?.sub?.length ?? 0;
    totalDub += data.servers?.dub?.length ?? 0;
  }

  if (mergedSub.length === 0 && mergedDub.length === 0) {
    // All fetches failed — return single provider
    return getEpisodeLinks(animeUrl, false, null);
  }

  return {
    success: true,
    data: {
      title: firstTitle,
      malId: sourceMalId,
      episode: episodeNum,
      servers: { sub: mergedSub, dub: mergedDub },
      downloadLinks: { SUB: mergedDownloads, DUB: mergedDownloads },
      _sources: Object.keys(resultsByProvider),
      _sourceUrl: animeUrl,
      _episodeNum: episodeNum,
    },
  };
}

async function getEpisodeLinks(urlCandidate, includeMega, excludeServers) {
  const provider = findProviderForUrl(urlCandidate) || PROVIDERS[0];
  if (!provider) {
    throw new ApiError(400, "Proveedor no soportado");
  }

  const result = await provider.service.getEpisodeLinks(urlCandidate, includeMega, excludeServers);
  return {
    ...result,
    source: result?.source || provider.id,
    // Enrich malId from provider if available, otherwise keep null
    // (anilistCache.enrichResults in route handler will try to resolve it)
  };
}

async function getAnimeInfoMultiSource(metadata, baseUrl) {
  const variants = buildSearchVariants(metadata);
  const query = typeof metadata?.title === "string" ? metadata.title : (metadata?.title?.romaji || metadata?.titleJapanese || "");

  const resultsByProvider = {};
  const errors = {};

  // Try each variant across all providers until we get a hit
  const allVariants = [query, ...variants].filter(Boolean);

  // If malId is available, we MUST search ALL providers before deciding
  // because the first provider might return a wrong anime (animeav1 bug)
  const mustSearchAll = !!metadata?.malId;

  for (const variant of allVariants) {
    // Search all providers in parallel for this variant
    const providerResults = await Promise.allSettled(
      MULTI_SOURCE_PROVIDERS.map((provider) =>
        provider.service.searchAnime(variant, provider.domains[0]).then((r) => ({
          provider,
          results: r?.data?.results ?? [],
        }))
      )
    );

    for (const pr of providerResults) {
      if (pr.status !== "fulfilled" || !pr.value) continue;
      const { provider, results } = pr.value;
      if (results.length > 0 && !resultsByProvider[provider.id]) {
        resultsByProvider[provider.id] = { results, variant };
      }
    }

    // If malId is available, keep searching until all variants tried
    // so we give every provider a chance to find the right anime
    if (!mustSearchAll && Object.keys(resultsByProvider).length > 0) break;
  }

  if (Object.keys(resultsByProvider).length === 0) {
    throw new ApiError(404, "Anime no encontrado en ningun proveedor");
  }

  // Get full info from each provider that returned results
  const infosByProvider = {};
  const metadataMalId = metadata?.malId;
  const metadataTitle = typeof metadata?.title === "string"
    ? metadata.title
    : (metadata?.title?.romaji || metadata?.titleJapanese || "");

  for (const [providerId, { results, variant }] of Object.entries(resultsByProvider)) {
    const provider = MULTI_SOURCE_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) continue;

    // Find the best matching result:
    // 1. If malId available, look for a result with matching malId
    // 2. Otherwise prefer exact title match
    // 3. Fall back to first result
    let best = null;
    if (results.length === 1) {
      best = results[0];
    } else if (results.length > 1) {
      if (metadataMalId) {
        // Try to find result with matching malId
        best = results.find(r => r.malId === metadataMalId || r.anilistMalId === metadataMalId) || null;
      }
      if (!best) {
        // Fall back to title matching - use the first exact match
        const normalizedMetaTitle = metadataTitle.toLowerCase().trim();
        best = results.find(r => {
          const resultTitle = (r.title || "").toLowerCase().trim();
          return resultTitle === normalizedMetaTitle;
        }) || null;
        // If still no match, use first result as fallback
        if (!best) best = results[0];
      }
    } else {
      best = results[0];
    }

    if (!best || !best.url) continue;

    // Validate title match (fuzzy: handles romaji vs spanish, special chars, etc.)
    const hasMatch = titlesMatch(best.title || "", metadataTitle);

    if (!hasMatch) {
      // Title doesn't match - if animeav1, try jkanime fallback
      if (providerId === "animeav1" && resultsByProvider["jkanime"]) {
        const jkResults = resultsByProvider["jkanime"].results;
        if (jkResults.length > 0) {
          const jkBest = jkResults[0];
          if (jkBest?.url) {
            try {
              const jkInfo = await jkanimeService.getAnimeInfo(jkBest.url);
              if (jkInfo.success && jkInfo.data) {
                infosByProvider["jkanime"] = {
                  ...jkInfo.data,
                  _provider: "jkanime",
                  _url: jkBest.url,
                  _searchVariant: resultsByProvider["jkanime"].variant,
                };
              }
            } catch (_) {}
          }
        }
      }
      // Skip this provider - animeav1 already handled above, other providers fail validation
      console.log(`[getAnimeInfoMultiSource] Skipping ${providerId}: title mismatch '${best.title}' vs '${metadataTitle}'`);
      continue;
    }

    console.log(`[getAnimeInfoMultiSource] Fetching info for ${providerId} with URL: ${best.url}`);
    try {
      const info = await provider.service.getAnimeInfo(best.url);
      if (info.success && info.data) {
        console.log(`[getAnimeInfoMultiSource] Success from ${providerId}: ${info.data.title}`);
        infosByProvider[providerId] = {
          ...info.data,
          _provider: providerId,
          _url: best.url,
          _searchVariant: variant,
        };
      }
    } catch (err) {
      console.log(`[getAnimeInfoMultiSource] ${providerId} failed: ${err.message}`);
      errors[providerId] = err;
    }
  }

  if (Object.keys(infosByProvider).length === 0) {
    throw new ApiError(502, "No se pudo obtener info de anime de ningun proveedor");
  }

  // Merge episodes from all sources, only include episodes with valid URLs
  const primary = Object.values(infosByProvider)[0];
  const allEpisodes = [];

  for (const [, info] of Object.entries(infosByProvider)) {
    const eps = info.episodes || [];
    for (const ep of eps) {
      // Skip episodes without valid URL
      if (!ep.url || typeof ep.url !== "string") continue;
      const exists = allEpisodes.some(
        (e) => e.number === ep.number && e.source === ep.source
      );
      if (!exists) {
        allEpisodes.push({ ...ep, source: info._provider });
      }
    }
  }

  allEpisodes.sort((a, b) => (a.number || 0) - (b.number || 0));

  // If no episodes with valid URLs found, return error
  if (allEpisodes.length === 0) {
    throw new ApiError(404, "No se encontraron episodios con URL válida");
  }

  return {
    success: true,
    data: {
      ...primary,
      episodes: allEpisodes,
      sources: Object.entries(infosByProvider).map(([provider, info]) => ({
        provider,
        url: info._url,
        episodeCount: (info.episodes || []).length,
      })),
    },
  };
}

module.exports = {
  searchAnime,
  searchAnimeMultiSource,
  getAnimeInfo,
  getAnimeInfoMultiSource,
  getAnimeInfoMultiUrl,
  getEpisodeLinks,
  getEpisodeMulti,
  getCoverUrlById,
};

// Fetch cover URL by anilistId or malId using GraphQL
async function getCoverUrlById(id, source = "anilist") {
  const query = source === "anilist"
    ? `query($id: Int) {
        Media(id: $id, type: ANIME) {
          coverImage { large }
        }
      }`
    : `query($id: Int) {
        Media(idMal: $id, type: ANIME) {
          coverImage { large }
        }
      }`;

  const vars = source === "anilist" ? { id: Number(id) } : { id: Number(id) };

  try {
    const response = await axios.post(
      "https://graphql.anilist.co",
      { query, variables: vars },
      { headers: { "Content-Type": "application/json", "Accept": "application/json" }, timeout: 10000 }
    );
    const data = response.data?.data?.Media;
    return data?.coverImage?.large || null;
  } catch (err) {
    console.error(`[animeService] getCoverUrlById ${source}#${id} error:`, err.message);
    return null;
  }
}
