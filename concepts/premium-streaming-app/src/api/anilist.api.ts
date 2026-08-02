import type { AniListMedia, AniListAiringSchedule, AniListSingleData, AniListPageData, AiringScheduleData, CurrentSeasonData } from './anilist.types';

const ANILIST_URL = 'https://graphql.anilist.co';

// Minimal query for search results (grid cards)
const SEARCH_METADATA_QUERY = `
  query ($search: String) {
    Page(perPage: 1) {
      media(search: $search, type: ANIME, isAdult: false, genre_not_in: ["Hentai"]) {
        id
        idMal
        title { romaji english native }
        coverImage { extraLarge large color }
        bannerImage
        averageScore
        genres
        synonyms
        seasonYear
        status
      }
    }
  }
`;

// Full query for anime detail page
const FULL_METADATA_QUERY = `
  query ($search: String) {
    Media(search: $search, type: ANIME, isAdult: false, genre_not_in: ["Hentai"]) {
      id
      idMal
      title { romaji english native }
      description(asHtml: false)
      coverImage { extraLarge large color }
      bannerImage
      genres
      averageScore
      episodes
      status
      season
      seasonYear
      studios(isMain: true) { nodes { name } }
      trailer { id site }
      characters(sort: ROLE, perPage: 6) {
        nodes {
          name { full }
          image { large }
        }
      }
    }
  }
`;

// anilistQuery returns json as T (no .data wrapper — the response IS the data)

async function anilistQuery<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  try {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    console.log('[AniList] Status:', response.status, 'OK:', response.ok);

    if (!response.ok) {
      const text = await response.text();
      console.warn('[AniList] Not OK:', response.status, text.slice(0, 200));
      return null;
    }

    const json = await response.json();

    if (json.errors) {
      console.warn('[AniList] GraphQL errors:', json.errors);
      return null;
    }

    return json.data as T;
  } catch (err) {
    console.warn('[AniList] Fetch failed:', err);
    return null;
  }
}

/**
 * Clean a Spanish/localized title to improve AniList match rate.
 * Removes common Spanish suffixes, season numbers, etc.
 */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*-\s*Temporada\s*\d*/gi, '')
    .replace(/\s*-\s*Temp\s*\d*/gi, '')
    .replace(/\(\s*(Sub|Español|Latino|Castellano)\s*(Español|Latino|Castellano)?\s*\)/gi, '')
    .replace(/\[\s*(Sub|Español|Latino)\s*(Español|Latino)?\s*\]/gi, '')
    .replace(/[📺👁️]*/g, '')
    .replace(/\s*-\s*(Dub|sub)\s*(Español)?\s*$/gi, '')
    .replace(/\s*-\s*Completo\s*$/gi, '')
    .replace(/^\d+\s*[×x]\s*\d+\s*/g, '')
    .replace(/\d+\s*°?\s*(Temporada|Season|temp)\s*\d*/gi, '')
    .trim();
}

/**
 * Build search variants from a title: exact, cleaned, and progressively shorter.
 */
function buildSearchVariants(title: string): string[] {
  const cleaned = cleanTitle(title);
  const words = cleaned.split(/\s+/).filter(Boolean);
  return [
    title.trim(),
    cleaned,
    words.slice(0, 4).join(' '),
    words.slice(0, 3).join(' '),
    words.slice(0, 2).join(' '),
  ];
}

export interface AniListSearchResult {
  malId: number | null;
  coverImage: string;
  color: string | null;
  bannerImage: string | null;
  averageScore: number | null;
  genres: string[];
  synonyms: string[];
  seasonYear: number | null;
  status: string | null;
  title: { romaji: string; english: string | null; native: string | null };
}

/**
 * Search AniList with fallback variants — returns first match.
 * Tries MAL ID hint first, then title variants.
 */
export async function searchAniList(
  title: string,
  malIdHint?: number | null
): Promise<AniListSearchResult | null> {
  // Try MAL ID first if available
  if (malIdHint) {
    const data = await anilistQuery<AniListSingleData>(
      `query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
          id idMal title { romaji english native }
          coverImage { extraLarge large color }
          bannerImage averageScore genres synonyms seasonYear status
        }
      }`,
      { idMal: malIdHint }
    );

    if (data?.Media) {
      const m = data.Media;
      return {
        malId: m.idMal,
        coverImage: m.coverImage.extraLarge || m.coverImage.large,
        color: m.coverImage.color,
        bannerImage: m.bannerImage,
        averageScore: m.averageScore,
        genres: m.genres,
        synonyms: m.synonyms || [],
        seasonYear: m.seasonYear,
        status: m.status,
        title: m.title,
      };
    }
  }

  // Try search variants
  for (const variant of buildSearchVariants(title)) {
    if (!variant || variant.length < 2) continue;

    const data = await anilistQuery<AniListPageData>(SEARCH_METADATA_QUERY, { search: variant });

    const media = data?.Page?.media?.[0];

    if (media) {
      return {
        malId: media.idMal,
        coverImage: media.coverImage.extraLarge || media.coverImage.large,
        color: media.coverImage.color,
        bannerImage: media.bannerImage,
        averageScore: media.averageScore,
        genres: media.genres,
        synonyms: media.synonyms || [],
        seasonYear: media.seasonYear,
        status: media.status,
        title: media.title,
      };
    }
  }

  return null;
}

