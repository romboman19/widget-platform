// renderFloatingMenuV2 - supports both legacy channels[] and new buttons[] format
function renderFloatingMenuV2(widget) {
  const cfg = widget.config || {};
  const pos = widget.position || {};
  const corner = pos.corner || 'bottom-right';
  
  // Detect format: new buttons[] or legacy channels[]
  const isNewFormat = cfg.buttons && Array.isArray(cfg.buttons);
  const buttons = isNewFormat ? cfg.buttons : [{ 
    id: 'legacy_main', 
    mode: 'menu', 
    channels: cfg.channels || [] 
  }];
  
  // Button shape configuration
  const shape = cfg.buttonShape || { type: 'circle' };
  const layout = cfg.layout || 'single';
  
  // Position styles
  const posStyle = {};
  if (corner.includes('bottom')) posStyle.bottom = (pos.offsetY || 20) + 'px';
  if (corner.includes('top')) posStyle.top = (pos.offsetY || 20) + 'px';
  if (corner.includes('right')) posStyle.right = (pos.offsetX || 20) + 'px';
  if (corner.includes('left')) posStyle.left = (pos.offsetX || 20) + 'px';

  // Helper: get button styles based on shape
  function getButtonStyles(btnStyle, isMain = false) {
    const base = {
      position: 'fixed',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: 'none',
      boxShadow: '0 4px 12px rgba(0,0,0,.25)',
      transition: 'transform .2s, box-shadow .2s',
    };
    
    const size = isMain ? (btnStyle?.size === 'sm' ? 48 : btnStyle?.size === 'lg' ? 64 : 56) : 46;
    
    base.width = size + 'px';
    base.height = size + 'px';
    base.background = btnStyle?.bgColor || cfg.color || '#1f93ff';
    
    // Border
    if (shape.borderWidth) {
      base.border = `${shape.borderWidth}px solid ${shape.borderColor || '#fff'}`;
    }
    
    // Border radius based on shape type
    switch (shape.type) {
      case 'circle':
        base.borderRadius = '50%';
        break;
      case 'square':
        base.borderRadius = shape.borderRadius ? shape.borderRadius + 'px' : '0';
        break;
      case 'rounded':
        base.borderRadius = shape.borderRadius ? shape.borderRadius + 'px' : '12px';
        break;
      case 'oval':
        base.borderRadius = '50%';
        base.width = (size * 1.4) + 'px';
        break;
    }
    
    return base;
  }

  // Helper: render icon (supports iconId/iconUrl, iconClass, or inline SVG)
  function renderButtonIcon(btn, ch, size = 26) {
    // New format: iconUrl from resolved config
    if (ch?.iconUrl) {
      return el('img', { 
        src: ch.iconUrl, 
        style: { width: size + 'px', height: size + 'px', objectFit: 'contain' } 
      });
    }
    // Legacy: iconClass (FontAwesome)
    if (ch?.iconClass) {
      return el('i', { 
        class: ch.iconClass, 
        style: { fontSize: size + 'px', color: btn.style?.iconColor || '#fff' } 
      });
    }
    // Default: inline SVG by type
    const iconSvg = ICONS[ch?.type] || ICONS.custom;
    return el('span', { style: { color: btn.style?.iconColor || '#fff' } }, iconSvg);
  }

  // Helper: handle channel click
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
        if (window.$chatwoot) window.$chatwoot.toggle('open');
        else if (channel.value) window.open(channel.value, '_blank');
        break;
      case 'callback': showCallbackForm(widget); break;
      case 'custom': if (channel.value) window.open(channel.value, '_blank'); break;
    }
  }

  // State for menu buttons
  const menuStates = {};

  // Create buttons based on layout
  const container = el('div', {
    class: 'wp-widget wp-floating-container',
    style: {
      position: 'fixed',
      zIndex: 999999,
      ...posStyle,
      display: 'flex',
      flexDirection: layout === 'vertical' ? 'column' : 
                     layout === 'horizontal' ? 'row' : 'column',
      gap: '10px',
      alignItems: corner.includes('right') ? 'flex-end' : 'flex-start',
    }
  });

  buttons.forEach((btn, btnIndex) => {
    const btnStyle = btn.style || {};
    const isMenuMode = btn.mode === 'menu';
    const isToggleMode = btn.mode === 'toggle';
    const isDirectMode = btn.mode === 'direct' || (!isMenuMode && !isToggleMode);
    
    const buttonEl = el('button', {
      class: 'wp-floating-btn-v2',
      'aria-label': btn.channels?.[0]?.label || 'Open menu',
      style: getButtonStyles(btnStyle, true),
      onClick: () => {
        if (isDirectMode) {
          // Direct click on first channel
          if (btn.channels?.[0]) {
            handleChannelClick(btn.channels[0], widget);
          }
        } else if (isMenuMode || isToggleMode) {
          // Toggle menu
          const menuId = 'wp-menu-' + widget.id + '-' + btnIndex;
          const menuEl = document.getElementById(menuId);
          const isOpen = menuStates[btnIndex];
          
          if (menuEl) {
            menuEl.classList.toggle('hidden', isOpen);
            menuStates[btnIndex] = !isOpen;
            
            // Update main button icon
            const iconContent = !isOpen 
              ? (btnStyle.closeIcon ? ICONS[btnStyle.closeIcon] : ICONS.close)
              : renderButtonIcon(btn, btn.channels?.[0], 26);
            
            // Clear and re-append icon
            buttonEl.innerHTML = '';
            if (typeof iconContent === 'string') {
              buttonEl.innerHTML = iconContent;
            } else {
              buttonEl.appendChild(iconContent);
            }
            
            if (!isOpen) {
              track('open', widget.id);
              applyAnimation(menuEl, cfg.menuAnimation || 'fade');
            }
          }
        }
      },
    });
    
    // Set initial icon
    const initialIcon = btn.channels?.[0] 
      ? renderButtonIcon(btn, btn.channels[0], 26)
      : (btnStyle.icon ? ICONS[btnStyle.icon] : ICONS.menu);
    
    if (typeof initialIcon === 'string') {
      buttonEl.innerHTML = initialIcon;
    } else {
      buttonEl.appendChild(initialIcon);
    }
    
    // Attention animation
    if (btnStyle.attentionAnimation || cfg.attentionAnimation) {
      buttonEl.classList.add('wp-attention-' + (btnStyle.attentionAnimation || cfg.attentionAnimation));
    }
    
    container.appendChild(buttonEl);
    
    // Create menu for menu/toggle modes
    if ((isMenuMode || isToggleMode) && btn.channels?.length > 1) {
      const menuId = 'wp-menu-' + widget.id + '-' + btnIndex;
      const menuEl = el('div', {
        id: menuId,
        class: 'wp-widget wp-floating-menu hidden',
        role: 'menu',
        'aria-label': 'Contact channels',
        style: {
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          transition: 'opacity .25s, transform .25s',
          ...(corner.includes('bottom') ? { bottom: '70px' } : { top: '70px' }),
          ...(corner.includes('right') ? { right: '0' } : { left: '0' }),
        }
      });
      
      btn.channels.forEach((ch, chIndex) => {
        const channelBtn = el('button', {
          class: 'wp-channel-btn',
          role: 'menuitem',
          'aria-label': ch.label || ch.type,
          style: {
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: shape.borderWidth ? `${shape.borderWidth}px solid ${shape.borderColor || '#fff'}` : 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: ch.color || CHANNEL_COLORS[ch.type] || '#333',
            boxShadow: '0 2px 8px rgba(0,0,0,.2)',
            transition: 'transform .15s',
            transitionDelay: (chIndex * 0.04) + 's',
          },
          onClick: () => handleChannelClick(ch, widget),
        }, [
          renderButtonIcon(btn, ch, 22),
          el('span', { class: 'wp-tooltip' }, ch.label || ch.type),
        ]);
        
        menuEl.appendChild(channelBtn);
      });
      
      container.appendChild(menuEl);
      menuStates[btnIndex] = false;
    }
  });

  document.body.appendChild(container);
  track('view', widget.id);
}
