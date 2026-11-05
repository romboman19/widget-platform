import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };
const MIN_LENGTH = 8;

const ERROR_MESSAGES = {
  'Current password is incorrect': 'Поточний пароль неправильний',
  'Password must be at least 8 characters': `Новий пароль має містити щонайменше ${MIN_LENGTH} символів`,
  'Both passwords required': 'Заповніть обидва паролі',
};

export default function Account() {
  const { api, user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      await api('/auth/password', {
        method: 'PUT',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      });
      setForm(EMPTY_FORM);
      setSuccess('Пароль змінено');
    } catch (err) {
      setError(readApiError(err));
    } finally {
      setSaving(false);
    }
  }

  function field(name, placeholder, autoComplete) {
    return (
      <input
        type="password"
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full border rounded-lg px-3 py-2"
      />
    );
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-1">Мій акаунт</h1>
      <p className="text-sm text-slate-500 mb-6">{user?.email}</p>

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold">Зміна пароля</h2>
        {field('currentPassword', 'Поточний пароль', 'current-password')}
        {field('newPassword', `Новий пароль (мін. ${MIN_LENGTH} символів)`, 'new-password')}
        {field('confirmPassword', 'Повторіть новий пароль', 'new-password')}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Збереження…' : 'Змінити пароль'}
        </button>
      </form>
    </div>
  );
}

function validate({ newPassword, confirmPassword, currentPassword }) {
  if (newPassword.length < MIN_LENGTH) return ERROR_MESSAGES['Password must be at least 8 characters'];
  if (newPassword !== confirmPassword) return 'Нові паролі не збігаються';
  if (newPassword === currentPassword) return 'Новий пароль має відрізнятися від поточного';
  return '';
}

function readApiError(err) {
  try {
    const message = JSON.parse(err.message).error;
    return ERROR_MESSAGES[message] || message || 'Не вдалося змінити пароль';
  } catch {
    return 'Не вдалося змінити пароль';
  }
}
