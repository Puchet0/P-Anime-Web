import type { AnimeResult } from '../api/types';

export const SERVER_PRIORITY = ['filemoon', 'streamwish', 'mp4upload', 'yourupload', 'streamtape', 'doodstream', 'dood', 'mixdrop', 'voe', 'vidhide', 'hls', 'pixeldrain'];

export function selectBestServer(servers: { server: string; url: string }[]): { server: string; url: string } {
  for (const preferred of SERVER_PRIORITY) {
    const match = servers.find((s) => s.server.toLowerCase().includes(preferred));
    if (match) return match;
  }
  return servers[0];
}

export function isHLSUrl(url: string): boolean {
  return url.endsWith('.m3u8') || url.includes('manifest');
}

export function isEmbed(url: string): boolean {
  return url.includes('embed') || url.includes('iframe') || url.includes('.html');
}

export function getAnimeImage(anime: AnimeResult): string {
  if (anime.image) return anime.image;
  if (anime.coverImage) return anime.coverImage;
  if (anime.anilistCoverImage) return anime.anilistCoverImage;
  return '';
}


export function formatScore(score: number | null): string {
  if (!score) return 'N/A';
  return score.toFixed(2);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}