import { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Clock, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const KPICard = ({ icon: Icon, title, value, subtitle, color }) => (
  <div className="bg-dark-800 rounded-xl border border-slate-700 p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </div>
);

const SummaryPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/summary')
      .then(r => setSummary(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
    </div>
  );

  const trendData = summary?.trend?.map(t => ({
    date: format(parseISO(t.date), 'dd MMM', { locale: es }),
    conversaciones: parseInt(t.count),
  })) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Resumen</h1>
        <p className="text-slate-400 text-sm mt-1">Vista general de tu plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={MessageSquare}
          title="Conversaciones hoy"
          value={summary?.totalToday ?? 0}
          subtitle={`${summary?.totalWeek ?? 0} esta semana`}
          color="bg-primary-500"
        />
        <KPICard
          icon={TrendingUp}
          title="Total del mes"
          value={summary?.totalMonth ?? 0}
          subtitle="Últimos 30 días"
          color="bg-violet-500"
        />
        <KPICard
          icon={ThumbsUp}
          title="Satisfacción"
          value={`${summary?.satisfactoryPercent ?? 0}%`}
          subtitle="Rating ≥ 4 estrellas"
          color="bg-emerald-500"
        />
        <KPICard
          icon={Clock}
          title="Tiempo de respuesta"
          value={`${summary?.avgResponseTimeSeconds ?? 0}s`}
          subtitle="Promedio de la IA"
          color="bg-amber-500"
        />
      </div>

      {/* Gráfico de tendencia */}
      <div className="bg-dark-800 rounded-xl border border-slate-700 p-5">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-500" />
          Tendencia de conversaciones — últimos 14 días
        </h2>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="conversaciones"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500">
            No hay datos suficientes aún
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryPage;