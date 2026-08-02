import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { addWatchHistory, updateWatchHistoryProgress, updateWatchHistoryCompleted } from '../api/auth.api';

export interface HistoryEntry {
  id: string;
  animeUrl: string;
  animeTitle: string;
  animeImage: string | null;
  episodeUrl: string;
  episodeNumber: number;
  progress: number;
  completed: boolean;
  variant: 'SUB' | 'DUB';
  lastWatched: string;
}

interface HistoryState {
  entries: HistoryEntry[];
  isLoading: boolean;
  isSyncing: boolean;
  loadFromSupabase: () => Promise<void>;
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'lastWatched'>) => void;
  updateProgress: (episodeUrl: string, progress: number) => void;
  markWatched: (episodeUrl: string, completed: boolean) => void;
  removeEntry: (id: string) => void;
  removeByEpisodeUrl: (episodeUrl: string) => void;
  clearHistory: () => void;
  getEntry: (episodeUrl: string) => HistoryEntry | undefined;
  getEntriesByAnime: (animeUrl: string) => HistoryEntry[];
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  entries: [],
  isLoading: false,
  isSyncing: false,
  loadFromSupabase: async () => {
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) {
      set({ entries: [], isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('last_watched', { ascending: false })
        .limit(50);
      if (error) throw error;
      if (data) {
        const mapped: HistoryEntry[] = data.map((h) => ({
          id: h.id,
          animeUrl: h.anime_id,
          animeTitle: h.anime_title || '',
          animeImage: h.anime_cover || null,
          episodeUrl: h.episode_url,
          episodeNumber: h.episode_number,
          progress: h.progress_seconds || 0,
          completed: h.completed || false,
          variant: (h.variant as 'SUB' | 'DUB') || 'SUB',
          lastWatched: h.last_watched,
        }));
        set({ entries: mapped, isLoading: false });
      }
    } catch (err) {
      console.error('Failed to load history from Supabase', err);
      set({ isLoading: false });
    }
  },
  addEntry: async (entry) => {
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) return;

    set({ isSyncing: true });
    try {
      const { data: existingRows } = await supabase
        .from('watch_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('episode_url', entry.episodeUrl)
        .single();

      if (existingRows) {
        await updateWatchHistoryProgress(entry.episodeUrl, Math.floor(entry.progress));
        if (entry.completed !== undefined) {
          await updateWatchHistoryCompleted(entry.episodeUrl, entry.completed);
        }
      } else {
        await addWatchHistory({
          animeId: entry.animeUrl,
          animeTitle: entry.animeTitle,
          animeCover: entry.animeImage || undefined,
          episodeUrl: entry.episodeUrl,
          episodeNumber: entry.episodeNumber,
          variant: entry.variant,
          progressSeconds: Math.floor(entry.progress),
          completed: entry.completed,
        });
      }
      // Reload from Supabase to get the real ID
      await get().loadFromSupabase();
    } catch (err) {
      console.error('Failed to sync history to Supabase', err);
    } finally {
      set({ isSyncing: false });
    }
  },
  updateProgress: (episodeUrl, progress) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.episodeUrl === episodeUrl ? { ...e, progress } : e
      ),
    })),
  markWatched: (episodeUrl, completed) => {
    const existing = get().entries.find((e) => e.episodeUrl === episodeUrl);
    if (existing) {
      set((state) => ({
        entries: state.entries.map((e) =>
          e.episodeUrl === episodeUrl ? { ...e, completed } : e
        ),
      }));
    } else {
      // Entry doesn't exist yet — we need full info to create it
      // Signal via a special entry so the caller can provide details
      console.warn('[history] markWatched: no local entry for', episodeUrl, '— call addEntry first with completed=true');
    }
    updateWatchHistoryCompleted(episodeUrl, completed).catch(console.error);
  },
  removeEntry: async (id) => {
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) return;
    try {
      await supabase.from('watch_history').delete().eq('id', id);
      await get().loadFromSupabase();
    } catch (error) {
      console.error('Failed to delete from Supabase', error);
    }
  },
  removeByEpisodeUrl: async (episodeUrl) => {
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) return;
    try {
      await supabase.from('watch_history').delete().eq('episode_url', episodeUrl);
      await get().loadFromSupabase();
    } catch (error) {
      console.error('Failed to delete from Supabase', error);
    }
  },
  clearHistory: async () => {
    const { data: sessionData } = await supabase.auth.getUser();
    const user = sessionData?.user;
    if (!user) return;
    try {
      await supabase.from('watch_history').delete().eq('user_id', user.id);
      set({ entries: [] });
    } catch (error) {
      console.error('Failed to clear history in Supabase', error);
    }
  },
  getEntry: (episodeUrl) => get().entries.find((e) => e.episodeUrl === episodeUrl),
  getEntriesByAnime: (animeUrl) => get().entries.filter((e) => e.animeUrl === animeUrl),
}));
