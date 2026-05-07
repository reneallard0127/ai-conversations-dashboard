import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-dark-950 flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-violet-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">ConversaAI</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Monitorea tus<br />
            <span className="text-white/80">conversaciones de IA</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Dashboard avanzado para analizar el rendimiento de tus agentes de IA en tiempo real.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { label: 'Conversaciones', value: '12,847' },
            { label: 'Satisfacción', value: '94.2%' },
            { label: 'Tiempo respuesta', value: '1.3s' },
            { label: 'Organizaciones', value: '2' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-white font-bold text-xl">{value}</p>
              <p className="text-white/60 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Bienvenido de vuelta</h2>
            <p className="text-slate-400">Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="w-full bg-dark-800 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-800 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary-500/20 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-dark-800 rounded-xl border border-slate-700/50">
            <p className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wide">Cuentas de demo</p>
            <div className="space-y-2">
              <button
                onClick={() => { setEmail('carlos@techstore.com'); setPassword('password123'); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors group"
              >
                <p className="text-slate-300 text-sm group-hover:text-white transition-colors">TechStore</p>
                <p className="text-slate-500 text-xs">carlos@techstore.com</p>
              </button>
              <button
                onClick={() => { setEmail('maria@fashionshop.com'); setPassword('password123'); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors group"
              >
                <p className="text-slate-300 text-sm group-hover:text-white transition-colors">FashionShop</p>
                <p className="text-slate-500 text-xs">maria@fashionshop.com</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;