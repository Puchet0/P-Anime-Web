import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { addFollowing as addFollowingApi, removeFollowing as removeFollowingApi, getFollowing } from '../api/auth.api';

export interface FollowingAnime {
  url: string;
  title: string;
  image: string | null;
  addedAt: string;
}

interface FollowingState {
  following: FollowingAnime[];
  isLoading: boolean;
  isSyncing: boolean;
  loadFromSupabase: () => Promise<void>;
  addFollowing: (anime: FollowingAnime) => void;
  removeFollowing: (url: string) => void;
  isFollowing: (url: string) => boolean;
}

export const useFollowingStore = create<FollowingState>()((set, get) => ({
  following: [],
  isLoading: false,
  isSyncing: false,
  loadFromSupabase: async () => {
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) {
      set({ following: [], isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const data = await getFollowing();
      const following: FollowingAnime[] = (data || []).map((f) => ({
        url: f.anime_id,
        title: f.anime_title || '',
        image: f.anime_cover || null,
        addedAt: f.added_at,
      }));
      set({ following, isLoading: false });
    } catch (err) {
      console.error('Failed to load following from Supabase', err);
      set({ isLoading: false });
    }
  },
  addFollowing: async (anime) => {
    if (!anime.url) return;
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) return;

    const existing = get().following.find((f) => f.url === anime.url);
    if (!existing) {
      set((state) => ({
        following: [{ ...anime, addedAt: new Date().toISOString() }, ...state.following],
      }));
    }

    set({ isSyncing: true });
    try {
      await addFollowingApi(anime.url, anime.title, anime.image || undefined);
    } catch (err) {
      console.error('Failed to sync following to Supabase', err);
      set((state) => ({
        following: state.following.filter((f) => f.url !== anime.url),
      }));
    } finally {
      set({ isSyncing: false });
    }
  },
  removeFollowing: async (url) => {
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) return;

    set((state) => ({
      following: state.following.filter((f) => f.url !== url),
    }));

    try {
      await removeFollowingApi(url);
    } catch (err) {
      console.error('Failed to remove following from Supabase', err);
      get().loadFromSupabase();
    }
  },
  isFollowing: (url) => get().following.some((f) => f.url === url),
}));
