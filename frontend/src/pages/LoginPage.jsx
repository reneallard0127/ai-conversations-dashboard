import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Mail, Lock, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/summary');
    } catch (err) {
      setError('Credenciales incorrectas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
            <Bot size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AI Conversations</h1>
          <p className="text-slate-400 mt-1">Dashboard de monitoreo</p>
        </div>

        {/* Card */}
        <div className="bg-dark-800 rounded-2xl border border-slate-700 p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Iniciar sesión</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 mb-4 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="carlos@techstore.com"
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors mt-2"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Credenciales de prueba */}
          <div className="mt-6 p-4 bg-dark-900 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-xs font-medium mb-2">Cuentas de prueba:</p>
            <div className="space-y-1">
              <p className="text-slate-500 text-xs">📧 carlos@techstore.com / password123</p>
              <p className="text-slate-500 text-xs">📧 maria@fashionshop.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;