import { supabase, hasSupabase } from './supabase';
import type {
  UserProfile,
  WatchHistoryEntry,
  WatchHistoryPayload,
  FavoriteEntry,
  FollowingEntry,
} from './auth.types';

function requireSupabase() {
  if (!hasSupabase || !supabase) throw new Error('Auth no disponible — configura Supabase en .env');
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function loginUser(username: string, password: string) {
  requireSupabase();
  let email = username;
  if (!email.includes('@')) {
    const { data: profile } = await supabase!
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .single();
    if (!profile) throw new Error('Usuario no encontrado');
  }
  const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function registerUser(username: string, email: string, password: string) {
  requireSupabase();
  const { data, error } = await supabase!.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) throw error;
  return data;
}

export async function logoutUser() {
  requireSupabase();
  await supabase!.auth.signOut();
}

export async function getProfile(): Promise<UserProfile> {
  requireSupabase();
  const { data: { user }, error: authError } = await supabase!.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const [profileResult, watchCountResult, favCountResult, followingCountResult] =
    await Promise.all([
      supabase!.from('user_profiles').select('*').eq('id', user.id).single(),
      supabase!.from('watch_history').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase!.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase!.from('following').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]);

  const profile = profileResult.data;
  return {
    id: user.id,
    email: user.email,
    username: profile?.username || user.email?.split('@')[0] || 'User',
    created_at: profile?.created_at || user.created_at || new Date().toISOString(),
    stats: {
      watchCount: watchCountResult.count ?? 0,
      favoritesCount: favCountResult.count ?? 0,
      followingCount: followingCountResult.count ?? 0,
    },
  };
}

// ── Watch History ─────────────────────────────────────────────────────────────

export async function addWatchHistory(entry: WatchHistoryPayload): Promise<{ id: string }> {
  requireSupabase();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase!
    .from('watch_history')
    .insert({
      user_id: user.id, anime_id: entry.animeId, anime_title: entry.animeTitle,
      anime_cover: entry.animeCover, episode_url: entry.episodeUrl,
      episode_number: entry.episodeNumber, variant: entry.variant || 'SUB',
      progress_seconds: entry.progressSeconds || 0, completed: entry.completed || false,
    })
    .select('id').single();
  if (error) throw error;
  return { id: data.id };
}

export async function getWatchHistory(limit = 50): Promise<WatchHistoryEntry[]> {
  requireSupabase();
  const { data, error } = await supabase!
    .from('watch_history').select('*')
    .order('last_watched', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

export async function removeWatchHistory(historyId: string): Promise<void> {
  requireSupabase();
  const { error } = await supabase!.from('watch_history').delete().eq('id', historyId);
  if (error) throw error;
}

export async function updateWatchHistoryProgress(episodeUrl: string, progressSeconds: number): Promise<void> {
  requireSupabase();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase!
    .from('watch_history')
    .update({ progress_seconds: progressSeconds, last_watched: new Date().toISOString() })
    .eq('user_id', user.id).eq('episode_url', episodeUrl);
  if (error) throw error;
}

export async function updateWatchHistoryCompleted(episodeUrl: string, completed: boolean): Promise<void> {
  requireSupabase();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase!
    .from('watch_history')
    .update({ completed })
    .eq('user_id', user.id).eq('episode_url', episodeUrl);
  if (error) throw error;
}

export async function clearWatchHistory(): Promise<void> {
  requireSupabase();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase!.from('watch_history').delete().eq('user_id', user.id);
  if (error) throw error;
}

// ── Favorites ────────────────────────────────────────────────────────────────

export async function addFavorite(
  animeId: string, animeTitle: string, animeCover?: string, malId?: number, anilistId?: number
): Promise<{ id: string; added: boolean }> {
  requireSupabase();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase!
    .from('favorites')
    .upsert(
      { user_id: user.id, anime_id: animeId, anime_title: animeTitle, anime_cover: animeCover, mal_id: malId, anilist_id: anilistId },
      { onConflict: 'user_id,anime_id' }
    )
    .select('id').single();
  if (error) throw error;
  return { id: data.id, added: true };
}

export async function getFavorites(): Promise<FavoriteEntry[]> {
  requireSupabase();
  const { data, error } = await supabase!
    .from('favorites').select('*').order('added_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function removeFavorite(animeId: string): Promise<void> {
  requireSupabase();
  const { error } = await supabase!.from('favorites').delete().eq('anime_id', animeId);
  if (error) throw error;
}

// ── Following ────────────────────────────────────────────────────────────────

export async function addFollowing(
  animeId: string, animeTitle: string, animeCover?: string, malId?: number, anilistId?: number
): Promise<{ id: string; added: boolean }> {
  requireSupabase();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase!
    .from('following')
    .upsert(
      { user_id: user.id, anime_id: animeId, anime_title: animeTitle, anime_cover: animeCover, mal_id: malId, anilist_id: anilistId },
      { onConflict: 'user_id,anime_id' }
    )
    .select('id').single();
  if (error) throw error;
  return { id: data.id, added: true };
}

export async function getFollowing(): Promise<FollowingEntry[]> {
  requireSupabase();
  const { data, error } = await supabase!
    .from('following').select('*').order('added_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function removeFollowing(animeId: string): Promise<void> {
  requireSupabase();
  const { error } = await supabase!.from('following').delete().eq('anime_id', animeId);
  if (error) throw error;
}
