import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { LayoutDashboard, Globe, LogOut, Plus, FolderOpen, Users, Github, Star } from 'lucide-react';
import CreateSiteModal from './CreateSiteModal.jsx';

const GITHUB_REPO_URL = 'https://github.com/romboman19/widget-platform';

export default function Layout() {
  const { api, logout, user } = useAuth();
  const [sites, setSites] = useState([]);
  const navigate = useNavigate();
  const [showCreateSite, setShowCreateSite] = useState(false);

  useEffect(() => { loadSites(); }, []);

  async function loadSites() {
    try { setSites(await api('/sites')); } catch {}
  }

  async function handleSiteCreated(site) {
    setShowCreateSite(false);
    await loadSites();
    navigate(`/sites/${site.id}`);
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

          <Link to="/media" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm">
            <FolderOpen size={18} /> Бібліотека файлів
          </Link>

          {user?.role === 'OWNER' ? (
            <>
              <div className="mt-4 mb-2 px-3 text-xs text-slate-400 uppercase tracking-wider">Налаштування</div>
              <Link to="/settings/users" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm">
                <Users size={18} /> Користувачі
              </Link>
            </>
          ) : null}

          <div className="mt-4 mb-2 px-3 text-xs text-slate-400 uppercase tracking-wider">Сайти</div>
          {sites.map(site => (
            <Link key={site.id} to={`/sites/${site.id}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm">
              <Globe size={16} /> {site.name}
              <span className="ml-auto text-xs text-slate-400">{site._count?.widgets || 0}</span>
            </Link>
          ))}
          {user?.role === 'OWNER' ? (
            <button onClick={() => setShowCreateSite(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-sm text-slate-400 w-full text-left">
              <Plus size={16} /> Додати сайт
            </button>
          ) : null}
        </nav>

        <div className="p-3 border-t border-slate-700 space-y-2">
          <div className="px-3 py-2 flex items-center justify-center gap-3 text-sm border border-slate-800 rounded-lg">
            <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white">
              <Github size={16} /> GitHub
            </a>
            <a href={`${GITHUB_REPO_URL}/stargazers`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300">
              <Star size={16} /> Star
            </a>
          </div>
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

      {showCreateSite ? (
        <CreateSiteModal
          onClose={() => setShowCreateSite(false)}
          onCreated={handleSiteCreated}
        />
      ) : null}
    </div>
  );
}
