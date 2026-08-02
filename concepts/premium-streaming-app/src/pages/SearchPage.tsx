import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAnimeSearch } from '../hooks/useAnimeSearch';
import { useCoverProxy, applyCoverMap, promoteAnilistCover } from '../hooks/useCoverProxy';
import { AnimeGrid } from '../components/anime/AnimeGrid';
import { PROVIDERS } from '../api/types';
import type { AniListSearchResult } from '../api/anilist.api';
import { Search } from 'lucide-react';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const domain = searchParams.get('domain') || '';

  const [draftQuery, setDraftQuery] = useState(query);

  const { data: results, isLoading, error } = useAnimeSearch(query, domain || undefined);

  const anilistMap: Record<number, AniListSearchResult> = {};
  if (results) {
    for (const a of results) {
      if (a.anilistId && !anilistMap[a.anilistId]) {
        anilistMap[a.anilistId] = {
          malId: a.anilistMalId || null,
          title: { romaji: a.title, english: null, native: null },
          coverImage: a.anilistCoverImage || a.coverImage || a.image || '',
          bannerImage: a.anilistBannerImage || null,
          color: a.anilistColor || null,
          averageScore: a.anilistScore || null,
          genres: [],
          synonyms: [],
          seasonYear: null,
          status: null,
        };
      }
    }
  }

  const imageUrls = (results || []).flatMap((a) => {
    const urls = [];
    if (a.image) urls.push(a.image);
    if (a.coverImage) urls.push(a.coverImage);
    if (a.anilistCoverImage) urls.push(a.anilistCoverImage);
    return urls;
  });
  const { data: coverMap } = useCoverProxy(imageUrls);
  const withProxiedCover = coverMap ? applyCoverMap(results || [], coverMap) : (results || []);
  const enrichedResults = promoteAnilistCover(withProxiedCover, coverMap || {});

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        if (draftQuery) newParams.set('q', draftQuery);
        else newParams.delete('q');
        return newParams;
      },
      { replace: true }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        if (e.target.value) newParams.set('domain', e.target.value);
        else newParams.delete('domain');
        return newParams;
      },
      { replace: true }
    );
  };

  return (
    <div className="pt-20 pb-12 px-6">
      <div className="max-w-[1320px] mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 mb-8 max-w-[720px]">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar anime…"
              className="w-full h-12 pl-12 pr-4 bg-surface rounded-xl border border-border text-[15px] text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <select
            value={domain}
            onChange={handleDomainChange}
            className="h-12 px-4 bg-surface rounded-xl border border-border text-text focus:outline-none focus:border-primary min-w-[160px]"
          >
            <option value="">Todos los sitios</option>
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="h-12 px-7 bg-primary hover:bg-primary-hover text-background rounded-xl font-semibold text-sm transition-all duration-200 ease-premium active:scale-95"
          >
            Buscar
          </button>
        </form>

        {error && (
          <div className="text-red-400 text-center py-8">
            Error al buscar. Intenta de nuevo.
          </div>
        )}

        <AnimeGrid animes={enrichedResults} loading={isLoading} anilistMap={anilistMap} />
      </div>
    </div>
  );
}
