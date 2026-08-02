import { useQuery } from '@tanstack/react-query';
import { getAnimeInfo } from '../api/anime.api';

export function useAnimeInfo(url: string | null) {
  return useQuery({
    queryKey: ['anime', 'info', url],
    queryFn: () => getAnimeInfo(url!),
    enabled: !!url,
    staleTime: 10 * 60 * 1000,
  });
}