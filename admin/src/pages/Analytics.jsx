import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { ChevronLeft, Eye, MousePointer, Send, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Analytics() {
  const { siteId } = useParams();
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [siteId, days]);

  async function load() {
    setLoading(true);
    try {
      const res = await api(`/sites/${siteId}/analytics?days=${days}`);
      setData(res);
    } catch {}
    setLoading(false);
  }

  if (loading) return <div className="text-slate-400">Завантаження аналітики...</div>;
  if (!data) return <div className="text-red-400">Помилка завантаження</div>;

  // Process daily events for chart
  const dailyMap = {};
  (data.dailyEvents || []).forEach(row => {
    const dateStr = typeof row.date === 'string' ? row.date.slice(0, 10) : new Date(row.date).toISOString().slice(0, 10);
    if (!dailyMap[dateStr]) dailyMap[dateStr] = { date: dateStr };
    dailyMap[dateStr][row.event] = (dailyMap[dateStr][row.event] || 0) + row.count;
  });
  const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // Totals
  const totals = {};
  (data.totals || []).forEach(t => { totals[t.event] = (t._count && typeof t._count === 'object') ? t._count._all : t._count; });

  const topChannels = data.topChannels || [];

  return (
    <div>
      <Link to={`/sites/${siteId}`} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4">
        <ChevronLeft size={14} /> Назад до сайту
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Аналітика</h2>
        <div className="flex gap-1">
          {[7, 14, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm ${days === d ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {d}д
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Eye size={20} />} label="Покази" value={totals.view || 0} color="text-blue-500" />
        <StatCard icon={<MousePointer size={20} />} label="Кліки" value={totals.click || 0} color="text-green-500" />
        <StatCard icon={<Send size={20} />} label="Заявки" value={totals.submit || 0} color="text-orange-500" />
        <StatCard icon={<TrendingUp size={20} />} label="Відкриття" value={totals.open || 0} color="text-purple-500" />
      </div>

      {/* Daily chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 mb-6">
        <h3 className="font-semibold text-slate-700 mb-4">Активність по днях</h3>
        {dailyData.length === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">Немає даних за цей період</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="view" name="Покази" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="click" name="Кліки" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="submit" name="Заявки" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top channels */}
      <div className="bg-white rounded-xl p-5 border border-slate-200">
        <h3 className="font-semibold text-slate-700 mb-4">Топ канали</h3>
        {topChannels.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">Немає даних</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, topChannels.length * 40)}>
            <BarChart data={topChannels} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="channel" tick={{ fontSize: 12 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" name="Кліки" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <div className="text-2xl font-bold text-slate-800">{value.toLocaleString()}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}
