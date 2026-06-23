# Widget Platform — Roadmap v2 (після уточнень)

## Архітектурні рішення

### 1. Lazy Load — правильна реалізація

**w.js залишається мінімальним loader'ом (~1KB):**
```javascript
// w.js — тільки bootstrap
(function() {
  const SCRIPT = document.currentScript;
  const SITE_SLUG = new URL(SCRIPT.src).searchParams.get('site');
  const BASE_URL = SCRIPT ? new URL(SCRIPT.src).origin : '';
  
  // Config для lazy loading — з сервера, не data-атрибути
  let LL_CONFIG = { loadDelay: 0, loadOnScroll: null, loadOnInteraction: false };
  
  // Fetch конфігу одразу (1-2KB JSON)
  fetch(`${BASE_URL}/api/widget/config?site=${SITE_SLUG}`)
    .then(r => r.json())
    .then(cfg => {
      LL_CONFIG = cfg.lazyLoad || { loadDelay: 0 };
      scheduleRender();
    })
    .catch(() => scheduleRender()); // fallback — одразу
  
  function loadWidget() {
    // Завантажуємо основний bundle
    const script = document.createElement('script');
    script.src = `${BASE_URL}/w.bundle.js?site=${SITE_SLUG}`;
    script.async = true;
    document.head.appendChild(script);
  }
  
  if (LL_CONFIG.loadDelay) {
    setTimeout(loadWidget, LL_CONFIG.loadDelay);
  } else if (LL_CONFIG.loadOnScroll) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadWidget();
    }, { rootMargin: `${LL_CONFIG.loadOnScroll}%` });
    observer.observe(document.body);
  } else if (LL_CONFIG.loadOnInteraction) {
    const trigger = () => { loadWidget(); removeEventListeners(); };
    window.addEventListener('click', trigger, { once: true });
    window.addEventListener('scroll', trigger, { once: true });
    window.addEventListener('mousemove', trigger, { once: true });
  }
  
  function scheduleRender() {
    const { loadDelay, loadOnScroll, loadOnInteraction } = LL_CONFIG;
    
    if (loadDelay) {
      setTimeout(loadWidget, loadDelay);
    } else if (loadOnScroll) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadWidget();
      }, { rootMargin: `${loadOnScroll}%` });
      observer.observe(document.body);
    } else if (loadOnInteraction) {
      const trigger = () => { loadWidget(); removeEventListeners(); };
      window.addEventListener('click', trigger, { once: true });
      window.addEventListener('scroll', trigger, { once: true });
      window.addEventListener('mousemove', trigger, { once: true });
    } else {
      // requestIdleCallback або DOMContentLoaded
      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadWidget, { timeout: 2000 });
      } else {
        window.addEventListener('DOMContentLoaded', loadWidget);
      }
    }
  }
})();
```

**Основний bundle (w.bundle.js):**
- Fetch конфігу
- Рендер віджетів
- Ліниве завантаження іконок (по URL, не інлайн)

### 2. FLOATING_MENU — розширена конфігурація (без нового типу)

```typescript
interface FloatingMenuConfig {
  // === ФОРМА КНОПКИ (нове) ===
  buttonShape: {
    type: 'circle' | 'oval' | 'square' | 'rounded';
    borderRadius?: number;      // для 'rounded' — px
    borderWidth?: number;       // px
    borderColor?: string;
    shadow?: boolean;
    shadowConfig?: {
      color: string;
      blur: number;
      spread: number;
      x: number;
      y: number;
    };
  };
  
  // === КНОПКИ (розширення channels → buttons) ===
  buttons: Array<{
    id: string;
    
    // Режим
    mode: 'direct' | 'menu' | 'toggle';
    
    // Для mode: 'direct' — один канал
    // Для mode: 'menu' | 'toggle' — масив каналів
    channels: Array<{
      type: 'phone' | 'telegram' | 'viber' | 'whatsapp' | 'email' | 
            'instagram' | 'facebook' | 'tiktok' | 'chatwoot' | 'custom';
      value: string;           // номер/юзернейм/URL
      label: string;
      // Іконка з бібліотеки медіа
      iconId?: string;         // ID з MediaLibrary
      iconUrl?: string;        // fallback URL
    }>;
    
    // Візуал
    style: {
      bgColor: string;
      iconColor: string;
      size: 'sm' | 'md' | 'lg' | number;  // px або пресет
    };
    
    // Позиція (для multi-button layout)
    position?: {
      offsetX: number;
      offsetY: number;
    };
  }>;
  
  // === ГРУПА КНОПОК ===
  layout: 'single' | 'double' | 'triple' | 'vertical' | 'horizontal' | 'grid';
  mainButton?: string | null;  // ID головної кнопки (для single/double)
  staggerDelay?: number;       // ms між анімацією появи
  
  // === АНІМАЦІЇ ===
  appearAnimation: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 
                   'slide-right' | 'zoom' | 'bounce' | 'elastic' | 'none';
  attentionAnimation?: 'pulse' | 'shake' | 'bounce' | 'none';
  
  // === ПОЗИЦІОНУВАННЯ ===
  position: {
    side: 'left' | 'right' | 'bottom-left' | 'bottom-right' | 
          'top-left' | 'top-right';
    offset: { x: number; y: number };
  };
  
  // === ВИГЛЯД МЕНЮ (для mode: menu/toggle) ===
  menuStyle: {
    shape: 'rounded' | 'square';
    borderRadius?: number;
    bgColor: string;
    shadow: boolean;
    itemSpacing: number;
    direction: 'up' | 'down' | 'left' | 'right';
  };
}
```

