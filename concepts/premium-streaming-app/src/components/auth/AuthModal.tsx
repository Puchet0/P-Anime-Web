import { useState } from 'react';
import { X, User, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePassword, validateUsername, sanitizeTextInput } from '../../utils/validate';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sanitize inputs
      const cleanUsername = sanitizeTextInput(username, 20);
      const cleanEmail = sanitizeTextInput(email, 254);

      // Validate username
      if (!validateUsername(cleanUsername)) {
        setError('Usuario: 3-20 caracteres, solo letras, números y guión bajo');
        setLoading(false);
        return;
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        setError(passwordValidation.errors.join('. '));
        setLoading(false);
        return;
      }

      if (mode === 'login') {
        await login(cleanUsername, password);
      } else {
        // Validate email for registration
        if (!validateEmail(cleanEmail)) {
          setError('Email inválido');
          setLoading(false);
          return;
        }
        await register(cleanUsername, cleanEmail, password);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </h2>
              <p className="text-sm text-text-muted">
                {mode === 'login' ? 'Accede a tu cuenta' : 'Regístrate gratis'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-border rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-colors ${
              mode === 'login'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Iniciar sesión
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-colors ${
              mode === 'register'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Registrarse
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu nombre de usuario"
              required
              minLength={3}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Mínimo 8 caracteres, 1 mayúscula, 1 número' : 'Tu contraseña'}
              required
              minLength={mode === 'register' ? 8 : 1}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-spin">⟳</span>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                Iniciar sesión
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Crear cuenta
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-text-muted">
            {mode === 'login' ? (
              <>¿No tienes cuenta? <button onClick={() => setMode('register')} className="text-primary hover:underline">Regístrate</button></>
            ) : (
              <>¿Ya tienes cuenta? <button onClick={() => setMode('login')} className="text-primary hover:underline">Inicia sesión</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}