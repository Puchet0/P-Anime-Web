import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFollowingStore } from '../store/followingStore';
import { Eye, Trash2, Play } from 'lucide-react';

export function FollowingPage() {
  const { following, isLoading, loadFromSupabase, removeFollowing } = useFollowingStore();

  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  return (
    <div className="pt-20 pb-12 px-6">
      <div className="max-w-[1100px] mx-auto">
        <h1 className="font-display text-3xl font-bold mb-8 flex items-center gap-3">
          <Eye className="w-8 h-8 text-primary" />
          Siguiendo
          <span className="text-text-muted text-lg font-normal">({following.length})</span>
        </h1>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted text-lg">Cargando animes seguidos…</p>
          </div>
        ) : following.length === 0 ? (
          <div className="text-center py-16">
            <Eye className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted text-lg mb-4">No sigues ningún anime aún</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover px-6 py-3 rounded-xl font-semibold text-sm text-background transition-all duration-200 ease-premium active:scale-95"
            >
              <Play className="w-5 h-5" /> Explorar animes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-[18px]">
            {following.map((item) => (
              <div key={item.url} className="group relative">
                <Link to={`/search?q=${encodeURIComponent(item.title.toLowerCase())}`} className="block">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-surface transition-all duration-200 ease-premium hover:scale-[1.04] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">Sin imagen</div>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h3>
                </Link>
                <button
                  onClick={() => removeFollowing(item.url)}
                  className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Dejar de seguir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
