// AniList GraphQL response types

export interface AniListTitle {
  romaji: string;
  english: string | null;
  native: string | null;
}

export interface AniListCoverImage {
  extraLarge: string;
  large: string;
  color: string | null;
}

export interface AniListStudio {
  name: string;
}

export interface AniListCharacter {
  name: { full: string };
  image: { large: string };
}

export interface AniListMedia {
  id: number;
  idMal: number | null;
  title: AniListTitle;
  description: string | null;
  coverImage: AniListCoverImage;
  bannerImage: string | null;
  genres: string[];
  synonyms: string[];
  averageScore: number | null;
  episodes: number | null;
  status: string | null;
  season: string | null;
  seasonYear: number | null;
  format?: string;
  studios: {
    nodes: AniListStudio[];
  };
  trailer: {
    id: string;
    site: string;
  } | null;
  characters: {
    nodes: AniListCharacter[];
  };
  nextAiringEpisode?: {
    episode: number;
    airingAt: number;
    timeUntilAiring: number;
  } | null;
}

export interface AniListAiringSchedule {
  id: number;
  episode: number;
  airingAt: number;
  media: {
    id: number;
    title: AniListTitle;
    coverImage: AniListCoverImage;
    bannerImage: string | null;
    genres: string[];
    synonyms: string[];
    averageScore: number | null;
    format: string | null;
    episodes: number | null;
    status: string | null;
  };
}

export interface AniListSearchResponse {
  data: {
    Page: {
      media: AniListMedia[];
    };
  };
}

// GraphQL response wrapper types
export interface AniListSingleData {
  Media: AniListMedia;
}

export interface AniListPageData {
  Page: {
    media: AniListMedia[];
  };
}

export interface AiringScheduleData {
  Page: {
    airingSchedules: AniListAiringSchedule[];
  };
}

export interface CurrentSeasonData {
  Page: {
    media: AniListMedia[];
  };
}