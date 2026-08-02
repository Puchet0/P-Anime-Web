import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User, Clock, Heart, Eye, Play, Trash2, X,
  RefreshCw, Loader2, UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getProfile,
  getWatchHistory,
  getFavorites,
  getFollowing,
  removeWatchHistory,
  clearWatchHistory,
  removeFavorite,
  removeFollowing,
} from '../api/auth.api';

type Tab = 'history' | 'favorites' | 'following';

export function ProfilePage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('history');

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const { data: history = [], isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['auth', 'history'],
    queryFn: () => getWatchHistory(100),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const { data: favorites = [], isLoading: favoritesLoading, refetch: refetchFavorites } = useQuery({
    queryKey: ['auth', 'favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const { data: following = [], isLoading: followingLoading, refetch: refetchFollowing } = useQuery({
    queryKey: ['auth', 'following'],
    queryFn: getFollowing,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const handleRemove = async (action: 'history' | 'favorites' | 'following', id: string, animeId?: string) => {
    try {
      if (action === 'history') {
        await removeWatchHistory(id);
        refetchHistory();
      } else if (action === 'favorites' && animeId) {
        await removeFavorite(animeId);
        refetchFavorites();
      } else if (action === 'following' && animeId) {
        await removeFollowing(animeId);
        refetchFollowing();
      }
    } catch (e) {
      console.error('Failed to remove:', e);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearWatchHistory();
      refetchHistory();
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatProgress = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  if (!isAuthenticated) {
    return (
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto text-center py-20">
          <UserCheck className="w-20 h-20 text-text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Inicia sesión para ver tu perfil</h2>
          <p className="text-text-muted mb-6">Accede a tu historial, favoritos y animes que sigues</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Play className="w-5 h-5" />
            Empezar a explorar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <div className="bg-surface rounded-2xl p-6 mb-6 flex items-center gap-6">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div className="flex-1">
            {profileLoading ? (
              <div className="space-y-2">
                <div className="h-7 w-40 bg-background animate-pulse rounded" />
                <div className="h-4 w-60 bg-background animate-pulse rounded" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{profile?.username}</h1>
                <p className="text-text-muted">{profile?.email}</p>
                <p className="text-xs text-text-muted mt-1">
                  Desde {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => refetchProfile()}
            className="p-2 hover:bg-background rounded-lg transition-colors text-text-muted"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setTab('history')}
            className={`bg-surface rounded-xl p-4 text-center transition-colors hover:bg-surface-hover ${
              tab === 'history' ? 'ring-2 ring-primary' : ''
            }`}
          >
            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{profile?.stats?.watchCount ?? '–'}</p>
            <p className="text-sm text-text-muted">Episodios vistos</p>
          </button>
          <button
            onClick={() => setTab('favorites')}
            className={`bg-surface rounded-xl p-4 text-center transition-colors hover:bg-surface-hover ${
              tab === 'favorites' ? 'ring-2 ring-primary' : ''
            }`}
          >
            <Heart className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{profile?.stats?.favoritesCount ?? '–'}</p>
            <p className="text-sm text-text-muted">Favoritos</p>
          </button>
          <button
            onClick={() => setTab('following')}
            className={`bg-surface rounded-xl p-4 text-center transition-colors hover:bg-surface-hover ${
              tab === 'following' ? 'ring-2 ring-primary' : ''
            }`}
          >
            <Eye className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{profile?.stats?.followingCount ?? '–'}</p>
            <p className="text-sm text-text-muted">Siguiendo</p>
          </button>
        </div>

        {/* Tabs content */}
        <div className="bg-surface rounded-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border">
            {(['history', 'favorites', 'following'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-colors ${
                  tab === t
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {t === 'history' && <Clock className="w-4 h-4" />}
                {t === 'favorites' && <Heart className="w-4 h-4" />}
                {t === 'following' && <Eye className="w-4 h-4" />}
                {t === 'history' ? 'Historial' : t === 'favorites' ? 'Favoritos' : 'Siguiendo'}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* History tab */}
            {tab === 'history' && (
              <>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-muted">Sin historial aún</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button
                        onClick={handleClearHistory}
                        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Limpiar todo
                      </button>
                    </div>
                    {history.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                        <div className="w-16 h-10 bg-surface rounded overflow-hidden shrink-0">
                          {entry.anime_cover ? (
                            <img src={entry.anime_cover} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-text-muted" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/anime?url=${encodeURIComponent(entry.anime_id)}`}
                            className="font-medium hover:text-primary transition-colors line-clamp-1 text-sm"
                          >
                            {entry.anime_title || entry.anime_id}
                          </Link>
                          <p className="text-xs text-text-muted">
                            Ep. {entry.episode_number} • {entry.variant}
                            {entry.progress_seconds > 0 && ` • ${formatProgress(entry.progress_seconds)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            to={`/watch?episodeUrl=${encodeURIComponent(entry.episode_url)}&animeUrl=${encodeURIComponent(entry.anime_id)}`}
                            className="p-2 bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                          >
                            <Play className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleRemove('history', entry.id)}
                            className="p-2 hover:bg-red-500/20 text-text-muted hover:text-red-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Favorites tab */}
            {tab === 'favorites' && (
              <>
                {favoritesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-muted">Sin favoritos aún</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {favorites.map((fav) => (
                      <div key={fav.anime_id} className="group relative">
                        <Link to={`/anime?url=${encodeURIComponent(fav.anime_id)}`}>
                          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-background">
                            {fav.anime_cover ? (
                              <img src={fav.anime_cover} alt={fav.anime_title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-text-muted">?</div>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {fav.anime_title || fav.anime_id}
                          </p>
                        </Link>
                        <button
                          onClick={() => handleRemove('favorites', fav.id, fav.anime_id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Following tab */}
            {tab === 'following' && (
              <>
                {followingLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : following.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="w-12 h-12 text-text-muted mx-auto mb-3" />
                    <p className="text-text-muted">No sigues animes aún</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {following.map((f) => (
                      <div key={f.anime_id} className="group relative">
                        <Link to={`/anime?url=${encodeURIComponent(f.anime_id)}`}>
                          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-background">
                            {f.anime_cover ? (
                              <img src={f.anime_cover} alt={f.anime_title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-text-muted">?</div>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {f.anime_title || f.anime_id}
                          </p>
                        </Link>
                        <button
                          onClick={() => handleRemove('following', f.id, f.anime_id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}