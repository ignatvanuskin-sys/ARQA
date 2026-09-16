# Arqa — автосервис в Кокшетау

Лендинг автосервиса Arqa (Кокшетау, ул. Шагалалы, 1): React 19 + Vite 7 + Tailwind 4, бэкенд — Express (Node 22). Форма записи отправляет заявки владельцу в Telegram.

## Локальный запуск

```bash
pnpm install
pnpm run dev        # http://localhost:3000
```

Проверки:

```bash
pnpm run check      # tsc --noEmit
pnpm run build      # vite build + бандл сервера в dist/
pnpm start          # прод-сервер из dist/ (NODE_ENV=production)
```

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните. Все секреты — только через env, в репозиторий не попадают.

| Переменная | Обязательна | Описание |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | да (для формы) | Токен бота от @BotFather |
| `TELEGRAM_CHAT_ID` | да (для формы) | ID чата для заявок |
| `PORT` | нет | Порт сервера (по умолчанию 3000) |
| `NODE_ENV` | нет | `production` в проде |
| `ORIGIN` | нет | Разрешённый origin для CORS (если фронт на другом домене) |
| `VITE_ANALYTICS_ENDPOINT` | нет | Self-hosted Umami — при заданных значениях скрипт попадёт в билд |
| `VITE_ANALYTICS_WEBSITE_ID` | нет | ID сайта в Umami |

Без Telegram-переменных форма вернёт понятную ошибку с предложением позвонить — сайт работает, но заявки не доставляются.

## Деплой

### Docker (VPS / Railway)

```bash
docker build -t arqa .
docker run -p 3000:3000 --env-file .env arqa
```

На Railway: подключите репозиторий, задайте переменные окружения из таблицы выше — Dockerfile подхватится автоматически.

### GitHub Actions

`.github/workflows/ci.yml` прогоняет `pnpm run check` + `pnpm run build` на каждый push в `main` и каждый PR.

## Ассеты

Реальные фото/логотипы лежат в `assets-src/` (оригиналы) и `client/public/assets/` (сжатые WebP + JPG-fallback, favicon-набор, og-image).

Пересобрать оптимизированные версии:

```bash
node scripts/optimize-assets.mjs
```

Перекачать оригиналы из внешнего хранилища (нужен `FORGE_KEY`):

```bash
node scripts/fetch-assets.mjs
```

## Перед запуском в прод (ручные шаги)

1. Заменить плейсхолдер домена `https://arqa-kokshetau.kz/` на реальный: `client/index.html` (canonical, og:url, og:image, twitter:image), `client/public/robots.txt`, `client/public/sitemap.xml`.
2. Создать Telegram-бота и задать `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`.
3. При необходимости настроить Umami-аналитику (см. `.env.example`).
4. Включить HTTPS/домен на хостинге.
