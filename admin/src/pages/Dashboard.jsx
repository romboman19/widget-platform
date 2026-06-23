import React, { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Globe, BarChart3, Settings, Copy, Check, Code } from 'lucide-react';

export default function Dashboard() {
  const { sites } = useOutletContext();
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text, siteId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(siteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Дашборд</h2>

      {sites.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <Globe size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 mb-2">Сайтів поки немає</p>
          <p className="text-slate-400 text-sm">Натисніть «Додати сайт» в бічній панелі</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map(site => (
            <div key={site.id} className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">{site.name}</h3>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                  {site._count?.widgets || 0} віджетів
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-3">{site.domain}</p>
              
              {/* Embed Script Section */}
              <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Code size={12} /> Код для вставки
                  </span>
                  <button
                    onClick={() => copyToClipboard(site.embedScript, site.id)}
                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    {copiedId === site.id ? <Check size={12} /> : <Copy size={12} />}
                    {copiedId === site.id ? 'Скопійовано!' : 'Копіювати'}
                  </button>
                </div>
                <code className="block bg-slate-800 text-green-400 p-2 rounded text-xs overflow-x-auto">
                  {site.embedScript}
                </code>
              </div>

              <div className="flex gap-2">
                <Link to={`/sites/${site.id}`}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100">
                  <Settings size={14} /> Налаштування
                </Link>
                <Link to={`/sites/${site.id}/analytics`}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100">
                  <BarChart3 size={14} /> Аналітика
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
