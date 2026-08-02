import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { useFavoritesStore } from '../store/favoritesStore';
import { useHistoryStore } from '../store/historyStore';
import { getAnimeInfo, getAnimeInfoMultiUrl, getAnimeInfoMultiSource } from '../api/anime.api';
import type { AniListSearchResult } from '../api/anilist.api';
import { fetchAniListFull } from '../api/anilist.api';
import type { AnimeInfo, EpisodeLink } from '../api/types';
import { Heart, Play, Star, Film, Calendar, Tv, User, Eye, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addFollowing, removeFollowing, getFollowing } from '../api/auth.api';
import { useQueryClient } from '@tanstack/react-query';

interface EnrichedAnime extends Omit<AnimeInfo, 'image' | 'backdrop' | 'episodes'> {
  image: string | null;
  backdrop: string | null;
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
  episodes: EpisodeLink[];
  sources: { provider: string; url: string; episodeCount: number }[];
}

function formatScore(score: number | null): string {
  if (!score) return 'N/A';
  return (score / 10).toFixed(2);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function AnimePage() {
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url');

  // Parse AniList metadata from URL params
  const anilistParam = searchParams.get('anilist');
  let anilistMetadata: AniListSearchResult | null = null;
  if (anilistParam) {
    try {
      anilistMetadata = JSON.parse(decodeURIComponent(anilistParam));
    } catch {}
  }

  // Refetch trigger: increment when anime changes to force React Query refetch
  // (prevents stale data from being shown when navigating between different animes)
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const prevAnimeKey = useRef<string>('');

  const currentAnimeKey = anilistMetadata ? `anilist:${anilistMetadata.malId}` : `url:${url}`;

  useEffect(() => {
    if (currentAnimeKey !== prevAnimeKey.current) {
      prevAnimeKey.current = currentAnimeKey;
      setFetchTrigger(t => t + 1);
    }
  }, [currentAnimeKey]);

  // Fetch anime info — use AniList metadata when available (no scraper lookup needed)
  // Fall back to scraper URL only when no anilistMetadata
  const scraperQuery = useQuery({
    queryKey: ['anime', 'info', url, anilistMetadata?.malId, fetchTrigger],
    queryFn: async (): Promise<AnimeInfo & { sources?: { provider: string; url: string; episodeCount: number }[] }> => {
      if (anilistMetadata) {
        // Use AniList metadata directly — no scraper URL needed
        return await getAnimeInfoMultiSource(undefined, {
          title: anilistMetadata.title.romaji,
          titleJapanese: anilistMetadata.title.native || undefined,
          synonyms: [],
          malId: anilistMetadata.malId || undefined,
        });
      }
      if (url) {
        const stored = sessionStorage.getItem(`_sources:${url}`);
        if (stored) {
          try {
            const sources = JSON.parse(stored) as { provider: string; url: string }[];
            if (sources.length > 1) {
              return await getAnimeInfoMultiUrl(sources);
            }
          } catch {}
        }
      }
      return await getAnimeInfo(url!);
    },
    enabled: !!url || !!anilistMetadata,
    staleTime: 0,
    gcTime: 0,
  });

  // Store episode URLs per number (all sources) for WatchPage multi-source fetch
  useEffect(() => {
    if (scraperQuery.data?.episodes) {
      // Use source URL as key when available (anilist nav has no url param),
      // otherwise use the url param
      const storageKey = scraperQuery.data.sources?.[0]?.url || url || 'unknown';
      const episodeMap: Record<string, { provider: string; url: string }[]> = {};
      for (const ep of scraperQuery.data.episodes) {
        if (!ep.url) continue;
        const source = ep.source || scraperQuery.data.sources?.[0]?.provider || 'unknown';
        episodeMap[ep.number] = episodeMap[ep.number] || [];
        if (!episodeMap[ep.number].some(e => e.url === ep.url)) {
          episodeMap[ep.number].push({ provider: source, url: ep.url });
        }
      }
      sessionStorage.setItem(`_episodes:${storageKey}`, JSON.stringify(episodeMap));
      // Also store the cover data under the source URL for cross-key lookups
      const coverData = {
        cover: scraperQuery.data.image,
        anilistCoverImage: null,
        title: scraperQuery.data.title,
        malId: scraperQuery.data.malId,
      };
      if (scraperQuery.data.sources?.[0]?.url) {
        sessionStorage.setItem(`_sources:${scraperQuery.data.sources[0].url}`, JSON.stringify(coverData));
      }
    }
  }, [scraperQuery.data, url]);

  const anilistQuery = useQuery({
    queryKey: ['anilist', scraperQuery.data?.title, scraperQuery.data?.malId],
    queryFn: () => fetchAniListFull(scraperQuery.data!.title, scraperQuery.data?.malId),
    enabled: !!scraperQuery.data?.title,
    staleTime: 0,
    gcTime: 0,
    retry: (_failureCount, error) => !(error instanceof TypeError),
  });

  // Store anime cover for watch history tracking — use source URL as key (anilist nav has no url param)
  useEffect(() => {
    if (scraperQuery.data) {
      const srcUrl = scraperQuery.data.sources?.[0]?.url || url || 'unknown';
      const coverData = {
        cover: scraperQuery.data.image,
        anilistCoverImage: anilistQuery.data?.coverImage?.extraLarge || anilistQuery.data?.coverImage?.large,
        title: scraperQuery.data.title,
        malId: scraperQuery.data.malId,
      };
      sessionStorage.setItem(`_sources:${srcUrl}`, JSON.stringify(coverData));
    }
  }, [scraperQuery.data, anilistQuery.data, url]);

  // Merge scraper + AniList data
  let anime: EnrichedAnime | null = null;
  if (scraperQuery.data) {
    const scraperData = scraperQuery.data;
    const anilistData = anilistQuery.data ?? null;
    const coverImage = anilistData?.coverImage.extraLarge || anilistData?.coverImage.large;
    anime = {
      ...scraperData,
      image: coverImage || scraperData.image,
      backdrop: (anilistData?.bannerImage ?? scraperData.backdrop ?? null) as string | null,
      anilistCoverImage: coverImage as string | null,
      anilistBannerImage: anilistData?.bannerImage || null,
      anilistColor: anilistData?.coverImage.color || null,
      anilistFullDescription: anilistData?.description || null,
      anilistGenres: anilistData?.genres || [],
      anilistScore: anilistData?.averageScore || null,
      anilistStatus: anilistData?.status || null,
      anilistSeasonYear: anilistData?.seasonYear || null,
      anilistSeason: anilistData?.season || null,
      anilistStudios: (anilistData?.studios?.nodes || []).map((s: any) => s.name),
      anilistTrailer: anilistData?.trailer || null,
      anilistCharacters: (anilistData?.characters?.nodes || []).map((c: any) => ({ name: c.name.full, image: c.image.large })),
      anilistTitle: anilistData?.title || null,
      anilistSynonyms: anilistData?.synonyms || [],
      episodes: scraperData.episodes,
      sources: scraperData.sources || [],
    };
  }

  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { addFavorite: addLocalFavorite, removeFavorite: removeLocalFavorite, isFavorite: isLocalFavorite } = useFavoritesStore();
  const { getEntriesByAnime } = useHistoryStore();

  // Stable ID: scraper URL if available, else anilist:{id}
  const stableId = url || (anilistQuery.data?.id ? `anilist:${anilistQuery.data.id}` : '');

  // Backend sync queries
  const { data: backendFollowing = [] } = useQuery({
    queryKey: ['auth', 'following'],
    queryFn: getFollowing,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const isFav = isLocalFavorite(stableId);
  const isFollowingBackend = isAuthenticated && backendFollowing.some((f) => f.anime_id === stableId);

  const toggleFavorite = async () => {
    if (!anime || !stableId) return;
    if (isFav) {
      removeLocalFavorite(stableId);
    } else {
      addLocalFavorite({ url: stableId, title: anime.title, image: anime.image, addedAt: new Date().toISOString() });
    }
  };

  const toggleFollowing = async () => {
    if (!anime || !isAuthenticated || !stableId) return;
    if (isFollowingBackend) {
      await removeFollowing(stableId).catch(console.error);
      queryClient.invalidateQueries({ queryKey: ['auth', 'following'] });
    } else {
      await addFollowing(
        stableId,
        anime.title,
        anime.image || undefined,
        anime.malId,
        anilistQuery.data?.id
      ).catch(console.error);
      queryClient.invalidateQueries({ queryKey: ['auth', 'following'] });
    }
  };

  // Merge scraper + AniList data
  const isLoading = scraperQuery.isLoading;
  const isLoadingAniList = anilistQuery.isLoading;
  const scraperError = scraperQuery.error;

  if (!url && !anilistMetadata) {
    return (
      <div className="pt-24 text-center">
        <p className="text-text-muted">URL de anime no proporcionada</p>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block">
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="pt-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-8">
            <div className="w-64 aspect-[3/4] bg-surface animate-pulse rounded-lg" />
            <div className="flex-1 space-y-4">
              <div className="h-12 bg-surface animate-pulse rounded w-3/4" />
              <div className="h-6 bg-surface animate-pulse rounded w-1/4" />
              <div className="h-32 bg-surface animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (scraperError || !anime) {
    return (
      <div className="pt-24 text-center">
        <p className="text-red-500">Error al cargar la información del anime</p>
      </div>
    );
  }

  const bgColor = anime.anilistColor || '#1a1a2e';

  // Deduplicate episodes by number — show first occurrence per number
  const uniqueEpisodes = anime.episodes.filter((ep, i, arr) => {
    return arr.findIndex(e => e.number === ep.number) === i;
  });

  return (
    <div className="pt-24 pb-12">
      {anime.anilistBannerImage && (
        <div className="relative h-64 md:h-80 overflow-hidden bg-surface">
          <img
            src={anime.anilistBannerImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) parent.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column: poster + actions */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-surface">
              {anime.image ? (
                <img src={anime.image} alt={anime.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  Sin imagen
                </div>
              )}
            </div>
            <button
              onClick={toggleFavorite}
              className={`mt-4 w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isFav ? 'bg-primary text-white' : 'bg-surface hover:bg-surface-hover border border-border'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
              {isFav ? 'En favoritos' : 'Añadir a favoritos'}
            </button>
            {isAuthenticated && (
              <button
                onClick={toggleFollowing}
                className={`mt-2 w-full py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  isFollowingBackend
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-surface hover:bg-surface-hover border border-border'
                }`}
              >
                {isFollowingBackend ? <Check className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {isFollowingBackend ? 'Siguiendo' : 'Seguir anime'}
              </button>
            )}
          </div>

          {/* Right column: info */}
          <div className="flex-1">
            {/* Title block */}
            <h1 className="text-3xl lg:text-4xl font-bold mb-1">
              {anime.anilistTitle?.english || anime.title}
            </h1>
            {anime.anilistTitle?.romaji && anime.anilistTitle?.romaji !== anime.anilistTitle?.english && (
              <p className="text-text-muted text-lg mb-2">{anime.anilistTitle.romaji}</p>
            )}
            {anime.anilistTitle?.native && (
              <p className="text-text-muted text-base mb-3">{anime.anilistTitle.native}</p>
            )}

            {/* Meta badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              {anime.anilistScore ? (
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg"
                  style={{ backgroundColor: `${bgColor}22`, border: `1px solid ${bgColor}44` }}
                >
                  <Star className="w-5 h-5" style={{ color: bgColor }} fill={bgColor} />
                  <span style={{ color: bgColor }}>{formatScore(anime.anilistScore)}</span>
                </div>
              ) : anime.score ? (
                <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-lg">
                  <Heart className="w-5 h-5 text-primary fill-primary" />
                  <span className="font-bold text-xl">{formatScore(anime.score)}</span>
                  <span className="text-text-muted text-sm">{formatNumber(anime.votes)} votos</span>
                </div>
              ) : null}

              {anime.type && (
                <span className="flex items-center gap-1.5 bg-surface px-4 py-2 rounded-lg text-sm">
                  <Film className="w-4 h-4 text-text-muted" />
                  {anime.type}
                </span>
              )}

              {anime.anilistSeason && anime.anilistSeasonYear && (
                <span className="flex items-center gap-1.5 bg-surface px-4 py-2 rounded-lg text-sm">
                  <Calendar className="w-4 h-4 text-text-muted" />
                  {anime.anilistSeason} {anime.anilistSeasonYear}
                </span>
              )}

              {anime.year && !anime.anilistSeasonYear && (
                <span className="flex items-center gap-1.5 bg-surface px-4 py-2 rounded-lg text-sm">
                  <Calendar className="w-4 h-4 text-text-muted" />
                  {anime.year}
                </span>
              )}

              {anime.anilistStatus && (
                <span className="flex items-center gap-1.5 bg-surface px-4 py-2 rounded-lg text-sm">
                  <Tv className="w-4 h-4 text-text-muted" />
                  {anime.anilistStatus}
                </span>
              )}

              {anime.anilistStudios.length > 0 && (
                <span className="flex items-center gap-1.5 bg-surface px-4 py-2 rounded-lg text-sm">
                  <span className="text-text-muted">{anime.anilistStudios[0]}</span>
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {anime.anilistGenres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 rounded-full text-sm transition-colors cursor-pointer"
                  style={{
                    backgroundColor: `${bgColor}22`,
                    border: `1px solid ${bgColor}44`,
                    color: bgColor,
                  }}
                >
                  {genre}
                </span>
              ))}
              {anime.anilistGenres.length === 0 &&
                anime.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-surface rounded-full text-sm hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    {genre.name}
                  </span>
                ))}
            </div>

            {/* Description */}
            {(anime.anilistFullDescription || anime.description) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Sinopsis</h2>
                <p
                  className="text-text-muted leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: anime.anilistFullDescription || anime.description,
                  }}
                />
              </div>
            )}

            {/* Alternative Titles */}
            {anime.anilistSynonyms && anime.anilistSynonyms.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Títulos alternativos</h2>
                <div className="flex flex-wrap gap-2">
                  {anime.anilistSynonyms.map((syn) => (
                    <span key={syn} className="px-3 py-1 bg-surface rounded-full text-sm text-text-muted">
                      {syn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Trailer */}
            {anime.anilistTrailer && (
              <div className="mb-8">
                <a
                  href={`https://www.youtube.com/watch?v=${anime.anilistTrailer.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover px-6 py-3 rounded-lg font-semibold transition-colors"
                  style={{ backgroundColor: bgColor }}
                >
                  <Play className="w-5 h-5" />
                  Ver trailer
                </a>
              </div>
            )}

            {/* Characters */}
            {anime.anilistCharacters.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personajes
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {anime.anilistCharacters.map((char) => (
                    <div key={char.name} className="flex flex-col items-center shrink-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-surface">
                        {char.image ? (
                          <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-text-muted text-center mt-1 max-w-16 truncate">
                        {char.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AniList loading indicator */}
            {isLoadingAniList && (
              <p className="text-text-muted text-sm mb-4 flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Cargando metadata de AniList...
              </p>
            )}

            {/* Episodes */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                Episodios
                <span className="text-text-muted text-base font-normal">
                  ({uniqueEpisodes.length})
                </span>
              </h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {uniqueEpisodes.map((ep) => {
                  const watchedEntry = getEntriesByAnime(url || '').find((e) => e.episodeUrl === ep.url);
                  const isWatched = watchedEntry?.completed || false;

                  return (
                    <Link
                      key={ep.id}
                      to={`/watch?episodeUrl=${encodeURIComponent(ep.url)}&animeUrl=${encodeURIComponent(url || '')}&episodeNum=${ep.number}`}
                      className={`aspect-square rounded-lg flex items-center justify-center font-semibold transition-colors relative group ${
                        isWatched ? 'bg-surface-hover border-2 border-primary/50' : 'bg-surface hover:bg-surface-hover'
                      }`}
                    >
                      {ep.number}
                      {isWatched && (
                        <span className="absolute top-1 right-1">
                          <Check className="w-3 h-3 text-primary" />
                        </span>
                      )}
                      <div
                        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        style={{ backgroundColor: `${bgColor}cc` }}
                      >
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
