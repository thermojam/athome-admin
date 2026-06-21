# Этап 1: Фундамент — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:
> executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Запускаемая основа «Штаба» — зарегистрировать первого тренера через `/register`, войти на `/login`, увидеть
пустой `/today` со штатным EmptyState. После этого этапа продукт уже включается, но пока ничего не делает кроме
приветствия.

**Architecture:** Next.js 16 App Router с RSC по умолчанию. Все мутации — Server Actions. Auth.js v5 credentials
provider, JWT-сессия. Drizzle ORM поверх локального Postgres в Docker. Tailwind 4 с токенами брендбука через `@theme` в
`globals.css`. В Next.js 16 `middleware.ts` переименован в `proxy.ts` — используем новое имя.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, TypeScript strict, Tailwind 4, Drizzle ORM, pg, Auth.js v5 (next-auth),
argon2, zod, lucide-react, next/font, Docker Compose Postgres.

**Без автотестов** — решение пользователя. Каждая задача завершается ручной проверкой в браузере / в БД через `psql` и
коммитом.

---

## File map

**Создаём:**

- `docker-compose.yml`
- `.env.example`
- `.env.local` (в .gitignore)
- `drizzle.config.ts`
- `proxy.ts` (бывший middleware.ts)
- `lib/db/index.ts`, `lib/db/schema.ts`
- `lib/auth/config.ts`, `lib/auth/edge.ts`, `lib/auth/password.ts`, `lib/auth/register.ts`
- `lib/triggers/defaults.ts`
- `app/api/auth/[...nextauth]/route.ts`
- `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`
- `app/(app)/layout.tsx`
- `app/(app)/today/page.tsx`, `app/(app)/clients/page.tsx`, `app/(app)/dashboard/page.tsx`,
  `app/(app)/settings/page.tsx`
- `components/ui/Button.tsx`, `components/ui/Input.tsx`, `components/ui/EmptyState.tsx`, `components/ui/Card.tsx`
- `components/nav/Sidebar.tsx`, `components/nav/MobileTabBar.tsx`, `components/nav/NavLink.tsx`
- `public/fonts/README.md`
- `drizzle/*` (генерация drizzle-kit)
- `types/next-auth.d.ts`

**Меняем:**

- `package.json` (добавляются зависимости и scripts)
- `app/globals.css` (заменяется на Tailwind 4 + токены брендбука)
- `app/layout.tsx` (шрифты, body-стили)
- `app/page.tsx` (редирект на /today)
- `.gitignore` (добавить .env.local и Drizzle артефакты)
- `README.md` (инструкции запуска)

---

## Task 0: Сверить с docs Next.js 16

**Файлы:** только чтение.

- [ ] **Step 1: Открыть и прочитать ключевые разделы docs Next.js 16**

Согласно `AGENTS.md`, Next.js 16 имеет breaking changes. Прочитать перед кодом:

```bash
cat node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md | head -100
cat node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md | head -120
cat node_modules/next/dist/docs/01-app/01-getting-started/11-css.md | head -80
cat node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md | head -120
cat node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md | head -100
cat node_modules/next/dist/docs/01-app/01-getting-started/18-upgrading.md | head -120
```

Ключевое, что нужно подтвердить:

- В Next.js 16 файл `middleware.ts` переименован в `proxy.ts` (та же функциональность).
- Tailwind 4 подключается через `@tailwindcss/postcss` и `@import 'tailwindcss'` в `globals.css`.
- Шрифты через `next/font/google` и `next/font/local`.
- Server Actions через `'use server'`.

- [ ] **Step 2: Зафиксировать заметку (не коммитим)**

Никаких файловых изменений; результат — устранение «слепых пятен» по новому API. Этот task завершается без коммита, мы
просто переходим к task 1 с подтверждённым пониманием.

---

## Task 1: Установить зависимости

**Файлы:**

- Изменить: `package.json`

- [ ] **Step 1: Установить runtime-зависимости**

```bash
npm install drizzle-orm pg next-auth@beta @auth/drizzle-adapter argon2 zod papaparse lucide-react
```

- [ ] **Step 2: Установить dev-зависимости**

```bash
npm install -D drizzle-kit @types/pg @types/papaparse tsx
```

- [ ] **Step 3: Добавить scripts в package.json**

Открыть `package.json`. Заменить блок `"scripts"`:

```json
"scripts": {
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "eslint",
"db:up": "docker compose up -d postgres",
"db:down": "docker compose down",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio",
"db:psql": "docker compose exec postgres psql -U postgres -d athome"
}
```

- [ ] **Step 4: Manual verify**

```bash
npm install
npm run lint
```

