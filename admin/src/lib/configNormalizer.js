/**
 * Widget Config Denormalization
 * 
 * Converts UI-friendly config to DB format before saving.
 * Removes runtime-resolved fields like iconUrl.
 */

/**
 * Denormalize FLOATING_MENU config for saving to DB
 * Strips iconUrl (resolved at runtime), keeps only iconId
 */
export function denormalizeFloatingMenuConfig(config) {
  if (!config) return config;
  
  // Keep only necessary fields
  const { buttons, layout, buttonShape, menuAnimation, attentionAnimation, ...rest } = config;
  
  return {
    ...rest,
    buttons: buttons?.map(btn => ({
      id: btn.id,
      mode: btn.mode,
      channels: btn.channels?.map(ch => ({
        type: ch.type,
        value: ch.value,
        label: ch.label,
        iconId: ch.iconId, // Keep iconId, NOT iconUrl
        // iconUrl is runtime-resolved, don't store
        iconClass: ch.iconClass, // Keep for legacy
        // Per-channel design settings
        sizePx: ch.sizePx,
        iconScale: ch.iconScale,
        bgColor: ch.bgColor,
        bgTransparent: ch.bgTransparent,
      })),
      style: btn.style,
      position: btn.position,
    })),
    layout: layout || 'single',
    buttonShape: buttonShape || { type: 'circle' },
    ...(menuAnimation && { menuAnimation }),
    ...(attentionAnimation && { attentionAnimation }),
  };
}
