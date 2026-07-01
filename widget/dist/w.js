(function() {
  'use strict';

  // ─── Config ───
  const SCRIPT = document.currentScript;
  const SCRIPT_SRC = SCRIPT?.src || '';
  const BASE_URL = SCRIPT_SRC ? new URL(SCRIPT_SRC).origin : '';
  const SCRIPT_PARAMS = SCRIPT_SRC ? new URL(SCRIPT_SRC).searchParams : new URLSearchParams();
  const SITE_SLUG = SCRIPT_PARAMS.get('site');
  const IS_PREVIEW = SCRIPT_PARAMS.get('preview') === '1' || SCRIPT_PARAMS.get('__widget_preview__') === '1';
  if (!SITE_SLUG && !IS_PREVIEW) return console.warn('[Widget] Missing ?site= parameter');
  // ─── Font families ───
  const FONT_FAMILIES = [
    { value: '', label: 'За замовчуванням' },
    { value: 'system-ui, sans-serif', label: 'System' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: "'Roboto', sans-serif", label: 'Roboto' },
    { value: "'Montserrat', sans-serif", label: 'Montserrat' },
  ];

  // ─── Design config ───
  function applyDesign(style, cfg) {
    const d = cfg.design || {};
    if (d.fontFamily) style.fontFamily = d.fontFamily;
    if (d.fontSize) style.fontSize = d.fontSize + 'px';
    if (d.borderRadius !== undefined) style.borderRadius = d.borderRadius + 'px';
    if (d.borderWidth) { style.borderWidth = d.borderWidth + 'px'; style.borderStyle = 'solid'; }
    if (d.borderColor) style.borderColor = d.borderColor;
    return style;
  }



  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
  const DEVICE = isMobile ? 'mobile' : 'desktop';

  // Load FontAwesome if configured
  const loadFontAwesome = () => {
    if (document.querySelector('link[href*="font-awesome"]') || document.querySelector('link[href*="fontawesome"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    link.integrity = 'sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };

  // ─── Icons (inline SVG + FontAwesome support) ───
  const ICONS = {
    phone: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1.003 1.003 0 011.01-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.1.31.03.66-.25 1.01l-2.2 2.21z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
    viber: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 0C9.473.028 5.333.344 3.38 2.106 1.837 3.6 1.24 5.88 1.16 8.7c-.08 2.82-.18 8.1 4.96 9.54h.01l-.01 2.18s-.04.88.55 1.06c.37.12.58-.07 1.63-1.22.58-.63 1.37-1.56 1.97-2.27 5.43.46 9.6-.58 10.08-.76.55-.2 3.66-.58 4.16-4.7.52-4.26.08-6.94-1.02-8.14 0 0-.02-.02-.02-.04C22.52 3.18 14.79-.04 11.4 0zm.32 1.93c2.95-.02 9.19 2.47 10.06 3.43.86.96 1.27 3.38.81 7.12-.4 3.28-2.76 3.56-3.22 3.73-.4.15-4.06 1.05-8.88.7 0 0-3.51 4.23-3.89 4.61-.06.06-.13.08-.18.07-.07-.02-.09-.1-.09-.17l.02-5c-4.28-1.16-4.03-5.63-3.96-7.94.07-2.31.5-4.2 1.76-5.44C5.65 2.64 8.77 1.97 11.72 1.93zm.48 3.16c-.17 0-.3.14-.3.3 0 .18.13.32.3.32 1.22 0 2.36.48 3.22 1.35.87.86 1.39 2.04 1.45 3.3 0 .17.15.3.32.3h.02c.17 0 .3-.15.3-.33-.07-1.41-.65-2.72-1.62-3.7a5.29 5.29 0 00-3.6-1.52h-.09zm-3.05 1.2c-.27-.04-.6.07-.88.35l-.02.02c-.63.63-.56 1.33-.56 1.33l.01.02a12.3 12.3 0 005.84 5.84l.02.01s.7.07 1.33-.56c.51-.51.41-1.07.29-1.29a20.7 20.7 0 00-1.63-1.63c-.34-.25-.7-.1-.87.06l-.57.56s-.16.15-.38.08a6.2 6.2 0 01-1.94-1.5 6.2 6.2 0 01-1.5-1.94c-.07-.22.08-.38.08-.38l.56-.57c.16-.17.31-.53.06-.87-.45-.6-.97-1.15-1.37-1.43a.82.82 0 00-.46-.1zm3.88.1c-.17 0-.3.14-.3.3 0 .17.14.31.3.31.84 0 1.62.33 2.2.93.46.46.76 1.05.86 1.7.02.17.17.28.33.26.17-.02.28-.17.26-.33a3.6 3.6 0 00-1.02-2.02 3.53 3.53 0 00-2.63-1.15zm.46 1.67c-.18-.02-.33.14-.33.32.18 0 .33.14.33.32a1.53 1.53 0 011.23 1.23c.02.17.17.28.33.26.17-.02.28-.17.26-.33a2.11 2.11 0 00-1.82-1.8z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    callback: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.12-.74-.03-1.02.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM12 3v10l3-3h6V3h-9z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
    chatwoot: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
    custom: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
  };

  // ─── Default channel colors ───
  const CHANNEL_COLORS = {
    phone: '#2ecc71',
    telegram: '#0088cc',
    viber: '#7360f2',
    whatsapp: '#25d366',
    email: '#e74c3c',
    callback: '#f39c12',
    instagram: '#e4405f',
    facebook: '#1877f2',
    tiktok: '#010101',
    chatwoot: '#1f93ff',
    custom: '#8e44ad',
  };

  // ─── State ───
  let siteConfig = null;
  let siteId = null;
  let floatingOpen = false;

  // ─── Utils ───
  function el(tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v);
    });
    if (children) {
      if (typeof children === 'string') {
        // Allow SVG content (from our ICONS), use textContent for everything else
        if (children.trim().startsWith('<svg')) e.innerHTML = children;
        else e.textContent = children;
      }
      else if (Array.isArray(children)) children.forEach(c => c && e.appendChild(c));
      else e.appendChild(children);
    }
    return e;
  }

  function track(event, widgetId, channel, meta) {
    // Skip tracking in preview mode
    if (window.__WIDGET_PREVIEW__) return;
    const data = { siteId, widgetId, event, channel, page: location.href, device: DEVICE, meta };
    navigator.sendBeacon?.(BASE_URL + '/api/analytics/track', new Blob([JSON.stringify(data)], { type: 'application/json' }))
      || fetch(BASE_URL + '/api/analytics/track', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' }, keepalive: true, credentials: 'omit' });
  }

  function matchRules(rules) {
    if (!rules) return true;

    // Schedule check
    if (rules.schedule && !checkSchedule(rules.schedule)) return false;

    // Device filter
    if (rules.devices && !rules.devices.includes(DEVICE)) return false;

    // URL filter
    if (rules.urlRules?.length) {
      const url = location.href;
      const path = location.pathname;
      return rules.urlRules.some(r => {
        if (r.type === 'contains') return url.includes(r.value);
        if (r.type === 'exact') return path === r.value;
        if (r.type === 'regex') {
          if (!r.value || r.value.length > 200) return false;
          try { return new RegExp(r.value).test(url); } catch { return false; }
        }
        return true;
      });
    }
    return true;
  }

  // ─── Schedule utilities ───
  function checkSchedule(schedule) {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute; // minutes since midnight

    // Check enabled
    if (schedule.enabled === false) return true; // schedule disabled = always show

    // Check date range
    if (schedule.startDate || schedule.endDate) {
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
      if (schedule.startDate && today < schedule.startDate) return false;
      if (schedule.endDate && today > schedule.endDate) return false;
    }

    // Check days of week
    if (schedule.daysOfWeek?.length) {
      const daysMap = { 'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6 };
      const allowedDays = schedule.daysOfWeek.map(d => typeof d === 'string' ? daysMap[d.toLowerCase()] : d);
      if (!allowedDays.includes(currentDay)) return false;
    }

    // Check time range
    if (schedule.timeRanges?.length) {
      const inTimeRange = schedule.timeRanges.some(range => {
        const start = parseTime(range.start);
        const end = parseTime(range.end);
        if (start === null || end === null) return true;
        return currentTime >= start && currentTime <= end;
      });
      if (!inTimeRange) return false;
    }

    // Check excluded dates (holidays)
    if (schedule.excludedDates?.length) {
      const today = now.toISOString().split('T')[0];
      if (schedule.excludedDates.includes(today)) return false;
    }

    // Check timezone offset (basic validation)
    if (schedule.timezone) {
      // Simple check: if timezone specified, we assume browser is in correct timezone
      // For production, consider using Intl.DateTimeFormat
    }

    return true;
  }

  function parseTime(timeStr) {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
  }

  function getCookie(name) {
    return document.cookie.split(';').find(c => c.trim().startsWith(name + '='))?.split('=')?.[1];
  }

  function setCookie(name, val, days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    document.cookie = `${name}=${val};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }

  // ─── Trigger utilities ───
  function setupExitIntent(widget, showCallback) {
    const triggers = widget.triggers || {};
    if (!triggers.exitIntent) return;

    const cookieKey = 'wp_exit_' + widget.id;
    const cooldownMinutes = triggers.exitCooldown || 0;

    // Check cooldown
    if (cooldownMinutes > 0) {
      const lastShown = getCookie(cookieKey + '_time');
      if (lastShown) {
        const elapsed = (Date.now() - parseInt(lastShown)) / 1000 / 60;
        if (elapsed < cooldownMinutes) return;
      }
    }

    // Already shown this session
    if (getCookie(cookieKey)) return;

    let shown = false;
    const handler = (e) => {
      if (shown) return;
      // Detect when mouse leaves viewport toward top
      if (e.clientY < 10) {
        shown = true;
        setCookie(cookieKey, '1', triggers.frequency === 'once' ? 365 : (triggers.frequencyDays || 1));
        if (cooldownMinutes > 0) {
          setCookie(cookieKey + '_time', Date.now().toString(), 1);
        }
        showCallback();
      }
    };

    document.addEventListener('mouseleave', handler);
  }

  function setupIdleTrigger(widget, showCallback) {
    const triggers = widget.triggers || {};
    if (!triggers.idleTimeout || triggers.idleTimeout <= 0) return;

    const cookieKey = 'wp_idle_' + widget.id;
    if (getCookie(cookieKey)) return;

    const timeoutMs = triggers.idleTimeout * 1000;
    const resetOnActivity = triggers.idleResetOnActivity !== false;
    let idleTimer = null;
    let shown = false;

    const show = () => {
      if (shown) return;
      shown = true;
      setCookie(cookieKey, '1', triggers.frequency === 'once' ? 365 : (triggers.frequencyDays || 1));
      showCallback();
    };

    const resetTimer = () => {
      if (shown || !resetOnActivity) return;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(show, timeoutMs);
    };

    idleTimer = setTimeout(show, timeoutMs);

    const idleEvents = ['mousemove', 'click', 'scroll', 'keydown', 'touchstart'];
    idleEvents.forEach(evt => {
      document.addEventListener(evt, resetTimer, { passive: true });
    });
    // Track for cleanup on reinit
    window.__WIDGET_IDLE_CLEANUPS__ = window.__WIDGET_IDLE_CLEANUPS__ || [];
    window.__WIDGET_IDLE_CLEANUPS__.push(() => {
      clearTimeout(idleTimer);
      idleEvents.forEach(evt => document.removeEventListener(evt, resetTimer));
    });
  }

  // ─── Animation utilities ───
  function applyAnimation(element, animationName) {
    if (!animationName || animationName === 'none') return;
    const className = 'wp-anim-' + animationName;
    element.classList.add(className);
    // Remove class after animation completes to allow re-triggering
    const duration = getAnimationDuration(animationName);
    if (duration) {
      setTimeout(() => element.classList.remove(className), duration);
    }
  }

  function getAnimationDuration(animationName) {
    const durations = {
      'fade': 300,
      'slide-up': 400,
      'slide-down': 400,
      'slide-left': 400,
      'slide-right': 400,
      'zoom': 350,
      'bounce': 600,
      'elastic': 500,
      'flip': 500,
    };
    return durations[animationName] || 400;
  }

  function setCookie(name, val, days) {
    const d = new Date(); d.setDate(d.getDate() + days);
    document.cookie = `${name}=${val};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }

  // ─── Inject global styles ───
  function injectStyles() {
    // Guard: already injected
    if (document.getElementById('wp-styles')) return;
    
    const css = `
      /* Animation keyframes */
      @keyframes wp-fade-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes wp-fade-out { from { opacity: 1; } to { opacity: 0; } }
      @keyframes wp-slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes wp-slide-down { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes wp-slide-left { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes wp-slide-right { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes wp-zoom { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
      @keyframes wp-bounce { 
        0% { opacity: 0; transform: translateY(30px); } 
        60% { opacity: 1; transform: translateY(-10px); } 
        80% { transform: translateY(5px); } 
        100% { transform: translateY(0); } 
      }
      @keyframes wp-elastic { 
        0% { opacity: 0; transform: scale(0.3); } 
        50% { transform: scale(1.05); } 
        70% { transform: scale(0.9); } 
        100% { opacity: 1; transform: scale(1); } 
      }
      @keyframes wp-flip { from { opacity: 0; transform: perspective(400px) rotateX(90deg); } to { opacity: 1; transform: perspective(400px) rotateX(0deg); } }
      @keyframes wp-pulse { 
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      @keyframes wp-shake { 
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      @keyframes wp-wobble {
        0% { transform: translateX(0%); }
        15% { transform: translateX(-25%) rotate(-5deg); }
        30% { transform: translateX(20%) rotate(3deg); }
        45% { transform: translateX(-15%) rotate(-3deg); }
        60% { transform: translateX(10%) rotate(2deg); }
        75% { transform: translateX(-5%) rotate(-1deg); }
        100% { transform: translateX(0%); }
      }
      
      /* Animation classes */
      .wp-anim-fade { animation: wp-fade-in 0.3s ease forwards; }
      .wp-anim-slide-up { animation: wp-slide-up 0.4s ease forwards; }
      .wp-anim-slide-down { animation: wp-slide-down 0.4s ease forwards; }
      .wp-anim-slide-left { animation: wp-slide-left 0.4s ease forwards; }
      .wp-anim-slide-right { animation: wp-slide-right 0.4s ease forwards; }
      .wp-anim-zoom { animation: wp-zoom 0.35s ease forwards; }
      .wp-anim-bounce { animation: wp-bounce 0.6s ease forwards; }
      .wp-anim-elastic { animation: wp-elastic 0.5s ease forwards; }
      .wp-anim-flip { animation: wp-flip 0.5s ease forwards; }
      .wp-anim-pulse { animation: wp-pulse 1s ease infinite; }
      .wp-anim-shake { animation: wp-shake 0.5s ease forwards; }
      .wp-anim-wobble { animation: wp-wobble 1s ease forwards; }
      
      /* Attention effects */
      .wp-attention-pulse { animation: wp-pulse 2s ease infinite; }
      .wp-attention-shake { animation: wp-shake 0.5s ease; }
      .wp-attention-wobble { animation: wp-wobble 1s ease; }
 .wp-attention-spin { animation: wp-spin 2s linear infinite; }
 .wp-attention-swing { animation: wp-kf-swing 1.2s ease infinite; }
 .wp-attention-bounce { animation: wp-kf-bounce 1.2s ease infinite; }
 .wp-attention-tada { animation: wp-kf-tada 1.4s ease infinite; }
 /* Icon wrapper inside a floating button (for per-button icon animations & carousel) */
 .wp-btn-icon { display:flex; align-items:center; justify-content:center; width:100%; height:100%; }
 .wp-btn-icon img, .wp-btn-icon svg { object-fit:contain; display:block; }
 /* Per-button icon attention animations (animate the icon, not the button) */
 .wp-icon-pulse { animation-name: wp-kf-pulse; animation-timing-function: ease; animation-iteration-count: infinite; }
 .wp-icon-shake { animation-name: wp-kf-shake; animation-timing-function: ease; animation-iteration-count: infinite; }
 .wp-icon-wobble { animation-name: wp-kf-wobble; animation-timing-function: ease; animation-iteration-count: infinite; }
 .wp-icon-spin { animation-name: wp-kf-spin; animation-timing-function: linear; animation-iteration-count: infinite; }
 .wp-icon-swing { animation-name: wp-kf-swing; animation-timing-function: ease; animation-iteration-count: infinite; }
 .wp-icon-bounce { animation-name: wp-kf-bounce; animation-timing-function: ease; animation-iteration-count: infinite; }
 .wp-icon-tada { animation-name: wp-kf-tada; animation-timing-function: ease; animation-iteration-count: infinite; }
 @keyframes wp-slide-in-right { from { opacity:0; transform: translateX(60%); } to { opacity:1; transform: translateX(0); } }
 @keyframes wp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
 @keyframes wp-kf-pulse {
 0% { transform: scale(1); } 25% { transform: scale(1.15); } 50% { transform: scale(1); } 100% { transform: scale(1); }
 }
 @keyframes wp-kf-shake {
 0% { transform: translateX(0); } 8% { transform: translateX(-3px); } 16% { transform: translateX(3px); }
 24% { transform: translateX(-3px); } 32% { transform: translateX(3px); } 40% { transform: translateX(0); } 100% { transform: translateX(0); }
 }
 @keyframes wp-kf-wobble {
 0% { transform: rotate(0deg); } 10% { transform: rotate(-10deg); } 20% { transform: rotate(8deg); }
 30% { transform: rotate(-6deg); } 40% { transform: rotate(3deg); } 50% { transform: rotate(0deg); } 100% { transform: rotate(0deg); }
 }
 @keyframes wp-kf-spin {
 0% { transform: rotate(0deg); } 50% { transform: rotate(360deg); } 100% { transform: rotate(360deg); }
 }
 @keyframes wp-kf-swing {
 0% { transform: rotate(0deg); } 10% { transform: rotate(15deg); } 20% { transform: rotate(-12deg); }
 30% { transform: rotate(9deg); } 40% { transform: rotate(-6deg); } 50% { transform: rotate(0deg); } 100% { transform: rotate(0deg); }
 }
 @keyframes wp-kf-bounce {
 0% { transform: translateY(0); } 15% { transform: translateY(-25%); } 30% { transform: translateY(0); }
 42% { transform: translateY(-12%); } 52% { transform: translateY(0); } 100% { transform: translateY(0); }
 }
 @keyframes wp-kf-tada {
 0% { transform: scale(1) rotate(0); } 10% { transform: scale(0.9) rotate(-3deg); } 20% { transform: scale(1.1) rotate(3deg); }
 30% { transform: scale(1.1) rotate(-3deg); } 40% { transform: scale(1.1) rotate(3deg); } 50% { transform: scale(1) rotate(0); } 100% { transform: scale(1) rotate(0); }
 }
      
      /* Exit animations */
      .wp-exit-fade { animation: wp-fade-out 0.2s ease forwards; }
      .wp-exit-zoom { animation: wp-zoom 0.2s ease reverse forwards; }
      
      /* Focus styles for accessibility */
      .wp-widget button:focus-visible,
      .wp-widget [role="button"]:focus-visible { outline: 2px solid #1f93ff; outline-offset: 2px; }
      .wp-widget button:focus:not(:focus-visible),
      .wp-widget [role="button"]:focus:not(:focus-visible) { outline: none; }
      
      /* Screen reader only */
      .wp-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .wp-floating-btn, .wp-channel-btn, .wp-popup-box, .wp-sticky-bar, .wp-side-tab { border: 2px solid currentColor; }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .wp-widget * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
      }
      
      .wp-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .wp-floating-btn { position: fixed; width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.25); display: flex; align-items: center; justify-content: center; transition: transform .2s, box-shadow .2s; }
      .wp-floating-btn:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(0,0,0,.3); }
      .wp-floating-btn svg { width: 26px; height: 26px; color: #fff; }
      .wp-floating-btn-v2 { display: flex; align-items: center; justify-content: center; }
      .wp-floating-btn-v2 svg { color: #fff; }
      .wp-floating-btn-v2 { overflow: hidden; }
      .wp-floating-menu { display: flex; flex-direction: column; gap: 10px; transition: opacity .25s, transform .25s, visibility 0s; visibility: visible; }
      .wp-floating-menu.hidden { opacity: 0; transform: translateY(10px); pointer-events: none; visibility: hidden; transition: opacity .25s, transform .25s, visibility 0s .25s; }
      .wp-channel-btn { width: 46px; height: 46px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,.2); transition: transform .15s; position: relative; }
      .wp-channel-btn:hover { transform: scale(1.15); }
      .wp-channel-btn svg { width: 22px; height: 22px; color: #fff; }
      .wp-channel-btn .wp-tooltip { position: absolute; right: 56px; top: 50%; transform: translateY(-50%); background: #333; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 13px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .15s; }
      .wp-channel-btn:hover .wp-tooltip { opacity: 1; }
      .wp-popup-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .3s; }
      .wp-popup-overlay.visible { opacity: 1; }
      .wp-popup-box { background: #fff; border-radius: 12px; max-width: 420px; width: 90%; padding: 28px; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,.3); }
      .wp-popup-close { position: absolute; top: 10px; right: 10px; background: none; border: none; cursor: pointer; padding: 4px; }
      .wp-popup-close svg { width: 20px; height: 20px; color: #666; }
      .wp-popup-title { margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #1a1a1a; }
      .wp-popup-text { margin: 0 0 20px; font-size: 14px; color: #666; line-height: 1.5; }
      .wp-form-input { width: 100%; padding: 12px 14px; border: 1.5px solid #ddd; border-radius: 8px; font-size: 15px; margin-bottom: 12px; outline: none; transition: border-color .2s; }
      .wp-form-input:focus { border-color: #1f93ff; }
      .wp-form-submit { width: 100%; padding: 13px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; color: #fff; cursor: pointer; transition: opacity .2s; }
      .wp-form-submit:hover { opacity: .9; }
      .wp-form-success { text-align: center; padding: 20px; font-size: 16px; color: #2ecc71; }
      .wp-sticky-bar { position: fixed; left: 0; width: 100%; padding: 10px 20px; display: flex; align-items: center; justify-content: center; gap: 14px; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,.15); transition: transform .3s; }
      .wp-sticky-bar.top { top: 0; }
      .wp-sticky-bar.bottom { bottom: 0; }
      .wp-sticky-bar-close { background: none; border: none; cursor: pointer; margin-left: 8px; }
      .wp-sticky-bar-close svg { width: 16px; height: 16px; }
      .wp-sticky-btn { padding: 6px 16px; border-radius: 6px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; }
      .wp-side-tab { position: fixed; writing-mode: vertical-rl; text-orientation: mixed; padding: 14px 8px; border-radius: 8px 0 0 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: -2px 0 8px rgba(0,0,0,.15); border: none; transition: transform .2s; }
      .wp-side-tab:hover { transform: translateX(-3px); }
      .wp-banner-img { width: 100%; border-radius: 8px; margin-bottom: 16px; }
      @media (max-width: 480px) {
        .wp-channel-btn .wp-tooltip { display: none; }
        .wp-popup-box { width: 95%; padding: 20px; }
      }
    `;

    if (document.getElementById('wp-styles')) return;
    const style = el('style', { id: 'wp-styles' }, css);
    document.head.appendChild(style);
  }

  // ─── Renderers ───

  function renderFloatingMenu(widget) {
    const cfg = widget.config;
    const pos = widget.position || {};
    const corner = pos.corner || 'bottom-right';
    const mainColor = cfg.color || '#1f93ff';
    const channels = cfg.channels || [];

    // Position styles
    const posStyle = {};
    if (corner.includes('bottom')) posStyle.bottom = (pos.offsetY || 20) + 'px';
    if (corner.includes('top')) posStyle.top = (pos.offsetY || 20) + 'px';
    if (corner.includes('right')) posStyle.right = (pos.offsetX || 20) + 'px';
    if (corner.includes('left')) posStyle.left = (pos.offsetX || 20) + 'px';

    // Channel buttons with ARIA
    const menuEl = el('div', {
      class: 'wp-widget wp-floating-menu hidden',
      role: 'menu',
      'aria-label': 'Канали зв\'язку',
      'aria-expanded': 'false',
      style: { ...posStyle, [corner.includes('bottom') ? 'bottom' : 'top']: (pos.offsetY || 20) + 66 + 'px', zIndex: (widget.zIndex || 999999) + 1 }
    });

    const menuItems = [];
    channels.forEach((ch, i) => {
      const color = ch.color || CHANNEL_COLORS[ch.type] || '#333';
      const btn = el('button', {
        class: 'wp-channel-btn',
        role: 'menuitem',
        'aria-label': ch.label || ch.type,
        tabIndex: -1,
        style: { background: color, transitionDelay: (i * 0.04) + 's' },
        onClick: () => handleChannelClick(ch, widget),
      }, [
        el('span', { 'aria-hidden': 'true' }, ICONS[ch.type] || ICONS.custom),
        el('span', { class: 'wp-tooltip' }, ch.label || ch.type),
      ]);
      menuEl.appendChild(btn);
      menuItems.push(btn);
    });

    // Main button with ARIA
    const mainBtn = el('button', {
      class: 'wp-widget wp-floating-btn',
      'aria-label': floatingOpen ? 'Закрити меню' : (cfg.greeting || 'Відкрити меню зв\'язку'),
      'aria-expanded': 'false',
      'aria-controls': 'wp-floating-menu',
      style: { ...posStyle, background: mainColor, zIndex: widget.zIndex || 999999 },
      onClick: () => {
        floatingOpen = !floatingOpen;
        menuEl.classList.toggle('hidden', !floatingOpen);
        mainBtn.setAttribute('aria-expanded', floatingOpen);
        menuEl.setAttribute('aria-expanded', floatingOpen);
        mainBtn.setAttribute('aria-label', floatingOpen ? 'Закрити меню' : 'Відкрити меню зв\'язку');
        mainBtn.innerHTML = floatingOpen ? ICONS.close : (cfg.icon ? ICONS[cfg.icon] : ICONS.menu);
        if (floatingOpen) {
          track('open', widget.id);
          applyAnimation(menuEl, cfg.menuAnimation || 'fade');
          // Focus first item
          if (menuItems[0]) menuItems[0].tabIndex = 0;
        }
      },
      onKeyDown: (e) => {
        // Keyboard navigation
        if (!floatingOpen) return;
        const current = menuItems.findIndex(item => item === document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault();
          const next = (current + 1) % menuItems.length;
          menuItems.forEach((item, i) => item.tabIndex = i === next ? 0 : -1);
          menuItems[next]?.focus();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = current <= 0 ? menuItems.length - 1 : current - 1;
          menuItems.forEach((item, i) => item.tabIndex = i === prev ? 0 : -1);
          menuItems[prev]?.focus();
        } else if (e.key === 'Escape') {
          floatingOpen = false;
          menuEl.classList.add('hidden');
          mainBtn.setAttribute('aria-expanded', 'false');
          mainBtn.setAttribute('aria-label', 'Відкрити меню зв\'язку');
          mainBtn.innerHTML = cfg.icon ? ICONS[cfg.icon] : ICONS.menu;
          mainBtn.focus();
        }
      },
    }, cfg.icon ? ICONS[cfg.icon] : ICONS.menu);

    // Apply attention animation to main button
    if (cfg.attentionAnimation) {
      mainBtn.classList.add('wp-attention-' + cfg.attentionAnimation);
    }

    // Greeting animation (legacy fallback)
    if (cfg.greeting && !getCookie('wp_greeted_' + widget.id) && !cfg.attentionAnimation) {
      setTimeout(() => {
        mainBtn.style.animation = 'none';
        mainBtn.style.transform = 'scale(1.15)';
        setTimeout(() => { mainBtn.style.transform = ''; }, 300);
      }, (cfg.greetingDelay || 3) * 1000);
      setCookie('wp_greeted_' + widget.id, '1', 1);
    }

    document.body.appendChild(menuEl);
    document.body.appendChild(mainBtn);
    track('view', widget.id);
  }

  function handleChannelClick(channel, widget) {
    track('click', widget.id, channel.type);

    const v = (channel.value || '').trim();
    const isFullUrl = /^(https?:|viber:|tg:|tel:|mailto:)/i.test(v);
    switch (channel.type) {
      case 'phone': window.open(isFullUrl ? v : 'tel:' + v, '_self'); break;
      case 'telegram': window.open(isFullUrl ? v : 'https://t.me/' + v, '_blank'); break;
      case 'viber': window.open(isFullUrl ? v : 'viber://chat?number=' + v, '_blank'); break;
      case 'whatsapp': window.open(isFullUrl ? v : 'https://wa.me/' + v.replace(/[^0-9]/g, ''), '_blank'); break;
      case 'email': window.open(isFullUrl ? v : 'mailto:' + v, '_self'); break;
      case 'instagram': window.open(isFullUrl ? v : 'https://instagram.com/' + v, '_blank'); break;
      case 'facebook': window.open(isFullUrl ? v : 'https://facebook.com/' + v, '_blank'); break;
      case 'tiktok': window.open(isFullUrl ? v : 'https://tiktok.com/@' + v, '_blank'); break;
      case 'chatwoot': {
        if (window.$chatwoot) {
          window.$chatwoot.toggle('open');
        } else {
          let tries = 0;
          const tryOpen = () => {
            if (window.$chatwoot) { window.$chatwoot.toggle('open'); }
            else if (tries++ < 30) setTimeout(tryOpen, 200);
          };
          window.addEventListener('chatwoot:ready', tryOpen);
          tryOpen();
        }
        break;
      }
      case 'callback': {
        // If channel has callbackWidgetId, find and render that specific POPUP_CALLBACK widget directly
        if (channel.callbackWidgetId && siteConfig) {
          const cbWidget = siteConfig.widgets.find(w => w.id === channel.callbackWidgetId);
          if (cbWidget) { showCallbackForm(cbWidget); break; }
        }
        // Fallback: use this widget's own callback config (legacy)
        showCallbackForm(widget); break;
      }
      case 'custom': if (channel.value) window.open(channel.value, '_blank'); break;
    }
  }

  // ─── Icon renderer with FontAwesome support ───
  function renderIcon(iconName, customIconUrl, customIconClass) {
    // FontAwesome icon
    if (customIconClass) {
      return el('i', { class: customIconClass, style: { fontSize: '22px', color: 'inherit' } });
    }
    // Inline SVG icon
    if (ICONS[iconName]) {
      return el('span', {}, ICONS[iconName]);
    }
    // Custom icon URL (image)
    if (customIconUrl) {
      return el('img', { src: customIconUrl, style: { width: '22px', height: '22px', objectFit: 'contain' } });
    }
    // Fallback
    return el('span', {}, ICONS.custom);
  }

  // ─── IMask loader ───
  let _imaskPromise = null;
  function loadIMask() {
    if (_imaskPromise) return _imaskPromise;
    _imaskPromise = new Promise((resolve, reject) => {
      if (window.IMask) return resolve(window.IMask);
      const scr = document.createElement('script');
      scr.src = 'https://unpkg.com/imask';
      scr.async = true;
      scr.onload = () => resolve(window.IMask);
      scr.onerror = () => reject(new Error('IMask load error'));
      document.body.appendChild(scr);
    });
    return _imaskPromise;
  }

  // ─── Build mask pattern for IMask from country code ───
  function buildMaskPattern(cc) {
    // e.g. +380 -> '{+380}000000000' (12 digits total for UA)
    const patterns = {
      '+380': '{+380}000000000',
      '+48': '{+48}000000000',
      '+374': '{+374}00000000',
      '+995': '{+995}000000000',
      '+375': '{+375}000000000',
    };
    return patterns[cc] || '{+380}000000000';
  }

  // ─── Working hours check ───
  function checkWorkingHours(schedule) {
    if (!schedule) return true;
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon, ...
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const key = dayMap[day];
    const dayCfg = schedule[key];
    if (!dayCfg || !dayCfg.enabled) return false;
    const mins = now.getHours() * 60 + now.getMinutes();
    const [fh, fm] = (dayCfg.from || '09:30').split(':').map(Number);
    const [th, tm] = (dayCfg.to || '18:00').split(':').map(Number);
    return mins >= (fh * 60 + fm) && mins < (th * 60 + tm);
  }

  // ─── Schedule info for off-hours ───
  function getScheduleInfo(schedule, defaultTime) {
    if (!schedule) return null;
    const now = new Date();
    const day = now.getDay();
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const tomorrow = new Date(now.getTime() + 86400000);
    const dayAfter = new Date(now.getTime() + 2 * 86400000);
    const fmt = (d) => d.toISOString().split('T')[0];

    // If today is working day but before hours -> today
    const todayKey = dayMap[day];
    const todayCfg = schedule[todayKey];
    if (todayCfg && todayCfg.enabled) {
      const mins = now.getHours() * 60 + now.getMinutes();
      const [fh, fm] = (todayCfg.from || '09:30').split(':').map(Number);
      if (mins < (fh * 60 + fm)) return { label: 'Сьогодні', date: fmt(now) };
    }

    // Check tomorrow
    const tomorrowKey = dayMap[tomorrow.getDay()];
    const tomorrowCfg = schedule[tomorrowKey];
    if (tomorrowCfg && tomorrowCfg.enabled) {
      return { label: 'Завтра', date: fmt(tomorrow) };
    }

    // Check day after tomorrow
    const dayAfterKey = dayMap[dayAfter.getDay()];
    const dayAfterCfg = schedule[dayAfterKey];
    if (dayAfterCfg && dayAfterCfg.enabled) {
      return { label: dayAfterKey === 'mon' ? 'в Понеділок' : 'Незабаром', date: fmt(dayAfter) };
    }

    // Fallback: find next working day
    for (let i = 2; i < 7; i++) {
      const d = new Date(now.getTime() + i * 86400000);
      const k = dayMap[d.getDay()];
      if (schedule[k] && schedule[k].enabled) return { label: 'Незабаром', date: fmt(d) };
    }

    return { label: 'Завтра', date: fmt(tomorrow) };
  }

  function showCallbackForm(widget) {
    const cfg = widget.config;
    const color = cfg.color || '#29574c';
    const bgColor = cfg.popupBgColor || '#f4f4f4';
    const textColor = cfg.popupTextColor || '#0a0a0a';
    const popupWidth = cfg.popupWidth || 300;
    const popupRadius = cfg.popupRadius || 6;
    const fields = cfg.fields || [{ id: 'phone', type: 'phone', label: 'Телефон', required: true, mappedTo: 'phone' }];

    // ─── Working hours check ───
    const useWH = cfg.useWorkingHours || false;
    const isWorking = useWH ? checkWorkingHours(cfg.workSchedule) : true;
    const scheduleInfo = useWH ? getScheduleInfo(cfg.workSchedule, cfg.defaultTime) : null;

    // ─── Title and button text based on working hours ───
    let title = isWorking ? (cfg.callbackTitle || 'Зателефонувати Вам?') : (cfg.callbackTitleOffHours || 'Зателефонуємо Вам о:');
    if (!isWorking && scheduleInfo && title.includes('{nextWorkDay}')) {
      const dayNames = { mon: 'понеділок', tue: 'вівторок', wed: 'середу', thu: 'четвер', fri: 'п\u2019ятницю', sat: 'суботу', sun: 'неділю' };
      const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const nextDate = new Date(scheduleInfo.date + 'T00:00:00');
      const nextDayKey = dayMap[nextDate.getDay()];
      // Tomorrow = next calendar day
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const isTomorrow = nextDate.toDateString() === tomorrow.toDateString();
      const isToday = nextDate.toDateString() === now.toDateString();
      const nextDayName = isToday ? 'сьогодні' : (isTomorrow ? 'завтра' : (dayNames[nextDayKey] || scheduleInfo.label.toLowerCase()));
      title = title.replace(/\{nextWorkDay\}/g, nextDayName);
    }
    const buttonText = isWorking ? (cfg.callbackButton || 'Передзвоніть мені зараз') : (cfg.callbackButtonOffHours || 'Чекаю на дзвінок');

    // Create modal with proper ARIA
    const overlay = el('div', {
      class: 'wp-widget wp-popup-overlay',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'wp-cb-title',
      style: { zIndex: widget.zIndex || 9999999 },
      onClick: (e) => { if (e.target === overlay) closePopup(overlay); },
      onKeyDown: (e) => {
        if (e.key === 'Escape') { e.preventDefault(); closePopup(overlay); }
      }
    });

    const titleId = 'wp-cb-title';

    // ─── Build form children from configured fields ───
    const formChildren = [];
    fields.forEach((field) => {
      const inputId = 'wp-field-' + field.id;
      formChildren.push(el('label', { class: 'wp-sr-only', for: inputId }, field.label));
      if (field.type === 'select') {
        const opts = (field.options || '').split(',').map(o => o.trim()).filter(Boolean);
        formChildren.push(el('select', {
          id: inputId,
          class: 'wp-form-input',
          'data-field-id': field.id,
          'data-mapped-to': field.mappedTo || field.id,
          'data-field-type': field.type,
          required: field.required || false,
        }, opts.map(o => el('option', { value: o }, o))));
      } else {
        formChildren.push(el('input', {
          id: inputId,
          class: 'wp-form-input',
          type: field.type === 'phone' ? 'tel' : (field.type === 'email' ? 'email' : 'text'),
          placeholder: field.label + (field.required ? ' *' : ''),
          'data-field-id': field.id,
          'data-mapped-to': field.mappedTo || field.id,
          'data-field-type': field.type,
          'data-phone-mask': field.phoneMask || '',
          required: field.required || false,
          'aria-required': field.required ? 'true' : 'false',
        }));
      }
    });

    // ─── Time picker (only if off-hours and working hours enabled) ───
    if (useWH && !isWorking && scheduleInfo) {
      formChildren.push(el('input', {
        id: 'wp-schedule-time',
        class: 'wp-form-input',
        type: 'time',
        value: cfg.defaultTime || '09:30',
        step: '900',
        'data-field-id': 'schedule_time',
        'data-mapped-to': 'schedule_time',
      }));
      formChildren.push(el('div', { style: { margin: '10px 0' } }, ''));
    }

    // ─── Submit button ───
    formChildren.push(el('button', {
      type: 'submit',
      class: 'wp-form-submit',
      style: { background: color },
    }, buttonText));

    const box = el('div', {
      class: 'wp-popup-box',
      role: 'document',
      style: { background: bgColor, width: popupWidth + 'px', maxWidth: '95%', borderRadius: popupRadius + 'px', color: textColor },
    }, [
      el('button', {
        class: 'wp-popup-close',
        'aria-label': 'Закрити',
        onClick: () => closePopup(overlay),
      }, ICONS.close),
      el('h3', { id: titleId, class: 'wp-popup-title', style: { color: textColor } }, title),
      el('form', {
        onSubmit: (e) => { e.preventDefault(); submitCallback(widget, overlay); },
      }, formChildren),
      el('div', { id: 'wp-callback-msg', style: { marginTop: '10px', color: 'green', fontSize: '14px' } }, ''),
    ]);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('visible');
      applyAnimation(box, cfg.animation || 'zoom');

      // ─── Apply IMask to phone fields ───
      fields.forEach((field) => {
        if (field.type === 'phone') {
          const phoneInput = document.getElementById('wp-field-' + field.id);
          const mask = field.phoneMask || '+380';
          if (phoneInput) {
            loadIMask().then(IMask => {
              IMask(phoneInput, { mask: buildMaskPattern(mask) });
            }).catch(e => console.warn('IMask load failed:', e));
          }
        }
      });

      // Focus trap
      const focusable = box.querySelectorAll('button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      first?.focus();
      box.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      });
    });
    track('view', widget.id, 'callback_form');
  }

  async function submitCallback(widget, overlay) {
    const cfg = widget.config;
    const fields = cfg.fields || [{ id: 'phone', type: 'phone', label: 'Телефон', required: true, mappedTo: 'phone' }];
    const msgEl = document.getElementById('wp-callback-msg');
    const successMsg = cfg.successMessage || 'Запит прийнято. Очікуйте дзвінка.';
    const errorMsg = cfg.errorMessage || 'Помилка. Спробуйте ще.';

    // ─── Collect field values ───
    const data = { siteId, widgetId: widget.id, page: location.href, device: DEVICE };
    let hasError = false;

    fields.forEach((field) => {
      const input = document.getElementById('wp-field-' + field.id);
      if (!input) return;
      const val = input.value.trim();
      const key = field.mappedTo || field.id;

      if (field.required && !val) {
        input.style.borderColor = '#e74c3c';
        hasError = true;
      } else if (field.type === 'phone' && val) {
        // Strip non-digits for validation
        const digits = val.replace(/[^0-9]/g, '');
        if (digits.length < 9) { input.style.borderColor = '#e74c3c'; hasError = true; }
        else { data[key] = val; }
      } else {
        data[key] = val;
      }
    });

    // ─── Schedule time (if off-hours) ───
    const timeInput = document.getElementById('wp-schedule-time');
    if (timeInput && timeInput.value) {
      const [hour, minute] = timeInput.value.split(':');
      const scheduleInfo = getScheduleInfo(cfg.workSchedule, cfg.defaultTime);
      if (scheduleInfo) {
        data.schedule = { date: scheduleInfo.date, hour, minute };
      }
    }

    if (hasError) {
      if (msgEl) { msgEl.textContent = 'Заповніть обовʼязкові поля'; msgEl.style.color = '#e74c3c'; }
      return;
    }

    // ─── Send to analytics ───
    fetch(BASE_URL + '/api/analytics/form', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' }, credentials: 'omit' });

    // ─── Send to webhook ───
    if (cfg.webhookUrl) {
      try {
        const resp = await fetch(cfg.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (msgEl) { msgEl.textContent = resp.ok ? successMsg : errorMsg; msgEl.style.color = resp.ok ? 'green' : '#e74c3c'; }
      } catch (err) {
        if (msgEl) { msgEl.textContent = errorMsg; msgEl.style.color = '#e74c3c'; }
      }
    } else {
      if (msgEl) { msgEl.textContent = successMsg; msgEl.style.color = 'green'; }
    }

    // ─── Auto-close ───
    if (cfg.autoClose) {
      const delay = (cfg.autoCloseDelay || 3) * 1000;
      setTimeout(() => closePopup(overlay), delay);
    }
  }

  function renderPopupBanner(widget) {
    const cfg = widget.config;
    const triggers = widget.triggers || {};
    const cookieKey = 'wp_popup_' + widget.id;

    // Frequency check
    if (triggers.frequency === 'once' && getCookie(cookieKey)) return;
    if (triggers.frequency === 'days' && getCookie(cookieKey)) return;

    const show = () => {
      if (getCookie(cookieKey + '_shown')) return;
      setCookie(cookieKey + '_shown', '1', 0.01); // prevent double show in same pageview

      const color = cfg.color || '#1f93ff';
      const overlay = el('div', { class: 'wp-widget wp-popup-overlay', style: { zIndex: widget.zIndex || 9999999 }, onClick: (e) => { if (e.target === overlay) closePopup(overlay, cookieKey, triggers); } });

      const children = [
        el('button', { class: 'wp-popup-close', onClick: () => closePopup(overlay, cookieKey, triggers) }, ICONS.close),
      ];

      if (cfg.image) children.push(el('img', { class: 'wp-banner-img', src: cfg.image, alt: cfg.imageAlt || '' }));
      if (cfg.title) children.push(el('h3', { class: 'wp-popup-title', id: 'wp-banner-title' }, cfg.title));
      if (cfg.text) children.push(el('p', { class: 'wp-popup-text' }, cfg.text));
      if (cfg.buttonText && cfg.buttonUrl) {
        children.push(el('a', {
          href: cfg.buttonUrl,
          target: cfg.buttonTarget || '_self',
          role: 'button',
          style: { display: 'block', textAlign: 'center', background: color, color: '#fff', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '15px' },
          onClick: () => track('click', widget.id, 'banner_button'),
        }, cfg.buttonText));
      }

      const bannerBox = el('div', { class: 'wp-popup-box', role: 'document' }, children);

      overlay.appendChild(bannerBox);
      document.body.appendChild(overlay);
      requestAnimationFrame(() => {
        overlay.classList.add('visible');
        const box = overlay.querySelector('.wp-popup-box');
        applyAnimation(box, cfg.animation || 'zoom');
      });
      track('view', widget.id);
    };

    // Trigger: delay
    if (triggers.delay) setTimeout(show, triggers.delay * 1000);
    // Trigger: scroll
    if (triggers.scrollPercent) {
      const handler = () => {
        const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (pct >= triggers.scrollPercent) { show(); window.removeEventListener('scroll', handler); }
      };
      window.addEventListener('scroll', handler, { passive: true });
    }

    // Exit-intent trigger
    setupExitIntent(widget, show);

    // Idle trigger
    setupIdleTrigger(widget, show);

    // No trigger = show on load
    if (!triggers.delay && !triggers.scrollPercent && !triggers.exitIntent && !triggers.idleTimeout) {
      setTimeout(show, 500);
    }
  }

  function renderPopupCallback(widget) {
    const triggers = widget.triggers || {};

    // If trigger mode is 'button', do nothing here - widget is only called from FLOATING_MENU
    if (triggers.triggerMode === 'button') return;

    const cookieKey = 'wp_cb_' + widget.id;
    if (triggers.frequency === 'once' && getCookie(cookieKey)) return;

    const show = () => {
      if (getCookie(cookieKey + '_shown')) return;
      setCookie(cookieKey + '_shown', '1', 0.01);
      showCallbackForm(widget);
      setCookie(cookieKey, '1', triggers.frequencyDays || 1);
    };

    if (triggers.delay) setTimeout(show, triggers.delay * 1000);
    if (triggers.scrollPercent) {
      const handler = () => {
        const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (pct >= triggers.scrollPercent) { show(); window.removeEventListener('scroll', handler); }
      };
      window.addEventListener('scroll', handler, { passive: true });
    }

    setupExitIntent(widget, show);
    setupIdleTrigger(widget, show);

    if (!triggers.delay && !triggers.scrollPercent && !triggers.exitIntent && !triggers.idleTimeout) {
      show();
    }
  }

  function renderStickyBar(widget) {
    const cfg = widget.config;
    const pos = widget.position || {};
    const triggers = widget.triggers || {};
    const placement = pos.placement || 'bottom';
    const color = cfg.color || '#1f93ff';
    const cookieKey = 'wp_bar_' + widget.id;
    if (getCookie(cookieKey)) return;

    const barStyle = applyDesign({ background: cfg.bgColor || '#fff', color: cfg.textColor || '#333' }, cfg);
    const sideOffset = cfg.sideOffset ?? 0;
    const bottomOffset = cfg.bottomOffset ?? 0;
    const fontScale = cfg.fontScale ?? 100;
    const stickyStyle = {
      ...barStyle,
      zIndex: widget.zIndex || 999990,
    };
    if (placement === 'bottom') {
      stickyStyle.bottom = bottomOffset + 'px';
      stickyStyle.left = sideOffset + 'px';
      stickyStyle.right = sideOffset + 'px';
      stickyStyle.width = 'auto';
    } else {
      stickyStyle.top = bottomOffset + 'px';
      stickyStyle.left = sideOffset + 'px';
      stickyStyle.right = sideOffset + 'px';
      stickyStyle.width = 'auto';
    }
    if (fontScale !== 100) {
      stickyStyle.fontSize = `calc(14px * ${fontScale / 100})`;
    }
      const bar = el('div', {
        class: 'wp-widget wp-sticky-bar ' + placement,
        style: stickyStyle,
      }, [
      el('span', {}, cfg.text || ''),
      cfg.buttonText ? el('button', {
        class: 'wp-sticky-btn',
        style: { background: color, color: '#fff' },
        onClick: () => { track('click', widget.id, 'sticky_bar'); if (cfg.buttonUrl) window.open(cfg.buttonUrl, cfg.buttonTarget || '_self'); },
      }, cfg.buttonText) : null,
      el('button', {
        class: 'wp-sticky-bar-close',
        style: { color: cfg.textColor || '#666' },
        onClick: () => { bar.remove(); setCookie(cookieKey, '1', 1); },
      }, ICONS.close),
    ]);

    const show = () => {
      document.body.appendChild(bar);
      applyAnimation(bar, cfg.animation || 'slide-down');
      track('view', widget.id);
    };

    if (triggers.delay) setTimeout(show, triggers.delay * 1000);
    else show();
  }

  function renderSideTab(widget) {
    const cfg = widget.config;
    const pos = widget.position || {};
    const triggers = widget.triggers || {};
    const color = cfg.color || '#1f93ff';

    const tabStyle = applyDesign({
        background: color,
        color: '#fff',
        top: (pos.offsetY || 50) + '%',
        [pos.side || 'right']: '0',
      }, cfg);
      const tab = el('button', {
        class: 'wp-widget wp-side-tab',
        style: { ...tabStyle, zIndex: widget.zIndex || 999995 },
        onClick: () => {
          track('click', widget.id, 'side_tab');
          if (cfg.action === 'callback') showCallbackForm(widget);
          else if (cfg.url) window.open(cfg.url, '_blank');
        },
      }, cfg.text || 'Зв\'язатися');

    const show = () => {
      document.body.appendChild(tab);
      applyAnimation(tab, cfg.animation || 'slide-left');
      track('view', widget.id);
    };

    if (triggers.delay) setTimeout(show, triggers.delay * 1000);
    else show();
  }

  function closePopup(overlay, cookieKey, triggers) {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 300);
    if (cookieKey) {
      const days = triggers?.frequencyDays || 1;
      setCookie(cookieKey, '1', days);
    }
  }

  function renderCustomIframe(widget) {
    const cfg = widget.config || {};
    const pos = widget.position || {};
    const triggers = widget.triggers || {};
    const corner = pos.corner || 'bottom-right';
    const posStyle = {};
    if (corner.includes('bottom')) posStyle.bottom = (pos.offsetY || 20) + 'px';
    if (corner.includes('top')) posStyle.top = (pos.offsetY || 20) + 'px';
    if (corner.includes('right')) posStyle.right = (pos.offsetX || 20) + 'px';
    if (corner.includes('left')) posStyle.left = (pos.offsetX || 20) + 'px';

    const sandboxMap = {
      strict: '',
      safe: 'allow-scripts allow-forms',
      relaxed: 'allow-scripts allow-forms allow-popups allow-same-origin',
    };

    const wrapper = el('div', {
      class: 'wp-widget wp-custom-iframe',
      style: {
        position: 'fixed',
        zIndex: widget.zIndex || 999999,
        ...posStyle,
        width: (cfg.width || 360) + 'px',
        height: (cfg.height || 520) + 'px',
        background: cfg.backgroundColor || '#ffffff',
        borderRadius: (cfg.borderRadius || 12) + 'px',
        overflow: 'hidden',
        boxShadow: '0 8px 28px rgba(0,0,0,.22)',
      },
    });

    const attrs = {
      src: cfg.src,
      title: cfg.title || 'Custom iframe',
      loading: 'lazy',
      referrerpolicy: 'strict-origin-when-cross-origin',
      style: {
        width: '100%',
        height: '100%',
        border: '0',
        background: cfg.backgroundColor || '#ffffff',
      },
    };
    const sandboxValue = sandboxMap[cfg.sandboxMode || 'safe'];
    if (sandboxValue !== undefined) attrs.sandbox = sandboxValue;
    if (cfg.allowFullscreen) attrs.allowfullscreen = 'true';

    const frame = el('iframe', attrs);
    wrapper.appendChild(frame);

    const show = () => {
      document.body.appendChild(wrapper);
      track('view', widget.id);
    };

    if (triggers.delay) setTimeout(show, triggers.delay * 1000);
    else show();
  }

  // ─── A/B Testing utilities ───
  function getABVariant(experiment) {
    const cookieKey = 'wp_ab_' + experiment.id;
    const saved = getCookie(cookieKey);
    if (saved) return saved;

    // Hash visitor ID for consistent assignment
    const visitorId = getVisitorId();
    const hash = hashCode(visitorId + experiment.id);
    const variants = experiment.variants || [];
    if (variants.length === 0) return null;

    // Weighted random selection
    let totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);
    let random = (hash & 0x7FFFFFFF) / 0x7FFFFFFF * totalWeight;
    
    for (const variant of variants) {
      random -= variant.weight || 1;
      if (random <= 0) {
        // Save for 30 days
        setCookie(cookieKey, variant.widgetId, 30);
        return variant.widgetId;
      }
    }
    return variants[0]?.widgetId;
  }

  function getVisitorId() {
    const key = 'wp_visitor';
    let id = getCookie(key);
    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      setCookie(key, id, 365);
    }
    return id;
  }

  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  // ─── FLOATING_MENU V2 — supports legacy channels[] and new buttons[] format ───
  function renderFloatingMenuV2(widget) {
    const cfg = widget.config || {};
    const pos = widget.position || {};
    const corner = pos.corner || 'bottom-right';
    
    // Detect format: new buttons[] or legacy channels[]
    const isNewFormat = cfg.buttons && Array.isArray(cfg.buttons);
    const buttons = isNewFormat ? cfg.buttons : [{ 
      id: 'legacy_main', 
      mode: 'menu', 
      channels: cfg.channels || [],
      style: { bgColor: cfg.color, iconColor: '#fff', size: 'lg' }
    }];
    
    // Button shape configuration
    const shape = cfg.buttonShape || { type: 'circle' };
    // Normalize layout: 'double' maps to 'horizontal' for backward compatibility
    const layout = cfg.layout === 'double' ? 'horizontal' : (cfg.layout || 'single');
    
    // Position styles
    const posStyle = {};
    if (corner.includes('bottom')) posStyle.bottom = (pos.offsetY || 20) + 'px';
    if (corner.includes('top')) posStyle.top = (pos.offsetY || 20) + 'px';
    if (corner.includes('right')) posStyle.right = (pos.offsetX || 20) + 'px';
    if (corner.includes('left')) posStyle.left = (pos.offsetX || 20) + 'px';

    function applyShapeStyles(base, size, shapeCfg) {
      const type = shapeCfg?.type || 'circle';
      const radius = shapeCfg?.borderRadius;
      base.width = size + 'px';
      base.height = size + 'px';
      switch (type) {
        case 'circle':
          base.borderRadius = '50%';
          break;
        case 'square':
          base.borderRadius = radius ? radius + 'px' : '0';
          break;
        case 'rounded':
          base.borderRadius = radius ? radius + 'px' : '12px';
          break;
        case 'oval':
          base.width = Math.round(size * 1.4) + 'px';
          base.borderRadius = '9999px';
          break;
        default:
          base.borderRadius = '50%';
          break;
      }
      return base;
    }

    // Helper: get button styles based on shape
    function getButtonStyles(btnStyle, isMain) {
      const base = {
        position: 'relative', // Changed from 'fixed' — buttons flow in container
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,.25)',
        transition: 'transform .2s, box-shadow .2s',
      };
      
      const presetSize = btnStyle?.size === 'sm' ? 48 : btnStyle?.size === 'lg' ? 64 : 56;
      const size = isMain ? (btnStyle?.sizePx || presetSize) : 46;
      
      base._size = size;
      base.background = btnStyle?.bgTransparent ? 'transparent' : (btnStyle?.bgColor || cfg.color || '#1f93ff');
      if (btnStyle?.bgTransparent) base.boxShadow = 'none';
      
      if (shape.borderWidth) {
        base.border = shape.borderWidth + 'px solid ' + (shape.borderColor || '#fff');
      }
      
      return applyShapeStyles(base, size, shape);
    }

    // Helper: render icon
    function renderButtonIcon(btn, ch, size) {
      // New format: iconUrl from resolved config
      if (ch?.iconUrl) {
        return el('img', { src: ch.iconUrl, style: { width: size + 'px', height: size + 'px', objectFit: 'contain' } });
      }
      // Legacy: iconClass (FontAwesome)
      if (ch?.iconClass) {
        return el('i', { class: ch.iconClass, style: { fontSize: size + 'px', color: btn.style?.iconColor || '#fff' } });
      }
      // Default: inline SVG by type
      const iconSvg = ICONS[ch?.type] || ICONS.custom;
      return el('span', { style: { color: btn.style?.iconColor || '#fff' } }, iconSvg);
    }

    // State for menu buttons
    const menuStates = {};

    // Create buttons based on layout
    const container = el('div', {
      class: 'wp-widget wp-floating-container',
      style: {
        position: 'fixed',
        zIndex: widget.zIndex || 999999,
        ...posStyle,
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 
                       layout === 'horizontal' ? 'row' : 'column',
        gap: (cfg.buttonGap ?? 10) + 'px',
        alignItems: corner.includes('right') ? 'flex-end' : 'flex-start',
      }
    });

    buttons.forEach((btn, btnIndex) => {
      const btnStyle = btn.style || {};
      const isMenuMode = btn.mode === 'menu';
      const isToggleMode = btn.mode === 'toggle';
      const isDirectMode = btn.mode === 'direct' || (!isMenuMode && !isToggleMode);
      
      // Create wrapper for each button (for menu positioning)
      const wrapper = el('div', {
        class: 'wp-btn-wrapper',
        style: {
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: corner.includes('right') ? 'flex-end' : 'flex-start',
        }
      });
      
      const buttonEl = el('button', {
        class: 'wp-floating-btn-v2',
        'aria-label': btn.channels?.[0]?.label || 'Open menu',
        style: getButtonStyles(btnStyle, true),
      });
      
      // Click handler
      buttonEl.addEventListener('click', () => {
        if (isDirectMode) {
          if (btn.channels?.[0]) handleChannelClick(btn.channels[0], widget);
        } else if (isMenuMode || isToggleMode) {
          // If only 1 channel, behave like direct mode
          if (btn.channels?.length === 1) {
            handleChannelClick(btn.channels[0], widget);
            return;
          }
          
          const menuId = 'wp-menu-' + widget.id + '-' + btnIndex;
          const menuEl = document.getElementById(menuId);
          const isOpen = menuStates[btnIndex];
          
          if (menuEl) {
            menuEl.classList.toggle('hidden', isOpen);
            menuStates[btnIndex] = !isOpen;
            
            if (!isOpen) {
              // Open the menu ABOVE the top-most button of the whole stack so it never
              // overlaps the other buttons (they stay visible below).
              const wrapperEl = menuEl.parentElement;
              const containerEl = wrapperEl ? wrapperEl.parentElement : null;
              if (containerEl && wrapperEl && corner.includes('bottom')) {
                const cRect = containerEl.getBoundingClientRect();
                const wRect = wrapperEl.getBoundingClientRect();
                const lift = (wRect.bottom - cRect.top) + 10;
                menuEl.style.bottom = lift + 'px';
                menuEl.style.marginBottom = '0';
              }
              track('open', widget.id);
              applyAnimation(menuEl, cfg.menuAnimation || 'fade');
            }
          }
        }
      });
      
      // Set initial icon — size scales with button size and per-button iconScale
 const _scale = (btn.style?.iconScale || 55) / 100;
 const _btnSize = btn.style?.sizePx || (btn.style?.size === 'sm' ? 48 : btn.style?.size === 'lg' ? 64 : 56);
 const _iconSize = Math.round(_btnSize * _scale);
 const initialIcon = btn.channels?.[0] 
 ? renderButtonIcon(btn, btn.channels[0], _iconSize)
 : ICONS.menu;
      
      // Icon wrapper — animations & carousel target this element, not the whole button.
      // Wrapper fills the button (for centering); the icon itself is sized to _iconSize (iconScale%).
      const iconWrap = document.createElement('span');
      iconWrap.className = 'wp-btn-icon';
      const sizeIcon = () => {
        const el = iconWrap.querySelector('img, svg');
        if (el) { el.style.width = _iconSize + 'px'; el.style.height = _iconSize + 'px'; }
      };
      const setIcon = (icon) => {
        iconWrap.innerHTML = '';
        if (typeof icon === 'string') iconWrap.innerHTML = icon;
        else iconWrap.appendChild(icon);
        sizeIcon();
      };
      setIcon(initialIcon);
      buttonEl.appendChild(iconWrap);

      // Carousel: slide through this button's channel icons (icon only, button stays still)
      if (btn.style?.carousel && (btn.channels?.length || 0) >= 2) {
        const speed = (btn.style.carouselSpeed || 3) * 1000;
        const delay = (btn.style.carouselDelay || 0) * 1000;
        let ci = 0;
        const cycle = () => {
          ci = (ci + 1) % btn.channels.length;
          const nextIcon = renderButtonIcon(btn, btn.channels[ci], _iconSize);
          iconWrap.style.transition = 'opacity .25s, transform .25s';
          iconWrap.style.opacity = '0';
          iconWrap.style.transform = 'translateX(-40%)';
          setTimeout(() => {
            setIcon(nextIcon);
            iconWrap.style.transition = 'none';
            iconWrap.style.transform = 'translateX(40%)';
            requestAnimationFrame(() => {
              iconWrap.style.transition = 'opacity .25s, transform .25s';
              iconWrap.style.opacity = '1';
              iconWrap.style.transform = 'translateX(0)';
            });
          }, 250);
        };
        window.__WIDGET_INTERVALS__ = window.__WIDGET_INTERVALS__ || [];
        window.__WIDGET_INTERVALS__.push(setInterval(cycle, speed));
      }

      // Attention: general (cfg) animates the WHOLE button; per-button animates the ICON.
      // attentionTarget: 'button' on per-button forces button-level animation instead.
      if (cfg.attentionAnimation) {
        buttonEl.classList.add('wp-attention-' + cfg.attentionAnimation);
      }
      if (btnStyle.attentionAnimation) {
        const toButton = btnStyle.attentionTarget === 'button';
        const target = toButton ? buttonEl : iconWrap;
        target.classList.add((toButton ? 'wp-attention-' : 'wp-icon-') + btnStyle.attentionAnimation);
        // Pause between cycles lives inside the keyframes (motion in first ~50%, still after),
        // so it repeats every cycle. animation-delay would pause only once before the first run.
        const motion = btnStyle.attentionDuration || 1;
        const pause = btnStyle.attentionDelay || 0;
        target.style.animationDuration = (motion + pause) + 's';
      }
      
      wrapper.appendChild(buttonEl);
      
      // Create menu for menu/toggle modes with 2+ channels
      // Menu is now inside wrapper for proper positioning
      if ((isMenuMode || isToggleMode) && btn.channels?.length >= 2) {
        const menuId = 'wp-menu-' + widget.id + '-' + btnIndex;
        const menuEl = el('div', {
          id: menuId,
          class: 'wp-widget wp-floating-menu hidden',
          style: {
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            gap: (cfg.channelGap ?? 10) + 'px',
            transition: 'opacity .25s, transform .25s',
            // Position relative to wrapper, not viewport
            ...(corner.includes('bottom') ? { bottom: '100%', marginBottom: '10px' } : { top: '100%', marginTop: '10px' }),
            ...(corner.includes('right') ? { right: '0' } : { left: '0' }),
          }
        });
        
        btn.channels.forEach((ch, chIndex) => {
          const _chSize = ch.sizePx || 46;
          const _chScale = (ch.iconScale || 48) / 100;
          const _chIconSize = Math.round(_chSize * _chScale);
          const _chBg = ch.bgTransparent ? 'transparent' : (ch.bgColor || ch.color || CHANNEL_COLORS[ch.type] || '#333');
          const channelStyle = applyShapeStyles({
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: _chBg,
            boxShadow: ch.bgTransparent ? 'none' : '0 2px 8px rgba(0,0,0,.2)',
            overflow: 'hidden',
            border: shape.borderWidth ? shape.borderWidth + 'px solid ' + (shape.borderColor || '#fff') : 'none',
          }, _chSize, shape);
          const channelBtn = el('button', {
            class: 'wp-channel-btn',
            style: channelStyle,
          }, [
            renderButtonIcon(btn, ch, _chIconSize),
            el('span', { class: 'wp-tooltip' }, ch.label || ch.type),
          ]);
          
          channelBtn.addEventListener('click', () => handleChannelClick(ch, widget));
          menuEl.appendChild(channelBtn);
        });
        
        wrapper.appendChild(menuEl);
        menuStates[btnIndex] = false;
      }
      
      container.appendChild(wrapper);
    });

    const _ft = widget.triggers || {};
    const showContainer = () => {
      document.body.appendChild(container);
      track('view', widget.id);
    };
    if (_ft.delay) setTimeout(showContainer, _ft.delay * 1000);
    else showContainer();
  }

  // ─── Render dispatcher ───
  function renderWidget(widget) {
    if (!matchRules(widget.rules)) return;

    // Check A/B experiment
    if (widget.experimentId) {
      const experiment = siteConfig.experiments?.find(e => e.id === widget.experimentId);
      if (experiment && experiment.status === 'RUNNING') {
        const variantId = getABVariant(experiment);
        if (variantId !== widget.id) return; // Not assigned to this variant
        
        // Track experiment view
        track('view', widget.id, null, { experimentId: experiment.id, variantId });
      }
    }

    // Dispatch to appropriate renderer
    // FLOATING_MENU v2: supports both legacy channels[] and new buttons[] format
    if (widget.type === 'FLOATING_MENU') {
      const cfg = widget.config || {};
      const hasNewFormat = cfg.buttons && Array.isArray(cfg.buttons);
      const hasLegacyFormat = cfg.channels && Array.isArray(cfg.channels);
      
      // Use v2 if new format detected OR if explicitly requested
      if (hasNewFormat || (hasLegacyFormat && !cfg.useLegacyRenderer)) {
        renderFloatingMenuV2(widget);
      } else {
        renderFloatingMenu(widget); // Legacy renderer
      }
      return;
    }

    switch (widget.type) {
      case 'POPUP_BANNER': renderPopupBanner(widget); break;
      case 'POPUP_CALLBACK': renderPopupCallback(widget); break;
      case 'STICKY_BAR': renderStickyBar(widget); break;
      case 'SIDE_TAB': renderSideTab(widget); break;
      case 'CUSTOM_IFRAME': renderCustomIframe(widget); break;
    }
  }

  // ─── Preview mode: listen for postMessage config updates ───
  const urlParams = new URL(window.location.href).searchParams;
  const isPreview = urlParams.get('preview') === '1' || urlParams.get('__widget_preview__') === '1';
  
  if (isPreview) {
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'UPDATE_WIDGET_CONFIG') {
        // Validate origin for security
        const allowedOrigins = [window.location.origin];
        if (allowedOrigins.includes(e.origin)) {
          window.__WIDGET_PREVIEW__ = e.data.config;
          if (window.__WIDGET_REINIT__) window.__WIDGET_REINIT__();
        }
      }
    });
  }

  // ─── Preload Chatwoot SDK if any widget has a chatwoot channel ───
  function preloadChatwoot(widgets) {
    for (const w of widgets) {
      if (w.config?.buttons) {
        for (const btn of w.config.buttons) {
          for (const ch of (btn.channels || [])) {
            if (ch.type === 'chatwoot' && ch.value) {
              try {
                const cwUrl = new URL(ch.value);
                const token = cwUrl.searchParams.get('website_token');
                const base = cwUrl.origin + '/';
                if (!token) return;
                // Hide Chatwoot default launcher
                const hideStyle = document.createElement('style');
                hideStyle.textContent = '#woot-launcher, #woot-launcher * { display: none !important; } #woot-widget-bubble, #woot-widget-bubble * { z-index: 2147483000 !important; } .woot-widget-wrap { z-index: 2147483000 !important; }';
                document.head.appendChild(hideStyle);
                // Set settings BEFORE loading SDK (like old widget)
                window.chatwootSettings = { baseUrl: base, websiteToken: token, hideMessageBubble: true };
                // Load SDK and run immediately on load
                const sdkScript = document.createElement('script');
                sdkScript.src = base + 'packs/js/sdk.js';
                sdkScript.async = true;
                sdkScript.defer = true;
                sdkScript.onload = () => {
                  console.log('[Widget] Chatwoot SDK loaded, calling run()');
                  if (window.chatwootSDK) {
                    console.log('[Widget] chatwootSDK found, settings:', JSON.stringify(window.chatwootSettings));
                    window.chatwootSDK.run(window.chatwootSettings);
                    console.log('[Widget] chatwootSDK.run() called');
                  } else {
                    console.warn('[Widget] chatwootSDK not found after SDK load');
                  }
                };
                document.body.appendChild(sdkScript);
                return; // Only load once
              } catch (e) {}
            }
          }
        }
      }
    }
  }

  // ─── Init ───
  async function init() {
    try {
      // Check for preview mode (data injected via window.__WIDGET_PREVIEW__)
      if (window.__WIDGET_PREVIEW__) {
        siteConfig = window.__WIDGET_PREVIEW__;
        siteId = siteConfig.siteId;
        injectStyles();
        preloadChatwoot(siteConfig.widgets || []);
        // In preview, ignore display rules and triggers so the widget always shows
        (siteConfig.widgets || []).forEach((wgt) => {
          wgt.rules = null;
          wgt.triggers = null;
          wgt.enabled = true;
          renderWidget(wgt);
        });
        return;
      }
      
      const res = await fetch(BASE_URL + '/api/widget/' + SITE_SLUG, { credentials: 'omit' });
      if (!res.ok) return console.warn('[Widget] Config fetch failed:', res.status);
      siteConfig = await res.json();
      siteId = siteConfig.siteId;

      injectStyles();
      preloadChatwoot(siteConfig.widgets);
      siteConfig.widgets.forEach(renderWidget);
    } catch (err) {
      console.warn('[Widget] Init failed:', err);
    }
  }

  // Expose reinit function for preview updates
  window.__WIDGET_REINIT__ = function() {
    // Clear existing intervals
    if (window.__WIDGET_INTERVALS__) {
      window.__WIDGET_INTERVALS__.forEach(clearInterval);
      window.__WIDGET_INTERVALS__ = [];
    }
    // Clear idle trigger listeners
    if (window.__WIDGET_IDLE_CLEANUPS__) {
      window.__WIDGET_IDLE_CLEANUPS__.forEach(fn => fn());
      window.__WIDGET_IDLE_CLEANUPS__ = [];
    }
    // Clear existing widgets (use .wp-widget class which all renderers add)
    document.querySelectorAll('.wp-widget').forEach(el => el.remove());
    // Re-init with current config
    init();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