Ожидается: `npm install` завершается без `peer dependency` ошибок (warning'и про deprecated пакеты допустимы).
`npm run lint` отрабатывает без ошибок на текущем дефолтном `app/page.tsx`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Drizzle, Auth.js v5, argon2, zod, papaparse, lucide-react"
```

---

## Task 2: Docker Compose Postgres + ENV

**Файлы:**

- Создать: `docker-compose.yml`
- Создать: `.env.example`
- Создать: `.env.local`
- Изменить: `.gitignore`

- [ ] **Step 1: Создать `docker-compose.yml`**

```yaml
services:
    postgres:
        image: postgres:16-alpine
        container_name: athome-postgres
        environment:
            POSTGRES_USER: postgres
            POSTGRES_PASSWORD: postgres
            POSTGRES_DB: athome
        ports:
            - "5432:5432"
        volumes:
            - athome-pgdata:/var/lib/postgresql/data
        healthcheck:
            test: [ "CMD-SHELL", "pg_isready -U postgres -d athome" ]
            interval: 5s
            timeout: 3s
            retries: 10

volumes:
    athome-pgdata:
```

- [ ] **Step 2: Создать `.env.example`**

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/athome
AUTH_SECRET=replace-with-output-of-openssl-rand-base64-32
AUTH_URL=http://localhost:3000
LEADS_API_TOKEN=replace-with-random-string
```

- [ ] **Step 3: Создать `.env.local` с реальными значениями**

```bash
cat > .env.local <<'EOF'
DATABASE_URL=postgres://postgres:postgres@localhost:5432/athome
AUTH_SECRET=$(openssl rand -base64 32)
AUTH_URL=http://localhost:3000
LEADS_API_TOKEN=$(openssl rand -hex 24)
EOF
```

(Файл создаём вручную через текстовый редактор, если в shell `EOF`-блок отрабатывает с буквальной подстановкой
`$(...)` — заменяем строки на реальные выходы `openssl rand -base64 32` и `openssl rand -hex 24`.)

- [ ] **Step 4: Добавить `.env.local` и Drizzle артефакты в `.gitignore`**

Открыть `.gitignore` и дописать в конец:

```
# env
.env.local
.env*.local

# drizzle (опционально храним только миграции, не meta-файлы)
# /drizzle/meta
```

- [ ] **Step 5: Поднять Postgres и проверить**

```bash
npm run db:up
docker compose ps
```

Ожидается: контейнер `athome-postgres` в статусе `healthy` (может занять 5-10 сек).

- [ ] **Step 6: Подключиться через psql**

```bash
npm run db:psql -- -c "SELECT version();"
```

Ожидается: вывод вида `PostgreSQL 16.x on ...`.

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml .env.example .gitignore
git commit -m "chore: add Docker Compose Postgres and .env.example"
```

`.env.local` НЕ коммитим (он в .gitignore).

---

## Task 3: Drizzle config, схема trainers, первая миграция

**Файлы:**

- Создать: `drizzle.config.ts`
- Создать: `lib/db/index.ts`
- Создать: `lib/db/schema.ts`
- Создать: `lib/triggers/defaults.ts`
- Создать: `drizzle/0000_*.sql` (автоген)

- [ ] **Step 1: Создать `drizzle.config.ts`**

```ts
import {defineConfig} from 'drizzle-kit';
import {config} from 'dotenv';

config({path: '.env.local'});

export default defineConfig({
    schema: './lib/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    strict: true,
    verbose: true,
});
```

- [ ] **Step 2: Установить dotenv для drizzle-kit**

```bash
npm install -D dotenv
```

- [ ] **Step 3: Создать `lib/triggers/defaults.ts`**

```ts
export const DEFAULT_THRESHOLDS = {
    leadStaleDays: 3,
    activeFreshDays: 10,
    activeStaleDays: 21,
    cooledStaleDays: 30,
    silentDays: 45,
} as const;

export const DEFAULT_PROMPT_TEMPLATE = `Ты — мой помощник-копирайтер. Я тренер на дому, веду базу клиентов. По строкам ниже собери черновики коротких личных сообщений в моём голосе: тёплых, без сюсюканья, без эмодзи в начале, с обращением по имени и упоминанием личного факта. На каждую строку — один черновик, 2-4 предложения, заканчивающийся открытым вопросом или приглашением.`;
```

- [ ] **Step 4: Создать `lib/db/schema.ts` (только trainers на этом этапе)**

```ts
import {pgTable, uuid, text, jsonb, timestamp} from 'drizzle-orm/pg-core';
import {DEFAULT_THRESHOLDS, DEFAULT_PROMPT_TEMPLATE} from '@/lib/triggers/defaults';

export type TrainerSettings = {
    promptTemplate: string;
    thresholds: {
        leadStaleDays: number;
        activeFreshDays: number;
        activeStaleDays: number;
        cooledStaleDays: number;
        silentDays: number;
    };
};

export const DEFAULT_TRAINER_SETTINGS: TrainerSettings = {
    promptTemplate: DEFAULT_PROMPT_TEMPLATE,
    thresholds: {...DEFAULT_THRESHOLDS},
};

export const trainers = pgTable('trainers', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    settings: jsonb('settings').$type<TrainerSettings>().notNull(),
    createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
});

export type Trainer = typeof trainers.$inferSelect;
export type NewTrainer = typeof trainers.$inferInsert;
```

- [ ] **Step 5: Создать `lib/db/index.ts`**

```ts
import {drizzle} from 'drizzle-orm/node-postgres';
import {Pool} from 'pg';
import * as schema from './schema';

declare global {
    var __athomePool: Pool | undefined;
}

const pool =
    globalThis.__athomePool ??
    new Pool({connectionString: process.env.DATABASE_URL});

if (process.env.NODE_ENV !== 'production') {
    globalThis.__athomePool = pool;
}