/**
 * Fetch minimal metadata by AniList ID (for resolving favorites/following links).
 */
export async function fetchAniListById(id: number): Promise<AniListMedia | null> {
  return anilistQuery<AniListSingleData>(
    `query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id idMal title { romaji english native }
        description(asHtml: false) coverImage { extraLarge large color }
        bannerImage genres averageScore episodes status season seasonYear
        studios(isMain: true) { nodes { name } }
        trailer { id site }
        characters(sort: ROLE, perPage: 6) {
          nodes { name { full } image { large } }
        }
      }
    }`,
    { id }
  ).then(d => d?.Media ?? null);
}

/**
 * Full metadata fetch for anime detail page.
 */
export async function fetchAniListFull(
  title: string,
  malIdHint?: number | null
): Promise<AniListMedia | null> {
  // Try MAL ID first if available
  if (malIdHint) {
    const data = await anilistQuery<AniListSingleData>(
      `query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
          id idMal title { romaji english native }
          description(asHtml: false) coverImage { extraLarge large color }
          bannerImage genres averageScore episodes status season seasonYear
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

  for (const variant of buildSearchVariants(title)) {
    if (!variant || variant.length < 2) continue;

    const data = await anilistQuery<AniListSingleData>(FULL_METADATA_QUERY, { search: variant });

    if (data?.Media) {
      return data.Media;
    }
  }

  return null;
}

// ─── Homepage: Recent Episodes (AiringSchedule) ───────────────────────────────

export async function getRecentEpisodes(hoursAgo = 72): Promise<AniListAiringSchedule[]> {
  const now = Math.floor(Date.now() / 1000);
  const since = now - 60 * 60 * hoursAgo;

  const query = `
    query ($gt: Int, $lt: Int) {
      Page(perPage: 50) {
        airingSchedules(airingAt_greater: $gt, airingAt_lesser: $lt, sort: TIME_DESC) {
          id
          episode
          airingAt
          media {
            id
            idMal
            title { romaji english native }
            coverImage { extraLarge large color }
            bannerImage
            genres
            averageScore
            format
            episodes
            status
          }
        }
      }
    }
  `;

  const data = await anilistQuery<AiringScheduleData>(query, { gt: since, lt: now });
  const schedules = data?.Page?.airingSchedules ?? [];
  // Filter out adult/hentai content client-side
  return schedules.filter((s) => {
    const genres = s.media.genres || [];
    return !genres.some((g) => g.toLowerCase() === 'hentai');
  });
}

// ─── Homepage: Current Season Anime ──────────────────────────────────────────

export async function getCurrentSeasonAnime(): Promise<AniListMedia[]> {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const seasonMap: [number, string][] = [
    [1, 'WINTER'], [2, 'WINTER'], [3, 'WINTER'],
    [4, 'SPRING'], [5, 'SPRING'], [6, 'SPRING'],
    [7, 'SUMMER'], [8, 'SUMMER'], [9, 'SUMMER'],
    [10, 'FALL'], [11, 'FALL'], [12, 'FALL'],
  ];
  const season = seasonMap.find(([m]) => m === month)?.[1] ?? 'FALL';

  const query = `
    query ($season: MediaSeason, $year: Int) {
      Page(perPage: 30) {
        media(season: $season, seasonYear: $year, type: ANIME,
              status: RELEASING, sort: POPULARITY_DESC, format_in: [TV, OVA],
              isAdult: false, genre_not_in: ["Hentai"]) {
          id
          idMal
          title { romaji english native }
          coverImage { extraLarge large color }
          bannerImage
          genres
          averageScore
          episodes
          format
          status
          nextAiringEpisode { episode airingAt timeUntilAiring }
        }
      }
    }
  `;

  const data = await anilistQuery<CurrentSeasonData>(query, { season, year });
  console.log('[anilist.api] getCurrentSeasonAnime result:', data);
  return data?.Page?.media ?? [];
}

// ─── Homepage: All-Time Popular (Hero/Banner) ───────────────────────────────

export async function getPopularAnime(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(perPage: 10) {
        media(type: ANIME, sort: POPULARITY_DESC, format: TV, status_not: NOT_YET_RELEASED,
              isAdult: false, genre_not_in: ["Hentai"]) {
          id
          idMal
          title { romaji english native }
          description(asHtml: false)
          coverImage { extraLarge large color }
          bannerImage
          genres
          averageScore
          trailer { id site }
          status
          episodes
        }
      }
    }
  `;

  const data = await anilistQuery<CurrentSeasonData>(query, {});
  console.log('[anilist.api] getPopularAnime result:', data);
  return data?.Page?.media ?? [];

}
