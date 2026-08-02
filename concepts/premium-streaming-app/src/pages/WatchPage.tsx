import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePlayerStore } from '../store/playerStore';
import { useHistoryStore } from '../store/historyStore';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { selectBestServer } from '../utils/helpers';
import { getEpisodeInfo, getEpisodeInfoMulti } from '../api/anime.api';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Download, Check, Play } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function WatchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const episodeUrl = searchParams.get('episodeUrl');
  const animeUrl = searchParams.get('animeUrl');
  const episodeNum = searchParams.get('episodeNum');

  const { data: singleEpisode, isLoading, error } = useEpisodeInfo(episodeUrl);
  const { data: multiEpisode } = useMultiSourceEpisode(animeUrl, episodeNum, episodeUrl);

  const [variant, setVariant] = useState<'SUB' | 'DUB'>('SUB');
  const [currentServer, setCurrentServer] = useState<{ server: string; url: string } | null>(null);

  const { setEpisode } = usePlayerStore();
  const { addEntry, markWatched, getEntry, entries } = useHistoryStore();
  useAuth();

  const lastSaveRef = useRef(0);
  const hasAutoCompleted = useRef(false);

  const episode = multiEpisode || singleEpisode;
  const isEpisodeLoading = isLoading && !multiEpisode;
  const isCompleted = !!episodeUrl && entries.some(e => e.episodeUrl === episodeUrl && e.completed);

  useEffect(() => {
    if (episodeUrl && animeUrl) setEpisode(episodeUrl, animeUrl);
  }, [episodeUrl, animeUrl, setEpisode]);

  // Reset auto-complete flag when episode changes
  useEffect(() => {
    hasAutoCompleted.current = false;
  }, [episodeUrl]);

  useEffect(() => {
    if (episode) {
      const servers = variant === 'SUB' ? (episode.servers?.sub || []) : (episode.servers?.dub || []);
      setCurrentServer(selectBestServer(servers));
    }
  }, [episode, variant]);

  const handleProgress = (progress: number) => {
    // Auto-complete at 70% watched
    if (!hasAutoCompleted.current && episodeUrl && progress > 0) {
      const video = document.querySelector('video');
      if (video && video.duration > 0 && progress / video.duration >= 0.7) {
        hasAutoCompleted.current = true;
        if (!isCompleted) {
          markWatched(episodeUrl, true);
        }
      }
    }

    const now = Date.now();
    if (now - lastSaveRef.current < 15000) return; // throttle: max once per 15s
    if (progress < 5) return; // ignore tiny progress
    lastSaveRef.current = now;
    if (episodeUrl && animeUrl && episode) {
      addEntry({
        animeUrl, animeTitle: episode.title, animeImage: getAnimeCover(),
        episodeUrl, episodeNumber: episode.episode, progress,
        completed: getEntry(episodeUrl)?.completed ?? false, variant,
      });
    }
  };

  const getAnimeCover = (): string | null => {
    if (episode?.anilistCoverImage) return episode.anilistCoverImage;
    if (animeUrl) {
      const stored = sessionStorage.getItem(`_sources:${animeUrl}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.cover) return data.cover;
          if (data.anilistCoverImage) return data.anilistCoverImage;
        } catch {}
      }
    }
    return null;
  };

  const toggleWatched = () => {
    if (!episodeUrl || !episode) return;
    if (isCompleted) {
      markWatched(episodeUrl, false);
    } else {
      addEntry({
        animeUrl: animeUrl || '',
        animeTitle: episode.title,
        animeImage: getAnimeCover(),
        episodeUrl,
        episodeNumber: episode.episode,
        progress: 0,
        completed: true,
        variant,
      });
    }
  };

  const navigateEpisode = (direction: 'prev' | 'next') => {
    if (!episode || (!animeUrl && !episodeUrl)) return;
    const currentNum = episode.episode;
    const newNum = direction === 'prev' ? currentNum - 1 : currentNum + 1;
    if (newNum < 1) return;
    let nextEpisodeUrl: string;
    if (animeUrl) {
      nextEpisodeUrl = `${animeUrl.replace(/\/$/, '')}/${newNum}`;
    } else if (episodeUrl) {
      nextEpisodeUrl = episodeUrl.replace(/\/\d+(\?.*)?$/, `/${newNum}`);
    } else return;
    setSearchParams({ episodeUrl: nextEpisodeUrl!, animeUrl: animeUrl || '', episodeNum: String(newNum) });
  };

  if (!episodeUrl) {
    return (
      <div className="pt-20 text-center">
        <p className="text-text-muted">URL de episodio no proporcionada</p>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block">Volver al inicio</Link>
      </div>
    );
  }

  if (isEpisodeLoading) {
    return (
      <div className="pt-20 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="aspect-video bg-surface animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="pt-20 text-center">
        <p className="text-red-400">Error al cargar el episodio</p>
        <Link to={`/anime?url=${encodeURIComponent(animeUrl || '')}`} className="text-primary hover:underline mt-4 inline-block">Volver al anime</Link>
      </div>
    );
  }

  const servers = variant === 'SUB' ? (episode.servers?.sub || []) : (episode.servers?.dub || []);
  const downloadLinks = variant === 'SUB' ? (episode.downloadLinks?.SUB || []) : (episode.downloadLinks?.DUB || []);

  return (
    <div className="pt-16 pb-12">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="mb-4 flex items-center gap-2 text-text-muted text-sm">
          <Link to={`/anime?url=${encodeURIComponent(animeUrl || '')}`} className="hover:text-text transition-colors">
            {episode.title.replace(`Episodio ${episode.episode}`, '').trim() || 'Anime'}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span>Episodio {episode.episode}</span>
        </div>

        <VideoPlayer src={currentServer?.url || ''} title={`${episode.title} - ${variant}`} onProgress={handleProgress} />

        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigateEpisode('prev')} disabled={episode.episode <= 1}
              className="p-2 bg-surface hover:bg-surface-hover rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg px-4">Episodio {episode.episode}</span>
            <button onClick={() => navigateEpisode('next')}
              className="p-2 bg-surface hover:bg-surface-hover rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={toggleWatched}
              title={isCompleted ? 'Marcar como no visto' : 'Marcar como visto'}
              className={`p-2 rounded-xl transition-all duration-200 ${isCompleted ? 'bg-green-500 text-white' : 'bg-surface hover:bg-surface-hover'}`}>
              {isCompleted ? <Check className="w-5 h-5" /> : <Check className="w-5 h-5 text-text-muted" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {episode._sources && episode._sources.length > 1 && (
              <div className="flex items-center gap-1 mr-2">
                <span className="text-text-muted text-xs">Fuentes:</span>
                {episode._sources.map(src => (
                  <span key={src} className="px-2 py-0.5 bg-surface border border-border rounded text-xs capitalize">{src}</span>
                ))}
              </div>
            )}
            <span className="text-text-muted text-sm">Audio:</span>
            <div className="flex rounded-xl overflow-hidden border border-border">
              {(episode.variants?.SUB ?? episode.servers?.sub?.length ?? 0) > 0 && (
                <button onClick={() => setVariant('SUB')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${variant === 'SUB' ? 'bg-primary text-background' : 'bg-surface hover:bg-surface-hover'}`}>SUB</button>
              )}
              {(episode.variants?.DUB ?? episode.servers?.dub?.length ?? 0) > 0 && (
                <button onClick={() => setVariant('DUB')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${variant === 'DUB' ? 'bg-primary text-background' : 'bg-surface hover:bg-surface-hover'}`}>DUB</button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-display font-semibold mb-3">Servidores de video</h3>
          <div className="flex flex-wrap gap-2">
            {servers.map((server, idx) => (
              <button key={idx} onClick={() => setCurrentServer(server)}
                className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                  currentServer?.url === server.url ? 'bg-primary text-background' : 'bg-surface hover:bg-surface-hover'
                }`}>{server.server}</button>
            ))}
          </div>
        </div>

        {episode.episode >= 1 && (
          <div className="mt-6">
            <Link
              to={`/watch?episodeUrl=${encodeURIComponent(
                animeUrl ? `${animeUrl.replace(/\/$/, '')}/${episode.episode + 1}` : episodeUrl!.replace(/\/\d+(\?.*)?$/, `/${episode.episode + 1}`)
              )}&animeUrl=${encodeURIComponent(animeUrl || '')}&episodeNum=${episode.episode + 1}`}
              className="flex items-center gap-4 p-4 bg-surface hover:bg-surface-hover rounded-xl transition-colors group"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/30 transition-colors">
                <Play className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                  Siguiente episodio
                </p>
                <p className="text-text-muted text-xs mt-0.5">
                  Episodio {episode.episode + 1}
                </p>
              </div>
            </Link>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            <Download className="w-4 h-4" /> Descargar
          </h3>
          <div className="flex flex-wrap gap-2">
            {downloadLinks.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-surface hover:bg-surface-hover rounded-xl transition-colors flex items-center gap-2 text-sm">
                <Download className="w-4 h-4" /> {link.server}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function useMultiSourceEpisode(animeUrl: string | null, episodeNum: string | null, episodeUrl: string | null) {
  return useQuery({
    queryKey: ['anime', 'episode', 'multi', animeUrl, episodeNum, episodeUrl],
    queryFn: () => getEpisodeInfoMulti(animeUrl, Number(episodeNum!), episodeUrl),
    enabled: !!((animeUrl && episodeNum) || (episodeUrl && episodeNum)),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
}

function useEpisodeInfo(url: string | null) {
  return useQuery({
    queryKey: ['anime', 'episode', url],
    queryFn: () => getEpisodeInfo(url!),
    enabled: !!url,
    staleTime: 5 * 60 * 1000,
  });
}
