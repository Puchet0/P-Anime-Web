import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, History, Menu, X, User, LogOut, Settings, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../auth/AuthModal';

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 border-b border-border transition-all duration-300 ${scrolled ? 'nav-glass scrolled' : 'nav-glass'}`}>
        <div className="max-w-[1320px] mx-auto h-full px-6 flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="font-display text-lg font-semibold hidden sm:block">Puchflix</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/12 px-2 py-0.5 rounded-md hidden sm:block">Anime</span>
          </Link>

          <nav className="flex gap-1.5 ml-2 hidden md:flex" aria-label="Principal">
            <Link to="/" className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${isActive('/') ? 'text-text bg-white/6' : 'text-text-muted hover:text-text hover:bg-white/6'}`}>Inicio</Link>
            <Link to="/following" className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${isActive('/following') ? 'text-text bg-white/6' : 'text-text-muted hover:text-text hover:bg-white/6'}`}>Siguiendo</Link>
            <Link to="/favorites" className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${isActive('/favorites') ? 'text-text bg-white/6' : 'text-text-muted hover:text-text hover:bg-white/6'}`}>Favoritos</Link>
            <Link to="/history" className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${isActive('/history') ? 'text-text bg-white/6' : 'text-text-muted hover:text-text hover:bg-white/6'}`}>Historial</Link>
          </nav>

          <form onSubmit={handleSearch} className="flex-1 max-w-[420px] mx-2 relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar anime, estudio, persona…"
              className="w-full h-9 pl-10 pr-4 bg-surface rounded-[9px] border border-border text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </form>

          <div className="flex items-center gap-2 ml-auto">
            <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/8 transition-colors" title="Notificaciones" aria-label="Notificaciones">
              <Bell className="w-[18px] h-[18px]" />
            </button>

            <Link to="/favorites" className="p-2 hover:bg-white/8 rounded-lg transition-colors" title="Favoritos">
              <Heart className="w-5 h-5" />
            </Link>
            <Link to="/history" className="p-2 hover:bg-white/8 rounded-lg transition-colors" title="Historial">
              <History className="w-5 h-5" />
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 hover:bg-white/8 rounded-lg transition-colors"
                  title={user?.username}
                >
                  <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center border border-border">
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
              className="p-2 hover:bg-white/8 rounded-lg transition-colors md:hidden"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-4 px-6">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar anime…"
                  className="w-full pl-10 pr-4 py-2 bg-surface rounded-xl border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors">Inicio</Link>
              <Link to="/following" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors">Siguiendo</Link>
              <Link to="/favorites" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors">Favoritos</Link>
              <Link to="/history" onClick={() => setIsMenuOpen(false)} className="px-4 py-2 rounded-lg hover:bg-surface-hover transition-colors">Historial</Link>
            </nav>
          </div>
        )}
      </nav>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
