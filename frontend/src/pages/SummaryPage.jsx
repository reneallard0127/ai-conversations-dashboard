import { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Clock, TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import api from '../services/api';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Determina color según valor y umbrales
const getStatus = (value, good, bad, inverse = false) => {
  if (inverse) {
    if (value <= good) return 'green';
    if (value >= bad) return 'red';
    return 'yellow';
  }
  if (value >= good) return 'green';
  if (value <= bad) return 'red';
  return 'yellow';
};

const statusStyles = {
  green: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: 'bg-emerald-500',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-400',
  },
  yellow: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'bg-amber-500',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-400',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'bg-red-500',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400',
  },
};

const KPICard = ({ icon: Icon, title, value, subtitle, status, trend }) => {
  const styles = statusStyles[status];
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;

  return (
    <div className={`rounded-xl border p-5 ${styles.bg} ${styles.border} transition-all hover:scale-[1.01]`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles.icon}`}>
          <Icon size={20} className="text-white" />
        </div>
        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${styles.badge}`}>
          <TrendIcon size={10} />
          {status === 'green' ? 'Bueno' : status === 'yellow' ? 'Regular' : 'Atención'}
        </span>
      </div>
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">{title}</p>
      <p className={`text-3xl font-bold mb-1 ${styles.text}`}>{value}</p>
      {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
    </div>
  );
};

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

  const satisfactory = summary?.satisfactoryPercent ?? 0;
  const avgResponse = parseFloat(summary?.avgResponseTimeSeconds ?? 0);
  const totalMonth = summary?.totalMonth ?? 0;

  const trendData = summary?.trend?.map(t => ({
    date: format(parseISO(t.date), 'dd MMM', { locale: es }),
    conversaciones: parseInt(t.count),
  })) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Resumen</h1>
          <p className="text-slate-400 text-sm mt-1">Vista general del rendimiento de tu plataforma</p>
        </div>
        <span className="text-xs text-slate-500 bg-dark-800 border border-slate-700 px-3 py-1.5 rounded-lg">
          Actualizado ahora
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={MessageSquare}
          title="Conversaciones hoy"
          value={summary?.totalToday ?? 0}
          subtitle={`${summary?.totalWeek ?? 0} esta semana`}
          status={getStatus(summary?.totalToday ?? 0, 5, 1)}
          trend="up"
        />
        <KPICard
          icon={TrendingUp}
          title="Total del mes"
          value={totalMonth}
          subtitle="Últimos 30 días"
          status={getStatus(totalMonth, 20, 5)}
          trend="up"
        />
        <KPICard
          icon={ThumbsUp}
          title="Satisfacción"
          value={`${satisfactory}%`}
          subtitle="Rating ≥ 4 estrellas"
          status={getStatus(satisfactory, 75, 50)}
          trend={satisfactory >= 75 ? 'up' : satisfactory >= 50 ? 'neutral' : 'down'}
        />
        <KPICard
          icon={Clock}
          title="Tiempo respuesta"
          value={`${avgResponse}s`}
          subtitle="Promedio de la IA"
          status={getStatus(avgResponse, 2, 5, true)}
          trend={avgResponse <= 2 ? 'up' : 'down'}
        />
      </div>

      {/* Gráfico */}
      <div className="bg-dark-800 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-500" />
            Tendencia — últimos 14 días
          </h2>
        </div>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px' }}
                labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="conversaciones"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                fill="url(#colorConv)"
                dot={{ fill: '#0ea5e9', r: 4, strokeWidth: 2, stroke: '#0f172a' }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
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