import React, { useState, useEffect } from 'react';
import { X, Copy, Plus, Layout, Star, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

// Pre-defined widget templates
const DEFAULT_TEMPLATES = [
  {
    id: 'default-floating',
    name: 'Меню зв\'язку',
    description: 'Плаваюче меню з кнопками дзвінка, Telegram та Viber',
    type: 'FLOATING_MENU',
    isGlobal: true,
    usageCount: 0,
    config: {
      color: '#1f93ff',
      channels: [
        { type: 'phone', value: '+380XXXXXXXXX', label: 'Зателефонувати' },
        { type: 'telegram', value: 'your_bot', label: 'Telegram' },
        { type: 'viber', value: '+380XXXXXXXXX', label: 'Viber' },
      ],
    },
    position: { corner: 'bottom-right', offsetX: 20, offsetY: 20 },
  },
  {
    id: 'default-callback',
    name: 'Зворотний дзвінок',
    description: 'Popup форма для замовлення зворотного дзвінка',
    type: 'POPUP_CALLBACK',
    isGlobal: true,
    usageCount: 0,
    config: {
      color: '#1f93ff',
      callbackTitle: 'Замовити дзвінок',
      callbackText: 'Залиште номер і ми зателефонуємо вам протягом 15 хвилин',
      callbackButton: 'Зателефонуйте мені',
    },
    triggers: { delay: 30, frequency: 'once' },
  },
  {
    id: 'default-banner',
    name: 'Акційний банер',
    description: 'Popup банер для оголошення акцій та знижок',
    type: 'POPUP_BANNER',
    isGlobal: true,
    usageCount: 0,
    config: {
      color: '#ff4757',
      title: '🔥 Гаряча пропозиція!',
      text: 'Отримайте знижку 20% на перше замовлення!',
      buttonText: 'Отримати знижку',
      buttonUrl: '/sale',
      image: '',
    },
    triggers: { delay: 5, frequency: 'once_per_session' },
  },
  {
    id: 'default-sticky',
    name: 'Акція в шапці',
    description: 'Sticky bar з акційною пропозицією вгорі сайту',
    type: 'STICKY_BAR',
    isGlobal: true,
    usageCount: 0,
    config: {
      color: '#2ed573',
      bgColor: '#fff3cd',
      textColor: '#856404',
      text: '⚡ Безкоштовна доставка при замовленні від 1500 грн!',
      buttonText: 'Каталог',
      buttonUrl: '/catalog',
    },
    position: { placement: 'top' },
  },
  {
    id: 'default-sidetab',
    name: 'Бічна вкладка',
    description: 'Вкладка з правого боку з кнопкою зворотного зв\'язку',
    type: 'SIDE_TAB',
    isGlobal: true,
    usageCount: 0,
    config: {
      color: '#1f93ff',
      text: "Зв\'язатися з нами",
      action: 'callback',
      url: '',
    },
    position: { side: 'right', offsetY: 50 },
  },
];

export default function TemplatesGallery({ siteId, onClose, onSelect }) {
  const { api } = useAuth();
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [activeTab, setActiveTab] = useState('global'); // 'global' | 'my'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [siteId]);

  async function loadTemplates() {
    try {
      const userTemplates = await api(`/sites/${siteId}/templates`);
      // Merge with defaults
      setTemplates([...DEFAULT_TEMPLATES, ...userTemplates]);
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setLoading(false);
    }
  }

  async function createFromTemplate(template) {
    try {
      const widget = await api(`/sites/${siteId}/widgets/from-template/${template.id}`, {
        method: 'POST',
      });
      onSelect(widget);
    } catch (e) {
      alert('Не вдалося створити віджет з шаблону: ' + e.message);
    }
  }

  const filteredTemplates = templates.filter(t => {
    if (activeTab === 'global') return t.isGlobal;
    return !t.isGlobal;
  });

  const WIDGET_TYPE_ICONS = {
    FLOATING_MENU: '💬',
    POPUP_CALLBACK: '📞',
    POPUP_BANNER: '🎯',
    STICKY_BAR: '📌',
    SIDE_TAB: '📎',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Layout size={22} className="text-blue-600" />
              Шаблони віджетів
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">Оберіть готовий шаблон або створіть свій</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'global'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Globe size={16} />
              Глобальні
            </span>
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'my'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Star size={16} />
              Мої шаблони
            </span>
          </button>
        </div>

        {/* Templates grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Завантаження...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Layout size={48} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-500">Шаблонів поки немає</p>
              {activeTab === 'my' && (
                <p className="text-sm text-slate-400 mt-1">
                  Збережіть віджет як шаблон, щоб використовувати його повторно
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => createFromTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{WIDGET_TYPE_ICONS[template.type]}</span>
                      <div>
                        <h3 className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                          {template.name}
                        </h3>
                        <span className="text-xs text-slate-400">{template.type}</span>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={16} />
                    </button>
                  </div>
                  {template.description && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  {template.usageCount > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                      <Copy size={12} />
                      Використано {template.usageCount} разів
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <p className="text-xs text-slate-400 text-center">
            Підказка: Ви можете зберегти будь-який віджет як шаблон у редакторі віджетів
          </p>
        </div>
      </div>
    </div>
  );
}
