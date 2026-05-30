# Widget Platform — Self-hosted конструктор віджетів

Повноцінна self-hosted платформа для керування контактними віджетами на сайтах. Аналог SaaS-сервісів Chaty/Buttonizer, але для власного хостингу.

## Можливості

- **5 типів віджетів**: FLOATING_MENU, POPUP_CALLBACK, POPUP_BANNER, STICKY_BAR, SIDE_TAB
- **11+ каналів**: Телефон, Telegram, Viber, WhatsApp, Email, Instagram, Facebook, TikTok, Chatwoot, Callback, кастомні
- **Мультисайтовість**: один інстанс — необмежена кількість сайтів
- **Правила показу**: фільтр за URL (contains/exact/regex), пристроєм (desktop/mobile)
- **Тригери popup**: затримка N секунд, скрол до X%, частота показу
- **Аналітика**: покази, кліки, заявки — з графіками та статистикою
- **Інтеграція з n8n**: заявки з форм надсилаються на webhook
- **Легкий widget.js**: ~15kb, vanilla JS, без залежностей

## Стек

| Компонент | Технологія |
|-----------|-----------|
| API | Node.js 20 + Fastify + Prisma ORM |
| БД | PostgreSQL 16 |
| Адмінка | React 18 + Tailwind + Recharts |
| Віджет | Vanilla JS (IIFE), ~26kb |
| Деплой | Docker Compose + Nginx |

## Швидкий старт

### 1. Клонувати / скопіювати

```bash
cd /opt
git clone https://github.com/romboman19/widget-platform.git widget-platform
cd widget-platform
# Оновити до останньої версії
git pull origin main
```

### 2. Налаштувати .env

```bash
cp .env.example .env
nano .env
```

Мінімально змінити:
- `DB_PASSWORD` — пароль до PostgreSQL
- `JWT_SECRET` — секрет для JWT (згенерувати: `openssl rand -hex 32`)
- `ADMIN_EMAIL` — email адміністратора
- `ADMIN_PASSWORD` — пароль адміністратора
- `PUBLIC_URL` — публічний URL (наприклад `https://widgets.yourdomain.ua`)

### 3. Запустити

```bash
# Перший запуск — зі збіркою образів
docker compose up -d --build

# Повне перебудування (після оновлень)
docker compose up -d --build --force-recreate --remove-orphans
```

### 4. Відкрити адмінку

Адмінка доступна на `http://your-server:8090` (або порт з `HTTP_PORT`).

### 5. Додати на сайт

В адмінці створити сайт → скопіювати тег:

```html
<script src="https://widgets.yourdomain.ua/w.js?site=your-site-slug"></script>
```

Вставити перед `</body>` на сайті.

## Налаштування за Nginx Proxy Manager

Створити Proxy Host:
- Domain: `widgets.yourdomain.ua`
- Forward: `http://docker-host-ip:8090`
- SSL: Let's Encrypt
- Websockets: OFF
- Custom locations: не потрібні (вже є внутрішній nginx)

## Структура проекту

```
widget-platform/
├── docker-compose.yml      # Оркестрація
├── .env.example            # Шаблон змінних
├── nginx/nginx.conf        # Reverse proxy + CORS
├── api/                    # REST API (Fastify + Prisma)
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/schema.prisma
│   └── src/
│       ├── index.js        # Entry point
│       ├── seed.js         # Автосід адміна
│       └── routes/
│           ├── auth.js     # Login, /me, зміна паролю
│           ├── sites.js    # CRUD сайтів + аналітика
│           ├── widgets.js  # CRUD віджетів + дублювання
│           ├── public.js   # Публічний конфіг для widget.js
│           └── analytics.js # Track подій + форма → n8n
├── admin/                  # React SPA
│   ├── Dockerfile          # Multi-stage (Vite → nginx)
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── hooks/useAuth.jsx
│       ├── components/Layout.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Dashboard.jsx
│           ├── SiteEditor.jsx
│           ├── WidgetEditor.jsx
│           └── Analytics.jsx
└── widget/
    └── dist/w.js           # Публічний скрипт для сайтів
```

## API Endpoints

### Публічні (без авторизації)
| Method | Path | Опис |
|--------|------|------|
| GET | `/api/widget/:slug` | Конфіг віджетів для сайту |
| POST | `/api/analytics/track` | Трекінг подій |
| POST | `/api/analytics/form` | Відправка форми → БД + n8n webhook |

### Захищені (JWT)
| Method | Path | Опис |
|--------|------|------|
| POST | `/api/auth/login` | Логін |
| GET | `/api/auth/me` | Поточний юзер |
| GET/POST | `/api/sites` | Список / створення сайтів |
| GET/PUT/DELETE | `/api/sites/:id` | CRUD сайту |
| GET | `/api/sites/:id/analytics` | Статистика сайту |
| GET/POST | `/api/sites/:id/widgets` | Список / створення віджетів |
| GET/PUT/DELETE | `/api/sites/:id/widgets/:wid` | CRUD віджета |
| POST | `/api/sites/:id/widgets/:wid/duplicate` | Дублювання віджета |

## Конфіг віджетів (JSON)

### Floating Menu
```json
{
  "color": "#1f93ff",
  "greeting": "Потрібна допомога?",
  "channels": [
    { "type": "phone", "value": "+380XXXXXXXXX", "label": "Зателефонувати" },
    { "type": "telegram", "value": "username", "label": "Telegram" },
    { "type": "viber", "value": "+380XXXXXXXXX", "label": "Viber" },
    { "type": "callback", "value": "", "label": "Зворотній дзвінок" }
  ],
  "callbackTitle": "Замовити дзвінок",
  "webhookUrl": "https://n8n.example.com/webhook/abc"
}
```

### Trigger / Rules
```json
// triggers
{ "delay": 5, "scrollPercent": 50, "frequency": "once", "frequencyDays": 7 }

// rules
{ "devices": ["mobile"], "urlRules": [{ "type": "contains", "value": "/catalog" }] }
```

## Корисні команди

```bash
# Перевірити оновлення в репозиторії
git fetch origin && git log HEAD..origin/main --oneline

# Оновити код і перезапустити
git pull origin main && docker compose up -d --build --force-recreate

# Логи API
docker compose logs -f api

# Логи всіх сервісів
docker compose logs -f

# Повне перебудування
docker compose up -d --build --force-recreate --remove-orphans

# Backup БД
docker compose exec postgres pg_dump -U widget widget_platform > backup.sql

# Відновлення БД
cat backup.sql | docker compose exec -T postgres psql -U widget widget_platform

# Очистити невикористовувані образи
docker system prune -af
```

## Відомі обмеження та баги

- Лічильник віджетів показує тільки активні (`enabled: true`)
- При першій збірці може знадобитися до 2-3 хвилин на `npm install` та генерацію Prisma client
- Admin panel потребує окремої збірки (Vite build) — не включена в базовий docker-compose

## Ліцензія

MIT — використовуйте як завгодно.
