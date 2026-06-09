# Widget Platform — Self-hosted конструктор віджетів

Повноцінна self-hosted платформа для керування контактними віджетами на сайтах. Аналог SaaS-сервісів Chaty/Buttonizer, але для власного хостингу.

## Можливості

### Типи віджетів
- **FLOATING_MENU** — плаваюче меню з каналами зв'язку
- **POPUP_CALLBACK** — popup форма зворотного дзвінка
- **POPUP_BANNER** — банер з зображенням та CTA
- **STICKY_BAR** — приклеєна панель (зверху/знизу)
- **SIDE_TAB** — бокова кнопка-вкладка

### Канали зв'язку
📞 Телефон | ✈️ Telegram | 💜 Viber | 💚 WhatsApp | 📧 Email | 📸 Instagram | 👤 Facebook | 🎵 TikTok | 💬 Chatwoot | 📲 Callback

### Тригери показу (#5, #6)
- ⏱️ Затримка N секунд
- 📜 Скрол до X%
- 🚪 Exit-intent (покидання сайту)
- 😴 Idle (бездіяльність N сек)
- 🔄 Частота: once / every / days

### Анімації (#7)
`fade` | `slide-up` | `slide-down` | `slide-left` | `slide-right` | `zoom` | `bounce` | `elastic` | `flip`

### Планування (#8)
- 📅 Діапазон дат
- 📆 Дні тижня
- ⏰ Часові інтервали
- ❌ Виключені дати

### A/B Тестування (#10)
- Створення експериментів з варіантами
- Weighted traffic allocation
- Автоматична статистика
- Winner selection

### Доступність (#11)
- ♿ ARIA labels та roles
- ⌨️ Keyboard navigation
- 🔍 Screen reader support
- 🎚️ Reduced motion support
- 🔲 High contrast mode

## Стек

| Компонент | Технологія |
|-----------|-----------|
| API | Node.js 20 + Fastify + Prisma ORM |
| БД | PostgreSQL 16 |
| Адмінка | React 18 + Tailwind + Recharts |
| Віджет | Vanilla JS (IIFE), ~48kb |
| Деплой | Docker Compose + Nginx |

## Швидкий старт

```bash
# Клонувати
git clone https://github.com/romboman19/widget-platform.git
cd widget-platform

# Налаштувати
cp .env.example .env
# Редагувати .env (DB_PASSWORD, JWT_SECRET, PUBLIC_URL)

# Запустити
docker compose up -d --build
```

Адмінка: `http://localhost:8090`

Embed код:
```html
<script src="https://widgets.yourdomain.ua/w.js?site=your-site-slug"></script>
```

## API Endpoints

### Публічні
| Method | Path | Опис |
|--------|------|------|
| GET | `/api/widget/:slug` | Конфіг + experiments |
| POST | `/api/analytics/track` | Трекінг |
| POST | `/api/analytics/form` | Форма → n8n |

### Захищені (JWT)
| Method | Path | Опис |
|--------|------|------|
| POST | `/api/auth/login` | Логін |
| GET | `/api/sites` | Список сайтів |
| GET/POST | `/api/sites/:id/widgets` | Віджети сайту |
| GET/POST | `/api/sites/:id/experiments` | A/B тести |
| POST | `/api/sites/:id/experiments/:eid/start` | Старт тесту |
| POST | `/api/sites/:id/experiments/:eid/complete` | Завершити |

## Конфігурація

### Floating Menu
```json
{
  "color": "#1f93ff",
  "iconType": "fontawesome",
  "iconClass": "fa-solid fa-comment-dots",
  "menuAnimation": "fade",
  "attentionAnimation": "pulse",
  "channels": [
    { "type": "phone", "value": "+380...", "label": "Подзвонити", "iconClass": "fa-solid fa-phone" }
  ]
}
```

### Triggers (тригери)
```json
{
  "delay": 5,
  "scrollPercent": 50,
  "exitIntent": true,
  "exitCooldown": 60,
  "idleTimeout": 30,
  "idleResetOnActivity": true,
  "frequency": "once",
  "frequencyDays": 7
}
```

### Schedule (розклад)
```json
{
  "enabled": true,
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "daysOfWeek": ["mon", "tue", "wed", "thu", "fri"],
  "timeRanges": [{ "start": "09:00", "end": "18:00" }],
  "excludedDates": ["2026-06-24"]
}
```

### Experiment (A/B тест)
```json
{
  "name": "Button color test",
  "trafficAllocation": 50,
  "variants": [
    { "widgetId": "widget-a-id", "weight": 1 },
    { "widgetId": "widget-b-id", "weight": 1 }
  ],
  "status": "RUNNING"
}
```

## Команди

```bash
# Логи
docker compose logs -f api

# Оновлення
git pull origin main && docker compose up -d --build --force-recreate

# Бекап
docker compose exec postgres pg_dump -U widget widget_platform > backup.sql

# Відновлення
cat backup.sql | docker compose exec -T postgres psql -U widget widget_platform
```

## Історія версій

### v1.0.0 — Issues #1-11
- ✅ Drag & Drop Builder (#1)
- ✅ Live Preview (#2)
- ✅ Embed script прив'язка (#3)
- ✅ Templates system (#4)
- ✅ Exit-intent + Idle triggers (#5, #6)
- ✅ 10+ анімацій (#7)
- ✅ Scheduling (#8)
- ✅ FontAwesome icons (#9)
- ✅ A/B Testing (#10)
- ✅ Accessibility — ARIA, keyboard (#11)

## Ліцензія

- **API** (`/api`): [AGPL-3.0](LICENSE)
- **Admin + Widget** (`/admin`, `/widget`): [MIT](LICENSE-MIT)
