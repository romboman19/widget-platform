# FLOATING_MENU Config Contract v2

## Schema

```typescript
interface FloatingMenuConfig {
  // Layout direction
  layout: 'single' | 'vertical' | 'horizontal';
  
  // Button styling (applies to all buttons)
  buttonShape?: {
    type: 'circle' | 'square' | 'rounded' | 'oval';
    borderRadius?: number;    // px, for square/rounded
    borderWidth?: number;     // px, 0 = no border
    borderColor?: string;     // hex color
  };
  
  // Menu animation when opening
  menuAnimation?: 'fade' | 'zoom' | 'slide-up' | 'slide-down' | 'none';
  
  // Global attention animation
  attentionAnimation?: 'pulse' | 'shake' | 'wobble' | 'none';
  
  // Buttons array (replaces legacy channels[])
  buttons: Button[];
}

interface Button {
  id: string;                    // unique identifier
  mode: 'direct' | 'menu' | 'toggle';  // how button behaves
  channels: Channel[];           // 1 for direct, 1+ for menu/toggle
  style?: {
    bgColor?: string;           // hex, fallback to widget color
    iconColor?: string;         // hex, default #fff
    size?: 'sm' | 'md' | 'lg';  // 48px, 56px, 64px
    attentionAnimation?: string;
  };
}

interface Channel {
  type: 'phone' | 'telegram' | 'viber' | 'whatsapp' | 
         'email' | 'instagram' | 'facebook' | 'tiktok' | 
         'chatwoot' | 'callback' | 'custom';
  value: string;                // phone number, URL, username
  label?: string;               // tooltip text
  iconId?: string | null;       // mediaFile.id or slug (default-*)
  iconClass?: string;           // legacy FontAwesome class
  color?: string;               // hex, fallback to CHANNEL_COLORS
}
```

## Legacy Migration

Old `channels[]` → one Button with mode='menu':
```javascript
{
  id: 'legacy_main',
  mode: 'menu',
  channels: channels.map(ch => ({
    type: ch.type,
    value: ch.value,
    label: ch.label,
    iconId: ch.iconId || null,
    iconClass: ch.iconClass  // preserved for backward compat
  })),
  style: { bgColor: config.color }
}
```

## Icon Resolution Priority

1. `iconUrl` (resolved at runtime by public.js)
2. `iconClass` (FontAwesome, legacy)
3. Inline SVG by type

## Storage Rules

- Store `iconId` in config (id or slug), NOT iconUrl
- Use `denormalizeFloatingMenuConfig()` before saving to DB
- URL resolution happens only in public.js for frontend

## Example Configs

### Single direct button
```json
{
  "layout": "single",
  "buttons": [{
    "id": "call",
    "mode": "direct",
    "channels": [{"type": "phone", "value": "+380...", "iconId": "default-phone"}],
    "style": {"bgColor": "#2ecc71"}
  }]
}
```

### Double: direct + menu
```json
{
  "layout": "horizontal",
  "buttonShape": {"type": "circle"},
  "buttons": [
    {
      "id": "call",
      "mode": "direct",
      "channels": [{"type": "phone", "value": "+380..."}],
      "style": {"bgColor": "#2ecc71"}
    },
    {
      "id": "chat",
      "mode": "menu",
      "channels": [
        {"type": "telegram", "value": "...", "iconId": "abc123"},
        {"type": "viber", "value": "...", "iconId": "def456"},
        {"type": "whatsapp", "value": "...", "iconId": null}
      ],
      "style": {"bgColor": "#0088cc"}
    }
  ]
}
```