export const db = drizzle(pool, {schema});
export {schema};
```

- [ ] **Step 6: Сгенерировать миграцию**

```bash
npm run db:generate
```

Ожидается: в `drizzle/` появился файл `0000_*.sql` с `CREATE TABLE trainers ...` и `drizzle/meta/` с метой.

- [ ] **Step 7: Применить миграцию**

```bash
npm run db:migrate
```

Ожидается: вывод вида `applying migration 0000_...`. Без ошибок.

- [ ] **Step 8: Manual verify**

```bash
npm run db:psql -- -c "\d trainers"
```

Ожидается: таблица `trainers` со столбцами `id`, `email`, `password_hash`, `name`, `settings`, `created_at`.

- [ ] **Step 9: Commit**

```bash
git add drizzle.config.ts lib/db lib/triggers drizzle/ package.json package-lock.json
git commit -m "feat(db): Drizzle config, trainers schema, default thresholds and prompt"
```

---

## Task 4: Шрифты

**Файлы:**

- Изменить: `app/layout.tsx`
- Создать: `public/fonts/README.md`

- [ ] **Step 1: Создать `public/fonts/README.md`**

```markdown
# Шрифты «Штаба»

## Gerhaus (заголовки)

Этот файл нужен для полного соответствия дизайн-системе. Положи сюда:

- `gerhaus-regular.woff2` (400)
- `gerhaus-medium.woff2` (500) — опционально

Пока файл отсутствует, заголовки фолбэкаются на Georgia/serif — это приемлемо для разработки, но не для продакшена.
После добавления .woff2 — раскомментируй блок `localFont` в `app/layout.tsx`.

## Nunito и JetBrains Mono

Подключаются через `next/font/google` автоматически — ничего класть не нужно.
```

- [ ] **Step 2: Создать пустую папку `public/fonts/` если её нет**

```bash
mkdir -p public/fonts
touch public/fonts/.gitkeep
```

- [ ] **Step 3: Изменить `app/layout.tsx` — подключить Nunito + JetBrains Mono**

Полностью заменить содержимое `app/layout.tsx`:

```tsx
import type {Metadata} from 'next';
import {Nunito, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const nunito = Nunito({
    subsets: ['latin', 'cyrillic'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-sans-loaded',
    display: 'swap',
});

const jetbrains = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['400', '500'],
    variable: '--font-mono-loaded',
    display: 'swap',
});

// TODO: когда положишь Gerhaus в public/fonts — раскомментируй и убери fallback
// import localFont from 'next/font/local';
// const gerhaus = localFont({
//   src: [{ path: '../public/fonts/gerhaus-regular.woff2', weight: '400', style: 'normal' }],
//   variable: '--font-display-loaded',
//   display: 'swap',
//   fallback: ['Georgia', 'serif'],
// });

export const metadata: Metadata = {
    title: 'Штаб',
    description: 'Админка тренера: база клиентов и пятничный ритуал',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ru" className={`${nunito.variable} ${jetbrains.variable}`}>
        <body>{children}</body>
        </html>
    );
}
```

- [ ] **Step 4: Manual verify**

```bash
npm run dev
```

Открыть `http://localhost:3000`. Дефолтная страница Next.js должна загрузиться без ошибок в консоли. На вкладке Network
в DevTools проверить: шрифты Nunito и JetBrains Mono подгружаются с `/_next/static/media/...`.

Остановить dev: Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx public/fonts
git commit -m "feat(ui): подключить Nunito и JetBrains Mono через next/font"
```

---

## Task 5: globals.css с токенами брендбука (Tailwind 4)

**Файлы:**

- Изменить: `app/globals.css`

- [ ] **Step 1: Полностью заменить содержимое `app/globals.css`**

```css
@import 'tailwindcss';

@theme {
    /* фон и подложки */
    --color-bg: #0E1117;
    --color-bg-2: #151923;
    --color-bg-3: #1B2030;
    --color-bg-glass: #141925;

    /* текст */
    --color-tx: #E8ECF4;
    --color-tx-2: #9AA3B5;
    --color-tx-3: #5E6678;

    /* акценты */
    --color-cyan: #2CE6FF;
    --color-violet: #8B5CFF;
    --color-pink: #FF4FD8;
    --color-green: #36FF9D;
    --color-orange: #FF9F43;
    --color-blue: #4D7DFF;

    /* линии */
    --color-line: rgb(255 255 255 / 0.09);
    --color-line-soft: rgb(255 255 255 / 0.055);

    /* радиусы */
    --radius-sm: 12px;
    --radius-md: 16px;
    --radius-lg: 22px;

    /* шрифты — переменные подключаются через next/font/google */
    --font-display: 'Gerhaus', Georgia, serif;
    --font-sans: var(--font-sans-loaded, 'Nunito'), system-ui, sans-serif;
    --font-mono: var(--font-mono-loaded, 'JetBrains Mono'), monospace;

    /* движение */
    --ease-soft: cubic-bezier(.2, .7, .2, 1);

    /* свечение */
    --shadow-glow: 0 0 24px rgb(44 230 255 / 0.35);
    --shadow-glow-orange: 0 0 20px rgb(255 159 67 / 0.30);
}

@layer base {
    html, body {
        background-color: var(--color-bg);
        color: var(--color-tx);
        font-family: var(--font-sans);
        min-height: 100vh;
        -webkit-font-smoothing: antialiased;
    }

    body {
        background-image: radial-gradient(at 10% 0%, rgb(139 92 255 / 0.15) 0%, transparent 50%),
        radial-gradient(at 90% 0%, rgb(44 230 255 / 0.10) 0%, transparent 50%);
        background-attachment: fixed;
    }

    *:focus-visible {
        outline: 2px solid var(--color-cyan);
        outline-offset: 2px;
        border-radius: 4px;
    }
}

