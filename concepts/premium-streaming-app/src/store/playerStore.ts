import { create } from 'zustand';

interface PlayerState {
  currentEpisodeUrl: string | null;
  currentAnimeUrl: string | null;
  currentVariant: 'SUB' | 'DUB';
  volume: number;
  playbackRate: number;
  isFullscreen: boolean;
  setEpisode: (episodeUrl: string, animeUrl: string) => void;
  setVariant: (variant: 'SUB' | 'DUB') => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setFullscreen: (isFullscreen: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentEpisodeUrl: null,
  currentAnimeUrl: null,
  currentVariant: 'SUB',
  volume: 1,
  playbackRate: 1,
  isFullscreen: false,
  setEpisode: (episodeUrl, animeUrl) =>
    set({ currentEpisodeUrl: episodeUrl, currentAnimeUrl: animeUrl }),
  setVariant: (variant) => set({ currentVariant: variant }),
  setVolume: (volume) => set({ volume }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
}));