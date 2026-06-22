import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { denormalizeFloatingMenuConfig } from '../lib/configNormalizer.js';
import IconPicker from '../components/IconPicker.jsx';
import { ChevronLeft, Save, Trash2, Plus, GripVertical, X, Monitor, Smartphone, Phone, Mail, MessageCircle, Link2 } from 'lucide-react';

// Brand SVG Icons
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.697.064-1.226-.46-1.901-.902-1.056-.692-1.653-1.123-2.678-1.799-.931-.615-.327-.953.203-1.506.277-.29.574-.797.766-1.222.09-.198.169-.412.19-.644a.49.49 0 0 0-.025-.247c-.044-.12-.132-.247-.22-.295-.184-.104-1.06-.602-1.502-.854a2.995 2.995 0 0 1-.613-.413c-.39-.332-.455-.478-.455-.646 0-.24.115-.448.345-.583.23-.134.552-.144.896-.028.45.15 1.77.64 2.357.848.587.208.44.347.666-.095.225-.442.29-.72.434-1.17.144-.45.09-.848-.22-1.035-.312-.187-.776-.127-1.27.055-1.166.418-2.835.92-3.726 1.19-.892.27-2.03.523-2.445.59a7.29 7.29 0 0 0-.72.138c-.36.098-.66.198-.89.335-.23.137-.4.335-.51.583a1.6 1.6 0 0 0-.08.662c.06.372.252.76.53 1.095.28.335.663.62 1.1.83.438.21.966.327 1.555.327.59 0 1.22-.138 1.82-.362.6-.224 1.17-.51 1.67-.804.5-.293.92-.578 1.24-.836.32-.258.52-.468.57-.558.05-.09.01-.18-.06-.26-.07-.08-.19-.15-.33-.18-.14-.03-.3-.03-.47.01z"/>
  </svg>
);

const ViberIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm6.638 14.88c-.624 1.11-3.137 2.367-4.088 2.628-.951.26-1.63.47-2.227-.41-.598-.88-1.01-1.49-1.69-1.98-.68-.49-1.36-.37-2.04.02-.68.39-.99 1.28-1.36 1.77-.37.49-2.37.53-3.21-.2-.84-.73-2.23-2.21-2.23-5.33 0-3.12 2.23-4.77 2.64-5.14.41-.37 3.07-4.64 6.8-2.5 3.73 2.14 3.52 5.36 3.43 5.88-.09.52-.27 1.03-.04 1.38z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.004c6.55 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.07-1.86-.57-2.56-1.31-.72-.77-1.14-1.8-1.17-2.83.11-.84.52-1.62 1.14-2.16.8-.71 1.97-1.08 3.03-.87z"/>
  </svg>
);

const ChatwootIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.175L2 22l4.825-1.438A9.944 9.944 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.58 0-3.06-.38-4.365-1.058l-.623-.327-2.812.836.836-2.812-.327-.623A7.95 7.95 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z"/>
  </svg>
);

const CallbackIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 00-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1.01A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM5.03 5h1.5c.07.88.22 1.75.45 2.58l-1.2 1.21c-.4-1.21-.66-2.47-.75-3.79zM19 18.97c-1.32-.09-2.59-.35-3.8-.76l1.2-1.2c.85.24 1.72.39 2.6.45v1.51zM17 8.5c0-.83-.67-1.5-1.5-1.5h-2v2h2v2h-2v6h2c.83 0 1.5-.67 1.5-1.5v-7z"/>
  </svg>
);

// Channel types with SVG icons
const CHANNEL_TYPES = [
  { value: 'phone', label: 'Телефон', icon: Phone },
  { value: 'telegram', label: 'Telegram', icon: TelegramIcon },
  { value: 'viber', label: 'Viber', icon: ViberIcon },
  { value: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'instagram', label: 'Instagram', icon: InstagramIcon },
  { value: 'facebook', label: 'Facebook', icon: FacebookIcon },
  { value: 'tiktok', label: 'TikTok', icon: TikTokIcon },
  { value: 'chatwoot', label: 'Chatwoot', icon: ChatwootIcon },
  { value: 'callback', label: 'Зворотній дзвінок', icon: CallbackIcon },
  { value: 'custom', label: 'Кастомне посилання', icon: Link2 },
];

const SHAPES = [
  { value: 'circle', label: '● Коло' },
  { value: 'square', label: '■ Квадрат' },
  { value: 'rounded', label: '▢ Заокруглений' },
  { value: 'oval', label: '⬭ Овал' },
];

const SIZES = [
  { value: 'sm', label: 'Маленький (48px)' },
  { value: 'md', label: 'Середній (56px)' },
  { value: 'lg', label: 'Великий (64px)' },
];

const CORNERS = [
  { value: 'bottom-right', label: '↘ Внизу праворуч' },
  { value: 'bottom-left', label: '↙ Внизу ліворуч' },
  { value: 'top-right', label: '↗ Вгорі праворуч' },
  { value: 'top-left', label: '↖ Вгорі ліворуч' },
];

function Field({ label, children, hint }) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, ...props }) {
  return <input value={value || ''} onChange={e => onChange(e.target.value)}
    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...props} />;
}

