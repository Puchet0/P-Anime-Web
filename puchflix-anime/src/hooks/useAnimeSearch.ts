import { useQuery } from '@tanstack/react-query';
import { searchAnime } from '../api/anime.api';

export function useAnimeSearch(query: string, domain?: string) {
  return useQuery({
    queryKey: ['anime', 'search', query, domain || 'all'],
    queryFn: async () => {
      const result = await searchAnime(query, domain);
      return result;
    },
    enabled: query.length >= 2,
    staleTime: 10 * 60 * 1000,
  });
}