@layer components {
    /* стеклянная карточка */
    .glass {
        background: linear-gradient(180deg, var(--color-bg-glass) 0%, color-mix(in oklab, var(--color-bg-glass) 92%, white 8%) 100%);
        border: 1px solid var(--color-line);
        box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.10),
        0 4px 24px rgb(0 0 0 / 0.30),
        0 1px 2px rgb(0 0 0 / 0.20);
        border-radius: var(--radius-lg);
    }

    /* hairline-разделитель */
    .hairline {
        border-color: var(--color-line-soft);
    }
}
```

- [ ] **Step 2: Manual verify**

```bash
npm run dev
```

Открыть `http://localhost:3000`. Дефолтная страница должна загружаться **на тёмном фоне** с radial-градиентами
violet/cyan в верхних углах. Текст должен быть светлым (`#E8ECF4`).

Остановить dev.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui): Tailwind 4 токены брендбука и базовая тёмная тема"
```

---

## Task 6: Заменить дефолтный `app/page.tsx` на редирект

**Файлы:**

- Изменить: `app/page.tsx`

- [ ] **Step 1: Полностью заменить `app/page.tsx`**

```tsx
import {redirect} from 'next/navigation';

export default function RootPage() {
    redirect('/today');
}
```

- [ ] **Step 2: Manual verify**

```bash
npm run dev
```

Открыть `http://localhost:3000` — должно перебросить на `/today`. Поскольку страницы `/today` пока нет, появится 404
Next.js. Это нормально.

Остановить dev.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redirect / → /today"
```

---

## Task 7: argon2-хеш пароля

**Файлы:**

- Создать: `lib/auth/password.ts`

- [ ] **Step 1: Создать `lib/auth/password.ts`**

```ts
import argon2 from 'argon2';

const ARGON2_OPTIONS: argon2.Options = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
    try {
        return await argon2.verify(hash, plain);
    } catch {
        return false;
    }
}
```

- [ ] **Step 2: Manual verify через ts-node-подобный запуск**

```bash
npx tsx -e "
import('./lib/auth/password.ts').then(async (m) => {
  const hash = await m.hashPassword('hello123');
  console.log('hash starts with:', hash.slice(0, 30));
  console.log('verify correct:', await m.verifyPassword('hello123', hash));
  console.log('verify wrong:', await m.verifyPassword('wrong', hash));
});
"
```

Ожидается: `hash starts with: $argon2id$v=19$...`, `verify correct: true`, `verify wrong: false`.

- [ ] **Step 3: Commit**

```bash
git add lib/auth/password.ts
git commit -m "feat(auth): argon2id helpers для хеша и проверки пароля"
```

---

## Task 8: Auth.js v5 конфиг и API route

**Файлы:**

- Создать: `lib/auth/config.ts`
- Создать: `lib/auth/edge.ts`
- Создать: `app/api/auth/[...nextauth]/route.ts`
- Создать: `types/next-auth.d.ts`

- [ ] **Step 1: Создать `lib/auth/edge.ts` (edge-safe конфиг для proxy.ts)**

```ts
import type {NextAuthConfig} from 'next-auth';

export const authEdgeConfig: NextAuthConfig = {
    session: {strategy: 'jwt'},
    pages: {signIn: '/login'},
    providers: [],
    callbacks: {
        authorized({auth, request}) {
            const {pathname} = request.nextUrl;
            const isAuthed = !!auth?.user;

            const isAuthPage =
                pathname === '/login' ||
                pathname === '/register' ||
                pathname.startsWith('/api/auth');

            if (isAuthPage) {
                // если уже залогинен, /login и /register не нужны — отправим на /today
                if (isAuthed && (pathname === '/login' || pathname === '/register')) {
                    return Response.redirect(new URL('/today', request.nextUrl));
                }
                return true;
            }

            return isAuthed;
        },
        async jwt({token, user}) {
            if (user) token.id = (user as { id: string }).id;
            return token;
        },
        async session({session, token}) {
            if (token.id && session.user) {
                (session.user as { id?: string }).id = token.id as string;
            }
            return session;
        },
    },
};
```

- [ ] **Step 2: Создать `lib/auth/config.ts` (полный конфиг с providers и БД)**

```ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {z} from 'zod';
import {eq} from 'drizzle-orm';
import {db} from '@/lib/db';
import {trainers} from '@/lib/db/schema';
import {verifyPassword} from './password';
import {authEdgeConfig} from './edge';

export const {handlers, signIn, signOut, auth} = NextAuth({
    ...authEdgeConfig,
    providers: [
        Credentials({
            credentials: {
                email: {label: 'Email', type: 'email'},
                password: {label: 'Пароль', type: 'password'},
            },
            async authorize(credentials) {
                const parsed = z
                    .object({email: z.string().email(), password: z.string().min(1)})
                    .safeParse(credentials);
                if (!parsed.success) return null;

                const [trainer] = await db
                    .select()
                    .from(trainers)
                    .where(eq(trainers.email, parsed.data.email))
                    .limit(1);
                if (!trainer) return null;

                const ok = await verifyPassword(parsed.data.password, trainer.passwordHash);
                if (!ok) return null;

                return {id: trainer.id, email: trainer.email, name: trainer.name};
            },
        }),
    ],
});
```

- [ ] **Step 3: Создать API route `app/api/auth/[...nextauth]/route.ts`**

```ts
import {handlers} from '@/lib/auth/config';

