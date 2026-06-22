/**
 * Widget Config Normalization
 * 
 * Converts old config format (channels[]) to new format (buttons[])
 * for backward compatibility.
 */

/**
 * Normalize FLOATING_MENU config from old to new format
 */
export function normalizeFloatingMenuConfig(config) {
  if (!config) return config;
  
  // Already new format
  if (config.buttons && Array.isArray(config.buttons)) {
    return config;
  }
  
  // Old format: channels[] — convert to ONE button with all channels inside
  if (config.channels && Array.isArray(config.channels)) {
    const button = {
      id: 'legacy_main',
      mode: 'menu',
      channels: config.channels.map((ch) => ({
        type: ch.type,
        value: ch.value,
        label: ch.label,
        // Map old iconClass to new iconId (fallback for migration)
        iconId: ch.iconId || null,
        iconClass: ch.iconClass, // Keep for backward compatibility
      })),
      style: {
        bgColor: config.color || '#1f93ff',
        iconColor: '#ffffff',
        size: 'lg',
      },
    };
    
    return {
      ...config,
      buttons: [button], // ONE button with menu mode
      layout: 'single',
      buttonShape: {
        type: 'circle',
        borderRadius: 0,
        borderWidth: 0,
        borderColor: null,
      },
    };
  }
  
  return config;
}

/**
 * Normalize any widget config based on type
 */
export function normalizeWidgetConfig(widget) {
  if (!widget || !widget.config) return widget;
  
  const config = widget.config;
  
  switch (widget.type) {
    case 'FLOATING_MENU':
      return {
        ...widget,
        config: normalizeFloatingMenuConfig(config),
      };
    default:
      return widget;
  }
}

/**
 * Denormalize config for saving (strip derived fields)
 */
export function denormalizeFloatingMenuConfig(config) {
  if (!config) return config;
  
  // Keep only necessary fields
  const { buttons, layout, buttonShape, menuStyle, lazyLoad, ...rest } = config;
  
  return {
    ...rest,
    buttons: buttons?.map(btn => ({
      id: btn.id,
      mode: btn.mode,
      channels: btn.channels?.map(ch => ({
        type: ch.type,
        value: ch.value,
        label: ch.label,
        iconId: ch.iconId, // Store iconId, not URL
        // iconUrl resolved at runtime
        // Per-channel design settings
        sizePx: ch.sizePx,
        iconScale: ch.iconScale,
        bgColor: ch.bgColor,
        bgTransparent: ch.bgTransparent,
        callbackWidgetId: ch.callbackWidgetId,
      })),
      style: btn.style,
      position: btn.position,
    })),
    layout: layout || 'single',
    buttonShape: buttonShape || { type: 'circle' },
    ...(menuStyle && { menuStyle }),
    ...(lazyLoad && { lazyLoad }),
  };
}
