import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingDown, Download, Filter } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    channel: '',
  });

  const fetchAnalytics = () => {
    setLoading(true);
    const params = {};
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.channel) params.channel = filters.channel;

    api.get('/analytics', { params })
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const clearFilters = () => {
    setFilters({ dateFrom: '', dateTo: '', channel: '' });
    setTimeout(() => fetchAnalytics(), 100);
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  const exportToCSV = async () => {
    try {
      toast.loading('Preparando exportación...', { id: 'export' });
      const { data: convData } = await api.get('/conversations', { params: { limit: 1000, page: 1 } });

      const headers = ['ID', 'Fecha Inicio', 'Canal', 'Duración (s)', 'Estado', 'Rating'];
      const rows = convData.data.map(conv => [
        conv.id,
        new Date(conv.started_at).toLocaleString('es-CL'),
        conv.channel,
        conv.duration_seconds || '',
        conv.status === 'open' ? 'Abierta' : 'Cerrada',
        conv.rating ? parseFloat(conv.rating).toFixed(1) : 'Sin calificar',
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conversaciones_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`${convData.data.length} conversaciones exportadas`, { id: 'export' });
    } catch (err) {
      toast.error('Error al exportar', { id: 'export' });
    }
  };

  const exportAnalytics = () => {
    try {
      toast.loading('Exportando analytics...', { id: 'export-analytics' });
      const headers = ['Métrica', 'Valor', 'Porcentaje'];
      const ratingRows = (data?.ratingDistribution || []).map(r => [
        `Rating ${r.rating} estrellas`, r.count, `${r.percentage}%`
      ]);
      const channelRows = (data?.channelDistribution || []).map(c => [
        `Canal ${c.channel}`, c.count, `${c.percentage}%`
      ]);

      const csvContent = [headers, ...ratingRows, [], ['Canal', 'Cantidad', 'Porcentaje'], ...channelRows]
        .map(row => Array.isArray(row) ? row.map(cell => `"${cell}"`).join(',') : '')
        .join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Analytics exportados', { id: 'export-analytics' });
    } catch (err) {
      toast.error('Error al exportar analytics', { id: 'export-analytics' });
    }
  };

  const ratingData = [1,2,3,4,5].map(r => {
    const found = data?.ratingDistribution?.find(d => parseInt(d.rating) === r);
    return { rating: `★ ${r}`, porcentaje: found ? parseFloat(found.percentage) : 0, count: found ? parseInt(found.count) : 0 };
  });

  const channelData = data?.channelDistribution?.map(c => ({
    name: c.channel,
    value: parseFloat(c.percentage),
    count: parseInt(c.count),
  })) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Métricas detalladas de rendimiento</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportAnalytics}
            className="flex items-center gap-2 bg-dark-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Exportar Analytics
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Exportar Conversaciones
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-dark-800 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-slate-400" />
          <span className="text-slate-400 text-sm font-medium">Filtrar métricas</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-slate-500 text-xs mb-1 block">Canal</label>
            <select
              value={filters.channel}
              onChange={e => setFilters(f => ({ ...f, channel: e.target.value }))}
              className="w-full bg-dark-900 border border-slate-600 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="">Todos los canales</option>
              <option value="Web">Web</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
            </select>
          </div>
          <div>
            <label className="text-slate-500 text-xs mb-1 block">Desde</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              className="w-full bg-dark-900 border border-slate-600 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="text-slate-500 text-xs mb-1 block">Hasta</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              className="w-full bg-dark-900 border border-slate-600 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>
        <button
          onClick={fetchAnalytics}
          className="mt-3 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Aplicar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de ratings */}
        <div className="bg-dark-800 rounded-xl border border-slate-700 p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary-500" />
            Distribución de Ratings
          </h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="rating" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value) => [`${value}%`, 'Porcentaje']}
                />
                <Bar dataKey="porcentaje" fill="#0ea5e9" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribución por canal */}
        <div className="bg-dark-800 rounded-xl border border-slate-700 p-5">
          <h2 className="text-white font-semibold mb-4">Conversaciones por Canal</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500"></div>
            </div>
          ) : channelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {channelData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  formatter={(value, name, props) => [`${value}% (${props.payload.count} convs)`, props.payload.name]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500">Sin datos</div>
          )}
        </div>
      </div>

      {/* Top 5 peores prompts */}
      <div className="bg-dark-800 rounded-xl border border-slate-700 p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingDown size={18} className="text-red-400" />
          Top 5 Prompts con Peor Rating
        </h2>
        {loading ? (
          <div className="text-center py-8 text-slate-500">Cargando...</div>
        ) : data?.worstPrompts?.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-xs font-medium px-3 py-2">#</th>
                <th className="text-left text-slate-400 text-xs font-medium px-3 py-2">Prompt</th>
                <th className="text-left text-slate-400 text-xs font-medium px-3 py-2">Rating Promedio</th>
                <th className="text-left text-slate-400 text-xs font-medium px-3 py-2">Conversaciones</th>
              </tr>
            </thead>
            <tbody>
              {data.worstPrompts.map((p, i) => (
                <tr key={i} className="border-b border-slate-700/50">
                  <td className="px-3 py-3 text-slate-400 text-sm">{i + 1}</td>
                  <td className="px-3 py-3 text-slate-300 text-sm max-w-xs">
                    <span className="truncate block">{p.prompt_used?.slice(0, 60)}...</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-red-400 font-medium">{parseFloat(p.avg_rating).toFixed(1)} ★</span>
                  </td>
                  <td className="px-3 py-3 text-slate-400 text-sm">{p.conversation_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-slate-500">
            No hay datos suficientes. Califica algunas conversaciones primero.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;