### 3. Media Library — безпека та архітектура

```prisma
// === МІГРАЦІЯ ===

model MediaFolder {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  parentId    String?
  parent      MediaFolder? @relation("FolderTree", fields: [parentId], references: [id], onDelete: SetNull)
  children    MediaFolder[] @relation("FolderTree")
  files       MediaFile[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
}

model MediaFile {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  folderId    String?
  folder      MediaFolder? @relation(fields: [folderId], references: [id], onDelete: SetNull)
  
  // Ідентифікація
  name        String
  slug        String    @unique  // для URL: /media/:slug
  
  // Тип
  type        MediaType
  mimeType    String
  subtype     String    // 'icon', 'avatar', 'banner', 'background', etc.
  
  // Файл
  originalUrl String    // оригінал (для бекапу)
  url         String    // оптимізована/санітизована версія
  thumbnailUrl String?  // для прев'ю
  
  // Для іконок — прив'язка до каналу
  channelType String?   // 'telegram', 'viber', etc.
  isDefault   Boolean   @default(false)  // системні
  
  // SVG-specific: санітизований контент
  svgContent  String?   // inline SVG після DOMPurify
  
  // Метадані
  size        Int       // bytes
  hash        String    @unique  // SHA-256 для дедуплікації
  width       Int?
  height      Int?
  
  // Використання
  usageCount  Int       @default(0)
  usedIn      Json?     // { widgets: [], campaigns: [] }
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId, folderId])
  @@index([type, subtype])
  @@index([channelType])
}

enum MediaType {
  SVG
  PNG
  JPG
  WEBP
  GIF
  VIDEO
  FONT
}
```

**Безпекові заходи:**
1. **Upload sanitization:**
   - Node.js: `DOMPurify` або `sanitize-html`
   - SVG-specific: `svg-sanitize` (вилучає script, foreignObject, etc.)
   - Валідація mime-type magic bytes, не тільки extension
   
2. **Upload limits:**
   - Max file size: 2MB
   - Whitelist: SVG, PNG, JPG, WEBP, GIF
   - Reject: EXE, JS, HTML, etc.
   
3. **Deduplication:**
   - SHA-256 hash перед upload
   - Якщо hash існує — повернути існуючий файл

4. **Usage check:**
   - При DELETE медіафайлу: `SELECT * FROM Widget WHERE config::text LIKE '%iconId%'`
   - Або JSONB запит: `WHERE config @> '{"buttons": [{"channels": [{"iconId": "..."}]}]}'`
   - Повернути 409 Conflict зі списком віджетів, де використовується

5. **Serving headers:**
   ```nginx
   location /media/ {
     add_header Content-Security-Policy "default-src 'none'; img-src 'self'; script-src 'none';";
     add_header X-Content-Type-Options nosniff;
     add_header Cache-Control "public, max-age=31536000, immutable";
   }
   ```

3. **CORS:** тільки з вказаних доменів (з Site.domain)

**API ендпоінти:**
```
GET    /api/media?folder=&type=&subtype=    # список з фільтрами
GET    /api/media/:slug                        # файл (через nginx)
POST   /api/media                              # multipart upload
PUT    /api/media/:id                          # метадані
DELETE /api/media/:id                          # видалити
GET    /api/media/folders                      # дерево папок
POST   /api/media/folders                      # створити папку
PUT    /api/media/folders/:id                  # перейменувати
DELETE /api/media/folders/:id                  # видалити (якщо порожня)
```

