import { Link } from 'react-router-dom';
import { useHistoryStore } from '../store/historyStore';
import { Play, Trash2, X, Clock } from 'lucide-react';

export function HistoryPage() {
  const { entries, removeEntry, clearHistory } = useHistoryStore();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString();
  };

  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" />
            Historial
            <span className="text-text-muted text-lg font-normal">({entries.length})</span>
          </h1>
          {entries.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-red-500/20 text-text-muted hover:text-red-500 rounded-lg transition-colors border border-border"
            >
              <X className="w-4 h-4" />
              Limpiar todo
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted text-lg mb-4">No hay historial de reproducción</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Play className="w-5 h-5" />
              Empezar a ver
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-4 p-4 bg-surface rounded-lg hover:bg-surface-hover transition-colors group"
              >
                <Link
                  to={`/watch?episodeUrl=${encodeURIComponent(entry.episodeUrl)}&animeUrl=${encodeURIComponent(entry.animeUrl)}`}
                  className="shrink-0"
                >
                  <div className="w-32 aspect-video rounded-lg overflow-hidden bg-background relative">
                    {entry.animeImage ? (
                      <img src={entry.animeImage} alt={entry.animeTitle} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-text-muted" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min((entry.progress / 3600) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/anime?url=${encodeURIComponent(entry.animeUrl)}`}
                    className="font-semibold hover:text-primary transition-colors line-clamp-1"
                  >
                    {entry.animeTitle}
                  </Link>
                  <p className="text-text-muted">
                    Episodio {entry.episodeNumber}
                    <span className="mx-2">•</span>
                    {entry.variant}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-text-muted">
                    <span>{formatDate(entry.lastWatched)}</span>
                    {entry.progress > 0 && (
                      <span className="text-primary">
                        {Math.floor(entry.progress / 60)} min reproducido
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/watch?episodeUrl=${encodeURIComponent(entry.episodeUrl)}&animeUrl=${encodeURIComponent(entry.animeUrl)}`}
                    className="p-2 bg-primary hover:bg-primary-hover rounded-lg transition-colors"
                  >
                    <Play className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="p-2 bg-surface hover:bg-red-500/20 text-text-muted hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}