function Select({ value, onChange, options }) {
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// Channel Select with SVG icons
function ChannelSelect({ value, onChange }) {
  const selected = CHANNEL_TYPES.find(c => c.value === value);
  const Icon = selected?.icon;
  
  return (
    <div className="relative">
      <select 
        value={value || ''} 
        onChange={e => onChange(e.target.value)}
        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
      >
        {CHANNEL_TYPES.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
        {Icon && <Icon />}
      </div>
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value || '#1f93ff'} onChange={e => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
      <Input value={value} onChange={onChange} placeholder="#1f93ff" />
    </div>
  );
}

export default function WidgetEditor() {
  const { siteId, widgetId } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [widget, setWidget] = useState(null);
  const [site, setSite] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { 
    loadWidget(); 
    loadSite();
  }, [widgetId]);

  async function loadWidget() {
    try {
      const data = await api(`/sites/${siteId}/widgets/${widgetId}`);
      setWidget(data);
    } catch { navigate(`/sites/${siteId}`); }
  }

  async function loadSite() {
    try {
      const data = await api(`/sites/${siteId}`);
      setSite(data);
    } catch (e) {
      console.error('Failed to load site:', e);
    }
  }

  const update = useCallback((path, value) => {
    setWidget(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
    setSaved(false);
  }, []);

  async function save() {
    setSaving(true);
    try {
      // Denormalize FLOATING_MENU config before saving
      let configToSave = widget.config;
      if (widget.type === 'FLOATING_MENU' && widget.config) {
        configToSave = denormalizeFloatingMenuConfig(widget.config);
      }

      await api(`/sites/${siteId}/widgets/${widgetId}`, {
        method: 'PUT',
        body: {
          name: widget.name,
          config: configToSave,
          position: widget.position,
          triggers: widget.triggers,
          rules: widget.rules,
          enabled: widget.enabled,
          priority: widget.priority,
          zIndex: widget.zIndex,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert('Помилка збереження: ' + e.message); }
    setSaving(false);
  }

  async function remove() {
    if (!confirm('Видалити цей віджет?')) return;
    await api(`/sites/${siteId}/widgets/${widgetId}`, { method: 'DELETE' });
    navigate(`/sites/${siteId}`);
  }

  if (!widget) return <div className="text-slate-400">Завантаження...</div>;

  const cfg = widget.config || {};
  const pos = widget.position || {};
  const triggers = widget.triggers || {};
  const rules = widget.rules || {};

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <Link to={`/sites/${siteId}`} className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1">
          <ChevronLeft size={14} /> Назад до сайту
        </Link>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-500">✓ Збережено</span>}
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            <Save size={14} /> {saving ? 'Зберігаю...' : 'Зберегти'}
          </button>
          <button onClick={remove} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* General */}
          <Section title="Загальні">
            <Field label="Назва (для себе)">
              <Input value={widget.name} onChange={v => update('name', v)} />
            </Field>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={widget.enabled} onChange={e => update('enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300" />
                <span className="text-sm text-slate-600">Увімкнений</span>
              </label>
              <Field label="Пріоритет">
                <Input type="number" value={widget.priority} onChange={v => update('priority', parseInt(v) || 0)} />
              </Field>
              <Field label="Z-index" hint="Шар поверхності. Більше = зверху">
                <Input type="number" value={widget.zIndex ?? 999990} onChange={v => update('zIndex', parseInt(v) || 0)} />
              </Field>
            </div>
          </Section>

          {/* Type-specific config */}
          {widget.type === 'FLOATING_MENU' && <FloatingMenuConfig cfg={cfg} pos={pos} triggers={triggers} update={update} api={api} siteId={siteId} />}
          {widget.type === 'POPUP_CALLBACK' && <PopupCallbackConfig cfg={cfg} triggers={triggers} update={update} />}
          {widget.type === 'POPUP_BANNER' && <PopupBannerConfig cfg={cfg} triggers={triggers} update={update} />}
          {widget.type === 'STICKY_BAR' && <StickyBarConfig cfg={cfg} pos={pos} triggers={triggers} update={update} />}
          {widget.type === 'SIDE_TAB' && <SideTabConfig cfg={cfg} pos={pos} triggers={triggers} update={update} />}

          {/* Display rules */}
          <RulesConfig rules={rules} update={update} />
        </div>

      </div>

      {/* Preview — full width below settings */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Попередній перегляд</h3>
        <PreviewPane widget={widget} siteId={siteId} />
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200">
      <h3 className="font-semibold text-slate-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ─── FLOATING MENU CONFIG ───
function FloatingMenuConfig({ cfg, pos, triggers, update, api, siteId }) {
  const channels = cfg.channels || [];
  const [callbackWidgets, setCallbackWidgets] = useState([]);
  useEffect(() => { if (siteId) loadCallbackWidgets(); }, [siteId]);
  async function loadCallbackWidgets() {
    try {
      const data = await api(`/sites/${siteId}/widgets`);
      setCallbackWidgets((data || []).filter(w => w.type === 'POPUP_CALLBACK' && w.enabled));
    } catch (e) { console.error('Failed to load callback widgets:', e); }
  }

  function addChannel() {
    update('config.channels', [...channels, { type: 'phone', value: '', label: '' }]);
  }
  function removeChannel(i) {
    update('config.channels', channels.filter((_, idx) => idx !== i));
  }
  function updateChannel(i, field, val) {
    const next = [...channels];
    next[i] = { ...next[i], [field]: val };
    update('config.channels', next);
  }

  return (
    <>
      <Section title="Розміщення">
        <Field label="Позиція">
          <Select value={pos.corner} onChange={v => update('position.corner', v)} options={CORNERS} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Відступ X (px)">
            <Input type="number" value={pos.offsetX} onChange={v => update('position.offsetX', parseInt(v) || 20)} />
          </Field>
          <Field label="Відступ Y (px)">
            <Input type="number" value={pos.offsetY} onChange={v => update('position.offsetY', parseInt(v) || 20)} />
          </Field>
        </div>
        <Field label="Текст привітання" hint="Покажеться як підказка біля кнопки">
          <Input value={cfg.greeting} onChange={v => update('config.greeting', v)} placeholder="Потрібна допомога?" />
        </Field>

        {/* FLOATING_MENU v2: Shape Picker */}
        <Section title="Форма кнопки">
          <p className="text-xs text-slate-400 mb-3">Налаштування форми та рамки кнопок</p>
          
          <Field label="Форма">
            <Select 
              value={cfg.buttonShape?.type || 'circle'} 
              onChange={v => update('config.buttonShape.type', v)} 
              options={SHAPES} 
            />
          </Field>
          
          <div className="grid grid-cols-3 gap-3">
            <Field label="Товщина рамки (px)" hint="0 = без рамки">
              <Input 
                type="number" 
                min="0" 
                max="10"
                value={cfg.buttonShape?.borderWidth || 0} 
                onChange={v => update('config.buttonShape.borderWidth', parseInt(v) || 0)} 
              />
            </Field>
            
            {(cfg.buttonShape?.type === 'square' || cfg.buttonShape?.type === 'rounded') && (
              <Field label="Радіус закруглення (px)">
                <Input 
                  type="number" 
                  min="0" 
                  max="50"
                  value={cfg.buttonShape?.borderRadius || (cfg.buttonShape?.type === 'rounded' ? 12 : 0)} 
                  onChange={v => update('config.buttonShape.borderRadius', parseInt(v) || 0)} 
                />
              </Field>
            )}
            
            {cfg.buttonShape?.borderWidth > 0 && (
              <Field label="Колір рамки">
                <ColorPicker 
                  value={cfg.buttonShape?.borderColor || '#ffffff'} 
                  onChange={v => update('config.buttonShape.borderColor', v)} 
                />
              </Field>
            )}
          </div>
          
        </Section>

        <Section title="Відступи">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Між кнопками (px)">
              <Input type="number" value={cfg.buttonGap ?? 10} onChange={v => update('config.buttonGap', parseInt(v) || 0)} />
            </Field>
            <Field label="Між каналами (px)">
              <Input type="number" value={cfg.channelGap ?? 10} onChange={v => update('config.channelGap', parseInt(v) || 0)} />
            </Field>
          </div>
        </Section>
      </Section>

      {/* Legacy channels section — show only if no v2 buttons */}
      {!cfg.buttons?.length ? (
        <>
          <Section title="Канали зв'язку">
            <p className="text-xs text-slate-400 mb-3">Налаштуйте канали з можливістю вибору іконок FontAwesome</p>
            <div className="space-y-3">
              {channels.map((ch, i) => (
                <div key={i} className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <ChannelSelect value={ch.type} onChange={v => updateChannel(i, 'type', v)} />
                      <Input value={ch.label} onChange={v => updateChannel(i, 'label', v)} placeholder="Підпис" />
                      <Input value={ch.iconClass} onChange={v => updateChannel(i, 'iconClass', v)} placeholder="fa-brands fa-telegram (FontAwesome)" />
                    </div>
                    <Input value={ch.value} onChange={v => updateChannel(i, 'value', v)}
                      placeholder={ch.type === 'phone' ? '+380...' : ch.type === 'email' ? 'email@...' : 'username або URL'} />
                  </div>
                  <button onClick={() => removeChannel(i)} className="p-1.5 text-slate-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addChannel}
              className="mt-3 flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
              <Plus size={14} /> Додати канал
            </button>
          </Section>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700 mb-2">Потрібно більше можливостей?</p>
            <button
              onClick={() => {
                // Migrate legacy channels to v2 format
                const legacyChannels = cfg.channels || [];
                const migrated = [{
                  id: 'legacy_main',
                  mode: 'menu',
                  channels: legacyChannels.map(ch => ({
                    type: ch.type,
                    value: ch.value,
                    label: ch.label,
                    iconId: ch.iconId || null,
                    iconClass: ch.iconClass
                  })),
                  style: { bgColor: cfg.color || '#1f93ff', iconColor: '#ffffff', size: 'md' }
                }];
                update('config.buttons', migrated);
                update('config.layout', 'single');
              }}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              <Plus size={16} /> Перейти до кнопок v2
            </button>
          </div>
        </>
      ) : null}

      {/* FLOATING_MENU v2: Button Builder */}
      <Section title="Кнопки">
        <p className="text-xs text-slate-400 mb-3">Конфігуруйте кнопки та їхні канали</p>
        
        <Field label="Розкладка">
          <Select
            value={cfg.layout || 'single'}
            onChange={v => update('config.layout', v)}
            options={[
              { value: 'single', label: 'Одна кнопка' },
              { value: 'horizontal', label: 'Горизонтально' },
              { value: 'vertical', label: 'Вертикально' },
            ]}
          />
        </Field>

        <div className="space-y-4">
          {(cfg.buttons || []).map((btn, btnIndex) => (
            <div key={btn.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-slate-700">Кнопка {btnIndex + 1}</h4>
                {(cfg.buttons?.length || 0) > 1 && (
                  <button
                    onClick={() => {
                      const next = (cfg.buttons || []).filter((_, i) => i !== btnIndex);
                      update('config.buttons', next);
                    }}
                    className="p-1 text-slate-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Режим">
                    <Select
                      value={btn.mode || 'menu'}
                      onChange={v => {
                        const next = [...(cfg.buttons || [])];
                        next[btnIndex] = { ...btn, mode: v };
                        update('config.buttons', next);
                      }}
                      options={[
                        { value: 'direct', label: 'Прямий дзвінок' },
                        { value: 'menu', label: 'Меню каналів' },
                        { value: 'toggle', label: 'Перемикач' },
                      ]}
                    />
                  </Field>

                  <Field label="Колір фону">
                    <ColorPicker
                      value={btn.style?.bgColor || cfg.color || '#1f93ff'}
                      onChange={v => {
                        const next = [...(cfg.buttons || [])];
                        next[btnIndex] = { ...btn, style: { ...btn.style, bgColor: v } };
                        update('config.buttons', next);
                      }}
                    />
                  </Field>
                  <Field label="Розмір кнопки (px)">
                    <Input type="number" min="24" max="120"
                      value={btn.style?.sizePx || 56}
                      onChange={v => {
                        const next = [...(cfg.buttons || [])];
                        next[btnIndex] = { ...btn, style: { ...btn.style, sizePx: parseInt(v) || 56 } };
                        update('config.buttons', next);
                      }}
                    />
                  </Field>
                  <Field label="Розмір картинки (%)" hint="Скільки картинка займає від кнопки">
                    <input type="range" min="20" max="100" step="5"
                      value={btn.style?.iconScale || 55}
                      onChange={e => {
                        const next = [...(cfg.buttons || [])];
                        next[btnIndex] = { ...btn, style: { ...btn.style, iconScale: parseInt(e.target.value) || 55 } };
                        update('config.buttons', next);
                      }}
                      className="w-full" />
                    <span className="text-xs text-slate-400">{btn.style?.iconScale || 55}%</span>
                  </Field>
                  <Field label="Фон кнопки">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox"
                        checked={btn.style?.bgTransparent || false}
                        onChange={e => {
                          const next = [...(cfg.buttons || [])];
                          next[btnIndex] = { ...btn, style: { ...btn.style, bgTransparent: e.target.checked } };
                          update('config.buttons', next);
                        }}
                        className="w-4 h-4 rounded border-slate-300" />
                      Прозорий фон (без заливки)
                    </label>
                  </Field>
                  <Field label="Анімація уваги">
                    <Select
                      value={btn.style?.attentionAnimation || ''}
                      onChange={v => {
                        const next = [...(cfg.buttons || [])];
                        next[btnIndex] = { ...btn, style: { ...btn.style, attentionAnimation: v } };
                        update('config.buttons', next);
                      }}
                      options={ATTENTION_ANIMATIONS}
                    />
                  </Field>
                    {btn.style?.attentionAnimation && (
                      <Field label="Що анімувати" hint="Піктограму всередині чи всю кнопку">
                        <Select
                          value={btn.style?.attentionTarget || 'icon'}
                          onChange={v => {
                            const next = [...(cfg.buttons || [])];
                            next[btnIndex] = { ...btn, style: { ...btn.style, attentionTarget: v } };
                            update('config.buttons', next);
                          }}
                          options={[
                            { value: 'icon', label: 'Тільки піктограму' },
                            { value: 'button', label: 'Всю кнопку' },
                          ]}
                        />
                      </Field>
                    )}
                  {btn.style?.attentionAnimation && (
                    <Field label="Швидкість (сек)" hint="Тривалість одного циклу">
                      <Input type="number" min="0.2" max="10" step="0.1"
                        value={btn.style?.attentionDuration || 2}
                        onChange={v => {
                          const next = [...(cfg.buttons || [])];
                          next[btnIndex] = { ...btn, style: { ...btn.style, attentionDuration: parseFloat(v) || 2 } };
                          update('config.buttons', next);
                        }}
                      />
                    </Field>
                  )}
                  {btn.style?.attentionAnimation && (
                    <Field label="Затримка між циклами (сек)" hint="Час між повтореннями анімації">
                      <Input type="number" min="0" max="30" step="0.5"
                        value={btn.style?.attentionDelay || 0}
                        onChange={v => {
                          const next = [...(cfg.buttons || [])];
                          next[btnIndex] = { ...btn, style: { ...btn.style, attentionDelay: parseFloat(v) || 0 } };
                          update('config.buttons', next);
                        }}
                      />
                    </Field>
                  )}
                  <Field label="Карусель іконок" hint="Кнопка по черзі показує іконки своїх каналів (потрібно 2+ канали)">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox"
                        checked={btn.style?.carousel || false}
                        onChange={e => {
                          const next = [...(cfg.buttons || [])];
                          next[btnIndex] = { ...btn, style: { ...btn.style, carousel: e.target.checked } };
                          update('config.buttons', next);
                        }}
                        className="w-4 h-4 rounded border-slate-300" />
                      Увімкнути карусель
                    </label>
                  </Field>
                  {btn.style?.carousel && (
                    <Field label="Швидкість каруселі (сек)" hint="Інтервал зміни іконки">
                      <Input type="number" min="1" max="20" step="0.5"
                        value={btn.style?.carouselSpeed || 3}
                        onChange={v => {
                          const next = [...(cfg.buttons || [])];
                          next[btnIndex] = { ...btn, style: { ...btn.style, carouselSpeed: parseFloat(v) || 3 } };
                          update('config.buttons', next);
                        }}
                      />
                    </Field>
                  )}
                </div>

                {/* Channels for this button */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-600">Канали:</label>
                  {(btn.channels || []).map((ch, chIndex) => (
                    <div key={chIndex} className="flex flex-col gap-2 p-2 bg-white rounded border border-slate-200">
                      <div className="flex gap-2 items-start">
                        
                      <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                        <ChannelSelect
                          value={ch.type}
                          onChange={v => {
                            const next = [...(cfg.buttons || [])];
                            const newChannels = [...(btn.channels || [])];
                            newChannels[chIndex] = { ...ch, type: v };
                            next[btnIndex] = { ...btn, channels: newChannels };
                            update('config.buttons', next);
                          }}
                        />
                        <Input
                          value={ch.label || ''}
                          onChange={v => {
                            const next = [...(cfg.buttons || [])];
                            const newChannels = [...(btn.channels || [])];
                            newChannels[chIndex] = { ...ch, label: v };
                            next[btnIndex] = { ...btn, channels: newChannels };
                            update('config.buttons', next);
                          }}
                          placeholder="Підпис"
                        />
                        <Input
                          value={ch.value || ''}
                          onChange={v => {
                            const next = [...(cfg.buttons || [])];
                            const newChannels = [...(btn.channels || [])];
                            newChannels[chIndex] = { ...ch, value: v };
                            next[btnIndex] = { ...btn, channels: newChannels };
                            update('config.buttons', next);
                          }}
                          placeholder={ch.type === 'phone' ? '+380...' : 'URL або username'}
                        />
                        <IconPicker
                          value={ch.iconId || null}
                          onChange={v => {
                            const next = [...(cfg.buttons || [])];
                            const newChannels = [...(btn.channels || [])];
                            newChannels[chIndex] = { ...ch, iconId: v };
                            next[btnIndex] = { ...btn, channels: newChannels };
                            update('config.buttons', next);
                          }}
                          api={api}
                          channelType={ch.type}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const next = [...(cfg.buttons || [])];
                          const newChannels = (btn.channels || []).filter((_, i) => i !== chIndex);
                          next[btnIndex] = { ...btn, channels: newChannels };
                          update("config.buttons", next);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {ch.type === 'callback' && (
                      <Field label="Віджет зворотного зв'язку" hint="Оберіть існуючий POPUP_CALLBACK віджет">
                        <Select
                          value={ch.callbackWidgetId || ''}
                          onChange={v => {
                            const next = [...(cfg.buttons || [])];
                            const newChannels = [...(btn.channels || [])];
                            newChannels[chIndex] = { ...ch, callbackWidgetId: v || null };
                            next[btnIndex] = { ...btn, channels: newChannels };
                            update('config.buttons', next);
                          }}
                          options={[
                            { value: '', label: '— Не обрано —' },
                            ...callbackWidgets.map(w => ({ value: w.id, label: w.name || 'Без назви' })),
                          ]}
                        />
                      </Field>
                    )}
                    <div className="w-full grid grid-cols-3 gap-2 text-xs">
                        <label className="flex flex-col gap-1">
                          <span className="text-slate-400">Розмір (px)</span>
                          <Input type="number" min="24" max="120"
                            value={ch.sizePx || 46}
                            onChange={v => {
                              const next = [...(cfg.buttons || [])];
                              const newChannels = [...(btn.channels || [])];
                              newChannels[chIndex] = { ...ch, sizePx: parseInt(v) || 46 };
                              next[btnIndex] = { ...btn, channels: newChannels };
                              update('config.buttons', next);
                            }} />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-slate-400">Заповнення %</span>
                          <input type="range" min="20" max="100" step="5"
                            value={ch.iconScale || 48}
                            onChange={e => {
                              const next = [...(cfg.buttons || [])];
                              const newChannels = [...(btn.channels || [])];
                              newChannels[chIndex] = { ...ch, iconScale: parseInt(e.target.value) || 48 };
                              next[btnIndex] = { ...btn, channels: newChannels };
                              update('config.buttons', next);
                            }} />
                          <span className="text-slate-400">{ch.iconScale || 48}%</span>
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-slate-400">Фон каналу</span>
                          <ColorPicker
                            value={ch.bgColor || ''}
                            onChange={v => {
                              const next = [...(cfg.buttons || [])];
                              const newChannels = [...(btn.channels || [])];
                              newChannels[chIndex] = { ...ch, bgColor: v };
                              next[btnIndex] = { ...btn, channels: newChannels };
                              update('config.buttons', next);
                            }} />
                          <label className="flex items-center gap-1 text-slate-400">
                            <input type="checkbox"
                              checked={ch.bgTransparent || false}
                              onChange={e => {
                                const next = [...(cfg.buttons || [])];
                                const newChannels = [...(btn.channels || [])];
                                newChannels[chIndex] = { ...ch, bgTransparent: e.target.checked };
                                next[btnIndex] = { ...btn, channels: newChannels };
                                update('config.buttons', next);
                              }}
                              className="w-3 h-3" />
                            Прозорий
                          </label>
                        </label>
                      </div>
                      <button
                        onClick={() => {
                          const next = [...(cfg.buttons || [])];
                          const newChannels = (btn.channels || []).filter((_, i) => i !== chIndex);
                          next[btnIndex] = { ...btn, channels: newChannels };
                          update('config.buttons', next);
                        }}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const next = [...(cfg.buttons || [])];
                      const newChannels = [...(btn.channels || []), { type: 'phone', value: '', label: '' }];
                      next[btnIndex] = { ...btn, channels: newChannels };
                      update('config.buttons', next);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Plus size={12} /> Додати канал
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(cfg.buttons?.length || 0) < 5 && (
          <button
            onClick={() => {
              const next = [...(cfg.buttons || [])];
              next.push({
                id: 'btn_' + Date.now(),
                mode: 'menu',
                channels: [{ type: 'phone', value: '', label: '' }],
                style: { bgColor: cfg.color || '#1f93ff', iconColor: '#ffffff', size: 'md' }
              });
              update('config.buttons', next);
            }}
            className="mt-4 flex items-center gap-1 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
          >
            <Plus size={16} /> Додати кнопку
          </button>
        )}
      </Section>

      <Section title="Налаштування анімації віджета">
        <Field label="Анімація меню" hint="Ефект появи каналів">
          <Select
            value={cfg.menuAnimation || 'fade'}
            onChange={v => update('config.menuAnimation', v)}
            options={ANIMATION_TYPES}
          />
        </Field>
        <Field label="Анімація уваги" hint="Привернути увагу до кнопки">
          <Select
            value={cfg.attentionAnimation || ''}
            onChange={v => update('config.attentionAnimation', v)}
            options={ATTENTION_ANIMATIONS}
          />
        </Field>
      </Section>

      <TriggersConfig triggers={triggers} update={update} simple={true} />
    </>
  );
}

// ─── POPUP CALLBACK CONFIG ───
function PopupCallbackConfig({ cfg, triggers, update }) {
  // ─── Trigger mode ───
  const triggerMode = triggers.triggerMode || 'auto';
  const setTriggerMode = (v) => update('triggers.triggerMode', v);

  // ─── Fields management ───
  const fields = cfg.fields || [
    { id: 'phone', type: 'phone', label: 'Телефон', required: true, mappedTo: 'phone' },
  ];
  const setFields = (next) => update('config.fields', next);

  function addField() {
    const next = [...fields, { id: 'f_' + Date.now(), type: 'text', label: 'Нове поле', required: false, mappedTo: '' }];
    setFields(next);
  }
  function removeField(id) {
    setFields(fields.filter(f => f.id !== id));
  }
  function updateField(id, key, val) {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: val } : f));
  }

  // ─── Working hours management ───
  const useWorkingHours = cfg.useWorkingHours || false;
  const workSchedule = cfg.workSchedule || {};
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  function toggleDay(key) {
    const current = workSchedule[key] || { enabled: false, from: '09:30', to: '18:00' };
    update(`config.workSchedule.${key}`, { ...current, enabled: !current.enabled });
  }
  function setDayTime(key, field, val) {
    const current = workSchedule[key] || { enabled: false, from: '09:30', to: '18:00' };
    update(`config.workSchedule.${key}`, { ...current, [field]: val });
  }

  return (
    <>
      {/* ─── Trigger Mode ─── */}
      <Section title="Режим виклику">
        <Field label="Як викликається віджет">
          <Select
            value={triggerMode}
            onChange={v => setTriggerMode(v)}
            options={[
              { value: 'auto', label: 'Авто (за тригерами: затримка, скрол, idle, exit)' },
              { value: 'button', label: 'Виклик по кнопці (з FLOATING_MENU)' },
            ]}
          />
        </Field>
        {triggerMode === 'button' && (
          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
            Цей віджет викликається лише по кнопці з FLOATING_MENU. Інші тригери не працюють.
          </p>
        )}
      </Section>

      {/* ─── Form Fields ─── */}
      <Section title="Поля форми">
        <p className="text-xs text-slate-400 mb-3">Додавайте поля форми. Поле "Телефон" обов'язкове з маскою.</p>
        {fields.map((field) => (
          <div key={field.id} className="bg-slate-50 rounded-lg p-3 mb-2 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Select
                value={field.type}
                onChange={v => updateField(field.id, 'type', v)}
                options={[
                  { value: 'phone', label: 'Телефон (з маскою)' },
                  { value: 'text', label: 'Текстове поле' },
                  { value: 'name', label: 'Імʼя' },
                  { value: 'email', label: 'Email' },
                  { value: 'select', label: 'Випадаючий список' },
                ]}
                className="flex-1"
              />
              <button
                onClick={() => removeField(field.id)}
                className="p-1 text-slate-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Field label="Назва поля">
                <Input value={field.label} onChange={v => updateField(field.id, 'label', v)} />
              </Field>
              <Field label="Мапінг у вебхук (ключ)">
                <Input value={field.mappedTo || ''} onChange={v => updateField(field.id, 'mappedTo', v)} placeholder={field.type} />
              </Field>
            </div>
            {field.type === 'phone' && (
              <Field label="Маска телефону (країна)">
                <Select
                  value={field.phoneMask || '+380'}
                  onChange={v => updateField(field.id, 'phoneMask', v)}
                  options={[
                    { value: '+380', label: 'Україна +380' },
                    { value: '+48', label: 'Польща +48' },
                    { value: '+374', label: 'Вірменія +374' },
                    { value: '+995', label: 'Грузія +995' },
                    { value: '+375', label: 'Білорусь +375' },
                  ]}
                />
              </Field>
            )}
            {field.type === 'select' && (
              <Field label="Варіанти (через кому)">
                <Input value={field.options || ''} onChange={v => updateField(field.id, 'options', v)} placeholder="Варіант 1, Варіант 2" />
              </Field>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={e => updateField(field.id, 'required', e.target.checked)}
              />
              Обов'язкове поле
            </label>
          </div>
        ))}
        <button
          onClick={addField}
          className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-blue-400 hover:text-blue-500"
        >
          + Додати поле
        </button>
      </Section>

      {/* ─── Texts ─── */}
      <Section title="Тексти">
        <Field label="Заголовок (робочий час)">
          <Input value={cfg.callbackTitle} onChange={v => update('config.callbackTitle', v)} placeholder="Ми на звʼязку. Зателефонувати Вам?" />
        </Field>
        <Field label="Заголовок (поза робочим часом)">
          <Input value={cfg.callbackTitleOffHours} onChange={v => update('config.callbackTitleOffHours', v)} placeholder="Зараз неробочий час. Зателефонуємо Вам о:" />
        </Field>
        <Field label="Текст кнопки (робочий час)">
          <Input value={cfg.callbackButton} onChange={v => update('config.callbackButton', v)} placeholder="Передзвоніть мені зараз" />
        </Field>
        <Field label="Текст кнопки (поза робочим часом)">
          <Input value={cfg.callbackButtonOffHours} onChange={v => update('config.callbackButtonOffHours', v)} placeholder="Чекаю на дзвінок" />
        </Field>
      </Section>

      {/* ─── Working Hours ─── */}
      <Section title="Робочий час">
        <label className="flex items-center gap-2 text-sm mb-3">
          <input
            type="checkbox"
            checked={useWorkingHours}
            onChange={e => update('config.useWorkingHours', e.target.checked)}
          />
          Використовувати робочий час
        </label>
        {useWorkingHours && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Графік роботи по днях:</p>
            {days.map((day, i) => {
              const key = dayKeys[i];
              const dayCfg = workSchedule[key] || { enabled: false, from: '09:30', to: '18:00' };
              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <label className="flex items-center gap-2 w-16">
                    <input
                      type="checkbox"
                      checked={dayCfg.enabled || false}
                      onChange={() => toggleDay(key)}
                    />
                    {day}
                  </label>
                  {dayCfg.enabled && (
                    <div className="flex items-center gap-2">
                      <Input type="time" value={dayCfg.from || '09:30'} onChange={v => setDayTime(key, 'from', v)} className="w-24" />
                      <span className="text-slate-400">-</span>
                      <Input type="time" value={dayCfg.to || '18:00'} onChange={v => setDayTime(key, 'to', v)} className="w-24" />
                    </div>
                  )}
                </div>
              );
            })}
            <Field label="Час за замовчуванням (для планування дзвінка)">
              <Input type="time" value={cfg.defaultTime || '09:30'} onChange={v => update('config.defaultTime', v)} className="w-24" />
            </Field>
          </div>
        )}
      </Section>

      {/* ─── Webhook ─── */}
      <Section title="Вебхук">
        <Field label="Webhook URL (n8n)" hint="Куди надсилати дані форми">
          <Input value={cfg.webhookUrl} onChange={v => update('config.webhookUrl', v)} placeholder="https://n8n.yourdomain.ua/webhook/..." />
        </Field>
      </Section>

      {/* ─── Behavior after submit ─── */}
      <Section title="Поведінка після відправки">
        <Field label="Текст при успіху">
          <Input value={cfg.successMessage} onChange={v => update('config.successMessage', v)} placeholder="Запит прийнято. Очікуйте дзвінка." />
        </Field>
        <Field label="Текст при помилці">
          <Input value={cfg.errorMessage} onChange={v => update('config.errorMessage', v)} placeholder="Помилка. Спробуйте ще." />
        </Field>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input
            type="checkbox"
            checked={cfg.autoClose || false}
            onChange={e => update('config.autoClose', e.target.checked)}
          />
          Закрити попап після відправки
        </label>
        {cfg.autoClose && (
          <Field label="Закрити через (секунд)">
            <Input type="number" value={cfg.autoCloseDelay || 3} onChange={v => update('config.autoCloseDelay', parseInt(v) || 3)} className="w-24" />
          </Field>
        )}
      </Section>

      {/* ─── Design ─── */}
      <Section title="Дизайн попапа">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Колір кнопки">
            <ColorPicker value={cfg.color} onChange={v => update('config.color', v)} />
          </Field>
          <Field label="Колір фону">
            <ColorPicker value={cfg.popupBgColor} onChange={v => update('config.popupBgColor', v)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ширина (px)">
            <Input type="number" value={cfg.popupWidth || 300} onChange={v => update('config.popupWidth', parseInt(v) || 300)} />
          </Field>
          <Field label="Радіус бордюра (px)">
            <Input type="number" value={cfg.popupRadius || 6} onChange={v => update('config.popupRadius', parseInt(v) || 6)} />
          </Field>
        </div>
        <Field label="Колір тексту">
          <ColorPicker value={cfg.popupTextColor} onChange={v => update('config.popupTextColor', v)} />
        </Field>
      </Section>

      <AnimationConfig cfg={cfg} update={update} />

      {/* ─── Triggers (only in auto mode) ─── */}
      {triggerMode === 'auto' && <TriggersConfig triggers={triggers} update={update} />}
    </>
  );
}

// ─── POPUP BANNER CONFIG ───
function PopupBannerConfig({ cfg, triggers, update }) {
  return (
    <>
      <Section title="Банер">
        <Field label="Колір кнопки">
          <ColorPicker value={cfg.color} onChange={v => update('config.color', v)} />
        </Field>
        <Field label="Зображення (URL)">
          <Input value={cfg.image} onChange={v => update('config.image', v)} placeholder="https://..." />
        </Field>
        <Field label="Заголовок">
          <Input value={cfg.title} onChange={v => update('config.title', v)} />
        </Field>
        <Field label="Текст">
          <textarea value={cfg.text || ''} onChange={e => update('config.text', e.target.value)} rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Текст кнопки">
            <Input value={cfg.buttonText} onChange={v => update('config.buttonText', v)} />
          </Field>
          <Field label="Посилання кнопки">
            <Input value={cfg.buttonUrl} onChange={v => update('config.buttonUrl', v)} />
          </Field>
        </div>
        
        <AnimationConfig cfg={cfg} update={update} />
      </Section>
      <DesignConfig cfg={cfg} update={update} />
      <TriggersConfig triggers={triggers} update={update} />
    </>
  );
}

// ─── STICKY BAR CONFIG ───
function StickyBarConfig({ cfg, pos, triggers, update }) {
 return (
 <>
 <Section title="Sticky Bar">
 <Field label="Розташування">
 <Select value={pos.placement} onChange={v => update('position.placement', v)}
 options={[{ value: 'top', label: '⬆ Вгорі' }, { value: 'bottom', label: '⬇ Внизу' }]} />
 </Field>
 <Field label="Фон">
 <ColorPicker value={cfg.bgColor} onChange={v => update('config.bgColor', v)} />
 </Field>
 <Field label="Колір тексту">
 <ColorPicker value={cfg.textColor} onChange={v => update('config.textColor', v)} />
 </Field>
 <Field label="Текст">
 <Input value={cfg.text} onChange={v => update('config.text', v)} />
 </Field>
 <Field label="Колір кнопки">
 <ColorPicker value={cfg.color} onChange={v => update('config.color', v)} />
 </Field>
 <div className="grid grid-cols-2 gap-3">
 <Field label="Текст кнопки">
 <Input value={cfg.buttonText} onChange={v => update('config.buttonText', v)} />
 </Field>
 <Field label="Посилання">
 <Input value={cfg.buttonUrl} onChange={v => update('config.buttonUrl', v)} />
 </Field>
 </div>
 <Section title="Відступи та розмір">
 <div className="grid grid-cols-2 gap-3">
 <Field label="Відступ знизу/зверху (px)" hint="Відступ від краю екрана">
 <Input type="number" value={cfg.bottomOffset ?? 0} onChange={v => update('config.bottomOffset', parseInt(v) || 0)} />
 </Field>
 <Field label="Відступ по боках (px)" hint="Лівий і правий одночасно">
 <Input type="number" value={cfg.sideOffset ?? 0} onChange={v => update('config.sideOffset', parseInt(v) || 0)} />
 </Field>
 </div>
 <Field label="Розмір шрифту">
 <div className="flex items-center gap-3">
 <input
 type="range"
 min="50"
 max="200"
 step="10"
 value={cfg.fontScale ?? 100}
 onChange={e => update('config.fontScale', parseInt(e.target.value))}
 className="flex-1"
 />
 <span className="text-sm text-slate-600 w-12 text-right">{cfg.fontScale ?? 100}%</span>
 </div>
 </Field>
 </Section>
 <AnimationConfig cfg={cfg} update={update} />
 </Section>
 <DesignConfig cfg={cfg} update={update} />
 <TriggersConfig triggers={triggers} update={update} simple={true} />
 </>
 );
}

// ─── SIDE TAB CONFIG ───
function SideTabConfig({ cfg, pos, triggers, update }) {
 return (
 <>
 <Section title="Вкладка збоку">
 <Field label="Колір">
 <ColorPicker value={cfg.color} onChange={v => update('config.color', v)} />
 </Field>
 <Field label="Текст">
 <Input value={cfg.text} onChange={v => update('config.text', v)} />
 </Field>
 <Field label="Сторона">
 <Select value={pos.side} onChange={v => update('position.side', v)}
 options={[{ value: 'right', label: '→ Праворуч' }, { value: 'left', label: '← Ліворуч' }]} />
 </Field>
 <Field label="Зміщення по вертикалі (%)">
 <Input type="number" value={pos.offsetY} onChange={v => update('position.offsetY', parseInt(v) || 50)} />
 </Field>
 <Field label="Дія">
 <Select value={cfg.action} onChange={v => update('config.action', v)}
 options={[{ value: 'callback', label: 'Форма зворотного дзвінка' }, { value: 'url', label: 'Відкрити посилання' }]} />
 </Field>
 {cfg.action === 'url' && (
 <Field label="URL">
 <Input value={cfg.url} onChange={v => update('config.url', v)} placeholder="https://..." />
 </Field>
 )}
 {cfg.action === 'callback' && (
 <Field label="Webhook URL (n8n)">
 <Input value={cfg.webhookUrl} onChange={v => update('config.webhookUrl', v)} placeholder="https://n8n.yourdomain.ua/webhook/..." />
 </Field>
 )}
 </Section>
 <DesignConfig cfg={cfg} update={update} />
 <TriggersConfig triggers={triggers} update={update} simple={true} />
 </>
 );
}

// ─── ANIMATION CONFIG ───
const ANIMATION_TYPES = [
  { value: 'none', label: 'Без анімації' },
  { value: 'fade', label: 'Fade (поступово)' },
  { value: 'slide-up', label: 'Slide Up (знизу вгору)' },
  { value: 'slide-down', label: 'Slide Down (зверху вниз)' },
  { value: 'slide-left', label: 'Slide Left (справа)' },
  { value: 'slide-right', label: 'Slide Right (зліва)' },
  { value: 'zoom', label: 'Zoom (масштабування)' },
  { value: 'bounce', label: 'Bounce (підскок)' },
  { value: 'elastic', label: 'Elastic (еластичний)' },
  { value: 'flip', label: 'Flip (переворот)' },
];

const ATTENTION_ANIMATIONS = [
  { value: '', label: 'Немає' },
  { value: 'pulse', label: 'Pulse (пульсація)' },
  { value: 'shake', label: 'Shake (тряска)' },
  { value: 'wobble', label: 'Wobble (хитання)' },
  { value: 'spin', label: 'Spin (повне обертання)' },
  { value: 'swing', label: 'Swing (хитання навколо осі)' },
  { value: 'bounce', label: 'Bounce (підстрибування)' },
  { value: 'tada', label: 'Tada (ефектний акцент)' },
];

function AnimationConfig({ cfg, update }) {
  return (
    <div className="border-t border-slate-200 mt-4 pt-4">
      <h4 className="text-sm font-medium text-slate-700 mb-3">Анімація появи</h4>
      <Field label="Ефект">
        <Select 
          value={cfg.animation || 'zoom'} 
          onChange={v => update('config.animation', v)} 
          options={ANIMATION_TYPES} 
        />
      </Field>
    </div>
  );
}

const FONT_FAMILIES = [
 { value: '', label: 'За замовчуванням' },
 { value: 'system-ui, sans-serif', label: 'System' },
 { value: 'Arial, sans-serif', label: 'Arial' },
 { value: 'Georgia, serif', label: 'Georgia' },
 { value: "'Roboto', sans-serif", label: 'Roboto' },
 { value: "'Montserrat', sans-serif", label: 'Montserrat' },
];

function DesignConfig({ cfg, update }) {
 const d = cfg.design || {};
 return (
 <Section title="Дизайн">
 <Field label="Шрифт">
 <Select value={d.fontFamily || ''} onChange={v => update('config.design.fontFamily', v)} options={FONT_FAMILIES} />
 </Field>
 <div className="grid grid-cols-2 gap-3">
 <Field label="Розмір шрифта (px)">
 <Input type="number" value={d.fontSize || ''} onChange={v => update('config.design.fontSize', parseInt(v) || null)} />
 </Field>
 <Field label="Заокруглення (px)">
 <Input type="number" value={d.borderRadius ?? ''} onChange={v => update('config.design.borderRadius', parseInt(v) || 0)} />
 </Field>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <Field label="Товщина рамки (px)">
 <Input type="number" value={d.borderWidth || 0} onChange={v => update('config.design.borderWidth', parseInt(v) || 0)} />
 </Field>
 <Field label="Колір рамки">
 <ColorPicker value={d.borderColor || '#000000'} onChange={v => update('config.design.borderColor', v)} />
 </Field>
 </div>
 </Section>
 );
}

// ─── TRIGGERS CONFIG (shared by popups) ───
function TriggersConfig({ triggers, update, simple = false }) {
  return (
    <Section title="Тригери показу">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Затримка (сек)" hint="0 = без затримки">
          <Input type="number" value={triggers.delay} onChange={v => update('triggers.delay', parseInt(v) || 0)} />
        </Field>
        <Field label="Скрол (%)" hint="0 = вимкнено">
          <Input type="number" value={triggers.scrollPercent} onChange={v => update('triggers.scrollPercent', parseInt(v) || 0)} />
        </Field>
      </div>
      <Field label="Частота показу">
        <Select value={triggers.frequency} onChange={v => update('triggers.frequency', v)}
          options={[
            { value: 'once', label: 'Один раз' },
            { value: 'every', label: 'Кожен візит' },
            { value: 'days', label: 'Раз на N днів' },
          ]} />
      </Field>
      {triggers.frequency === 'days' && (
        <Field label="Кількість днів">
          <Input type="number" value={triggers.frequencyDays} onChange={v => update('triggers.frequencyDays', parseInt(v) || 1)} />
        </Field>
      )}

      <div className="border-t border-slate-200 my-4 pt-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Exit Intent (покидання сайту)</h4>
        
        <Field label="Exit-intent" hint="Показати коли користувач рухає мишу до верхнього краю">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={triggers.exitIntent || false}
              onChange={(e) => update('triggers.exitIntent', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-600">Увімкнути exit-intent</span>
          </div>
        </Field>

        {triggers.exitIntent && (
          <Field label="Cooldown (хвилин)" hint="Не показувати знову протягом N хвилин">
            <Input
              type="number"
              min="0"
              value={triggers.exitCooldown || 0}
              onChange={(v) => update('triggers.exitCooldown', parseInt(v) || 0)}
            />
          </Field>
        )}
      </div>

      <div className="border-t border-slate-200 my-4 pt-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Idle (бездіяльність)</h4>
        
        <Field label="Idle timeout (секунд)" hint="Показати після N секунд бездіяльності (0 = вимкнено)">
          <Input
            type="number"
            min="0"
            value={triggers.idleTimeout || 0}
            onChange={(v) => {
              const val = parseInt(v) || 0;
              update('triggers.idleTimeout', val > 0 ? val : null);
            }}
          />
        </Field>

        {triggers.idleTimeout > 0 && (
          <Field label="Скидати при активності" hint="При русі миші/кліку таймер скидається">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={triggers.idleResetOnActivity !== false}
                onChange={(e) => update('triggers.idleResetOnActivity', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-600">Скидати таймер при активності</span>
            </div>
          </Field>
        )}
      </div>
    </Section>
  );
}

// ─── RULES CONFIG (URL + device filtering) ───
function RulesConfig({ rules, update }) {
  const urlRules = rules.urlRules || [];
  const devices = rules.devices || [];

  function addUrlRule() {
    update('rules.urlRules', [...urlRules, { type: 'contains', value: '' }]);
  }
  function removeUrlRule(i) {
    update('rules.urlRules', urlRules.filter((_, idx) => idx !== i));
  }
  function updateUrlRule(i, field, val) {
    const next = [...urlRules];
    next[i] = { ...next[i], [field]: val };
    update('rules.urlRules', next);
  }

  function toggleDevice(d) {
    if (devices.length === 0) {
      // No filter = all devices; clicking one means restrict to only the other
      update('rules.devices', d === 'desktop' ? ['mobile'] : ['desktop']);
    } else if (devices.includes(d)) {
      const next = devices.filter(x => x !== d);
      update('rules.devices', next.length === 0 ? [] : next);
    } else {
      update('rules.devices', []); // both selected = no filter
    }
  }

  return (
    <Section title="Правила відображення">
      <ScheduleConfig rules={rules} update={update} />
      
      <div className="border-t border-slate-200 my-4 pt-4">
        <Field label="Пристрої">
        <div className="flex gap-2">
          {['desktop', 'mobile'].map(d => (
            <button key={d} onClick={() => toggleDevice(d)}
              className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                devices.length === 0 || devices.includes(d)
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
              {d === 'desktop' ? '🖥 Desktop' : '📱 Mobile'}
            </button>
          ))}
          <span className="text-xs text-slate-400 self-center ml-2">
            {devices.length === 0 ? 'Всі пристрої' : `Тільки: ${devices.join(', ')}`}
          </span>
        </div>
      </Field>

      <Field label="URL-правила" hint="Якщо не задано — показується на всіх сторінках">
        <div className="space-y-2">
          {urlRules.map((rule, i) => (
            <div key={i} className="flex gap-2">
              <Select value={rule.type} onChange={v => updateUrlRule(i, 'type', v)}
                options={[
                  { value: 'contains', label: 'Містить' },
                  { value: 'exact', label: 'Точний шлях' },
                  { value: 'regex', label: 'Regex' },
                ]} />
              <Input value={rule.value} onChange={v => updateUrlRule(i, 'value', v)}
                placeholder={rule.type === 'regex' ? '/catalog/.*' : '/catalog'} />
              <button onClick={() => removeUrlRule(i)} className="p-2 text-slate-400 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addUrlRule}
          className="mt-2 flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
          <Plus size={14} /> Додати правило
        </button>
      </Field>
      </div>
    </Section>
  );
}

// ─── SCHEDULE CONFIG ───
const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Пн', full: 'Понеділок' },
  { value: 'tue', label: 'Вт', full: 'Вівторок' },
  { value: 'wed', label: 'Ср', full: 'Середа' },
  { value: 'thu', label: 'Чт', full: 'Четвер' },
  { value: 'fri', label: 'Пт', full: "П'ятниця" },
  { value: 'sat', label: 'Сб', full: 'Субота' },
  { value: 'sun', label: 'Нд', full: 'Неділя' },
];

function ScheduleConfig({ rules, update }) {
  const schedule = rules.schedule || {};
  const timeRanges = schedule.timeRanges || [{ start: '09:00', end: '18:00' }];
  const excludedDates = schedule.excludedDates || [];

  function updateSchedule(field, val) {
    update('rules.schedule', { ...schedule, [field]: val });
  }

  function toggleDay(day) {
    const current = schedule.daysOfWeek || [];
    const next = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    updateSchedule('daysOfWeek', next.length > 0 ? next : null);
  }

  function addTimeRange() {
    updateSchedule('timeRanges', [...timeRanges, { start: '09:00', end: '18:00' }]);
  }

  function removeTimeRange(i) {
    updateSchedule('timeRanges', timeRanges.filter((_, idx) => idx !== i));
  }

  function updateTimeRange(i, field, val) {
    const next = [...timeRanges];
    next[i] = { ...next[i], [field]: val };
    updateSchedule('timeRanges', next);
  }

  function addExcludedDate() {
    const today = new Date().toISOString().split('T')[0];
    updateSchedule('excludedDates', [...excludedDates, today]);
  }

  function removeExcludedDate(i) {
    updateSchedule('excludedDates', excludedDates.filter((_, idx) => idx !== i));
  }

  function updateExcludedDate(i, val) {
    const next = [...excludedDates];
    next[i] = val;
    updateSchedule('excludedDates', next);
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          checked={schedule.enabled || false}
          onChange={(e) => updateSchedule('enabled', e.target.checked)}
          className="w-4 h-4 rounded border-slate-300"
        />
        <span className="text-sm font-medium text-slate-700">Планування показу за часом</span>
      </div>

      {schedule.enabled && (
        <div className="space-y-4 pl-6">
          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Дата початку">
              <Input
                type="date"
                value={schedule.startDate || ''}
                onChange={(v) => updateSchedule('startDate', v || null)}
              />
            </Field>
            <Field label="Дата закінчення">
              <Input
                type="date"
                value={schedule.endDate || ''}
                onChange={(v) => updateSchedule('endDate', v || null)}
              />
            </Field>
          </div>

          {/* Days of week */}
          <Field label="Дні тижня">
            <div className="flex gap-1 flex-wrap">
              {DAYS_OF_WEEK.map(day => {
                const selected = (schedule.daysOfWeek || []).includes(day.value);
                return (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selected
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                    title={day.full}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Time ranges */}
          <Field label="Часові інтервали">
            <div className="space-y-2">
              {timeRanges.map((range, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={range.start}
                    onChange={(v) => updateTimeRange(i, 'start', v)}
                  />
                  <span className="text-slate-400">—</span>
                  <Input
                    type="time"
                    value={range.end}
                    onChange={(v) => updateTimeRange(i, 'end', v)}
                  />
                  {timeRanges.length > 1 && (
                    <button
                      onClick={() => removeTimeRange(i)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addTimeRange}
              className="mt-2 flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus size={14} /> Додати інтервал
            </button>
          </Field>

          {/* Excluded dates */}
          <div className="border-t border-slate-200 pt-3">
            <Field label="Виключені дати (свята)">
              <div className="space-y-2">
                {excludedDates.map((date, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={date}
                      onChange={(v) => updateExcludedDate(i, v)}
                    />
                    <button
                      onClick={() => removeExcludedDate(i)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addExcludedDate}
                className="mt-2 flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Plus size={14} /> Додати дату
              </button>
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ICON PICKER ───
const PRESET_ICONS = [
  { value: 'menu', label: '☰ Меню' },
  { value: 'phone', label: '📞 Телефон' },
  { value: 'message', label: '💬 Повідомлення' },
  { value: 'chat', label: '🗨 Чат' },
  { value: 'support', label: '🎧 Підтримка' },
  { value: 'help', label: '❓ Допомога' },
  { value: 'contact', label: '📇 Контакти' },
  { value: 'info', label: 'ℹ Інфо' },
  { value: 'bell', label: '🔔 Дзвінок' },
  { value: 'star', label: '⭐ Зірка' },
];

function LegacyIconPicker({ value, onChange }) {
  return (
    <Select value={value} onChange={onChange} options={PRESET_ICONS} />
  );
}

// ─── PREVIEW PANE ───
// Desktop viewport constants
const DESKTOP_W = 1280;
const DESKTOP_H = 720;
// Mobile viewport constants
const MOBILE_W = 375;
const MOBILE_H = 667;

function PreviewPane({ widget, siteId }) {
  const [device, setDevice] = useState('desktop');
  const iframeRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Compute scale so iframe fits the container for both modes
  useEffect(() => {
    const compute = () => {
      const w = containerRef.current?.offsetWidth || 600;
      const available = w - 32;
      if (device === 'desktop') {
        setScale(Math.min(available / DESKTOP_W, 1));
      } else {
        setScale(Math.min(available / MOBILE_W, 1));
      }
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [device]);

  // Send config to iframe
  const sendConfig = useCallback(() => {
    if (iframeRef.current?.contentWindow && widget) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_WIDGET_CONFIG',
        config: {
          siteId,
          widgets: [{ ...widget, enabled: true, triggers: null }]
        }
      }, '*');
    }
  }, [widget, siteId]);

  // Re-send on widget/siteId change
  useEffect(() => {
    const t = setTimeout(sendConfig, 300);
    return () => clearTimeout(t);
  }, [sendConfig]);

  // Re-send after iframe loads (device switch mounts a new iframe)
  const handleIframeLoad = useCallback(() => {
    setTimeout(sendConfig, 100);
  }, [sendConfig]);

  const buildPreviewUrl = () => {
    const baseUrl = window.location.origin.includes('localhost')
      ? 'http://localhost:8090'
      : 'https://widget.hunter.rv.ua';
    return `${baseUrl}/preview.html?preview=1`;
  };

  const isDesktop = device === 'desktop';
  const desktopContainerH = Math.round(DESKTOP_H * scale);
  const mobileFrameW = MOBILE_W;
  const mobileFrameH = MOBILE_H;
  const mobileScaledW = Math.round(mobileFrameW * scale);
  const mobileScaledH = Math.round(mobileFrameH * scale);

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      {/* Device toggle */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live Preview</span>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              isDesktop ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Monitor size={14} />
            Desktop
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              !isDesktop ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone size={14} />
            Mobile
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div
        ref={containerRef}
        className="relative bg-slate-100 flex items-start justify-center"
        style={{ padding: '16px', height: isDesktop ? desktopContainerH + 32 : mobileScaledH + 48 }}
      >
        {isDesktop ? (
          /* Desktop: full-width scaled iframe */
          <div
            className="rounded-lg border border-slate-300 shadow-lg overflow-hidden"
            style={{ width: DESKTOP_W * scale, height: desktopContainerH, flexShrink: 0 }}
          >
            <iframe
              ref={iframeRef}
              src={buildPreviewUrl()}
              onLoad={handleIframeLoad}
              style={{
                border: 'none',
                display: 'block',
                background: '#ffffff',
                width: DESKTOP_W,
                height: DESKTOP_H,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
              title="Widget Preview Desktop"
            />
          </div>
        ) : (
          /* Mobile: scaled phone frame */
          <div style={{ width: mobileScaledW, height: mobileScaledH, position: 'relative', flexShrink: 0 }}>
            <div
              className="rounded-[32px] border-[6px] border-slate-800 shadow-2xl overflow-hidden"
              style={{
                width: mobileFrameW,
                height: mobileFrameH,
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                background: '#fff',
              }}
            >
              {/* Notch */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 80, height: 20, background: '#1e293b', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, zIndex: 10 }} />
              <iframe
                ref={iframeRef}
                src={buildPreviewUrl()}
                onLoad={handleIframeLoad}
                style={{
                  border: 'none',
                  display: 'block',
                  background: '#ffffff',
                  width: mobileFrameW,
                  height: mobileFrameH,
                }}
                title="Widget Preview Mobile"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── A/B TEST CONFIG ───
function ABTestConfig({ widget, siteId, update }) {
  const [experiments, setExperiments] = useState([]);
  const { api } = useAuth();

  useEffect(() => {
    loadExperiments();
  }, []);

  async function loadExperiments() {
    try {
      const data = await api(`/sites/${siteId}/experiments`);
      setExperiments(data.filter(e => e.status === 'RUNNING' || e.status === 'DRAFT'));
    } catch (e) {
      console.error('Failed to load experiments:', e);
    }
  }

  const currentExp = experiments.find(e => e.id === widget.experimentId);

  return (
    <Section title="A/B Тестування">
      <p className="text-xs text-slate-400 mb-3">
        Призначте цей віджет як варіант A/B тесту
      </p>
      
      <Field label="Експеримент">
        <Select
          value={widget.experimentId || ''}
          onChange={v => update('experimentId', v || null)}
          options={[
            { value: '', label: '— Не в експерименті —' },
            ...experiments.map(e => ({ value: e.id, label: e.name }))
          ]}
        />
      </Field>
      
      {currentExp && (
        <div className="bg-blue-50 rounded-lg p-3 mt-3">
          <p className="text-sm text-blue-700">
            <strong>{currentExp.name}</strong>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Статус: {currentExp.status} | Варіантів: {currentExp.variants?.length || 0}
          </p>
        </div>
      )}
    </Section>
  );
}
