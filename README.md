# Штаб — админка тренера

Внутренний инструмент: база клиентов с автоматическими триггерами «кому пора написать» и экспортом строк для генерации черновиков в Claude.

Спецификация: [`mvp-spec.md`](./mvp-spec.md). Дизайн-система: [`design-system.md`](./design-system.md). Дизайн-документ: [`docs/superpowers/specs/2026-06-15-shtab-mvp-design.md`](./docs/superpowers/specs/2026-06-15-shtab-mvp-design.md).

## Стек

Next.js 16 (App Router, RSC, Server Actions) · React 19 · TypeScript strict · Tailwind 4 · Drizzle ORM + Postgres (Docker локально) · Auth.js v5 credentials · argon2 · zod · lucide-react.

## Запуск

```bash
# 1. Зависимости
npm install

# 2. ENV
cp .env.example .env.local
# затем подставь реальные значения AUTH_SECRET (openssl rand -base64 32) и LEADS_API_TOKEN

# 3. Postgres
npm run db:up
npm run db:migrate

# 4. Dev-сервер
npm run dev
```

Открыть `http://localhost:3000` — будет редирект на `/register` (база пуста). Заводишь первого тренера, потом дальше через `/login`.

Docker Postgres слушает host port **5433** (не 5432), чтобы не конфликтовать с локальным Homebrew Postgres на macOS.

## Шрифты

- **Nunito** и **JetBrains Mono** подключаются автоматически через `next/font/google`.
- **Gerhaus** (дисплейный, для заголовков): положи `.woff2` в `public/fonts/` (см. [`public/fonts/README.md`](./public/fonts/README.md)). Без файла заголовки используют системный fallback Georgia/serif.

## Полезные команды

```bash
npm run db:up           # поднять Postgres
npm run db:down         # остановить
npm run db:psql         # psql-сессия в БД
npm run db:generate     # сгенерировать миграцию из изменений schema.ts
npm run db:migrate      # применить миграции
npm run db:studio       # Drizzle Studio (UI для БД)
```

## Чтобы сбросить базу

```bash
npm run db:down
docker volume rm athome-admin_athome-pgdata
npm run db:up
npm run db:migrate
```

## Структура

- `app/(auth)/` — `/login`, `/register`. Регистрация работает только пока `trainers` пуст.
- `app/(app)/` — основные экраны: `/today`, `/clients`, `/dashboard`, `/settings`. Защищены `proxy.ts` (Next.js 16-имя для middleware).
- `lib/db/` — Drizzle схема и клиент.
- `lib/auth/` — Auth.js v5 конфиг (edge-safe для proxy + полный с БД для server actions).
- `lib/triggers/` — пороги и (на след. этапах) функция `computeTrigger`.
- `components/ui/` — атомы (Button, Input, Card, EmptyState).
- `components/nav/` — Sidebar, MobileTabBar.
