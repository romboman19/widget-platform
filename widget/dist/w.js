(function() {
  'use strict';

  // ─── Config ───
  const SCRIPT = document.currentScript;
  const BASE_URL = SCRIPT ? new URL(SCRIPT.src).origin : '';
  const SITE_SLUG = new URL(SCRIPT.src).searchParams.get('site');
  if (!SITE_SLUG) return console.warn('[Widget] Missing ?site= parameter');

  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
  const DEVICE = isMobile ? 'mobile' : 'desktop';

  // ─── Icons (inline SVG) ───
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
      if (typeof children === 'string') e.innerHTML = children;
      else if (Array.isArray(children)) children.forEach(c => c && e.appendChild(c));
      else e.appendChild(children);
    }
    return e;
  }

  function track(event, widgetId, channel, meta) {
    const data = { siteId, widgetId, event, channel, page: location.href, device: DEVICE, meta };
    navigator.sendBeacon?.(BASE_URL + '/api/analytics/track', new Blob([JSON.stringify(data)], { type: 'application/json' }))
      || fetch(BASE_URL + '/api/analytics/track', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' }, keepalive: true });
  }

  function matchRules(rules) {
    if (!rules) return true;
    // Device filter
    if (rules.devices && !rules.devices.includes(DEVICE)) return false;
    // URL filter
    if (rules.urlRules?.length) {
      const url = location.href;
      const path = location.pathname;
      return rules.urlRules.some(r => {
        if (r.type === 'contains') return url.includes(r.value);
        if (r.type === 'exact') return path === r.value;
        if (r.type === 'regex') return new RegExp(r.value).test(url);
        return true;
      });
    }
    return true;
  }

  function getCookie(name) {
    return document.cookie.split(';').find(c => c.trim().startsWith(name + '='))?.split('=')?.[1];
  }

  function setCookie(name, val, days) {
    const d = new Date(); d.setDate(d.getDate() + days);
    document.cookie = `${name}=${val};expires=${d.toUTCString()};path=/;SameSite=Lax`;
  }

  // ─── Inject global styles ───
  function injectStyles() {
    const css = `
      .wp-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .wp-floating-btn { position: fixed; z-index: 999999; width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.25); display: flex; align-items: center; justify-content: center; transition: transform .2s, box-shadow .2s; }
      .wp-floating-btn:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(0,0,0,.3); }
      .wp-floating-btn svg { width: 26px; height: 26px; color: #fff; }
      .wp-floating-menu { position: fixed; z-index: 999998; display: flex; flex-direction: column; gap: 10px; transition: opacity .25s, transform .25s; }
      .wp-floating-menu.hidden { opacity: 0; transform: translateY(10px); pointer-events: none; }
      .wp-channel-btn { width: 46px; height: 46px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,.2); transition: transform .15s; position: relative; }
      .wp-channel-btn:hover { transform: scale(1.15); }
      .wp-channel-btn svg { width: 22px; height: 22px; color: #fff; }
      .wp-channel-btn .wp-tooltip { position: absolute; right: 56px; top: 50%; transform: translateY(-50%); background: #333; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 13px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .15s; }
      .wp-channel-btn:hover .wp-tooltip { opacity: 1; }
      .wp-popup-overlay { position: fixed; z-index: 9999999; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .3s; }
      .wp-popup-overlay.visible { opacity: 1; }
      .wp-popup-box { background: #fff; border-radius: 12px; max-width: 420px; width: 90%; padding: 28px; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,.3); transform: scale(.9); transition: transform .3s; }
      .wp-popup-overlay.visible .wp-popup-box { transform: scale(1); }
      .wp-popup-close { position: absolute; top: 10px; right: 10px; background: none; border: none; cursor: pointer; padding: 4px; }
      .wp-popup-close svg { width: 20px; height: 20px; color: #666; }
      .wp-popup-title { margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #1a1a1a; }
      .wp-popup-text { margin: 0 0 20px; font-size: 14px; color: #666; line-height: 1.5; }
      .wp-form-input { width: 100%; padding: 12px 14px; border: 1.5px solid #ddd; border-radius: 8px; font-size: 15px; margin-bottom: 12px; outline: none; transition: border-color .2s; }
      .wp-form-input:focus { border-color: #1f93ff; }
      .wp-form-submit { width: 100%; padding: 13px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; color: #fff; cursor: pointer; transition: opacity .2s; }
      .wp-form-submit:hover { opacity: .9; }
      .wp-form-success { text-align: center; padding: 20px; font-size: 16px; color: #2ecc71; }
      .wp-sticky-bar { position: fixed; z-index: 999990; left: 0; width: 100%; padding: 10px 20px; display: flex; align-items: center; justify-content: center; gap: 14px; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,.15); transition: transform .3s; }
      .wp-sticky-bar.top { top: 0; }
      .wp-sticky-bar.bottom { bottom: 0; }
      .wp-sticky-bar-close { background: none; border: none; cursor: pointer; margin-left: 8px; }
      .wp-sticky-bar-close svg { width: 16px; height: 16px; }
      .wp-sticky-btn { padding: 6px 16px; border-radius: 6px; border: none; font-size: 13px; font-weight: 600; cursor: pointer; }
      .wp-side-tab { position: fixed; z-index: 999995; writing-mode: vertical-rl; text-orientation: mixed; padding: 14px 8px; border-radius: 8px 0 0 8px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: -2px 0 8px rgba(0,0,0,.15); border: none; transition: transform .2s; }
      .wp-side-tab:hover { transform: translateX(-3px); }
      .wp-banner-img { width: 100%; border-radius: 8px; margin-bottom: 16px; }
      @media (max-width: 480px) {
        .wp-channel-btn .wp-tooltip { display: none; }
        .wp-popup-box { width: 95%; padding: 20px; }
      }
    `;
    const style = el('style', {}, css);
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

    // Channel buttons
    const menuEl = el('div', { class: 'wp-widget wp-floating-menu hidden', style: { ...posStyle, [corner.includes('bottom') ? 'bottom' : 'top']: (pos.offsetY || 20) + 66 + 'px' } });

    channels.forEach((ch, i) => {
      const color = ch.color || CHANNEL_COLORS[ch.type] || '#333';
      const btn = el('div', {
        class: 'wp-channel-btn',
        style: { background: color, transitionDelay: (i * 0.04) + 's' },
        onClick: () => handleChannelClick(ch, widget),
      }, [
        el('span', {}, ICONS[ch.type] || ICONS.custom),
        el('span', { class: 'wp-tooltip' }, ch.label || ch.type),
      ]);
      menuEl.appendChild(btn);
    });

    // Main button
    const mainBtn = el('button', {
      class: 'wp-widget wp-floating-btn',
      style: { ...posStyle, background: mainColor },
      onClick: () => {
        floatingOpen = !floatingOpen;
        menuEl.classList.toggle('hidden', !floatingOpen);
        mainBtn.innerHTML = floatingOpen ? ICONS.close : (cfg.icon ? ICONS[cfg.icon] : ICONS.menu);
        if (floatingOpen) track('open', widget.id);
      },
    }, cfg.icon ? ICONS[cfg.icon] : ICONS.menu);

    // Pulse animation for greeting
    if (cfg.greeting && !getCookie('wp_greeted_' + widget.id)) {
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

    switch (channel.type) {
      case 'phone': window.open('tel:' + channel.value, '_self'); break;
      case 'telegram': window.open('https://t.me/' + channel.value, '_blank'); break;
      case 'viber': window.open('viber://chat?number=' + channel.value, '_blank'); break;
      case 'whatsapp': window.open('https://wa.me/' + channel.value.replace(/[^0-9]/g, ''), '_blank'); break;
      case 'email': window.open('mailto:' + channel.value, '_self'); break;
      case 'instagram': window.open('https://instagram.com/' + channel.value, '_blank'); break;
      case 'facebook': window.open(channel.value, '_blank'); break;
      case 'tiktok': window.open('https://tiktok.com/@' + channel.value, '_blank'); break;
      case 'chatwoot':
        // Toggle Chatwoot widget if available
        if (window.$chatwoot) window.$chatwoot.toggle('open');
        else if (channel.value) window.open(channel.value, '_blank');
        break;
      case 'callback': showCallbackForm(widget); break;
      case 'custom': if (channel.value) window.open(channel.value, '_blank'); break;
    }
  }

  function showCallbackForm(widget) {
    const cfg = widget.config;
    const color = cfg.color || '#1f93ff';

    const overlay = el('div', { class: 'wp-widget wp-popup-overlay', onClick: (e) => { if (e.target === overlay) closePopup(overlay); } });

    const box = el('div', { class: 'wp-popup-box' }, [
      el('button', { class: 'wp-popup-close', onClick: () => closePopup(overlay) }, ICONS.close),
      el('h3', { class: 'wp-popup-title' }, cfg.callbackTitle || 'Замовити дзвінок'),
      el('p', { class: 'wp-popup-text' }, cfg.callbackText || 'Залиште номер і ми зателефонуємо вам'),
      el('input', { class: 'wp-form-input', type: 'text', placeholder: "Ваше ім'я", id: 'wp-cb-name' }),
      el('input', { class: 'wp-form-input', type: 'tel', placeholder: 'Телефон', id: 'wp-cb-phone' }),
      el('button', {
        class: 'wp-form-submit',
        style: { background: color },
        onClick: () => submitCallback(widget, overlay),
      }, cfg.callbackButton || 'Зателефонуйте мені'),
    ]);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    track('view', widget.id, 'callback_form');
  }

  async function submitCallback(widget, overlay) {
    const name = document.getElementById('wp-cb-name')?.value;
    const phone = document.getElementById('wp-cb-phone')?.value;
    if (!phone) { document.getElementById('wp-cb-phone').style.borderColor = '#e74c3c'; return; }

    const data = { siteId, widgetId: widget.id, name, phone, page: location.href, device: DEVICE };
    fetch(BASE_URL + '/api/analytics/form', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });

    const box = overlay.querySelector('.wp-popup-box');
    box.innerHTML = '<div class="wp-form-success">✓ Дякуємо! Ми зателефонуємо вам найближчим часом.</div>';
    setTimeout(() => closePopup(overlay), 3000);
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
      const overlay = el('div', { class: 'wp-widget wp-popup-overlay', onClick: (e) => { if (e.target === overlay) closePopup(overlay, cookieKey, triggers); } });

      const children = [
        el('button', { class: 'wp-popup-close', onClick: () => closePopup(overlay, cookieKey, triggers) }, ICONS.close),
      ];

      if (cfg.image) children.push(el('img', { class: 'wp-banner-img', src: cfg.image, alt: '' }));
      if (cfg.title) children.push(el('h3', { class: 'wp-popup-title' }, cfg.title));
      if (cfg.text) children.push(el('p', { class: 'wp-popup-text' }, cfg.text));
      if (cfg.buttonText && cfg.buttonUrl) {
        children.push(el('a', {
          href: cfg.buttonUrl,
          target: cfg.buttonTarget || '_self',
          style: { display: 'block', textAlign: 'center', background: color, color: '#fff', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '15px' },
          onClick: () => track('click', widget.id, 'banner_button'),
        }, cfg.buttonText));
      }

      overlay.appendChild(el('div', { class: 'wp-popup-box' }, children));
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('visible'));
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
    // No trigger = show on load
    if (!triggers.delay && !triggers.scrollPercent) setTimeout(show, 500);
  }

  function renderPopupCallback(widget) {
    const triggers = widget.triggers || {};
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
  }

  function renderStickyBar(widget) {
    const cfg = widget.config;
    const pos = widget.position || {};
    const placement = pos.placement || 'bottom';
    const color = cfg.color || '#1f93ff';
    const cookieKey = 'wp_bar_' + widget.id;
    if (getCookie(cookieKey)) return;

    const bar = el('div', {
      class: 'wp-widget wp-sticky-bar ' + placement,
      style: { background: cfg.bgColor || '#fff', color: cfg.textColor || '#333' },
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

    document.body.appendChild(bar);
    track('view', widget.id);
  }

  function renderSideTab(widget) {
    const cfg = widget.config;
    const pos = widget.position || {};
    const color = cfg.color || '#1f93ff';

    const tab = el('button', {
      class: 'wp-widget wp-side-tab',
      style: {
        background: color,
        color: '#fff',
        top: (pos.offsetY || 50) + '%',
        [pos.side || 'right']: '0',
      },
      onClick: () => {
        track('click', widget.id, 'side_tab');
        if (cfg.action === 'callback') showCallbackForm(widget);
        else if (cfg.url) window.open(cfg.url, '_blank');
      },
    }, cfg.text || 'Зв\'язатися');

    document.body.appendChild(tab);
    track('view', widget.id);
  }

  function closePopup(overlay, cookieKey, triggers) {
    overlay.classList.remove('visible');
    setTimeout(() => overlay.remove(), 300);
    if (cookieKey) {
      const days = triggers?.frequencyDays || 1;
      setCookie(cookieKey, '1', days);
    }
  }

  // ─── Render dispatcher ───
  function renderWidget(widget) {
    if (!matchRules(widget.rules)) return;

    switch (widget.type) {
      case 'FLOATING_MENU': renderFloatingMenu(widget); break;
      case 'POPUP_BANNER': renderPopupBanner(widget); break;
      case 'POPUP_CALLBACK': renderPopupCallback(widget); break;
      case 'STICKY_BAR': renderStickyBar(widget); break;
      case 'SIDE_TAB': renderSideTab(widget); break;
    }
  }

  // ─── Init ───
  async function init() {
    try {
      const res = await fetch(BASE_URL + '/api/widget/' + SITE_SLUG);
      if (!res.ok) return console.warn('[Widget] Config fetch failed:', res.status);
      siteConfig = await res.json();
      siteId = siteConfig.siteId;

      injectStyles();
      siteConfig.widgets.forEach(renderWidget);
    } catch (err) {
      console.warn('[Widget] Init failed:', err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
