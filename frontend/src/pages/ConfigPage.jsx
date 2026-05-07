import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Key, User, Check, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';

const ConfigPage = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPrompt, setNewPrompt] = useState({ name: '', content: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/config'), api.get('/config/prompts')])
      .then(([configRes, promptsRes]) => {
        setConfig(configRes.data);
        setPrompts(promptsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSetDefault = async (promptId) => {
    try {
      await api.patch(`/config/prompts/${promptId}/default`);
      setPrompts(prev => prev.map(p => ({ ...p, is_default: p.id === promptId })));
    } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    if (!newPrompt.name || !newPrompt.content) return;
    try {
      const { data } = await api.post('/config/prompts', newPrompt);
      setPrompts(prev => [...prev, data]);
      setNewPrompt({ name: '', content: '' });
      setShowForm(false);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (promptId) => {
    try {
      await api.delete(`/config/prompts/${promptId}`);
      setPrompts(prev => prev.filter(p => p.id !== promptId));
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white">Configuración</h1>
        <p className="text-slate-400 text-sm mt-1">Ajustes de tu organización</p>
      </div>

      {/* Perfil de usuario */}
      <div className="bg-dark-800 rounded-xl border border-slate-700 p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <User size={18} className="text-primary-500" />
          Perfil de Usuario
        </h2>
        <div className="flex items-center gap-4">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
            alt="avatar"
            className="w-16 h-16 rounded-full bg-slate-700"
            style={{ maxWidth: '64px', maxHeight: '64px' }}
          />
          <div>
            <p className="text-white font-medium">{user?.name}</p>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
              {user?.orgName}
            </span>
          </div>
        </div>
      </div>

      {/* Configuración de IA */}
      <div className="bg-dark-800 rounded-xl border border-slate-700 p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Key size={18} className="text-primary-500" />
          Conexión API de IA
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Proveedor', value: config?.aiProvider },
            { label: 'Modelo', value: config?.model },
            { label: 'Endpoint', value: config?.endpoint },
            { label: 'API Key', value: config?.apiKey },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-slate-700/50">
              <span className="text-slate-400 text-sm">{label}</span>
              <span className="text-slate-300 text-sm font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prompts */}
      <div className="bg-dark-800 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Settings size={18} className="text-primary-500" />
            Personalidades de la IA
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm transition-colors"
          >
            <Plus size={16} />
            Nuevo prompt
          </button>
        </div>

        {/* Formulario nuevo prompt */}
        {showForm && (
          <div className="mb-4 p-4 bg-dark-900 rounded-lg border border-slate-600 space-y-3">
            <input
              placeholder="Nombre (ej: Asistente Formal)"
              value={newPrompt.name}
              onChange={e => setNewPrompt(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-dark-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            />
            <textarea
              placeholder="Contenido del prompt de sistema..."
              value={newPrompt.content}
              onChange={e => setNewPrompt(p => ({ ...p, content: e.target.value }))}
              rows={3}
              className="w-full bg-dark-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                Guardar
              </button>
              <button onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {prompts.map(prompt => (
            <div key={prompt.id} className={`p-4 rounded-lg border transition-colors ${
              prompt.is_default
                ? 'border-primary-500 bg-primary-500/5'
                : 'border-slate-700 bg-dark-900'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">{prompt.name}</span>
                    {prompt.is_default && (
                      <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{prompt.content}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!prompt.is_default && (
                    <>
                      <button
                        onClick={() => handleSetDefault(prompt.id)}
                        className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors px-2 py-1 rounded hover:bg-primary-500/10"
                      >
                        <Check size={14} />
                        Usar
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-400/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;