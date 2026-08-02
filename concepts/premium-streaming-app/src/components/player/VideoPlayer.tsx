import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';

interface VideoPlayerProps {
  src: string;
  title?: string;
  onProgress?: (progress: number) => void;
}

export function VideoPlayer({ src, title, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  const { volume, playbackRate, setPlaybackRate } = usePlayerStore();

  const isDirectVideo = (url: string) => {
    return url.includes('.m3u8') || url.includes('manifest');
  };

  // Detectar si es un embed de iframe (no un archivo de video directo)
  const isEmbedUrl = (url: string) => {
    if (!url) return false;
    return url.includes('/jkplayer/') ||
           url.includes('/jkplayer.') ||
           url.includes('embed') ||
           url.includes('/play/') ||
           url.includes('iframe') ||
           url.includes('player.zilla') ||
           url.includes('pixeldrain') ||
           url.includes('mp4upload') ||
           url.includes('streamsb') ||
           url.includes('dood') ||
           url.includes('mixdrop') ||
           url.includes('upstream') ||
           url.includes('streamtape') ||
           url.includes('yourupload');
  };

  useEffect(() => {
    if (!src || src.trim() === '') return;

    const video = videoRef.current;
    if (!video) return;

    // Limpiar HLS previo
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isDirectVideo(src)) {
      // HLS para iPad/iOS Safari (nativo)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.load();
      } else if (Hls.isSupported()) {
        // HLS.js para desktop Android Chrome
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      }
    } else if (!isEmbedUrl(src)) {
      // MP4 directo
      video.src = src;
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      onProgress?.(video.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = parseFloat(e.target.value);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Bloquear popups windows que los embeds puedan abrir
  useEffect(() => {
    const blockMouseDown = (e: MouseEvent) => {
      // Interceptar clicks en el iframe para evitar que abran popups
      const target = e.target as Element;
      if (containerRef.current?.contains(target) && target.closest('iframe')) {
        e.stopPropagation();
      }
    };

    document.addEventListener('mousedown', blockMouseDown, true);
    return () => document.removeEventListener('mousedown', blockMouseDown, true);
  }, []);

  // Renderizar iframe para URLs de embed
  if (isEmbedUrl(src)) {
    return (
      <div
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden"
      >
        <iframe
          src={src}
          className="w-full aspect-video"
          allowFullScreen
          allow="autoplay; fullscreen; playsinline; encrypted-media"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          {...({ playsInline: true } as React.HTMLProps<HTMLIFrameElement>)}
        />
        {title && <p className="text-sm text-white/80 p-2 bg-black/50">{title}</p>}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full aspect-video"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        playsInline
      />

      {showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 transition-opacity">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={togglePlay}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-mono">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
              />
              <span className="text-sm font-mono">{formatTime(duration)}</span>
            </div>

            <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-white/20 px-2 py-1 rounded text-sm"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-full">
              <Maximize className="w-5 h-5" />
            </button>
          </div>

          {title && <p className="text-sm text-white/80">{title}</p>}
        </div>
      )}
    </div>
  );
}