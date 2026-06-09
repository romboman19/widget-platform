import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { ChevronLeft, Save, Trash2, Plus, GripVertical, X, Monitor, Smartphone } from 'lucide-react';

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
            <PreviewPane widget={widget} siteId={siteId} />
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

      <Section title="Іконка кнопки">
        <p className="text-xs text-slate-400 mb-3">Виберіть іконку або вкажіть FontAwesome клас</p>
        <Field label="Тип іконки">
          <Select
            value={cfg.iconType || 'preset'}
            onChange={v => update('config.iconType', v)}
            options={[
              { value: 'preset', label: '🎨 Вбудована іконка' },
              { value: 'fontawesome', label: '🔤 FontAwesome' },
              { value: 'custom', label: '🖼 Кастомне зображення' },
            ]}
          />
        </Field>
        
        {cfg.iconType === 'preset' && (
          <Field label="Іконка">
            <IconPicker value={cfg.icon} onChange={v => update('config.icon', v)} />
          </Field>
        )}
        
        {cfg.iconType === 'fontawesome' && (
          <Field label="FontAwesome клас" hint="Наприклад: fa-solid fa-phone">
            <Input 
              value={cfg.iconClass || ''} 
              onChange={v => update('config.iconClass', v)} 
              placeholder="fa-solid fa-comment-dots"
            />
          </Field>
        )}
        
        {cfg.iconType === 'custom' && (
          <Field label="URL іконки">
            <Input 
              value={cfg.customIconUrl || ''} 
              onChange={v => update('config.customIconUrl', v)} 
              placeholder="https://..."
            />
          </Field>
        )}
      </Section>

      <Section title="Канали зв\'язку">
        <p className="text-xs text-slate-400 mb-3">Налаштуйте канали з можливістю вибору іконок FontAwesome</p>
        <div className="space-y-3">
          {channels.map((ch, i) => (
            <div key={i} className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Select value={ch.type} onChange={v => updateChannel(i, 'type', v)}
                    options={CHANNEL_TYPES} />
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

      <Section title="Налаштування анімації">
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
        <AnimationConfig cfg={cfg} update={update} />
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
        
        <AnimationConfig cfg={cfg} update={update} />
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
      
      <AnimationConfig cfg={cfg} update={update} />
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

function IconPicker({ value, onChange }) {
  return (
    <Select value={value} onChange={onChange} options={PRESET_ICONS} />
  );
}

// ─── PREVIEW PANE ───
function PreviewPane({ widget, siteId }) {
  const [device, setDevice] = useState('desktop');
  const iframeRef = useRef(null);

  // Send updated config to iframe via postMessage
  useEffect(() => {
    const timer = setTimeout(() => {
      if (iframeRef.current?.contentWindow && widget) {
        const previewConfig = {
          siteId: siteId,
          widgets: [{
            ...widget,
            enabled: true,
            triggers: null,
          }]
        };
        
        iframeRef.current.contentWindow.postMessage({
          type: 'UPDATE_WIDGET_CONFIG',
          config: previewConfig
        }, '*');
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [widget, siteId]);

  // Build iframe URL
  const buildPreviewUrl = () => {
    if (!widget) return '/preview.html';
    
    const previewConfig = {
      siteId: siteId,
      widgets: [{
        ...widget,
        enabled: true,
        triggers: null,
      }]
    };
    
    const configStr = JSON.stringify(previewConfig);
    const configB64 = btoa(unescape(encodeURIComponent(configStr)));
    
    return `/preview.html?config=${encodeURIComponent(configB64)}&device=${device}`;
  };
  
  // Device frame
  const frameClass = device === 'mobile' 
    ? 'rounded-[32px] border-[6px] border-slate-800 shadow-2xl' 
    : 'rounded-lg border border-slate-300 shadow-lg';
  
  const iframeStyle = device === 'mobile'
    ? { width: 375, height: 667 }
    : { width: '100%', height: 500 };

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      {/* Device toggle */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live Preview</span>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              device === 'desktop' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Monitor size={14} />
            Desktop
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              device === 'mobile' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Smartphone size={14} />
            Mobile
          </button>
        </div>
      </div>

      {/* Preview iframe */}
      <div className={`relative bg-slate-100 flex items-center justify-center p-4 ${device === 'mobile' ? 'py-8' : ''}`}>
        <div className={`overflow-hidden ${frameClass}`} style={iframeStyle}>
          <iframe
            ref={iframeRef}
            src={buildPreviewUrl()}
            className="w-full h-full"
            style={{ border: 'none', display: 'block', background: '#ffffff' }}
            title="Widget Preview"
          />
        </div>
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
