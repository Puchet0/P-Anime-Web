import { useState, useEffect, useRef, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRecentEpisodes, useCurrentSeason } from '../hooks/useHomepageData';
import { useHistoryStore } from '../store/historyStore';
import { useFavoritesStore } from '../store/favoritesStore';
import {
  Play,
  ChevronRight,
  ChevronLeft,
  Clock,
  TrendingUp,
  CalendarDays,
  Star,
  Heart,
} from 'lucide-react';
import type { AniListAiringSchedule, AniListMedia } from '../api/anilist.types';

function formatTimeUntil(seconds: number): string {
  if (seconds <= 0) return 'Ya disponible';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function formatAiringTime(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const now = new Date();
  const diffH = Math.floor((d.getTime() - now.getTime()) / 3600000);
  if (diffH < 1) return 'Hace menos de 1h';
  if (diffH < 24) return `Hace ${diffH}h`;
  return `Hace ${Math.floor(diffH / 24)}d`;
}

function getAnimeTitle(media: { title: { romaji: string; english: string | null } }): string {
  return media.title.english || media.title.romaji;
}

function HeroBanner() {
  const { data: currentSeason, isLoading } = useCurrentSeason();
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const filteredSeason = currentSeason?.filter(m => !m.genres.some(g => g.toLowerCase() === 'hentai')) ?? [];

  useEffect(() => {
    if (!filteredSeason.length) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % filteredSeason.length);
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [filteredSeason.length]);

  if (isLoading || !filteredSeason.length) {
    return (
      <div className="relative h-[420px] rounded-2xl overflow-hidden bg-surface animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-surface to-background" />
      </div>
    );
  }

  const item = filteredSeason[current];

  return (
    <div className="relative h-[420px] rounded-2xl overflow-hidden group">
      <div className="absolute inset-0">
        {item.bannerImage && (
          <img
            src={item.bannerImage}
            alt=""
            className="w-full h-full object-cover transition-opacity duration-700"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="relative h-full max-w-7xl mx-auto px-8 flex items-center">
        <div className="max-w-xl">
          <div className="flex gap-2 mb-3">
            {item.genres.slice(0, 3).map((g) => (
              <span key={g} className="text-xs font-medium bg-primary/20 text-primary px-2 py-1 rounded-full">
                {g}
              </span>
            ))}
          </div>
          <h1 className="text-4xl font-bold mb-2">{getAnimeTitle(item)}</h1>
          {item.description && (
            <p className="text-text-muted text-sm mb-4 line-clamp-3" dangerouslySetInnerHTML={{ __html: item.description }} />
          )}
          <div className="flex items-center gap-4 mb-6">
            {item.averageScore && (
              <span className="flex items-center gap-1 text-sm font-semibold text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                {item.averageScore / 10}
              </span>
            )}
            {item.episodes && (
              <span className="text-sm text-text-muted">{item.episodes} episodios</span>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              to={`/search?q=${encodeURIComponent(getAnimeTitle(item).toLowerCase())}`}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              Ver ahora
            </Link>
            <Link
              to={`/anime?malId=${item.idMal}&title=${encodeURIComponent(getAnimeTitle(item))}`}
              className="flex items-center gap-2 bg-surface-hover hover:bg-surface text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
            >
              Mas info
            </Link>
          </div>
        </div>
      </div>

      <button
        onClick={() => setCurrent((c) => (c - 1 + filteredSeason.length) % filteredSeason.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % filteredSeason.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {filteredSeason.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-primary w-6' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}

function RecentEpisodeCard({ schedule }: { schedule: AniListAiringSchedule }) {
  const navigate = useNavigate();
  const title = getAnimeTitle(schedule.media);
  const airingColor = schedule.media.coverImage.color || '#e11d48';

  return (
    <div
      onClick={() => navigate(`/search?q=${encodeURIComponent(title.toLowerCase())}&episode=${schedule.episode}&autoplay=true`)}
      className="group relative rounded-xl overflow-hidden bg-surface cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-black/50"
    >
      <div className="aspect-[16/10] relative">
        <img
          src={schedule.media.coverImage.extraLarge || schedule.media.coverImage.large}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div
          className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold"
          style={{ backgroundColor: airingColor, color: '#fff' }}
        >
          EP {schedule.episode}
        </div>
        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white/80">
          <Clock className="w-3 h-3 inline mr-1" />
          {formatAiringTime(schedule.airingAt)}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-sm text-white line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-white/60 mt-1">{schedule.media.format || 'TV'}</p>
        </div>
      </div>
    </div>
  );
}

function SeasonAnimeCard({ media }: { media: AniListMedia }) {
  const navigate = useNavigate();
  const title = getAnimeTitle(media);

  return (
    <div
      onClick={() => navigate(`/search?q=${encodeURIComponent(title.toLowerCase())}`)}
      className="group relative min-w-[160px] rounded-xl overflow-hidden bg-surface cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-black/50"
    >
      <div className="aspect-[3/4] relative">
        <img
          src={media.coverImage.extraLarge || media.coverImage.large}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {media.nextAiringEpisode && (
          <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
            <Clock className="w-3 h-3 inline mr-1" />
            {formatTimeUntil(media.nextAiringEpisode.timeUntilAiring)}
          </div>
        )}

        {media.averageScore && (
          <div className="absolute top-2 left-2 bg-black/70 px-1.5 py-0.5 rounded text-xs text-yellow-400 font-semibold flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-current" />
            {media.averageScore / 10}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h3 className="font-semibold text-xs text-white line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>
      </div>
    </div>
  );
}

function HistoryRow() {
  const { entries } = useHistoryStore();
  const recent = entries.slice(0, 8);
  const navigate = useNavigate();

  if (!recent.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Continuar viendo</h2>
        </div>
        <Link to="/history" className="text-sm text-text-muted hover:text-primary flex items-center gap-1 transition-colors">
          Ver todo <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {recent.map((entry) => (
          <div
            key={entry.id}
            onClick={() => navigate(`/anime?url=${encodeURIComponent(entry.animeUrl)}`)}
            className="group flex-shrink-0 w-32 cursor-pointer"
          >
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-surface relative">
              <img src={entry.animeImage || ''} alt={entry.animeTitle} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-xs font-semibold text-white line-clamp-2 group-hover:text-primary transition-colors">
                  {entry.animeTitle}
                </p>
                <p className="text-xs text-white/60 mt-0.5">Ep. {entry.episodeNumber}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FavoritesRow() {
  const { favorites } = useFavoritesStore();
  const recent = favorites.slice(0, 8);
  const navigate = useNavigate();

  if (!recent.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <h2 className="text-xl font-bold">Mis favoritos</h2>
        </div>
        <Link to="/favorites" className="text-sm text-text-muted hover:text-primary flex items-center gap-1 transition-colors">
          Ver todo <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {recent.map((fav) => (
          <div
            key={fav.url}
            onClick={() => navigate(`/anime?url=${encodeURIComponent(fav.url)}`)}
            className="group flex-shrink-0 w-32 cursor-pointer"
          >
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-surface relative">
              <img src={fav.image || ''} alt={fav.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-xs font-semibold text-white line-clamp-2 group-hover:text-primary transition-colors">
                  {fav.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return <div className={`rounded-xl bg-surface animate-pulse ${className || ''}`} />;
}

function SectionSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-shrink-0">
          <SkeletonCard className="w-40 h-56" />
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const { data: recentEpisodes, isLoading: recentLoading } = useRecentEpisodes(72);
  const { data: currentSeason, isLoading: seasonLoading } = useCurrentSeason();
  const recentScrollRef = useRef<HTMLDivElement>(null);
  const seasonScrollRef = useRef<HTMLDivElement>(null);

  const isHentai = (genres: string[]) => genres.some(g => g.toLowerCase() === 'hentai');

  const dedupedRecent = (() => {
    if (!recentEpisodes) return [];
    const seen = new Map<number, AniListAiringSchedule>();
    for (const s of recentEpisodes) {
      if (isHentai(s.media.genres)) continue;
      const existing = seen.get(s.media.id);
      if (!existing || s.episode > existing.episode) {
        seen.set(s.media.id, s);
      }
    }
    return Array.from(seen.values()).slice(0, 24);
  })();

  const scrollCarousel = (ref: RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 320;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <section className="mb-10">
            <HeroBanner />
          </section>

          <section className="mb-10 relative group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Episodios recientes</h2>
              </div>
              <span className="text-xs text-text-muted bg-surface px-2 py-1 rounded">
                Ultima actualizacion: hace pocos minutos
              </span>
            </div>
            {recentLoading ? (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} className="w-40 h-56 flex-shrink-0" />
                ))}
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); scrollCarousel(recentScrollRef, 'left'); }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center opacity-80 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div
                  ref={recentScrollRef}
                  className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
                >
                  {dedupedRecent.map((s) => (
                    <div key={`${s.media.id}-${s.episode}`} className="flex-shrink-0 w-40">
                      <RecentEpisodeCard schedule={s} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); scrollCarousel(recentScrollRef, 'right'); }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center opacity-80 transition-opacity"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </section>

          <HistoryRow />
          <FavoritesRow />

          <section className="mb-10 relative group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Temporada actual</h2>
              </div>
            </div>
            {seasonLoading ? (
              <SectionSkeleton count={8} />
            ) : (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); scrollCarousel(seasonScrollRef, 'left'); }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center opacity-80 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div
                  ref={seasonScrollRef}
                  className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
                >
                  {currentSeason?.filter(m => !isHentai(m.genres)).map((media) => (
                    <div key={media.id} className="flex-shrink-0 w-40">
                      <SeasonAnimeCard media={media} />
                    </div>
                  ))}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); scrollCarousel(seasonScrollRef, 'right'); }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center opacity-80 transition-opacity"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </section>

        </div>
      </div>
  );
}