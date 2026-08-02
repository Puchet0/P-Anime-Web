import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getCoversCache, setCoversCache } from '../services/cacheService';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const coverClient = axios.create({
  baseURL: API_BASE_URL,
  params: {
    apiKey: import.meta.env.VITE_API_KEY,
  },
  timeout: 15000,
});

export interface CoverMap {
  [sourceUrl: string]: string;
}

/**
 * Convert any URL (relative or absolute) to a relative path.
 * Backend may return absolute URLs in some configurations; we always want relative
 * so nginx can proxy them to the backend on the same origin.
 */
function toRelative(url: string): string {
  if (!url) return url;
  if (url.startsWith('/')) return url;
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

/**
 * Batch-fetch cover images through the backend cache.
 * Only fetches URLs that aren't already on our own backend.
 */
export function useCoverProxy(urls: (string | null | undefined)[]) {
  const filtered = urls.filter(
    (u): u is string => Boolean(u && typeof u === 'string' && u.startsWith('http') && !u.includes(API_BASE_URL))
  );

  return useQuery({
    queryKey: ['covers-v2', ...filtered.slice(0, 20).sort()],
    queryFn: async () => {
      if (filtered.length === 0) return {};

      // Check Supabase cache first
      const cacheKey = [...new Set(filtered.slice(0, 20).sort())].join('|');
      const cached = await getCoversCache<CoverMap>(cacheKey);
      if (cached) return cached;

      const response = await coverClient.post<{ success: boolean; data: CoverMap }>(
        '/covers/batch',
        { urls: filtered.slice(0, 50) }
      );
      const data = response.data.data ?? {};
      // Normalize all URLs to relative paths
      const relativeData: CoverMap = {};
      for (const [key, value] of Object.entries(data)) {
        relativeData[key] = toRelative(value);
      }
      // Cache in Supabase (24h)
      await setCoversCache(cacheKey, relativeData, 24 * 60 * 60);
      return relativeData;
    },
    enabled: filtered.length > 0,
    staleTime: 30 * 24 * 60 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Extract filename from an AniList CDN URL (e.g., "bx199588-M2vtWicvqNbU.jpg").
 */
function extractAnilistFilename(url: string): string | null {
  const match = url.match(/\/([^\/]+\.(?:jpg|png|jpeg|gif))$/);
  return match ? match[1] : null;
}

/**
 * Apply a cover map to a list of items that have `image` and/or `coverImage` fields.
 * Replaces the original URLs with local proxy URLs.
 * For AniList CDN URLs not in the map, constructs a proxy URL that triggers fetch-on-miss.
 */
export function applyCoverMap<T extends { image?: string | null; coverImage?: string | null; anilistCoverImage?: string | null }>(
  items: T[],
  coverMap: CoverMap
): T[] {
  return items.map((item) => {
    // Map image → proxy URL when available, keep original otherwise
    const mappedImage = item.image && coverMap[item.image] ? coverMap[item.image] : item.image;
    // Map coverImage (also fixes getAnimeImage fallback path)
    const mappedCover = item.coverImage && coverMap[item.coverImage] ? coverMap[item.coverImage] : item.coverImage;
    // Map anilistCoverImage (used when scraper has no image)
    let mappedAnilistCover = item.anilistCoverImage && coverMap[item.anilistCoverImage] ? coverMap[item.anilistCoverImage] : item.anilistCoverImage;
    // If not in map, construct proxy URL from filename so fetch-on-miss works
    if (!mappedAnilistCover && item.anilistCoverImage) {
      const fn = extractAnilistFilename(item.anilistCoverImage);
      if (fn) mappedAnilistCover = `/covers/${fn}`;
    }
    return { ...item, image: mappedImage, coverImage: mappedCover, anilistCoverImage: mappedAnilistCover };
  });
}

/**
 * Promotes anilistCoverImage → image when image is empty AND anilistCoverImage
 * is already mapped to a local proxy URL. Only promotes after the proxy resolves.
 * Returns a new array (original items are not mutated).
 */
export function promoteAnilistCover<T extends { image?: string | null; anilistCoverImage?: string | null; coverImage?: string | null }>(
  items: T[],
  coverMap: CoverMap = {}
): T[] {
  return items.map((item) => {
    if (!item.image && item.anilistCoverImage) {
      // Only promote if anilistCoverImage is already mapped to a proxy URL
      if (coverMap[item.anilistCoverImage]) {
        return { ...item, image: coverMap[item.anilistCoverImage] };
      }
      // If not yet mapped, leave image empty so AnimeCard renders coverImage/anilistCoverImage directly
      // (getAnimeImage will fall through to those fields, which are allowed direct loading)
    }
    return item;
  });
}