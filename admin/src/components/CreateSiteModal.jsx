import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function CreateSiteModal({ onClose, onCreated }) {
  const { api } = useAuth();
  const [form, setForm] = useState({ name: '', slug: '', domain: '' });
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await api('/users');
      setUsers(data.filter((user) => user.isActive && user.role !== 'OWNER'));
    } catch (e) {
      setError(e.message);
    }
  }

  const selectedMembers = useMemo(() => {
    return Object.entries(selectedUsers)
      .filter(([, enabled]) => !!enabled)
      .map(([userId]) => ({ userId, role: 'EDITOR' }));
  }, [selectedUsers]);

  function updateName(name) {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
    setForm((prev) => ({ ...prev, name, slug: prev.slug ? prev.slug : slug }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const site = await api('/sites', {
        method: 'POST',
        body: {
          ...form,
          members: selectedMembers,
        },
      });
      onCreated(site);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Створити сайт</h3>
            <p className="text-sm text-slate-500 mt-1">Одразу можна призначити редакторів, які матимуть доступ до віджетів.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-500">Назва сайту</label>
              <input
                value={form.name}
                onChange={(e) => updateName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Наприклад: Hunter RV"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-500">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="hunter-rv"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-500">Домен</label>
              <input
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="hunter.rv.ua"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-500">Користувачі з доступом</label>
              <span className="text-xs text-slate-400">Owner має доступ автоматично</span>
            </div>
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {users.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">Немає доступних користувачів. Спочатку створи їх у Налаштування → Користувачі.</div>
              ) : users.map((user) => (
                <label key={user.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <div className="font-medium text-slate-800">{user.name || 'Без імені'}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!selectedUsers[user.id]}
                    onChange={(e) => setSelectedUsers((prev) => ({ ...prev, [user.id]: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-slate-500">Обрано редакторів: <span className="font-medium text-slate-700">{selectedMembers.length}</span></div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">Скасувати</button>
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Створення...' : 'Створити сайт'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
