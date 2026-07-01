import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'EDITOR' };

export default function Users() {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      setUsers(await api('/users'));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createUser(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/users', { method: 'POST', body: form });
      setForm(EMPTY_FORM);
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleActive(user) {
    setError('');
    try {
      await api(`/users/${user.id}`, {
        method: 'PUT',
        body: { isActive: !user.isActive },
      });
      await loadUsers();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Користувачі</h2>
        <p className="text-sm text-slate-500 mt-1">Тільки власник платформи може додавати та вимикати користувачів.</p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Додати користувача</h3>
        <form onSubmit={createUser} className="grid gap-3 md:grid-cols-2">
          <input className="border rounded-lg px-3 py-2" placeholder="Ім'я" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Пароль" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="border rounded-lg px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="EDITOR">Редактор</option>
            <option value="ADMIN">Адмін</option>
            <option value="OWNER">Owner</option>
          </select>
          <div className="md:col-span-2">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Створити користувача</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Список користувачів</h3>
          <button onClick={loadUsers} className="text-sm text-blue-600 hover:text-blue-700">Оновити</button>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-slate-500">Завантаження...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-slate-800">{user.name || 'Без імені'}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">{user.role}</span>
                  <span className={`px-2 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {user.isActive ? 'Активний' : 'Вимкнений'}
                  </span>
                  <button onClick={() => toggleActive(user)} className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50">
                    {user.isActive ? 'Вимкнути' : 'Увімкнути'}
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 ? <div className="p-5 text-sm text-slate-500">Користувачів поки немає.</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}
