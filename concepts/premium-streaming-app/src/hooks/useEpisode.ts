import { useQuery } from '@tanstack/react-query';
import { getEpisodeInfo } from '../api/anime.api';

export function useEpisodeInfo(url: string | null) {
  return useQuery({
    queryKey: ['anime', 'episode', url],
    queryFn: () => getEpisodeInfo(url!),
    enabled: !!url,
    staleTime: 5 * 60 * 1000,
  });
}