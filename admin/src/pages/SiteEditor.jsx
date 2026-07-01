import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { Plus, BarChart3, Pencil, ChevronLeft, Layout } from 'lucide-react';
import DragDropBuilder from '../components/DragDropBuilder.jsx';
import TemplatesGallery from '../components/TemplatesGallery.jsx';

const WIDGET_TYPE_LABELS = {
  FLOATING_MENU: '💬 Floating меню',
  POPUP_CALLBACK: '📞 Popup зворотній дзвінок',
  POPUP_BANNER: '🎯 Popup банер',
  STICKY_BAR: '📌 Sticky bar',
  SIDE_TAB: '📎 Вкладка збоку',
  CUSTOM_IFRAME: '🪟 Custom iframe',
};

const WIDGET_TYPES = Object.keys(WIDGET_TYPE_LABELS);

const DEFAULT_CONFIGS = {
  FLOATING_MENU: {
    color: '#1f93ff',
    channels: [
      { type: 'phone', value: '+380XXXXXXXXX', label: 'Зателефонувати' },
      { type: 'telegram', value: 'your_bot', label: 'Telegram' },
      { type: 'viber', value: '+380XXXXXXXXX', label: 'Viber' },
    ],
  },
  POPUP_CALLBACK: {
    color: '#1f93ff',
    callbackTitle: 'Замовити дзвінок',
    callbackText: 'Залиште номер і ми зателефонуємо вам',
    callbackButton: 'Зателефонуйте мені',
    webhookUrl: '',
  },
  POPUP_BANNER: {
    color: '#1f93ff',
    title: 'Акція!',
    text: 'Знижка 10% на все',
    buttonText: 'Детальніше',
    buttonUrl: '/',
    image: '',
  },
  STICKY_BAR: {
    color: '#1f93ff',
    bgColor: '#ffffff',
    textColor: '#333333',
    text: '🔥 Безкоштовна доставка від 1000 грн',
    buttonText: 'Каталог',
    buttonUrl: '/',
  },
  SIDE_TAB: {
    color: '#1f93ff',
    text: "Зв'язатися",
    action: 'callback',
    url: '',
  },
  CUSTOM_IFRAME: {
    src: 'https://example.com/embed',
    title: 'Custom iframe',
    width: 360,
    height: 520,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    sandboxMode: 'safe',
    allowFullscreen: false,
  },
};

