import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, History, Menu, X, User, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../auth/AuthModal';

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim().toLowerCase())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-text hidden sm:block">Puchflix-Anime</span>
            </Link>

            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar anime..."
                  className="w-full pl-10 pr-4 py-2 bg-surface rounded-lg border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </form>

            <div className="flex items-center gap-1">
              <Link
                to="/favorites"
                className="p-2 hover:bg-surface rounded-lg transition-colors"
                title="Favoritos"
              >
                <Heart className="w-5 h-5" />
              </Link>
              <Link
                to="/history"
                className="p-2 hover:bg-surface rounded-lg transition-colors"
                title="Historial"
              >
                <History className="w-5 h-5" />
              </Link>

              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 hover:bg-surface rounded-lg transition-colors"
                    title={user?.username}
                  >
                    <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="font-medium text-text truncate">{user?.username}</p>
                        <p className="text-xs text-text-muted truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-background transition-colors text-text"
                      >
                        <Settings className="w-4 h-4" />
                        Mi perfil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-background transition-colors text-text"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors text-primary text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Iniciar sesión</span>
                </button>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 hover:bg-surface rounded-lg transition-colors md:hidden"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="md:hidden pb-4">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar anime..."
                    className="w-full pl-10 pr-4 py-2 bg-surface rounded-lg border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
                  />
                </div>
              </form>
            </div>
          )}
        </div>
      </nav>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}