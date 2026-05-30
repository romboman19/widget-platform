import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { ChevronLeft, Save, Trash2, Plus, GripVertical, X } from 'lucide-react';

const CHANNEL_TYPES = [
  { value: 'phone', label: '📞 Телефон' },
  { value: 'telegram', label: '✈️ Telegram' },
  { value: 'viber', label: '💜 Viber' },
  { value: 'whatsapp', label: '💚 WhatsApp' },
  { value: 'email', label: '📧 Email' },
  { value: 'instagram', label: '📸 Instagram' },
  { value: 'facebook', label: '👤 Facebook' },
  { value: 'tiktok', label: '🎵 TikTok' },
  { value: 'chatwoot', label: '💬 Chatwoot' },
  { value: 'callback', label: '📲 Зворотній дзвінок' },
  { value: 'custom', label: '🔗 Кастомне посилання' },
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadWidget(); }, [widgetId]);

  async function loadWidget() {
    try {
      const data = await api(`/sites/${siteId}/widgets/${widgetId}`);
      setWidget(data);
    } catch { navigate(`/sites/${siteId}`); }
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
      await api(`/sites/${siteId}/widgets/${widgetId}`, {
        method: 'PUT',
        body: {
          name: widget.name,
          config: widget.config,
          position: widget.position,
          triggers: widget.triggers,
          rules: widget.rules,
          enabled: widget.enabled,
          priority: widget.priority,
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
            </div>
          </Section>

          {/* Type-specific config */}
          {widget.type === 'FLOATING_MENU' && <FloatingMenuConfig cfg={cfg} pos={pos} update={update} />}
          {widget.type === 'POPUP_CALLBACK' && <PopupCallbackConfig cfg={cfg} triggers={triggers} update={update} />}
          {widget.type === 'POPUP_BANNER' && <PopupBannerConfig cfg={cfg} triggers={triggers} update={update} />}
          {widget.type === 'STICKY_BAR' && <StickyBarConfig cfg={cfg} pos={pos} update={update} />}
          {widget.type === 'SIDE_TAB' && <SideTabConfig cfg={cfg} pos={pos} update={update} />}

          {/* Display rules */}
          <RulesConfig rules={rules} update={update} />
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Попередній перегляд</h3>
            <PreviewPane widget={widget} />
          </div>
        </div>
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
function FloatingMenuConfig({ cfg, pos, update }) {
  const channels = cfg.channels || [];

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
      <Section title="Вигляд">
        <Field label="Колір кнопки">
          <ColorPicker value={cfg.color} onChange={v => update('config.color', v)} />
        </Field>
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
      </Section>

      <Section title="Канали зв'язку">
        <div className="space-y-3">
          {channels.map((ch, i) => (
            <div key={i} className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Select value={ch.type} onChange={v => updateChannel(i, 'type', v)}
                    options={CHANNEL_TYPES} />
                  <Input value={ch.label} onChange={v => updateChannel(i, 'label', v)} placeholder="Підпис" />
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

      <Section title="Форма зворотного дзвінка">
        <p className="text-xs text-slate-400 mb-3">Налаштування popup-форми, яка відкривається при натисканні на канал «Зворотній дзвінок»</p>
        <Field label="Заголовок">
          <Input value={cfg.callbackTitle} onChange={v => update('config.callbackTitle', v)} placeholder="Замовити дзвінок" />
        </Field>
        <Field label="Текст">
          <Input value={cfg.callbackText} onChange={v => update('config.callbackText', v)} />
        </Field>
        <Field label="Текст кнопки">
          <Input value={cfg.callbackButton} onChange={v => update('config.callbackButton', v)} placeholder="Зателефонуйте мені" />
        </Field>
        <Field label="Webhook URL (n8n)" hint="Куди надсилати заявки зі зворотного дзвінка">
          <Input value={cfg.webhookUrl} onChange={v => update('config.webhookUrl', v)} placeholder="https://n8n.yourdomain.ua/webhook/..." />
        </Field>
      </Section>
    </>
  );
}

// ─── POPUP CALLBACK CONFIG ───
function PopupCallbackConfig({ cfg, triggers, update }) {
  return (
    <>
      <Section title="Форма">
        <Field label="Колір">
          <ColorPicker value={cfg.color} onChange={v => update('config.color', v)} />
        </Field>
        <Field label="Заголовок">
          <Input value={cfg.callbackTitle} onChange={v => update('config.callbackTitle', v)} />
        </Field>
        <Field label="Текст">
          <Input value={cfg.callbackText} onChange={v => update('config.callbackText', v)} />
        </Field>
        <Field label="Текст кнопки">
          <Input value={cfg.callbackButton} onChange={v => update('config.callbackButton', v)} />
        </Field>
        <Field label="Webhook URL (n8n)">
          <Input value={cfg.webhookUrl} onChange={v => update('config.webhookUrl', v)} placeholder="https://n8n.yourdomain.ua/webhook/..." />
        </Field>
      </Section>
      <TriggersConfig triggers={triggers} update={update} />
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
      </Section>
      <TriggersConfig triggers={triggers} update={update} />
    </>
  );
}

// ─── STICKY BAR CONFIG ───
function StickyBarConfig({ cfg, pos, update }) {
  return (
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
    </Section>
  );
}

// ─── SIDE TAB CONFIG ───
function SideTabConfig({ cfg, pos, update }) {
  return (
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
  );
}

// ─── TRIGGERS CONFIG (shared by popups) ───
function TriggersConfig({ triggers, update }) {
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
    </Section>
  );
}

// ─── PREVIEW PANE ───
function PreviewPane({ widget }) {
  const cfg = widget.config || {};
  const color = cfg.color || '#1f93ff';

  return (
    <div className="bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden" style={{ height: 400 }}>
      <div className="absolute inset-0 p-4">
        <div className="bg-white rounded-lg h-full w-full shadow-sm border border-slate-100 relative overflow-hidden">
          {/* Fake page content */}
          <div className="p-4 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-100 rounded w-full"></div>
            <div className="h-3 bg-slate-100 rounded w-5/6"></div>
            <div className="h-8 bg-slate-50 rounded mt-4"></div>
            <div className="h-3 bg-slate-100 rounded w-full"></div>
            <div className="h-3 bg-slate-100 rounded w-2/3"></div>
          </div>

          {/* Widget preview */}
          {widget.type === 'FLOATING_MENU' && (
            <div className="absolute bottom-3 right-3">
              <div className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white text-sm"
                style={{ background: color }}>💬</div>
            </div>
          )}
          {widget.type === 'POPUP_BANNER' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-lg p-4 w-4/5 shadow-xl">
                {cfg.title && <div className="font-bold text-sm mb-1">{cfg.title}</div>}
                {cfg.text && <div className="text-xs text-slate-500 mb-2">{cfg.text}</div>}
                {cfg.buttonText && <div className="text-xs text-center py-1.5 rounded text-white" style={{ background: color }}>{cfg.buttonText}</div>}
              </div>
            </div>
          )}
          {widget.type === 'POPUP_CALLBACK' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-lg p-4 w-4/5 shadow-xl">
                <div className="font-bold text-sm mb-1">{cfg.callbackTitle || 'Замовити дзвінок'}</div>
                <div className="text-xs text-slate-400 mb-2">{cfg.callbackText || ''}</div>
                <div className="h-6 bg-slate-100 rounded mb-1.5"></div>
                <div className="h-6 bg-slate-100 rounded mb-2"></div>
                <div className="text-xs text-center py-1.5 rounded text-white" style={{ background: color }}>
                  {cfg.callbackButton || 'Зателефонуйте мені'}
                </div>
              </div>
            </div>
          )}
          {widget.type === 'STICKY_BAR' && (
            <div className={`absolute left-0 right-0 ${widget.position?.placement === 'top' ? 'top-0' : 'bottom-0'} px-3 py-2 flex items-center justify-center gap-2`}
              style={{ background: cfg.bgColor || '#fff', color: cfg.textColor || '#333', boxShadow: '0 1px 4px rgba(0,0,0,.1)' }}>
              <span className="text-xs truncate">{cfg.text || 'Текст'}</span>
              {cfg.buttonText && <span className="text-xs px-2 py-0.5 rounded text-white shrink-0" style={{ background: color }}>{cfg.buttonText}</span>}
            </div>
          )}
          {widget.type === 'SIDE_TAB' && (
            <div className={`absolute ${widget.position?.side === 'left' ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 text-white px-1.5 py-3 rounded-l text-xs font-medium`}
              style={{ background: color, writingMode: 'vertical-rl' }}>
              {cfg.text || "Зв'язатися"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
