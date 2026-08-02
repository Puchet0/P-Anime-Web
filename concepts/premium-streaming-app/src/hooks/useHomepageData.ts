import { useQuery } from '@tanstack/react-query';
import { getRecentEpisodes, getCurrentSeasonAnime, getPopularAnime } from '../api/anilist.api';

// Cache for 1 hour — persists across page reloads via localStorage persistence
const CACHE_BUSTER = 4;

export function useRecentEpisodes(hoursAgo = 72) {
  return useQuery({
    queryKey: ['recent-episodes-fixed', hoursAgo, CACHE_BUSTER],
    queryFn: () => getRecentEpisodes(hoursAgo),
    staleTime: 12 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useCurrentSeason() {
  return useQuery({
    queryKey: ['current-season-fixed', CACHE_BUSTER],
    queryFn: getCurrentSeasonAnime,
    staleTime: 12 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function usePopularAnime() {
  return useQuery({
    queryKey: ['popular-anime-fixed', CACHE_BUSTER],
    queryFn: getPopularAnime,
    staleTime: 12 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}