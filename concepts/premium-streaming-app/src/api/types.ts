// API Response types
export interface AnimeResult {
  id: string;
  title: string;
  slug: string;
  url: string;
  image: string | null;
  coverImage?: string | null;
  backdrop: string | null;
  type: string;
  score: number | null;
  status: string | null;
  year: string | number | null;
  // AniList enriched fields
  anilistCoverImage?: string | null;
  anilistBannerImage?: string | null;
  anilistColor?: string | null;
  anilistScore?: number | null;
  anilistMalId?: number | null;
  anilistId?: number | null;
  // Multi-source: URLs from all providers for this anime
  _sources?: { provider: string; url: string; slug: string; image: string | null }[];
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  malId: number;
}

export interface EpisodeLink {
  id: number;
  number: number;
  title: string;
  url: string;
  source?: string;
}

export interface AnimeInfo {
  id: number;
  title: string;
  titleJapanese: string | null;
  description: string;
  image: string | null;
  backdrop: string | null;
  status: string | null;
  type: string;
  year: string | number | null;
  startDate: string | null;
  endDate: string | null;
  score: number;
  votes: number;
  totalEpisodes: number;
  malId: number;
  trailer: string | null;
  genres: Genre[];
  episodes: EpisodeLink[];
  // Multi-source: list of URLs from different providers for the same anime
  sources?: { provider: string; url: string; episodeCount: number }[];
}

export interface VideoServer {
  server: string;
  url: string;
}

export interface EpisodeInfo {
  id: number;
  episode: number;
  title: string;
  season: string | null;
  variants: {
    SUB: number;
    DUB: number;
  };
  publishedAt: string | null;
  servers: {
    sub: VideoServer[];
    dub: VideoServer[];
  };
  streamLinks: {
    SUB: VideoServer[];
    DUB: VideoServer[];
  };
  downloadLinks: {
    SUB: VideoServer[];
    DUB: VideoServer[];
  };
  source: string;
  // Multi-source enrichment
  malId?: number | null;
  // VideoServer with _provider (from multi-source)
  anilistId?: number | null;
  anilistMalId?: number | null;
  anilistTitle?: string | AniListTitle | null;
  anilistCoverImage?: string | null;
  anilistBannerImage?: string | null;
  anilistColor?: string | null;
  anilistFullDescription?: string | null;
  anilistGenres?: string[];
  anilistScore?: number | null;
  anilistStatus?: string | null;
  anilistSeasonYear?: number | null;
  anilistStudios?: string[];
  anilistTrailer?: { id: string; site: string } | null;
  anilistCharacters?: { name: string; image: string }[];
  anilistSynonyms?: string[];
  _anilistCached?: boolean;
  // Providers that have this episode (from multi-source fetch)
  _sources?: string[];
}

export interface AniListTitle {
  romaji: string;
  english: string | null;
  native: string | null;
}

export interface SearchResponse {
  success: boolean;
  data: {
    query: string;
    results: AnimeResult[];
  };
}

export interface InfoResponse {
  success: boolean;
  data: AnimeInfo;
}

export interface EpisodeResponse {
  success: boolean;
  data: EpisodeInfo;
}

export interface DownloadRequest {
  url: string;
  quality?: string;
  variant?: 'SUB' | 'DUB';
  preferredServer?: string;
  includeMega?: boolean;
}

export interface DownloadStatus {
  id: string;
  status: 'pending' | 'downloading' | 'done' | 'error';
  progress: number;
  filename?: string;
  error?: string;
}

export interface Provider {
  id: string;
  label: string;
  domains: string[];
}

export const PROVIDERS: Provider[] = [
  { id: 'animeav1', label: 'AnimeAV1', domains: ['animeav1.com'] },
  { id: 'jkanime', label: 'JKAnime', domains: ['jkanime.net'] },
  { id: 'animeflv', label: 'AnimeFLV', domains: ['animeflv.net', 'www4.animeflv.net'] },
  { id: 'hentaila', label: 'HentaiLA', domains: ['hentaila.com'] },
  { id: 'tioanime', label: 'TioAnime', domains: ['tioanime.com'] },
  { id: 'monoschinos', label: 'MonosChinos', domains: ['monoschinos2.com'] },
];