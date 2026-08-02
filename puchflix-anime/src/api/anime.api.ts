import apiClient from './axiosClient';
import { getAnimeCache, setAnimeCache, getEpisodeCache, setEpisodeCache, getCoversCache, setCoversCache } from '../services/cacheService';
import type {
  AnimeResult,
  AnimeInfo,
  EpisodeInfo,
  DownloadRequest,
  DownloadStatus,
} from './types';

interface SearchResponse {
  success: boolean;
  data: {
    query: string;
    results: AnimeResult[];
  };
}

interface InfoResponse {
  success: boolean;
  data: AnimeInfo;
}

interface EpisodeResponse {
  success: boolean;
  data: EpisodeInfo;
}

interface AnilistMetadata {
  title?: string;
  titleJapanese?: string | null;
  synonyms?: string[];
  malId?: number | null;
  anilistId?: number | null;
}

export async function searchAnime(query: string, domain?: string): Promise<AnimeResult[]> {
  const cacheKey = `search:${query}:${domain || 'all'}`;
  const cached = await getCoversCache<AnimeResult[]>(cacheKey);
  if (cached) return cached;

  const params: Record<string, string> = { q: query };
  if (domain) params.domain = domain;
  else params.domain = 'all';

  const response = await apiClient.get<SearchResponse>('/anime/search', { params });
  const results = response.data.data.results;
  await setCoversCache(cacheKey, results, 10 * 60);
  return results;
}

export async function searchAnimeMultiSource(
  query: string,
  metadata?: AnilistMetadata
): Promise<AnimeResult[]> {
  const response = await apiClient.post<SearchResponse>('/anime/search-multi', {
    q: query,
    metadata,
  });
  return response.data.data.results;
}

export async function getAnimeInfo(url: string): Promise<AnimeInfo> {
  const cached = await getAnimeCache<AnimeInfo>(url);
  if (cached) return cached;

  const response = await apiClient.get<InfoResponse>('/anime/info', { params: { url } });
  const data = response.data.data;
  await setAnimeCache(url, data, 10 * 60);
  return data;
}

export async function getAnimeInfoMultiSource(
  url?: string,
  metadata?: AnilistMetadata
): Promise<AnimeInfo> {
  const cacheKey = `multi:${metadata?.malId || metadata?.title || 'unknown'}`;
  const cached = await getAnimeCache<AnimeInfo>(cacheKey);
  if (cached) return cached;

  const response = await apiClient.post<InfoResponse>('/anime/info-multi', { url, metadata });
  const data = response.data.data;
  await setAnimeCache(cacheKey, data, 10 * 60);
  return data;
}

export async function getAnimeInfoMultiUrl(
  urls: { provider: string; url: string }[]
): Promise<AnimeInfo> {
  const response = await apiClient.post<InfoResponse>('/anime/info-multi-url', { urls });
  return response.data.data;
}

export async function getEpisodeInfo(url: string): Promise<EpisodeInfo> {
  const cached = await getEpisodeCache<EpisodeInfo>(url);
  if (cached) return cached;

  const response = await apiClient.get<EpisodeResponse>('/anime/episode', { params: { url } });
  const data = response.data.data;
  await setEpisodeCache(url, data, 5 * 60);
  return data;
}

export async function getEpisodeInfoMulti(
  animeUrl: string | null,
  episodeNum: number,
  episodeUrl?: string | null
): Promise<EpisodeInfo & { _sources?: string[] }> {
  const params: Record<string, string | number> = { episodeNum };
  if (animeUrl) {
    params.animeUrl = animeUrl;
  } else if (episodeUrl) {
    params.episodeUrl = episodeUrl;
  }
  const response = await apiClient.get<EpisodeResponse>('/anime/episode-multi', { params });
  return response.data.data;
}

export async function startDownload(data: DownloadRequest): Promise<{ id: string }> {
  return apiClient.post('/anime/download', data);
}

export async function getDownloadStatus(id: string): Promise<DownloadStatus> {
  return apiClient.get(`/anime/download/${id}`);
}

export async function batchDownload(animeUrl: string, episodes: number[], variant?: 'SUB' | 'DUB') {
  return apiClient.post('/anime/batch', { animeUrl, episodes, variant });
}