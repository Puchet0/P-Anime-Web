import type { AnimeResult } from '../../api/types';
import type { AniListSearchResult } from '../../api/anilist.api';
import { getAnimeImage } from '../../utils/helpers';

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
  const displayScore = anime.anilistScore ? (anime.anilistScore / 10).toFixed(1) : null;
  const score = anime.score ? anime.score.toFixed(1) : displayScore;
  const year = anime.year || null;

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
      className="group block relative rounded-xl overflow-hidden bg-surface transition-all duration-200 ease-premium hover:scale-[1.04] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <div className="aspect-[3/4] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[1]" />
        <img
          src={imageUrl}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-400 ease-premium group-hover:scale-[1.06]"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            if (anime.image && isOurUrl(anime.image) && target.src !== anime.image) {
              target.src = anime.image;
            } else if (anime.coverImage && isOurUrl(anime.coverImage) && target.src !== anime.coverImage) {
              target.src = anime.coverImage;
            } else if (anime.anilistCoverImage && isOurUrl(anime.anilistCoverImage) && target.src !== anime.anilistCoverImage) {
              target.src = anime.anilistCoverImage;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/92 via-transparent to-transparent z-[2]" />

        {score && (
          <div className="absolute top-2.5 right-2.5 bg-primary/90 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 z-[3]">
            <span>★</span> {score}
          </div>
        )}

        {year && (
          <div className="absolute top-2.5 left-2.5 bg-white/8 px-1.5 py-0.5 rounded text-[10px] font-semibold text-text-muted z-[3]">
            {year}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3.5 z-[3]">
          <h3 className="font-semibold text-[13px] text-white line-clamp-2 group-hover:text-primary transition-colors">
            {anime.title}
          </h3>
          {anime.type && (
            <span className="text-xs text-text-muted mt-1 block">{anime.type}</span>
          )}
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-250 ease-premium z-[4] scale-75 group-hover:scale-100">
          <svg viewBox="0 0 24 24" width="14" height="14" className="text-background ml-0.5"><path d="M7 5v14l12-7z" fill="currentColor"/></svg>
        </div>
      </div>
    </a>
  );
}
