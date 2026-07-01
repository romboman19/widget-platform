import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import BrandLogo from '../components/BrandLogo.jsx';

const GITHUB_REPO_URL = 'https://github.com/romboman19/widget-platform';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Невірний email або пароль');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
        <BrandLogo className="mb-6 justify-center" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Пароль" required
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-3 text-sm">
          <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900">
            <Github size={16} /> GitHub
          </a>
          <a href={`${GITHUB_REPO_URL}/stargazers`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-700">
            <Star size={16} /> Star
          </a>
        </div>
      </div>
    </div>
  );
}
