# Vercel и локальные секреты

Этот проект использует два независимых набора переменных окружения:

- **Production/Preview на Vercel** — хранятся в настройках проекта Vercel и используются при деплое.
- **Локальная разработка** — хранится в локальном `.env.local`, не коммитится и нужна только для запуска на машине разработчика.

Главное правило: локальный `.env.local` не участвует в production deploy. Можно продолжать разработку на `dev`, мержить изменения в `main` и пушить `main`; Vercel возьмет переменные окружения со своей платформы.

## Production на Vercel

Проект Vercel:

- Team: `thermojams-projects`
- Project: `athome-admin`
- Production URL: `https://athome-admin-thermojams-projects.vercel.app`
- Public alias: `https://athome-admin-gold.vercel.app`
- Database: Neon resource `athome-admin-db`

Production-секреты задаются в Vercel Dashboard:

`Project -> Settings -> Environment Variables`

Нужные переменные:

```txt
DATABASE_URL
AUTH_SECRET
AUTH_URL
LEADS_API_TOKEN
```

Также Neon добавляет дополнительные Postgres-переменные вроде `POSTGRES_URL`, `POSTGRES_HOST`, `PGHOST`, `PGUSER`, `PGPASSWORD`, `DATABASE_URL_UNPOOLED`. Их не нужно дублировать вручную, если Neon-интеграция уже подключена к проекту.

### Что делает каждая переменная

`DATABASE_URL`
: Строка подключения к Neon/Postgres. На Vercel ее должна предоставлять Neon-интеграция. Не заменять на `localhost`.

`AUTH_SECRET`
: Секрет Auth.js для подписи сессий/JWT. Генерируется отдельно для Vercel. Не должен совпадать с локальным учебным значением.

`AUTH_URL`
: Канонический production URL приложения. Сейчас: `https://athome-admin-thermojams-projects.vercel.app`.

`LEADS_API_TOKEN`
: Секрет для защищенных lead/API операций. Генерируется отдельно для production.

## Preview на Vercel

Preview deployments тоже используют переменные из Vercel, а не локальный `.env.local`.

Минимально для Preview должны быть доступны:

```txt
DATABASE_URL
AUTH_SECRET
LEADS_API_TOKEN
```

`AUTH_URL` для Preview лучше не фиксировать на один preview URL. Если задать его только на production, preview-сборки не будут зависеть от случайного одноразового deployment-домена.

## Доступ с телефона

Production-домены должны открываться без Vercel SSO:

```txt
https://athome-admin-thermojams-projects.vercel.app
https://athome-admin-gold.vercel.app
```

Если пользователь не авторизован в самом приложении, это нормально: домен должен вести на `/login` приложения, а не на `vercel.com/sso-api`.

Для проекта отключена Vercel SSO deployment protection. Включенной остается собственная авторизация приложения через Auth.js.

## Локальная разработка

Локальная разработка идет от Docker Postgres из `docker-compose.yml`.

Локальный `.env.local` должен выглядеть так:

```txt
DATABASE_URL=postgres://postgres:postgres@localhost:5433/athome
AUTH_SECRET=local-development-secret-change-if-shared
AUTH_URL=http://localhost:3000
LEADS_API_TOKEN=local-development-token
```

Этот файл не коммитится. Он нужен только для локального `next dev`, `next build`, Drizzle migrations и других команд на машине разработчика.

Локальный запуск:

```bash
npm run db:up
npm run db:migrate
npm run dev
```

Проверки перед merge:

```bash
npm run lint
npm run build
```

## Рабочий процесс веток

Рекомендуемый поток:

1. Работать локально на `dev`.
2. Использовать локальный `.env.local` с `localhost:5433`.
3. Проверять изменения локально через Docker Postgres.
4. Мержить `dev` в `main`.
5. Пушить `main` в GitHub.
6. Vercel автоматически собирает и деплоит `main`, используя env vars из Vercel Project Settings.

Локальный `.env.local` не попадает в Git и не может переопределить Vercel production secrets при Git-based deploy.

## Если локальный `.env.local` сломался

Vercel CLI может перезаписать `.env.local`, например после `vercel env pull` или установки интеграции. Если локальная база перестала работать и в `.env.local` исчез `DATABASE_URL=postgres://postgres:postgres@localhost:5433/athome`, восстанови локальный файл по шаблону выше.

Симптомы:

- `npm run db:migrate` падает из-за отсутствия `DATABASE_URL`.
- `npm run build` падает при сборке auth/API routes.
- Локальная разработка случайно смотрит не на Docker Postgres.

Быстрая проверка без вывода секретов:

```bash
node -e "require('dotenv').config({path:'.env.local'}); const url = new URL(process.env.DATABASE_URL); console.log({host:url.hostname, port:url.port, authUrl:process.env.AUTH_URL})"
```

Ожидаемый локальный результат:

```txt
{ host: 'localhost', port: '5433', authUrl: 'http://localhost:3000' }
```

## Что нельзя делать

- Не коммитить `.env.local`.
- Не вставлять production `DATABASE_URL`, `AUTH_SECRET` или `LEADS_API_TOKEN` в README, docs, issues или чат.
- Не заменять Vercel `DATABASE_URL` на локальный `localhost`.
- Не использовать production Neon DB для обычной локальной разработки.
- Не запускать `vercel env pull` поверх локального `.env.local` без понимания, что файл может быть перезаписан.

## Когда нужны миграции

Если изменилась Drizzle-схема:

1. На `dev`: сгенерировать миграцию и проверить ее локально.
2. Перед production deploy: применить миграции к Vercel/Neon окружению.
3. После этого пушить/деплоить `main`.

Команда для применения миграций к production env через Vercel CLI:

```bash
npx vercel env run -e production -- npm run db:migrate
```

Эта команда берет `DATABASE_URL` из Vercel, а не из локального `.env.local`.
