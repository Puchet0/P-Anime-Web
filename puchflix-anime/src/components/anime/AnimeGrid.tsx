import type { AnimeResult } from '../../api/types';
import type { AniListSearchResult } from '../../api/anilist.api';
import { AnimeCard } from './AnimeCard';

interface AnimeGridProps {
  animes: AnimeResult[];
  loading?: boolean;
  // Map of malId → AniList metadata for multi-source navigation
  anilistMap?: Record<number, AniListSearchResult>;
}

export function AnimeGrid({ animes, loading, anilistMap }: AnimeGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-lg bg-surface animate-pulse" />
        ))}
      </div>
    );
  }

  if (animes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">No se encontraron resultados</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {animes.map((anime) => {
        const metadata = anilistMap?.[anime.anilistId || 0] || null;
        return (
          <AnimeCard
            key={anime.id}
            anime={anime}
            anilistMetadata={metadata}
          />
        );
      })}
    </div>
  );
}