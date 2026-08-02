import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { addFavorite as addFavoriteApi, removeFavorite as removeFavoriteApi, getFavorites } from '../api/auth.api';

export interface FavoriteAnime {
  url: string;
  title: string;
  image: string | null;
  addedAt: string;
}

interface FavoritesState {
  favorites: FavoriteAnime[];
  isLoading: boolean;
  isSyncing: boolean;
  loadFromSupabase: () => Promise<void>;
  addFavorite: (anime: FavoriteAnime) => void;
  removeFavorite: (url: string) => void;
  isFavorite: (url: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  favorites: [],
  isLoading: false,
  isSyncing: false,
  loadFromSupabase: async () => {
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) {
      set({ favorites: [], isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const data = await getFavorites();
      const favorites: FavoriteAnime[] = (data || []).map((f) => ({
        url: f.anime_id,
        title: f.anime_title || '',
        image: f.anime_cover || null,
        addedAt: f.added_at,
      }));
      set({ favorites, isLoading: false });
    } catch (err) {
      console.error('Failed to load favorites from Supabase', err);
      set({ isLoading: false });
    }
  },
  addFavorite: async (anime) => {
    if (!anime.url) return;
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) return;

    // Optimistic local update
    const existing = get().favorites.find((f) => f.url === anime.url);
    if (!existing) {
      set((state) => ({
        favorites: [{ ...anime, addedAt: new Date().toISOString() }, ...state.favorites],
      }));
    }

    set({ isSyncing: true });
    try {
      await addFavoriteApi(anime.url, anime.title, anime.image || undefined);
    } catch (err) {
      console.error('Failed to sync favorite to Supabase', err);
      // Revert optimistic update on error
      set((state) => ({
        favorites: state.favorites.filter((f) => f.url !== anime.url),
      }));
    } finally {
      set({ isSyncing: false });
    }
  },
  removeFavorite: async (url) => {
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) return;

    // Optimistic local update
    set((state) => ({
      favorites: state.favorites.filter((f) => f.url !== url),
    }));

    try {
      await removeFavoriteApi(url);
    } catch (err) {
      console.error('Failed to remove favorite from Supabase', err);
      // Reload from Supabase on error
      get().loadFromSupabase();
    }
  },
  isFavorite: (url) => get().favorites.some((f) => f.url === url),
}));
