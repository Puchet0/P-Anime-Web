import { supabase, hasSupabase } from '../api/supabase';

export type CacheType = 'anime' | 'covers' | 'homepage' | 'anilist' | 'episode';

export interface CacheEntry<T = unknown> {
  key: string;
  type: CacheType;
  data: T;
  staleMs: number;
  createdAt: string;
  updatedAt: string;
}

// Default stale times per type (ms)
export const CACHE_TTLS: Record<CacheType, number> = {
  anime: 10 * 60 * 1000,
  episode: 5 * 60 * 1000,
  covers: 30 * 24 * 60 * 60 * 1000,
  homepage: 12 * 60 * 60 * 1000,
  anilist: 30 * 24 * 60 * 60 * 1000,
};

// Hash a cache key to a fixed-length string (safe for PostgREST queries)
// Uses FNV-1a (no crypto.subtle needed — works on HTTP too)
function hashKey(key: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

// Local in-memory cache (L1)
const localCache = new Map<string, { data: unknown; expiresAt: number }>();

function localGet<T>(key: string): T | null {
  const entry = localCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    localCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function localSet(key: string, data: unknown, ttlMs: number) {
  localCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function localDelete(key: string) {
  localCache.delete(key);
}

// Supabase cache (L2) — async, shared across users
export async function cacheGet<T>(key: string, type: CacheType): Promise<T | null> {
  // Check L1 first
  const cached = localGet<T>(key);
  if (cached !== null) return cached;

  // Skip L2 if Supabase not configured
  if (!hasSupabase || !supabase) return null;

  // Check L2 (Supabase) — hash key to avoid special-char issues in PostgREST
  try {
    const hashed = hashKey(key);
    const { data, error } = await supabase
      .from('anime_cache')
      .select('data, stale_seconds, updated_at')
      .eq('cache_key', hashed)
      .maybeSingle();

    if (error || !data) return null;

    const staleMs = (data.stale_seconds || CACHE_TTLS[type]) * 1000;
    const updatedAt = new Date(data.updated_at).getTime();
    const age = Date.now() - updatedAt;

    if (age > staleMs) {
      // Stale — don't return but keep key for background refresh hint
      return null;
    }

    // Store in L1 with remaining TTL
    const remainingMs = staleMs - age;
    if (remainingMs > 0) {
      localSet(key, data.data as T, remainingMs);
    }

    return data.data as T;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  type: CacheType,
  data: T,
  staleSeconds?: number
): Promise<void> {
  const stale = staleSeconds || Math.floor(CACHE_TTLS[type] / 1000);

  // L1
  localSet(key, data, stale * 1000);

  // Skip L2 if Supabase not configured
  if (!hasSupabase || !supabase) return;

  // L2 (Supabase) — hash key to match cacheGet
  try {
    const hashed = hashKey(key);
    await supabase.rpc('upsert_anime_cache', {
      p_key: hashed,
      p_type: type,
      p_data: data as unknown as Record<string, unknown>,
      p_stale_seconds: stale,
    });
  } catch (err) {
    console.warn('[Cache] Failed to persist to Supabase:', err);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  localDelete(key);
  if (!hasSupabase || !supabase) return;
  try {
    const hashed = hashKey(key);
    await supabase
      .from('anime_cache')
      .delete()
      .eq('cache_key', hashed)
      .then(({ error }) => {
        if (error) console.warn('[Cache] Failed to delete from Supabase:', error);
      });
  } catch {
    // Supabase unreachable — ignore
  }
}

// Typed cache helpers
export async function getAnimeCache<T>(url: string): Promise<T | null> {
  return cacheGet<T>(`anime:${url}`, 'anime');
}

export async function setAnimeCache<T>(url: string, data: T, staleSeconds?: number): Promise<void> {
  return cacheSet(`anime:${url}`, 'anime', data, staleSeconds);
}

export async function getEpisodeCache<T>(url: string): Promise<T | null> {
  return cacheGet<T>(`episode:${url}`, 'episode');
}

export async function setEpisodeCache<T>(url: string, data: T, staleSeconds?: number): Promise<void> {
  return cacheSet(`episode:${url}`, 'episode', data, staleSeconds);
}

export async function getHomepageCache<T>(key: string): Promise<T | null> {
  return cacheGet<T>(`homepage:${key}`, 'homepage');
}

export async function setHomepageCache<T>(key: string, data: T, staleSeconds?: number): Promise<void> {
  return cacheSet(`homepage:${key}`, 'homepage', data, staleSeconds);
}

export async function getCoversCache<T>(key: string): Promise<T | null> {
  return cacheGet<T>(`covers:${key}`, 'covers');
}

export async function setCoversCache<T>(key: string, data: T, staleSeconds?: number): Promise<void> {
  return cacheSet(`covers:${key}`, 'covers', data, staleSeconds);
}

export async function getAnilistCache<T>(key: string): Promise<T | null> {
  return cacheGet<T>(`anilist:${key}`, 'anilist');
}

export async function setAnilistCache<T>(key: string, data: T, staleSeconds?: number): Promise<void> {
  return cacheSet(`anilist:${key}`, 'anilist', data, staleSeconds);
}