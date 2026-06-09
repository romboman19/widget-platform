# Widget Platform — Self-hosted конструктор віджетів

Повноцінна self-hosted платформа для керування контактними віджетами на сайтах. Аналог SaaS-сервісів Chaty/Buttonizer, але для власного хостингу.

## Ліцензія

**AGPLv3** — весь проект знаходиться під ліцензією GNU Affero General Public License v3.

Це означає:
- ✅ Вільне використання
- ✅ Модифікації дозволені
- ❗ **Будь-які зміни повинні бути опубліковані** — навіть якщо проект запущено як SaaS
- ❗ **Посилання на джерело обов'язкове**

Повний текст ліцензії: [LICENSE](LICENSE)

## Можливості

### Типи віджетів
- **FLOATING_MENU** — плаваюче меню з каналами зв'язку
- **POPUP_CALLBACK** — popup форма зворотного дзвінка
- **POPUP_BANNER** — банер з зображенням та CTA
- **STICKY_BAR** — приклеєна панель (зверху/знизу)
- **SIDE_TAB** — бокова кнопка-вкладка

### Канали зв'язку
📞 Телефон | ✈️ Telegram | 💜 Viber | 💚 WhatsApp | 📧 Email | 📸 Instagram | 👤 Facebook | 🎵 TikTok | 💬 Chatwoot | 📲 Callback

### Тригери показу
- ⏱️ Затримка N секунд
- 📜 Скрол до X%
- 🚪 Exit-intent (покидання сайту)
- 😴 Idle (бездіяльність N сек)
- 🔄 Частота: once / every / days

### Анімації
`fade` | `slide-up` | `slide-down` | `slide-left` | `slide-right` | `zoom` | `bounce` | `elastic` | `flip`

### Планування
- 📅 Діапазон дат
- 📆 Дні тижня
- ⏰ Часові інтервали
- ❌ Виключені дати

### A/B Тестування
- Створення експериментів з варіантами
- Weighted traffic allocation
- Автоматична статистика
- Winner selection

### Доступність
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

### v1.0.0
- ✅ Drag & Drop Builder
- ✅ Live Preview
- ✅ Embed script прив'язка
- ✅ Templates system
- ✅ Exit-intent + Idle triggers
- ✅ 10+ анімацій
- ✅ Scheduling
- ✅ FontAwesome icons
- ✅ A/B Testing
- ✅ Accessibility — ARIA, keyboard

## Внесок

Pull requests вітаються! Переконайтесь що зміни відповідають AGPLv3.

## Контакти

- GitHub: [romboman19/widget-platform](https://github.com/romboman19/widget-platform)
