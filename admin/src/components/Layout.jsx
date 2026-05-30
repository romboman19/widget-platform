import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { LayoutDashboard, Globe, BarChart3, LogOut, Plus } from 'lucide-react';

export default function Layout() {
  const { api, logout, user } = useAuth();
  const [sites, setSites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { loadSites(); }, []);

  async function loadSites() {
    try { setSites(await api('/sites')); } catch {}
  }

  async function createSite() {
    const name = prompt('Назва сайту:');
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const domain = prompt('Домен (наприклад: top-trig.store):');
    if (!domain) return;
    try {
      const site = await api('/sites', { method: 'POST', body: { name, slug, domain } });
      await loadSites();
      navigate(`/sites/${site.id}`);
    } catch (e) { alert('Помилка: ' + e.message); }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold tracking-tight">🔧 Widget Platform</h1>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm">
            <LayoutDashboard size={18} /> Дашборд
          </Link>

          <div className="mt-4 mb-2 px-3 text-xs text-slate-400 uppercase tracking-wider">Сайти</div>
          {sites.map(site => (
            <Link key={site.id} to={`/sites/${site.id}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm">
              <Globe size={16} /> {site.name}
              <span className="ml-auto text-xs text-slate-400">{site._count?.widgets || 0}</span>
            </Link>
          ))}
          <button onClick={createSite}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm text-slate-400 w-full text-left">
            <Plus size={16} /> Додати сайт
          </button>
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm text-slate-400 w-full text-left">
            <LogOut size={16} /> Вийти
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet context={{ sites, loadSites }} />
      </main>
    </div>
  );
}
