import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePlayerStore } from '../store/playerStore';
import { useHistoryStore } from '../store/historyStore';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { selectBestServer } from '../utils/helpers';
import { getEpisodeInfo, getEpisodeInfoMulti } from '../api/anime.api';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Download, Check, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';

export function WatchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const episodeUrl = searchParams.get('episodeUrl');
  const animeUrl = searchParams.get('animeUrl');
  const episodeNum = searchParams.get('episodeNum');

  const { data: singleEpisode, isLoading, error } = useEpisodeInfo(episodeUrl);

  // Multi-source: load merged servers from all providers for this episode number
  const { data: multiEpisode } = useMultiSourceEpisode(
    animeUrl,
    episodeNum,
    episodeUrl
  );

  const [variant, setVariant] = useState<'SUB' | 'DUB'>('SUB');
  const [currentServer, setCurrentServer] = useState<{ server: string; url: string } | null>(null);

  const { setEpisode } = usePlayerStore();
  const { addEntry, markWatched, getEntry } = useHistoryStore();
  useAuth();

  // Determine which episode data to use: prefer multi-source when available
  const episode = multiEpisode || singleEpisode;
  const isEpisodeLoading = isLoading && !multiEpisode;

  useEffect(() => {
    console.log(`[WatchPage] multiEpisode:`, multiEpisode, '| singleEpisode:', singleEpisode, '| episode:', episode);
  }, [multiEpisode, singleEpisode, episode]);

  useEffect(() => {
    if (episodeUrl && animeUrl) {
      setEpisode(episodeUrl, animeUrl);
    }
  }, [episodeUrl, animeUrl, setEpisode]);

  useEffect(() => {
    if (episode) {
      const servers = variant === 'SUB' ? episode.servers.sub : episode.servers.dub;
      const best = selectBestServer(servers);
      setCurrentServer(best);
    }
  }, [episode, variant]);

  const handleProgress = (progress: number) => {
    if (episodeUrl && animeUrl && episode) {
      const stored = sessionStorage.getItem(`_sources:${animeUrl}`);
      const coverData = stored ? JSON.parse(stored) : null;
      const animeCover = coverData?.cover || coverData?.anilistCoverImage || null;

      addEntry({
        animeUrl,
        animeTitle: episode.title,
        animeImage: animeCover,
        episodeUrl,
        episodeNumber: episode.episode,
        progress,
        completed: getEntry(episodeUrl)?.completed ?? false,
        variant,
      });
    }
  };

  const toggleWatched = () => {
    if (!episodeUrl) return;
    const entry = getEntry(episodeUrl);
    const newCompleted = !entry?.completed;
    markWatched(episodeUrl, newCompleted);
  };

  const navigateEpisode = (direction: 'prev' | 'next') => {
    if (!episode) return;
    if (!animeUrl && !episodeUrl) return;
    const currentNum = episode.episode;
    const newNum = direction === 'prev' ? currentNum - 1 : currentNum + 1;
    if (newNum < 1) return;

    // Use animeUrl if available, otherwise build from episodeUrl
    let nextEpisodeUrl: string;
    if (animeUrl) {
      const stripped = animeUrl.replace(/\/$/, '');
      nextEpisodeUrl = `${stripped}/${newNum}`;
    } else if (episodeUrl) {
      // episodeUrl like https://tioanime.com/ver/one-piece-1 or https://jkanime.net/one-piece/1
      const epUrl = episodeUrl;
      // Replace episode number at end of URL
      nextEpisodeUrl = epUrl.replace(/\/\d+(\?.*)?$/, `/${newNum}`);
    } else {
      // No URL available, cannot navigate
      return;
    }
    setSearchParams({ episodeUrl: nextEpisodeUrl!, animeUrl: animeUrl || '', episodeNum: String(newNum) });
  };

  if (!episodeUrl) {
    return (
      <div className="pt-24 text-center">
        <p className="text-text-muted">URL de episodio no proporcionada</p>
        <Link to="/" className="text-primary hover:underline mt-4 inline-block">
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (isEpisodeLoading) {
    return (
      <div className="pt-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="aspect-video bg-surface animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="pt-24 text-center">
        <p className="text-red-500">Error al cargar el episodio</p>
        <Link to={`/anime?url=${encodeURIComponent(animeUrl || '')}`} className="text-primary hover:underline mt-4 inline-block">
          Volver al anime
        </Link>
      </div>
    );
  }

  const servers = variant === 'SUB' ? episode.servers.sub : episode.servers.dub;
  const downloadLinks = variant === 'SUB' ? episode.downloadLinks.SUB : episode.downloadLinks.DUB;

  return (
    <div className="pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-4 flex items-center gap-2 text-text-muted">
          <Link to={`/anime?url=${encodeURIComponent(animeUrl || '')}`} className="hover:text-text">
            {episode.title.replace(`Episodio ${episode.episode}`, '').trim() || 'Anime'}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span>Episodio {episode.episode}</span>
        </div>

        <VideoPlayer
          src={currentServer?.url || ''}
          title={`${episode.title} - ${variant}`}
          onProgress={handleProgress}
        />

        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateEpisode('prev')}
              disabled={episode.episode <= 1}
              className="p-2 bg-surface hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg px-4">Episodio {episode.episode}</span>
            <button
              onClick={() => navigateEpisode('next')}
              className="p-2 bg-surface hover:bg-surface-hover rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={toggleWatched}
              title={getEntry(episodeUrl)?.completed ? 'Marcar como no visto' : 'Marcar como visto'}
              className={`p-2 rounded-lg transition-colors ${
                getEntry(episodeUrl)?.completed
                  ? 'bg-primary text-white'
                  : 'bg-surface hover:bg-surface-hover'
              }`}
            >
              {getEntry(episodeUrl)?.completed ? <EyeOff className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {episode._sources && episode._sources.length > 1 && (
              <div className="flex items-center gap-1 mr-2">
                <span className="text-text-muted text-xs">Fuentes:</span>
                {episode._sources.map(src => (
                  <span key={src} className="px-2 py-0.5 bg-surface border border-border rounded text-xs capitalize">
                    {src === 'animeav1' ? 'animev1' : src}
                  </span>
                ))}
              </div>
            )}
            <span className="text-text-muted">Audio:</span>
            <div className="flex rounded-lg overflow-hidden border border-border">
              {(episode.variants?.SUB ?? episode.servers?.sub?.length ?? 0) > 0 && (
                <button
                  onClick={() => setVariant('SUB')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    variant === 'SUB' ? 'bg-primary text-white' : 'bg-surface hover:bg-surface-hover'
                  }`}
                >
                  SUB
                </button>
              )}
              {(episode.variants?.DUB ?? episode.servers?.dub?.length ?? 0) > 0 && (
                <button
                  onClick={() => setVariant('DUB')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    variant === 'DUB' ? 'bg-primary text-white' : 'bg-surface hover:bg-surface-hover'
                  }`}
                >
                  DUB
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Servidores de video</h3>
          <div className="flex flex-wrap gap-2">
            {servers.map((server, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentServer(server)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentServer?.url === server.url
                    ? 'bg-primary text-white'
                    : 'bg-surface hover:bg-surface-hover'
                }`}
              >
                {server.server}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Descargar
          </h3>
          <div className="flex flex-wrap gap-2">
            {downloadLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-surface hover:bg-surface-hover rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {link.server}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Multi-source episode fetcher: delegates to the backend's /episode-multi endpoint
// which searches all providers for the same anime title and merges all servers
// Supports animeUrl OR episodeUrl directly (when animeUrl is empty)
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
