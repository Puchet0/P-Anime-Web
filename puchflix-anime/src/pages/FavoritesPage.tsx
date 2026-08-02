import { Link } from 'react-router-dom';
import { useFavoritesStore } from '../store/favoritesStore';
import { Heart, Trash2, Play } from 'lucide-react';

export function FavoritesPage() {
  const { favorites, removeFavorite } = useFavoritesStore();

  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Heart className="w-8 h-8 text-primary fill-primary" />
          Mis Favoritos
          <span className="text-text-muted text-lg font-normal">({favorites.length})</span>
        </h1>

        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted text-lg mb-4">No tienes animes favoritos aún</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Play className="w-5 h-5" />
              Explorar animes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {favorites.map((fav) => (
              <div key={fav.url} className="group relative">
                <Link
                  to={`/anime?url=${encodeURIComponent(fav.url)}`}
                  className="block"
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-surface transition-all duration-300 hover:scale-105">
                    {fav.image ? (
                      <img src={fav.image} alt={fav.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <h3 className="mt-2 font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {fav.title}
                  </h3>
                </Link>
                <button
                  onClick={() => removeFavorite(fav.url)}
                  className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  title="Eliminar de favoritos"
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