**Storage:**
- Volume: `/app/uploads` → `/var/www/media` на хості
- Nginx static serving для кешування
- Опціонально: CDN integration (Cloudflare R2, etc.)

---

## Порядок реалізації (оновлений)

### Фаза 0: Підготовка (паралельно)
- [ ] Розділити w.js на loader + bundle
- [ ] Налаштувати nginx для /media/
- [ ] Додати volume в docker-compose

### Фаза 1: Media Library (3-4 дні)
- [ ] Міграції БД (MediaFolder, MediaFile)
- [ ] API: CRUD + upload з санітизацією
- [ ] Backend: DOMPurify/svg-sanitize інтеграція
- [ ] UI: файловий менеджер (папки, grid, upload)
- [ ] Seed: дефолтні іконки каналів

### Фаза 2: FLOATING_MENU v2 (2-3 дні)
- [ ] Розширити config schema (buttons, layout, buttonShape)
- [ ] UI: shape picker, border controls
- [ ] UI: button builder (mode, channels, icon picker з медіа)
- [ ] w.bundle.js: рендерер для всіх layout
- [ ] Анімації: stagger, attention

### Фаза 3: Lazy Loading (1 день)
- [ ] w.js — fetch config при завантаженні
- [ ] API endpoint /api/widget/config (короткий JSON з lazyLoad налаштуваннями)
- [ ] requestIdleCallback / scroll / interaction triggers з конфігу
- [ ] Cache-Control для w.js (immutable) та config (60s + ETag)

### Фаза 4: Оптимізація (1 день)
- [ ] Tree-shaking для w.bundle.js
- [ ] CDN для медіа
- [ ] Кешування конфігів (Redis/CDN)

---

## Міграція існуючих даних

### Widget.config.channels → buttons (зворотна сумісність):

**API Layer — нормалізація при читанні:**
```javascript
// routes/widgets.js — get widget
function normalizeConfig(config) {
  // Старий формат
  if (config.channels && !config.buttons) {
    return {
      ...config,
      buttons: config.channels.map((ch, i) => ({
        id: `legacy_${i}`,
        mode: 'menu',
        channels: [{
          type: ch.type,
          value: ch.value,
          label: ch.label,
          iconId: `default_${ch.type}`,
          iconClass: ch.iconClass // fallback для старих
        }],
        style: { bgColor: config.color || '#1f93ff', iconColor: '#ffffff', size: 'lg' }
      })),
      layout: 'single',
      buttonShape: { type: 'circle' }
    };
  }
  return config;
}
```

**При збереженні — завжди новий формат:**
```javascript
// Стара структура
{ channels: [
  { type: 'telegram', value: '@user', label: 'Telegram', iconClass: 'fa-telegram' },
  { type: 'phone', value: '+380...', label: 'Phone', iconClass: 'fa-phone' }
]}

// Нова структура (після збереження з редактора)
{ buttons: [
  {
    id: 'btn_1',
    mode: 'menu',
    channels: [
      { type: 'telegram', value: '@user', label: 'Telegram', iconId: 'default_telegram' },
      { type: 'phone', value: '+380...', label: 'Phone', iconId: 'default_phone' }
    ],
    style: { bgColor: '#1f93ff', iconColor: '#ffffff', size: 'lg' }
  }
],
layout: 'single',
buttonShape: { type: 'circle', borderWidth: 0 }}
```

### Migration script:
```javascript
// Псевдо-код для міграції
const widgets = await prisma.widget.findMany({ where: { type: 'FLOATING_MENU' } });
for (const widget of widgets) {
  const oldConfig = widget.config;
  const newConfig = {
    ...oldConfig,
    buttons: oldConfig.channels?.map((ch, i) => ({
      id: `btn_${i}`,
      mode: 'menu',
      channels: [{
        type: ch.type,
        value: ch.value,
        label: ch.label,
        iconId: `default_${ch.type}` // посилання на MediaFile
      }],
      style: {
        bgColor: oldConfig.color || '#1f93ff',
        iconColor: '#ffffff',
        size: 'lg'
      }
    })) || [],
    layout: 'single',
    buttonShape: { type: 'circle' },
  };
  delete newConfig.channels;
  delete newConfig.color;
  await prisma.widget.update({ where: { id: widget.id }, data: { config: newConfig } });
}
```