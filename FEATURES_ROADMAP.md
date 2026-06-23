# Widget Platform — Roadmap змін (за фідбеком Роми)

## 1. FLOATING_MENU — розширена конфігурація форми

### Нові поля в `config`:
```typescript
interface FloatingMenuConfig {
  // ...existing...
  
  // Форма кнопки
  shape: 'circle' | 'oval' | 'square' | 'rounded';
  borderRadius?: number;       // для 'rounded' — px або %
  borderWidth?: number;        // товщина контуру
  borderColor?: string;        // колір контуру
  
  // Затримка показу (lazy load)
  lazyLoad: {
    enabled: boolean;
    delay: number;              // мс, defer завантаження
    scrollTrigger?: number;     // % скролу для завантаження
  };
}
```

### CSS реалізація:
- `circle` → `border-radius: 50%` + фіксовані width/height
- `oval` → `border-radius: 50%` + різні width/height
- `square` → `border-radius: 0`
- `rounded` → `border-radius: ${borderRadius}px`

---

## 2. Подвійна/множинна кнопка (Multi-button)

### Новий тип віджета: `MULTI_BUTTON`

```typescript
interface MultiButtonConfig {
  buttons: Array<{
    id: string;
    type: 'phone' | 'telegram' | 'viber' | 'whatsapp' | 'custom';
    value: string;              // номер/юзернейм/URL
    label: string;
    
    // Іконка
    iconSource: 'library' | 'custom';
    iconId?: string;            // ID з бібліотеки
    customIconUrl?: string;     // або свій URL
    
    // Стиль
    style: {
      bgColor: string;
      iconColor: string;
      size: 'sm' | 'md' | 'lg';
      shape: 'circle' | 'square' | 'rounded';
    };
    
    // Поведінка
    action: 'direct' | 'dropdown';  // direct = відразу відкриває, dropdown = меню
    dropdownItems?: Array<{
      label: string;
      value: string;
      type: 'phone' | 'email' | etc;
    }>;
  }>;
  
  // Розташування групи
  layout: 'vertical' | 'horizontal' | 'grid';
  position: {
    side: 'left' | 'right' | 'bottom';
    offset: { x: number; y: number };
  };
  
  // Анімації
  appearAnimation: 'fade' | 'slide' | 'bounce' | 'none';
  staggerDelay: number;        // затримка між появою кнопок
}
```

### UI в адмінці:
- Drag & drop для сортування кнопок
- Окремий елемент — одна кнопка з налаштуваннями
- Toggle "dropdown mode" для кожної кнопки

---

## 3. Бібліотека іконок (Media Library)

### Нова сутність в БД:

```prisma
model IconLibrary {
  id          String   @id @default(cuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  // Організація
  folderId    String?
  folder      IconFolder? @relation(fields: [folderId], references: [id], onDelete: SetNull)
  
  // Дані
  name        String
  type        IconType   // SVG, PNG, FONT
  source      String     // URL або inline SVG
  
  // Прив'язка до каналу
  channelType String?    // 'telegram', 'viber', 'custom', etc.
  isDefault   Boolean    @default(false)  // системні іконки
  
  // Метадані
  width       Int?
  height      Int?
  fileSize    Int?
  
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model IconFolder {
  id          String   @id @default(cuid())
  userId      String
  name        String
  parentId    String?
  icons       IconLibrary[]
  children    IconFolder[]
  createdAt   DateTime @default(now())
}
```

### Enum IconType:
```prisma
enum IconType {
  SVG_INLINE    // SVG кодом
  SVG_URL       // SVG за URL
  PNG_URL       // PNG зображення
  FONTAWESOME   // fa-solid fa-phone etc
  EMOJI         // 🔥 📞 etc
}
```

### UI в адмінці:
- **Окремий розділ** "Медіа" / "Бібліотека іконок"
- Папкова структура з drag-drop
- Завантаження SVG/PNG
- Перегляд іконок по категоріях (канали зв'язку)
- При створенні кнопки — picker з фільтрами

### API ендпоінти:
```
GET    /api/icons                    # список з фільтрами
GET    /api/icons/:id                 # одна іконка
POST   /api/icons                     # завантажити
PUT    /api/icons/:id                 # оновити
DELETE /api/icons/:id                 # видалити
GET    /api/icon-folders              # папки
POST   /api/icon-folders              # створити папку
```

---

## 4. Медіа-бібліотека (загальна)

### Розширення IconLibrary → MediaLibrary:

```prisma
model MediaLibrary {
  id          String   @id @default(cuid())
  userId      String
  
  // Організація
  folderId    String?
  folder      MediaFolder? @relation(fields: [folderId], references: [id])
  
  // Типи файлів
  type        MediaType   // IMAGE, SVG, VIDEO, AUDIO
  subtype     String      // 'icon', 'banner', 'avatar', 'background'
  
  // Файл
  name        String
  url         String
  thumbnailUrl String?  // для відео/великих картинок
  
  // Метадані
  size        Int        // bytes
  width       Int?
  height      Int?
  mimeType    String
  
  // Використання
  usedIn      Json?      // { widgets: [], popups: [], campaigns: [] }
  
  createdAt   DateTime   @default(now())
}

model MediaFolder {
  id          String   @id @default(cuid())
  userId      String
  name        String
  parentId    String?
  children    MediaFolder[]
  files       MediaLibrary[]
  createdAt   DateTime @default(now())
}
```

### UI:
- Grid view / List view
- Drag & drop upload
- Bulk operations (delete, move)
- Search за назвою
- Фільтри за типом

---

## 5. Пріоритети реалізації

### Фаза 1: FLOATING_MENU покращення (1-2 дні)
- [ ] Міграція БД: додати shape, borderRadius, borderWidth, borderColor, lazyLoad
- [ ] Оновлення config schema в API
- [ ] Оновлення UI в адмінці (shape selector, border controls, lazy load toggle)
- [ ] Оновлення widget/w.js — рендерінг форм

### Фаза 2: MULTI_BUTTON (2-3 дні)
- [ ] Новий тип WidgetType.MULTI_BUTTON
- [ ] Config schema з масивом buttons
- [ ] UI: конструктор кнопок (add/edit/delete/sort)
- [ ] Рендерінг у w.js

### Фаза 3: Media Library + Icons (3-4 дні)
- [ ] Міграції БД (MediaLibrary, MediaFolder)
- [ ] API CRUD для медіа
- [ ] UI: файловий менеджер
- [ ] Інтеграція в WidgetEditor — picker іконок

### Фаза 4: Рефакторинг іконок (1 день)
- [ ] Міграція існуючих inline SVG → MediaLibrary
- [ ] Оновлення w.js для роботи з бібліотекою
- [ ] Fallback на inline якщо URL недоступний

---

## 6. Технічні нотатки

### Зворотна сумісність:
- `shape: 'circle'` default для існуючих
- `lazyLoad: { enabled: false }` default
- Старі іконки працюють паралельно з новими

### Performance:
- Lazy load відкладає `fetch()` на widget config
- Медіа завантажується async з `loading="lazy"`
- CDN для іконок (опціонально)

### Security:
- Валідація SVG (XSS sanitization)
- Ліміти на розмір файлів
- Перевірка mime-type на сервері