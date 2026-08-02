// User & Auth API types — Supabase-compatible

export interface AuthUser {
  id: string; // UUID
  email?: string;
  username?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  email?: string;
  created_at: string;
  stats: {
    watchCount: number;
    favoritesCount: number;
    followingCount: number;
  };
}

export interface WatchHistoryEntry {
  id: string; // UUID
  user_id: string;
  anime_id: string;
  anime_title: string;
  anime_cover: string | null;
  episode_url: string;
  episode_number: number;
  variant: string;
  progress_seconds: number;
  completed: boolean;
  last_watched: string;
}

export interface FavoriteEntry {
  id: string; // UUID
  user_id: string;
  anime_id: string;
  anime_title: string;
  anime_cover: string | null;
  mal_id: number | null;
  anilist_id: number | null;
  added_at: string;
}

export interface FollowingEntry {
  id: string; // UUID
  user_id: string;
  anime_id: string;
  anime_title: string;
  anime_cover: string | null;
  mal_id: number | null;
  anilist_id: number | null;
  added_at: string;
}

export interface WatchHistoryPayload {
  animeId: string;
  animeTitle: string;
  animeCover?: string;
  episodeUrl: string;
  episodeNumber: number;
  variant?: string;
  progressSeconds?: number;
  completed?: boolean;
}
