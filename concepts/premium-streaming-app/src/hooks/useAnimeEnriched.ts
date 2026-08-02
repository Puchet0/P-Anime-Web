import { useQuery } from '@tanstack/react-query';
import { fetchAniListFull, type AniListSearchResult } from '../api/anilist.api';
import { getAnimeInfo, getAnimeInfoMultiSource } from '../api/anime.api';
import type { AnimeInfo } from '../api/types';
import type { AniListMedia } from '../api/anilist.types';

export interface EnrichedAnime extends Omit<AnimeInfo, 'image' | 'backdrop'> {
  // AniList cover takes priority, falls back to scraper image
  image: string | null;
  backdrop: string | null;
  // AniList enrichment
  anilistCoverImage: string | null;
  anilistBannerImage: string | null;
  anilistColor: string | null;
  anilistFullDescription: string | null;
  anilistGenres: string[];
  anilistScore: number | null;
  anilistStatus: string | null;
  anilistSeasonYear: number | null;
  anilistSeason: string | null;
  anilistStudios: string[];
  anilistTrailer: { id: string; site: string } | null;
  anilistCharacters: { name: string; image: string }[];
  anilistTitle: { romaji: string; english: string | null; native: string | null } | null;
  anilistSynonyms: string[];
  // Multi-source data
  sources?: { provider: string; url: string; episodeCount: number }[];
}

function mergeAnimeData(
  scraperData: AnimeInfo,
  anilistData: AniListMedia | null
): EnrichedAnime {
  if (!anilistData) {
    return {
      ...scraperData,
      anilistCoverImage: null,
      anilistBannerImage: null,
      anilistColor: null,
      anilistFullDescription: null,
      anilistGenres: [],
      anilistScore: null,
      anilistStatus: null,
      anilistSeasonYear: null,
      anilistSeason: null,
      anilistStudios: [],
      anilistTrailer: null,
      anilistCharacters: [],
      anilistTitle: null,
      anilistSynonyms: [],
    };
  }

  const coverImage = anilistData.coverImage.extraLarge || anilistData.coverImage.large;

  return {
    ...scraperData,
    // Scraper's image only used if AniList has nothing
    image: coverImage || scraperData.image,
    backdrop: anilistData.bannerImage || scraperData.backdrop,
    // AniList enrichment fields
    anilistCoverImage: coverImage,
    anilistBannerImage: anilistData.bannerImage,
    anilistColor: anilistData.coverImage.color,
    anilistFullDescription: anilistData.description,
    anilistGenres: anilistData.genres,
    anilistScore: anilistData.averageScore,
    anilistStatus: anilistData.status,
    anilistSeasonYear: anilistData.seasonYear,
    anilistSeason: anilistData.season,
    anilistStudios: anilistData.studios.nodes.map((s) => s.name),
    anilistTrailer: anilistData.trailer,
    anilistCharacters: anilistData.characters.nodes.map((c) => ({
      name: c.name.full,
      image: c.image.large,
    })),
    anilistTitle: anilistData.title,
    anilistSynonyms: anilistData.synonyms || [],
  };
}

export function useAnimeEnriched(
  url: string | null,
  anilistMetadata?: AniListSearchResult | null
) {
  // Use multi-source when we have AniList metadata but no direct URL
  const useMultiSource = !!anilistMetadata && !url;

  const scraperQuery = useQuery({
    queryKey: ['anime', 'info', url, anilistMetadata?.title?.romaji],
    queryFn: () => {
      if (useMultiSource) {
        return getAnimeInfoMultiSource(undefined, {
          title: anilistMetadata!.title.romaji,
          titleJapanese: anilistMetadata!.title.native || undefined,
          synonyms: anilistMetadata!.synonyms,
          malId: anilistMetadata!.malId || undefined,
          anilistId: anilistMetadata!.malId || undefined,
        });
      }
      return getAnimeInfo(url!);
    },
    enabled: !!url || useMultiSource,
    staleTime: 30 * 60 * 1000,
  });

  const anilistQuery = useQuery({
    queryKey: ['anilist', scraperQuery.data?.title, scraperQuery.data?.malId],
    queryFn: () => fetchAniListFull(scraperQuery.data!.title, scraperQuery.data?.malId),
    // Only fetch once we have the scraper data (title available)
    enabled: !!scraperQuery.data?.title,
    staleTime: 24 * 60 * 60 * 1000, // 24h — metadata rarely changes
    // Don't refetch if AniList already has data
    retry: (failureCount, error) => {
      // Don't retry on 429 (rate limit)
      if (error instanceof TypeError) return failureCount < 2;
      return false;
    },
  });

  const merged = scraperQuery.data
    ? mergeAnimeData(scraperQuery.data, anilistQuery.data ?? null)
    : null;

  // Attach multi-source data if present
  if (merged && scraperQuery.data?.sources) {
    merged.sources = (scraperQuery.data as any).sources;
  }

  return {
    data: merged,
    // Loading states
    isLoading: scraperQuery.isLoading,
    isLoadingAniList: anilistQuery.isLoading,
    // Whether both are done
    isLoaded: !scraperQuery.isLoading && !anilistQuery.isFetching,
    // Individual states
    scraperError: scraperQuery.error,
    anilistError: anilistQuery.error,
    // Individual refetch
    refetchScraper: scraperQuery.refetch,
    refetchAniList: anilistQuery.refetch,
  };
}