import { Heart } from 'lucide-react';
import type { AnimeResult } from '../../api/types';
import type { AniListSearchResult } from '../../api/anilist.api';
import { getAnimeImage } from '../../utils/helpers';

// Only use fallback URLs from our own backend/CDN, not external CDN URLs
function isOurUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('/') || url.includes(window.location.hostname);
}

interface AnimeCardProps {
  anime: AnimeResult;
  anilistMetadata?: AniListSearchResult | null;
}

export function AnimeCard({ anime, anilistMetadata }: AnimeCardProps) {
  const imageUrl = getAnimeImage(anime);
  const displayScore = anime.anilistScore ? (anime.anilistScore / 10).toFixed(2) : null;
  const score = anime.score ? anime.score.toFixed(2) : displayScore;

  let clickUrl = anime.url;
  if (!clickUrl && anime._sources && anime._sources.length > 0) {
    clickUrl = anime._sources[0].url;
  }
  const href = anilistMetadata
    ? `/anime?anilist=${encodeURIComponent(JSON.stringify(anilistMetadata))}`
    : `/anime?url=${encodeURIComponent(clickUrl || '')}`;

  return (
    <a
      href={href}
      className="group block relative rounded-lg overflow-hidden bg-surface transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
    >
      <div className="aspect-[3/4] relative">
        <img
          src={imageUrl}
          alt={anime.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            // Fallback: only use our own URLs (proxy /covers/ or internal), never external CDN
            if (anime.image && isOurUrl(anime.image) && target.src !== anime.image) {
              target.src = anime.image;
            } else if (anime.coverImage && isOurUrl(anime.coverImage) && target.src !== anime.coverImage) {
              target.src = anime.coverImage;
            } else if (anime.anilistCoverImage && isOurUrl(anime.anilistCoverImage) && target.src !== anime.anilistCoverImage) {
              target.src = anime.anilistCoverImage;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {anime.score && (
          <div className="absolute top-2 right-2 bg-primary/90 px-2 py-1 rounded text-sm font-semibold flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {score}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-sm text-white line-clamp-2 group-hover:text-primary transition-colors">
            {anime.title}
          </h3>
          {anime.type && (
            <span className="text-xs text-text-muted mt-1 block">{anime.type}</span>
          )}
        </div>
      </div>
    </a>
  );
}