export default function SiteEditor() {
  const { siteId } = useParams();
  const { api, user } = useAuth();
  const { loadSites } = useOutletContext();
  const navigate = useNavigate();
  const [site, setSite] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '' });
  const [showTemplates, setShowTemplates] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [siteMembers, setSiteMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => { load(); }, [siteId]);
  useEffect(() => {
    if (user?.role === 'OWNER') {
      loadUsersAndMembers();
    }
  }, [siteId, user?.role]);

  async function load() {
    try {
      const data = await api(`/sites/${siteId}`);
      setSite(data);
      setWidgets(data.widgets || []);
      setForm({ name: data.name, domain: data.domain });
    } catch { navigate('/'); }
  }

  async function loadUsersAndMembers() {
    setMembersLoading(true);
    try {
      const [users, membersRes] = await Promise.all([
        api('/users'),
        api(`/sites/${siteId}/members`),
      ]);
      setAvailableUsers(users.filter((u) => u.isActive && u.role !== 'OWNER'));
      setSiteMembers(membersRes.members || []);
    } finally {
      setMembersLoading(false);
    }
  }

  async function addSiteMember() {
    if (!selectedUserId) return;
    await api(`/sites/${siteId}/members`, {
      method: 'POST',
      body: { userId: selectedUserId, role: 'EDITOR' },
    });
    setSelectedUserId('');
    await loadUsersAndMembers();
  }

  async function removeSiteMember(userId) {
    await api(`/sites/${siteId}/members/${userId}`, { method: 'DELETE' });
    await loadUsersAndMembers();
  }

  async function saveSite() {
    await api(`/sites/${siteId}`, { method: 'PUT', body: form });
    setEditing(false);
    await load();
    await loadSites();
  }

  async function deleteSite() {
    if (!confirm(`Видалити сайт "${site.name}" і всі його віджети?`)) return;
    await api(`/sites/${siteId}`, { method: 'DELETE' });
    await loadSites();
    navigate('/');
  }

  async function addWidget(type) {
    const widget = await api(`/sites/${siteId}/widgets`, {
      method: 'POST',
      body: {
        type,
        name: WIDGET_TYPE_LABELS[type],
        config: DEFAULT_CONFIGS[type] || {},
        position: type === 'FLOATING_MENU' ? { corner: 'bottom-right', offsetX: 20, offsetY: 20 } :
                  type === 'STICKY_BAR' ? { placement: 'bottom' } :
                  type === 'SIDE_TAB' ? { side: 'right', offsetY: 50 } :
                  type === 'CUSTOM_IFRAME' ? { corner: 'bottom-right', offsetX: 20, offsetY: 20 } : null,
        triggers: ['POPUP_BANNER', 'POPUP_CALLBACK', 'CUSTOM_IFRAME'].includes(type) ? { delay: 5, frequency: 'once' } : null,
      },
    });
    navigate(`/sites/${siteId}/widgets/${widget.id}`);
  }

  async function reorderWidgets(newWidgets) {
    setWidgets(newWidgets);
    const updates = newWidgets.map((w, index) => ({
      id: w.id,
      priority: index + 1,
    }));
    
    await api(`/sites/${siteId}/widgets/reorder`, {
      method: 'POST',
      body: { updates },
    });
  }

  async function handleToggle(widget) {
    await api(`/sites/${siteId}/widgets/${widget.id}`, {
      method: 'PUT',
      body: { enabled: !widget.enabled },
    });
    await load();
  }

  async function duplicateWidget(widgetId) {
    await api(`/sites/${siteId}/widgets/${widgetId}/duplicate`, { method: 'POST' });
    await load();
  }

  async function deleteWidget(widgetId, name) {
    if (!confirm(`Видалити віджет "${name}"?`)) return;
    await api(`/sites/${siteId}/widgets/${widgetId}`, { method: 'DELETE' });
    await load();
  }

  function handleEdit(widget) {
    navigate(`/sites/${siteId}/widgets/${widget.id}`);
  }

  if (!site) return <div className="text-slate-400">Завантаження...</div>;

  const activeWidgets = widgets.filter(w => w.enabled);
  const assignedUserIds = new Set(siteMembers.map((member) => member.user.id));
  const unassignedUsers = availableUsers.filter((candidate) => !assignedUserIds.has(candidate.id));

  return (
    <div>
      <Link to="/" className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-4">
        <ChevronLeft size={14} /> Назад до дашборду
      </Link>

      <div className="bg-white rounded-xl p-5 border border-slate-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">{site.name}</h2>
          <div className="flex gap-2">
            <Link to={`/sites/${siteId}/analytics`}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100">
              <BarChart3 size={14} /> Аналітика
            </Link>
            {user?.role === 'OWNER' ? (
              <button onClick={() => setEditing(!editing)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                <Pencil size={14} /> Редагувати
              </button>
            ) : null}
          </div>
        </div>

        {user?.role === 'OWNER' && editing && (
          <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
            <div>
              <label className="text-sm text-slate-500">Назва</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-sm text-slate-500">Домен</label>
              <input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveSite} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Зберегти
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">
                Скасувати
              </button>
              <button onClick={deleteSite} className="ml-auto px-4 py-2 text-red-500 text-sm hover:bg-red-50 rounded-lg">
                Видалити сайт
              </button>
            </div>
          </div>
        )}

        {!editing && (
          <div className="text-sm text-slate-400">
            Домен: <span className="text-slate-600">{site.domain}</span> · Slug: <span className="text-slate-600">{site.slug}</span>
          </div>
        )}
      </div>

      {user?.role === 'OWNER' ? (
        <div className="bg-white rounded-xl p-5 border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Доступ користувачів</h3>
              <p className="text-sm text-slate-500 mt-1">Власник має повний доступ автоматично. Тут ти керуєш редакторами сайту.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Оберіть користувача для доступу</option>
              {unassignedUsers.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>{candidate.name || candidate.email} — {candidate.email}</option>
              ))}
            </select>
            <button
              onClick={addSiteMember}
              disabled={!selectedUserId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Додати доступ
            </button>
          </div>

          {membersLoading ? (
            <div className="text-sm text-slate-400">Завантаження доступів...</div>
          ) : siteMembers.length === 0 ? (
            <div className="text-sm text-slate-400">Поки що нікому не видано доступ до цього сайту.</div>
          ) : (
            <div className="space-y-3">
              {siteMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-lg px-4 py-3">
                  <div>
                    <div className="font-medium text-slate-800">{member.user.name || 'Без імені'}</div>
                    <div className="text-sm text-slate-500">{member.user.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">{member.role}</span>
                    <button
                      onClick={() => removeSiteMember(member.user.id)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Забрати доступ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-700">Віджети ({activeWidgets.length} активних з {widgets.length})</h3>
      </div>

      {/* Add widget buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setShowTemplates(true)}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
          <Layout size={14} /> З шаблону
        </button>
        <div className="w-px h-8 bg-slate-200 mx-1"></div>
        {WIDGET_TYPES.map(type => (
          <button key={type} onClick={() => addWidget(type)}
            className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
            <Plus size={14} /> {WIDGET_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Templates Gallery Modal */}
      {showTemplates && (
        <TemplatesGallery
          siteId={siteId}
          onClose={() => setShowTemplates(false)}
          onSelect={(widget) => {
            setShowTemplates(false);
            navigate(`/sites/${siteId}/widgets/${widget.id}`);
          }}
        />
      )}

      <DragDropBuilder
        widgets={widgets}
        onReorder={reorderWidgets}
        onEdit={handleEdit}
        onDelete={(w) => deleteWidget(w.id, w.name)}
        onDuplicate={(w) => duplicateWidget(w.id)}
        onToggle={handleToggle}
      />
      {widgets.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Віджетів поки немає. Натисніть кнопку вище, щоб додати перший.
        </div>
      )}
    </div>
  );
}