export const {GET, POST} = handlers;
```

- [ ] **Step 4: Расширить типы Auth.js в `types/next-auth.d.ts`**

```ts
import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
        };
    }

    interface User {
        id: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string;
    }
}
```

Включить путь в `tsconfig.json` — он уже включает `**/*.ts`, отдельных правок не нужно.

- [ ] **Step 5: Manual verify**

```bash
npm run dev
```

Открыть `http://localhost:3000/api/auth/providers`. Ожидается JSON-ответ вида:

```json
{
    "credentials": {
        "id": "credentials",
        "name": "Credentials",
        "type": "credentials",
        "signinUrl": "...",
        "callbackUrl": "..."
    }
}
```

Остановить dev.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/config.ts lib/auth/edge.ts app/api/auth types/next-auth.d.ts
git commit -m "feat(auth): Auth.js v5 credentials provider, edge config, API route"
```

---

## Task 9: proxy.ts — защита маршрутов

**Файлы:**

- Создать: `proxy.ts`

- [ ] **Step 1: Создать `proxy.ts` в корне (Next.js 16: бывший middleware.ts)**

```ts
import NextAuth from 'next-auth';
import {authEdgeConfig} from '@/lib/auth/edge';

export const {auth: proxy} = NextAuth(authEdgeConfig);

export const config = {
    // Исключаем /api целиком — API-роуты сами решают про авторизацию;
    // также исключаем статику Next и шрифты.
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|fonts/).*)'],
};
```

- [ ] **Step 2: Manual verify — незалогиненный пользователь перенаправляется**

```bash
npm run dev
```

Открыть в режиме инкогнито `http://localhost:3000/today`. Должно перебросить на `/login` (страницы пока нет → 404 на
/login, это ок).

Открыть `http://localhost:3000/api/auth/providers` — должен по-прежнему отдавать JSON (matcher явно исключает `/api/*`,
поэтому proxy.ts не вмешивается).

Остановить dev.

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat(auth): proxy.ts (Next.js 16) защищает маршруты Auth.js сессией"
```

---

## Task 10: Server action register с гейтом «trainers пуст»

**Файлы:**

- Создать: `lib/auth/register.ts`

- [ ] **Step 1: Создать `lib/auth/register.ts`**

```ts
'use server';

import {z} from 'zod';
import {count} from 'drizzle-orm';
import {db} from '@/lib/db';
import {trainers, DEFAULT_TRAINER_SETTINGS} from '@/lib/db/schema';
import {hashPassword} from './password';
import {signIn} from './config';

const RegisterSchema = z.object({
    name: z.string().trim().min(1, 'Имя обязательно').max(80),
    email: z.string().trim().toLowerCase().email('Похоже на не-email'),
    password: z.string().min(8, 'Минимум 8 символов').max(128),
});

export type RegisterResult =
    | { ok: true }
    | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function registerFirstTrainer(formData: FormData): Promise<RegisterResult> {
    const parsed = RegisterSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    });

    if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
            fieldErrors[issue.path[0] as string] = issue.message;
        }
        return {ok: false, error: 'Проверь поля и попробуй ещё раз', fieldErrors};
    }

    // Гейт: регистрация работает только пока trainers пуст
    const [{value: existing}] = await db
        .select({value: count()})
        .from(trainers);
    if (existing > 0) {
        return {ok: false, error: 'Регистрация закрыта — тренер уже заведён. Заходи через /login.'};
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await db.insert(trainers).values({
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
        settings: DEFAULT_TRAINER_SETTINGS,
    });

    // сразу логиним
    await signIn('credentials', {
        email: parsed.data.email,
        password: parsed.data.password,
        redirectTo: '/today',
    });

    return {ok: true};
}

export async function trainersExist(): Promise<boolean> {
    const [{value}] = await db.select({value: count()}).from(trainers);
    return value > 0;
}
```

- [ ] **Step 2: Manual verify через тест-вызов**

```bash
npx tsx -e "
import('./lib/auth/register.ts').then(async (m) => {
  console.log('trainers exist:', await m.trainersExist());
});
"
```

Ожидается: `trainers exist: false` (база пуста).

- [ ] **Step 3: Commit**

```bash
git add lib/auth/register.ts
git commit -m "feat(auth): server action регистрации первого тренера + гейт"
```

---

## Task 11: UI-атомы

**Файлы:**

- Создать: `components/ui/Button.tsx`
- Создать: `components/ui/Input.tsx`
- Создать: `components/ui/Card.tsx`
- Создать: `components/ui/EmptyState.tsx`

- [ ] **Step 1: `components/ui/Button.tsx`**

```tsx
import {forwardRef, type ButtonHTMLAttributes} from 'react';
import {clsx} from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
};

const variantClasses: Record<Variant, string> = {
    primary:
        'bg-cyan text-bg shadow-[var(--shadow-glow)] hover:-translate-y-0.5 ring-1 ring-cyan/40',
    secondary:
        'glass text-tx hover:bg-bg-3',
    ghost:
        'text-tx-2 hover:text-tx hover:bg-bg-3',
};

const sizeClasses: Record<Size, string> = {
    sm: 'h-9 px-3 text-[13px] rounded-[var(--radius-sm)]',
    md: 'h-11 px-4 text-[15px] rounded-[var(--radius-md)]',
    lg: 'h-14 px-6 text-[17px] rounded-[var(--radius-md)] font-medium',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
    {variant = 'secondary', size = 'md', className, disabled, children, ...rest},
    ref,
) {
    return (
        <button
            ref={ref}
            disabled={disabled}
            className={clsx(
                'inline-flex items-center justify-center gap-2 font-sans transition-all duration-200 ease-[var(--ease-soft)]',
                'disabled:opacity-50 disabled:pointer-events-none',
                variantClasses[variant],
                sizeClasses[size],
                className,
            )}
            {...rest}
        >
            {children}
        </button>
    );
});
```

- [ ] **Step 2: Установить `clsx`**

```bash
npm install clsx
```

- [ ] **Step 3: `components/ui/Input.tsx`**

```tsx
import {forwardRef, type InputHTMLAttributes} from 'react';
import {clsx} from 'clsx';

type Props = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
    {label, error, className, id, ...rest},
    ref,
) {
    const inputId = id ?? rest.name;
    return (
        <label htmlFor={inputId} className="flex flex-col gap-1.5">
            {label && (
                <span className="text-[13px] text-tx-2 font-medium tracking-[0.01em]">{label}</span>
            )}
            <input
                ref={ref}
                id={inputId}
                className={clsx(
                    'h-11 px-3 rounded-[var(--radius-sm)] bg-bg-3 text-tx',
                    'border border-line focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/40',
                    'transition-all duration-150 ease-[var(--ease-soft)]',
                    error && 'border-orange focus:border-orange focus:ring-orange/40',
                    className,
                )}
                aria-invalid={!!error}
                aria-describedby={error ? `${inputId}-err` : undefined}
                {...rest}
            />
            {error && (
                <span id={`${inputId}-err`} className="text-[13px] text-orange">
          {error}
        </span>
            )}
        </label>
    );
});
```

- [ ] **Step 4: `components/ui/Card.tsx`**

```tsx
import type {HTMLAttributes} from 'react';
import {clsx} from 'clsx';

type Props = HTMLAttributes<HTMLDivElement>;

export function Card({className, children, ...rest}: Props) {
    return (
        <div className={clsx('glass p-5', className)} {...rest}>
            {children}
        </div>
    );
}
```

- [ ] **Step 5: `components/ui/EmptyState.tsx`**

```tsx
import type {ReactNode} from 'react';

type Props = {
    title: string;
    hint?: string;
    action?: ReactNode;
};

export function EmptyState({title, hint, action}: Props) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-3">
            <h2 className="font-display uppercase text-[22px] tracking-wide text-tx">
                {title}
            </h2>
            {hint && <p className="text-tx-2 max-w-md">{hint}</p>}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}
```

- [ ] **Step 6: Manual verify (sanity-сборка)**

```bash
npm run build
```

Ожидается: build завершается без ошибок TypeScript.

- [ ] **Step 7: Commit**

```bash
git add components/ui package.json package-lock.json
git commit -m "feat(ui): атомы Button, Input, Card, EmptyState"
```

---

## Task 12: (auth) route group, /login, /register

**Файлы:**

- Создать: `app/(auth)/layout.tsx`
- Создать: `app/(auth)/login/page.tsx`
- Создать: `app/(auth)/register/page.tsx`

- [ ] **Step 1: `app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({children}: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-[400px]">{children}</div>
        </main>
    );
}
```

- [ ] **Step 2: `app/(auth)/login/page.tsx`**

```tsx
import {redirect} from 'next/navigation';
import {signIn, auth} from '@/lib/auth/config';
import {Card} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {trainersExist} from '@/lib/auth/register';

export default async function LoginPage({
                                            searchParams,
                                        }: {
    searchParams: Promise<{ error?: string }>;
}) {
    const session = await auth();
    if (session?.user) redirect('/today');

    const noTrainer = !(await trainersExist());
    if (noTrainer) redirect('/register');

    const {error} = await searchParams;

    async function login(formData: FormData) {
        'use server';
        await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirectTo: '/today',
        });
    }

    return (
        <Card>
            <h1 className="font-display uppercase text-[24px] tracking-wide mb-5">Вход</h1>
            <form action={login} className="flex flex-col gap-4">
                <Input name="email" type="email" label="Email" required autoFocus/>
                <Input name="password" type="password" label="Пароль" required/>
                {error && (
                    <p className="text-[13px] text-orange">
                        Не подошло. Проверь и попробуй ещё раз.
                    </p>
                )}
                <Button type="submit" variant="primary" size="lg" className="mt-2">
                    Войти
                </Button>
            </form>
        </Card>
    );
}
```

- [ ] **Step 3: `app/(auth)/register/page.tsx`**

```tsx
import {redirect} from 'next/navigation';
import {Card} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {registerFirstTrainer, trainersExist} from '@/lib/auth/register';

export default async function RegisterPage() {
    if (await trainersExist()) redirect('/login');

    async function action(formData: FormData) {
        'use server';
        const result = await registerFirstTrainer(formData);
        if (!result.ok) {
            // signIn внутри registerFirstTrainer редиректит сам; сюда попадаем только при ошибке
            throw new Error(result.error);
        }
    }

    return (
        <Card>
            <h1 className="font-display uppercase text-[24px] tracking-wide mb-2">
                Завести тренера
            </h1>
            <p className="text-tx-2 text-[13px] mb-5">
                Один раз. Дальше — только вход.
            </p>
            <form action={action} className="flex flex-col gap-4">
                <Input name="name" label="Имя" required autoFocus/>
                <Input name="email" type="email" label="Email" required/>
                <Input name="password" type="password" label="Пароль (8+ символов)" required minLength={8}/>
                <Button type="submit" variant="primary" size="lg" className="mt-2">
                    Завести и войти
                </Button>
            </form>
        </Card>
    );
}
```

- [ ] **Step 4: Manual verify полного цикла регистрации и входа**

```bash
npm run dev
```

1. Открыть `http://localhost:3000/today` — должно перекинуть на `/login`, оттуда на `/register` (база пуста).
2. Заполнить форму: имя `Тренер`, email `me@example.com`, пароль `password1`.
3. Нажать «Завести и войти». Должно перекинуть на `/today` (страница ещё не существует → 404 Next, но ты в сессии).
4. Открыть `/register` — должно перекинуть на `/login`.
5. Открыть `/login`, ввести email/пароль — снова `/today` (404).
6. Проверить в psql, что тренер в базе:

```bash
npm run db:psql -- -c "SELECT email, name, jsonb_pretty(settings) FROM trainers;"
```

Ожидается: одна строка с введёнными данными и заполненным `settings` (промпт и пороги).

Остановить dev.

- [ ] **Step 5: Commit**

```bash
git add "app/(auth)"
git commit -m "feat(auth): /login и /register с гейтом «trainers пуст»"
```

---

## Task 13: (app) route group, навигация и заглушки страниц

**Файлы:**

- Создать: `components/nav/NavLink.tsx`
- Создать: `components/nav/Sidebar.tsx`
- Создать: `components/nav/MobileTabBar.tsx`
- Создать: `app/(app)/layout.tsx`
- Создать: `app/(app)/today/page.tsx`
- Создать: `app/(app)/clients/page.tsx`
- Создать: `app/(app)/dashboard/page.tsx`
- Создать: `app/(app)/settings/page.tsx`

- [ ] **Step 1: `components/nav/NavLink.tsx`**

```tsx
'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {clsx} from 'clsx';
import type {ReactNode} from 'react';

type Props = {
    href: string;
    icon: ReactNode;
    children: ReactNode;
};

export function NavLink({href, icon, children}: Props) {
    const pathname = usePathname();
    const active = pathname === href || pathname.startsWith(href + '/');

    return (
        <Link
            href={href}
            className={clsx(
                'flex items-center gap-3 h-11 px-3 rounded-[var(--radius-sm)] text-[15px] transition-colors',
                active ? 'bg-bg-3 text-tx' : 'text-tx-2 hover:bg-bg-3 hover:text-tx',
            )}
        >
            <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
            <span>{children}</span>
        </Link>
    );
}
```

- [ ] **Step 2: `components/nav/Sidebar.tsx`**

```tsx
import {CalendarCheck, Users, BarChart3, Settings} from 'lucide-react';
import {NavLink} from './NavLink';
import {signOut, auth} from '@/lib/auth/config';
import {Button} from '@/components/ui/Button';

export async function Sidebar() {
    const session = await auth();

    async function logout() {
        'use server';
        await signOut({redirectTo: '/login'});
    }

    return (
        <aside className="hidden md:flex w-[240px] shrink-0 flex-col p-3 border-r hairline min-h-screen">
            <div className="font-display uppercase text-[20px] tracking-wide px-3 py-4 mb-2">
                Штаб
            </div>
            <nav className="flex flex-col gap-1 flex-1">
                <NavLink href="/today" icon={<CalendarCheck size={18}/>}>Сегодня</NavLink>
                <NavLink href="/clients" icon={<Users size={18}/>}>База</NavLink>
                <NavLink href="/dashboard" icon={<BarChart3 size={18}/>}>Панель</NavLink>
                <NavLink href="/settings" icon={<Settings size={18}/>}>Настройки</NavLink>
            </nav>
            <form action={logout} className="mt-2">
                <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
                    Выйти{session?.user?.name ? ` (${session.user.name})` : ''}
                </Button>
            </form>
        </aside>
    );
}
```

- [ ] **Step 3: `components/nav/MobileTabBar.tsx`**

```tsx
import {CalendarCheck, Users, BarChart3, Settings} from 'lucide-react';
import {NavLink} from './NavLink';

export function MobileTabBar() {
    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg-2/95 backdrop-blur border-t hairline">
            <div className="grid grid-cols-4 gap-1 p-2">
                <NavLink href="/today" icon={<CalendarCheck size={20}/>}>Сегодня</NavLink>
                <NavLink href="/clients" icon={<Users size={20}/>}>База</NavLink>
                <NavLink href="/dashboard" icon={<BarChart3 size={20}/>}>Панель</NavLink>
                <NavLink href="/settings" icon={<Settings size={20}/>}>Настройки</NavLink>
            </div>
        </nav>
    );
}
```

- [ ] **Step 4: `app/(app)/layout.tsx`**

```tsx
import {redirect} from 'next/navigation';
import {auth} from '@/lib/auth/config';
import {Sidebar} from '@/components/nav/Sidebar';
import {MobileTabBar} from '@/components/nav/MobileTabBar';

export default async function AppLayout({children}: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    return (
        <div className="min-h-screen flex">
            <Sidebar/>
            <main className="flex-1 pb-24 md:pb-0">
                <div className="max-w-[1080px] mx-auto px-4 md:px-8 py-6 md:py-10">
                    {children}
                </div>
            </main>
            <MobileTabBar/>
        </div>
    );
}
```

- [ ] **Step 5: `app/(app)/today/page.tsx`**

```tsx
import {EmptyState} from '@/components/ui/EmptyState';

export default function TodayPage() {
    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-6">Сегодня</h1>
            <EmptyState
                title="Триггеров нет"
                hint="База под контролем — так держать."
            />
        </>
    );
}
```

- [ ] **Step 6: `app/(app)/clients/page.tsx`**

```tsx
import {EmptyState} from '@/components/ui/EmptyState';

export default function ClientsPage() {
    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-6">База</h1>
            <EmptyState
                title="База пустая"
                hint="Скоро здесь появятся клиенты — пока добавлять некуда (это будет на следующем этапе)."
            />
        </>
    );
}
```

- [ ] **Step 7: `app/(app)/dashboard/page.tsx`**

```tsx
import {EmptyState} from '@/components/ui/EmptyState';

export default function DashboardPage() {
    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-6">Панель</h1>
            <EmptyState
                title="Первая пятница ещё впереди"
                hint="Здесь появятся счётчики и недельная сводка."
            />
        </>
    );
}
```

- [ ] **Step 8: `app/(app)/settings/page.tsx`**

```tsx
import {EmptyState} from '@/components/ui/EmptyState';

export default function SettingsPage() {
    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-6">Настройки</h1>
            <EmptyState
                title="Настройки появятся ниже"
                hint="Промпт-шаблон, пороги триггеров и смена пароля — в одном из следующих этапов."
            />
        </>
    );
}
```

- [ ] **Step 9: Manual verify полного флоу**

```bash
npm run dev
```

1. Открыть `http://localhost:3000` в инкогнито — перекидывает на `/today` → `/login` → `/register`.
2. Зарегистрироваться (если уже регистрировался ранее — сначала очисти БД:
   `npm run db:psql -- -c "TRUNCATE trainers CASCADE;"`).
3. После регистрации попадаешь на `/today` — видишь заголовок «СЕГОДНЯ» (КАПС, дисплейный шрифт), под ним EmptyState
   «Триггеров нет. База под контролем — так держать.»
4. На десктопе слева видишь сайдбар с 4 пунктами и кнопкой «Выйти». На мобильном (через DevTools toggle device,
   ≤768px) — нижний таб-бар.
5. Проверь все 4 страницы: `/today`, `/clients`, `/dashboard`, `/settings` — у каждой свой заголовок и EmptyState.
6. Активный пункт в навигации — на тёмном фоне `bg-bg-3`.
7. Нажми «Выйти» — должно перекинуть на `/login`. Попробуй `/today` — снова redirect на `/login`.
8. Залогинься. Снова на `/today`.

Если всё пройдено — Этап 1 готов.

Остановить dev.

- [ ] **Step 10: Commit**

```bash
git add components/nav "app/(app)"
git commit -m "feat: защищённый (app) layout, навигация, заглушки 4 страниц"
```

---

## Task 14: README с инструкциями запуска

**Файлы:**

- Изменить: `README.md`

- [ ] **Step 1: Заменить содержимое `README.md`**

```markdown
# Штаб — админка тренера

Внутренний инструмент: база клиентов с автоматическими триггерами «кому пора написать» и экспортом строк для генерации
черновиков в Claude.

Спецификация: [`mvp-spec.md`](./mvp-spec.md). Дизайн-система: [`design-system.md`](./design-system.md).
Дизайн-документ: [
`docs/superpowers/specs/2026-06-15-shtab-mvp-design.md`](./docs/superpowers/specs/2026-06-15-shtab-mvp-design.md).

## Стек

Next.js 16 (App Router, RSC, Server Actions) · React 19 · TypeScript strict · Tailwind 4 · Drizzle ORM + Postgres (
Docker локально) · Auth.js v5 credentials · argon2 · zod · lucide-react.

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

Открыть `http://localhost:3000` — будет редирект на `/register` (база пуста). Заводишь первого тренера, потом дальше
через `/login`.

## Шрифты

- **Nunito** и **JetBrains Mono** подключаются автоматически через `next/font/google`.
- **Gerhaus** (дисплейный, для заголовков): положи `.woff2` в `public/fonts/` (см. [
  `public/fonts/README.md`](./public/fonts/README.md)). Без файла заголовки используют системный fallback Georgia/serif.

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
- `app/(app)/` — основные экраны: `/today`, `/clients`, `/dashboard`, `/settings`. Защищены `proxy.ts` (Next.js 16-имя
  для middleware).
- `lib/db/` — Drizzle схема и клиент.
- `lib/auth/` — Auth.js v5 конфиг (edge-safe для proxy + полный с БД для server actions).
- `lib/triggers/` — пороги и (на след. этапах) функция `computeTrigger`.
- `components/ui/` — атомы (Button, Input, Card, EmptyState).
- `components/nav/` — Sidebar, MobileTabBar.

```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README с инструкциями запуска и структурой проекта"
```

---

## Acceptance — конец этапа 1

После выполнения всех 14 задач:

- [ ] `npm install` чистый, `npm run build` без ошибок.
- [ ] `docker compose up -d` поднимает Postgres, `npm run db:migrate` применяет миграцию `trainers`.
- [ ] Открыв `http://localhost:3000` в инкогнито, попадаешь сначала на `/register`. После регистрации — на `/today`.
- [ ] `/today` показывает «СЕГОДНЯ» в Gerhaus/serif капсом и EmptyState «Триггеров нет. База под контролем — так
  держать.»
- [ ] На десктопе сайдбар с 4 пунктами, на мобильном — нижний таб-бар.
- [ ] Незалогиненный пользователь не может попасть ни на одну `(app)`-страницу — `proxy.ts` редиректит на `/login`.
- [ ] `/register` после регистрации редиректит на `/login` (гейт «trainers пуст» закрыт).
- [ ] В `trainers` лежит одна строка с `settings.thresholds` из спеки и дефолтным `promptTemplate`.

Следующий этап (CRUD клиентов) запускается отдельным планом, ему будут нужны только результаты этого этапа.
