import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, MessageSquare, Star, Search, X } from 'lucide-react';
import api from '../services/api';
import { onMessage } from '../services/websocket';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
    status === 'open'
      ? 'bg-emerald-500/20 text-emerald-400'
      : 'bg-slate-500/20 text-slate-400'
  }`}>
    {status === 'open' ? 'Abierta' : 'Cerrada'}
  </span>
);

const RatingStars = ({ rating }) => {
  if (!rating) return <span className="text-slate-500 text-xs">Sin calificar</span>;
  return (
    <div className="flex items-center gap-1">
      <Star size={12} className="text-amber-400 fill-amber-400" />
      <span className="text-slate-300 text-xs">{parseFloat(rating).toFixed(1)}</span>
    </div>
  );
};

const ConversationsPage = () => {
  const [conversations, setConversations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', minRating: '', channel: '', dateFrom: '', dateTo: '' });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const fetchConversations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/conversations', { params });
      setConversations(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchConversations(1); }, [fetchConversations]);

  useEffect(() => {
    const unsub = onMessage('NEW_CONVERSATION', (msg) => {
      setConversations(prev => [msg.data, ...prev]);
      toast.success('Nueva conversación recibida en tiempo real');
    });
    return unsub;
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/conversations', { channel: 'Web' });
      toast.success('Nueva conversación creada');
      navigate(`/conversations/${data.id}`);
    } catch (err) {
      toast.error('Error al crear la conversación');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const clearFilters = () => {
    setFilters({ status: '', minRating: '', channel: '', dateFrom: '', dateTo: '' });
    setSearch('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || search;

  // Filtrar por búsqueda en el frontend (por ID)
  const filteredConversations = conversations.filter(conv => {
    if (!search) return true;
    return conv.id.toLowerCase().includes(search.toLowerCase()) ||
           conv.channel.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Conversaciones</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.total} conversaciones en total</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          {creating ? 'Creando...' : 'Nueva conversación'}
        </button>
      </div>

      {/* Barra de búsqueda + filtros */}
      <div className="space-y-3">
        <div className="flex gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por ID o canal..."
              className="w-full bg-dark-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 text-sm transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Botón filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
              hasActiveFilters
                ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                : 'bg-dark-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Filter size={16} />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            )}
          </button>

          {/* Limpiar filtros */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-slate-400 hover:text-red-400 text-sm transition-colors px-3"
            >
              <X size={14} />
              Limpiar
            </button>
          )}
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-dark-800 rounded-xl border border-slate-700 p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <select
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                className="bg-dark-900 border border-slate-600 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="">Todos los estados</option>
                <option value="open">Abierta</option>
                <option value="closed">Cerrada</option>
              </select>
              <select
                value={filters.channel}
                onChange={e => setFilters(f => ({ ...f, channel: e.target.value }))}
                className="bg-dark-900 border border-slate-600 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="">Todos los canales</option>
                <option value="Web">Web</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Instagram">Instagram</option>
              </select>
              <select
                value={filters.minRating}
                onChange={e => setFilters(f => ({ ...f, minRating: e.target.value }))}
                className="bg-dark-900 border border-slate-600 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="">Rating mínimo</option>
                <option value="1">★ 1+</option>
                <option value="2">★ 2+</option>
                <option value="3">★ 3+</option>
                <option value="4">★ 4+</option>
              </select>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="bg-dark-900 border border-slate-600 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="bg-dark-900 border border-slate-600 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-dark-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-dark-900/50">
              <th className="text-left text-slate-400 text-xs font-medium px-4 py-3 uppercase tracking-wide">ID</th>
              <th className="text-left text-slate-400 text-xs font-medium px-4 py-3 uppercase tracking-wide">Fecha inicio</th>
              <th className="text-left text-slate-400 text-xs font-medium px-4 py-3 uppercase tracking-wide">Canal</th>
              <th className="text-left text-slate-400 text-xs font-medium px-4 py-3 uppercase tracking-wide">Duración</th>
              <th className="text-left text-slate-400 text-xs font-medium px-4 py-3 uppercase tracking-wide">Estado</th>
              <th className="text-left text-slate-400 text-xs font-medium px-4 py-3 uppercase tracking-wide">Rating</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-primary-500"></div>
                  Cargando...
                </div>
              </td></tr>
            ) : filteredConversations.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <MessageSquare size={32} className="text-slate-700" />
                  <p>No hay conversaciones{search ? ` con "${search}"` : ''}</p>
                </div>
              </td></tr>
            ) : filteredConversations.map(conv => (
              <tr
                key={conv.id}
                onClick={() => navigate(`/conversations/${conv.id}`)}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-primary-500 flex-shrink-0" />
                    <span className="text-slate-300 text-xs font-mono">{conv.id.slice(0, 8)}...</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300 text-sm">
                  {format(new Date(conv.started_at), 'dd MMM yyyy HH:mm', { locale: es })}
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-300 text-xs px-2 py-0.5 bg-slate-700 rounded-full">{conv.channel}</span>
                </td>
                <td className="px-4 py-3 text-slate-300 text-sm">
                  {conv.duration_seconds ? `${conv.duration_seconds}s` : '—'}
                </td>
                <td className="px-4 py-3"><StatusBadge status={conv.status} /></td>
                <td className="px-4 py-3"><RatingStars rating={conv.rating} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 bg-dark-900/30">
            <span className="text-slate-400 text-sm">
              Página {pagination.page} de {pagination.totalPages} — {pagination.total} conversaciones
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchConversations(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 rounded-lg text-sm transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => fetchConversations(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-300 rounded-lg text-sm transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsPage;