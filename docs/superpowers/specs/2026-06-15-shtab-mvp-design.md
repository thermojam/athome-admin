# Design: «Штаб» — админка тренера, MVP

**Дата:** 2026-06-15
**Источники:** `mvp-spec.md` (продуктовая спека), `design-system.md` (визуальная система), `AGENTS.md` (Next.js 16 — breaking changes).
**Решения по открытым вопросам приняты в этой сессии и зафиксированы ниже.**

---

## 1. Архитектура и стек

### Зафиксированный стек

- **Next.js 16.2.9 + React 19.2.4 + TypeScript strict** — уже инициализированы.
- **Tailwind 4** через `@tailwindcss/postcss` — уже подключён. Токены брендбука переезжают в `globals.css` через `@theme` (Tailwind 4 не использует `tailwind.config.ts`).
- **Drizzle ORM + drizzle-kit** для миграций.
- **`pg`** (node-postgres) как драйвер. Локальный Postgres в Docker; переход на `@neondatabase/serverless` — одной строкой при деплое.
- **NextAuth v5 (Auth.js)** — credentials provider, JWT-сессия.
- **`argon2`** для хеша пароля; **`zod`** для валидации; **`papaparse`** для CSV.
- **Шрифты:** `next/font/google` для Nunito (subset cyrillic) и JetBrains Mono; `next/font/local` для Gerhaus (.woff2 кладёт пользователь в `public/fonts/`).
- **Иконки:** `lucide-react`.
- **Docker Compose** для локального Postgres.

### Решения по открытым вопросам спеки

| Вопрос | Решение |
|---|---|
| Хостинг БД | Локальный Postgres в Docker для разработки. Прод-хостинг (Neon vs Yandex Cloud) откладываем до момента деплоя — Drizzle переезжает без боли. |
| Поддомен | Откладываем до деплоя. Не блокирует разработку. |
| Тестирование | **Без автоматических тестов.** Только sanity-страницы `/dev/*` в dev-режиме. Решение пользователя — приоритет скорости MVP. |
| Первый вход | `/register` активен только пока таблица `trainers` пуста. После seed первого тренера форма недоступна (server-проверка). |
| CSV-эталон | Схема импорта выводится из полей `clients` спеки (15 колонок). Файла `client-base.xlsx` в репозитории нет — мы не от него отталкиваемся. |
| Шрифты | Gerhaus — .woff2 пользователь положит в `public/fonts/`; Nunito и JetBrains Mono — через `next/font/google`. До получения файла Gerhaus — fallback на serif. |

### Серверная модель

- Все мутации UI — **Server Actions** в RSC-страницах. Без API routes для UI.
- Один публичный API route `POST /api/leads` создаётся как задел V2 (приём лидов с внешнего лендинга). В v1 в продакшен не подключается.
- `middleware.ts` защищает всё кроме `/login` и `/register` (с дополнительным server-чеком пустоты `trainers`).

### Структура папок

```
app/
  (auth)/login/page.tsx
  (auth)/register/page.tsx           # активен только при пустом trainers
  (app)/today/page.tsx
  (app)/clients/page.tsx
  (app)/clients/new/page.tsx
  (app)/clients/[id]/page.tsx
  (app)/clients/import/page.tsx
  (app)/leads/new/page.tsx
  (app)/dashboard/page.tsx
  (app)/settings/page.tsx
  (app)/layout.tsx                    # защищённый лейаут с навигацией
  (app)/dev/triggers-sanity/page.tsx  # только NODE_ENV=development
  (app)/dev/export-sanity/page.tsx    # только NODE_ENV=development
  api/leads/route.ts                  # задел V2
  globals.css
  layout.tsx
lib/
  db/schema.ts
  db/index.ts
  db/seed.ts
  auth/config.ts
  triggers/compute.ts                 # чистая функция
  triggers/query.ts                   # SQL «клиенты + lastTouchDate»
  triggers/defaults.ts                # пороги из спеки
  csv/parse.ts
  csv/synonyms.ts                     # словарь «активный→active» и т.д.
  export/claude.ts
  weekly-stats/compute.ts
  zod/                                # схемы валидации форм
components/
  ui/                                 # Button, Input, Badge, Card, Toast, Modal, Drawer, Skeleton, EmptyState
  client/                             # ClientForm, ClientCard, ClientsTable, ClientsList
  today/                              # TriggerRow, TodayList, CopyForClaudeButton
  touch/                              # TouchButton, TouchModal
  dashboard/                          # WeekRow, LiveCounters
drizzle/                              # миграции
docker-compose.yml
.env.example
```

### Принцип границ

Триггер-логика, CSV-парсер, сборка экспорта — чистые функции в `lib/`. Проверяются вручную через playground-страницы `/dev/*` в dev-режиме. UI-компоненты не знают про БД — данные приходят через server actions.

---

## 2. Схема данных (Drizzle)

```ts
// lib/db/schema.ts
import { pgTable, uuid, text, jsonb, timestamp, integer, boolean, date, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const trainers = pgTable('trainers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  settings: jsonb('settings').$type<TrainerSettings>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerId: uuid('trainer_id').notNull().references(() => trainers.id),
  name: text('name').notNull(),
  contact: text('contact'),
  profile: text('profile', { enum: ['health', 'form', 'energy'] }),
  status: text('status', { enum: ['active', 'vacation', 'cooling', 'lead', 'prebook', 'left'] }).notNull(),
  source: text('source', { enum: ['reception', 'lift1', 'lift2', 'lift3', 'lift4', 'avito', 'referral', 'chat', 'base', 'other'] }),
  personalFact: text('personal_fact'),
  goal: text('goal'),
  sessionsPerWeek: integer('sessions_per_week'),
  lastSessionDate: date('last_session_date'),
  septemberBooking: boolean('september_booking').default(false),
  note: text('note'),
  leadPayload: jsonb('lead_payload'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  trainerIdx: index('clients_trainer_idx').on(t.trainerId),
  statusIdx: index('clients_status_idx').on(t.trainerId, t.status),
}));

export const touches = pgTable('touches', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  trainerId: uuid('trainer_id').notNull().references(() => trainers.id),
  type: text('type', { enum: ['message', 'call', 'training', 'other'] }).notNull(),
  touchedAt: date('touched_at').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  clientIdx: index('touches_client_idx').on(t.clientId, t.touchedAt.desc()),
}));

export const weeklyStats = pgTable('weekly_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  trainerId: uuid('trainer_id').notNull().references(() => trainers.id),
  weekStart: date('week_start').notNull(),         // понедельник недели
  leadsReception: integer('leads_reception').default(0).notNull(),
  leadsLifts: integer('leads_lifts').default(0).notNull(),
  leadsAvito: integer('leads_avito').default(0).notNull(),
  leadsReferral: integer('leads_referral').default(0).notNull(),
  leadsBase: integer('leads_base').default(0).notNull(),
  leadsChat: integer('leads_chat').default(0).notNull(),
  trials: integer('trials').default(0).notNull(),
  newRegulars: integer('new_regulars').default(0).notNull(),
  loadPercent: integer('load_percent'),
  note: text('note'),
}, (t) => ({
  uniqWeek: uniqueIndex('weekly_stats_trainer_week_uniq').on(t.trainerId, t.weekStart),
}));
```

### TrainerSettings (JSON)

```ts
type TrainerSettings = {
  promptTemplate: string;        // дефолт = текст reactivation-prompt.md, кладётся в seed
  thresholds: {
    leadStaleDays: number;       // 3
    activeFreshDays: number;     // 10
    activeStaleDays: number;     // 21
    cooledStaleDays: number;     // 30
    silentDays: number;          // 45 — «тихий», страховка-приоритет
  };
};
```

### Решения схемы

- `trainer_id` в каждой таблице — задел под мультитенантность без будущих миграций.
- `last_contact` НЕ хранится — выводится как `GREATEST(last_session_date, created_at, max(touches.touched_at))` через LEFT JOIN LATERAL. Один источник правды.
- Триггеры НЕ хранятся — `computeTrigger` чистая функция. SQL даёт `client + lastTouchDate`; вычисление в TS.
- Soft delete только у `clients` (на него смотрит «тихий»).
- Перечисления — `text` с enum-ограничением Drizzle (не Postgres ENUM), миграции проще.
- В UI отображаем кириллические лейблы, в БД — латиница. Снимает риск с кодировкой/сортировкой.

---

## 3. Триггеры (ядро системы)

### computeTrigger — чистая функция

```ts
// lib/triggers/compute.ts
type TriggerKind = 'lead_stale' | 'vacation_no_prebook' | 'active_stale' | 'cooled_stale' | 'silent';
type TriggerPriority = 'high' | 'medium' | 'low' | 'info';
type Trigger = { kind: TriggerKind; priority: TriggerPriority; daysSince: number; emoji: string };

export function computeTrigger(
  client: { status: ClientStatus; septemberBooking: boolean; deletedAt: Date | null },
  lastTouchDate: Date | null,
  today: Date,
  thresholds: TrainerSettings['thresholds'],
): Trigger | null {
  if (client.deletedAt) return null;
  if (client.status === 'left') return null;

  const daysSince = lastTouchDate ? diffDays(today, lastTouchDate) : Infinity;

  // Тихий — последний рубеж, проверяем ПЕРВЫМ.
  if (daysSince >= thresholds.silentDays) {
    return { kind: 'silent', priority: 'high', daysSince, emoji: 'silent' };
  }

  switch (client.status) {
    case 'lead':
      if (daysSince >= thresholds.leadStaleDays)
        return { kind: 'lead_stale', priority: 'high', daysSince, emoji: 'high' };
      return null;

    case 'vacation':
      if (!client.septemberBooking)
        return { kind: 'vacation_no_prebook', priority: 'medium', daysSince, emoji: 'medium' };
      return null;

    case 'active':
      if (daysSince >= thresholds.activeStaleDays)
        return { kind: 'active_stale', priority: 'high', daysSince, emoji: 'high' };
      if (daysSince >= thresholds.activeFreshDays)
        return { kind: 'active_stale', priority: 'medium', daysSince, emoji: 'medium' };
      return null;

    case 'cooling':
      if (daysSince >= thresholds.cooledStaleDays)
        return { kind: 'cooled_stale', priority: 'medium', daysSince, emoji: 'low' };
      return null;

    case 'prebook':
      return null;
  }
}
```

### Источник lastTouchDate

`max` из всех `touches.touched_at` клиента, `clients.last_session_date`, `clients.created_at`. Закрывает дыру: новосозданный клиент без касаний не считается «забытым» с эпохи Unix.

### SQL для /today и счётчиков

```sql
SELECT
  c.*,
  GREATEST(
    c.last_session_date,
    c.created_at::date,
    COALESCE(lt.touched_at, '1970-01-01'::date)
  ) AS last_touch_date
FROM clients c
LEFT JOIN LATERAL (
  SELECT touched_at FROM touches t
  WHERE t.client_id = c.id
  ORDER BY t.touched_at DESC LIMIT 1
) lt ON true
WHERE c.trainer_id = $1
  AND c.deleted_at IS NULL
  AND c.status <> 'left';
```

Один запрос → массив `{ client, lastTouchDate }` → прогон через `computeTrigger` в TS → сортировка.

### Сортировка на /today

1. Группа «тихий» сверху (страховка-приоритет, отдельная секция в UI).
2. `high`: просроченные лиды, активные 21+.
3. `medium`: отпуск без предзаписи, активные 10+.
4. `low/info`: остывшие 30+.

Внутри приоритета — по `daysSince DESC`.

### Пороги — как в спеке

```ts
export const DEFAULT_THRESHOLDS = {
  leadStaleDays: 3,
  activeFreshDays: 10,
  activeStaleDays: 21,
  cooledStaleDays: 30,
  silentDays: 45,
};
```

На `/settings` редактируются; копируются в `trainers.settings.thresholds` при регистрации.

### «Отметить касание»

- Server action `recordTouch(clientId, type, note?)` пишет в `touches` с `touched_at = CURRENT_DATE`.
- После — `revalidatePath('/today')`, `revalidatePath('/clients/[id]', 'page')`.
- UI кнопка работает оптимистически (`useOptimistic`); реальная пересортировка ждёт ревалидации.
- На `/today` — кнопка «Отметил сообщением» (тип `message` по умолчанию, в один тап).
- В карточке `/clients/[id]` — модалка с выбором типа и заметкой.

### Sanity-проверка вместо тестов

`/dev/triggers-sanity` (только `NODE_ENV=development`) прогоняет ~10 синтетических кейсов, покрывающих каждую ветку `computeTrigger` (готовых эталонных кейсов в `mvp-spec.md` нет — составляем по таблице фич: лид 0/3/5 дней, активный 9/10/21/30, отпуск с предзаписью и без, остывший 29/30, любой не-`left` на 45 днях). Показывает таблицу «ожидалось vs получили». Не автоматический тест, но дешёвый ручной чек после изменений `compute.ts`.

---

## 4. Экспорт для Claude и UI-каркас

### Сборка экспорта

```ts
// lib/export/claude.ts
export function buildClaudeExport(
  selectedClients: ClientWithTrigger[],     // тип БЕЗ contact физически
  promptTemplate: string,
): string {
  const lines = selectedClients
    .filter(c => c.personalFact && c.personalFact.trim() !== '')
    .map(c => [
      c.name,
      profileLabel(c.profile),
      triggerLabel(c.trigger),
      `${c.trigger.daysSince}д без касания`,
      c.goal ?? '—',
      c.personalFact,
      c.note ?? '—',
    ].join(' · '));
  return `${promptTemplate}\n\n---\n\n${lines.join('\n')}`;
}
```

**Инвариант безопасности:** тип `ClientWithTrigger` НЕ содержит `contact`. Server action делает явный `pick` нужных полей. Sanity-страница `/dev/export-sanity` прогоняет 5 кейсов с явной проверкой `!result.includes('@')` и `!result.includes('+7')`.

### UX «Скопировать для Claude»

1. На `/today` чекбоксы у каждого триггера; «выбрать все» доступно.
2. Кнопка — единственный cyan-CTA на экране.
3. По клику: server action собирает строку → возвращает в клиент → `navigator.clipboard.writeText(...)` → тост «В буфере. Вставляй в Claude».
4. Если среди выбранных есть клиенты без `personal_fact` — модалка-предупреждение со списком имён и двумя кнопками: «Допиши факт» (→ карточка) и «Скопировать без них».

### Промпт-шаблон

Дефолт — текст `reactivation-prompt.md` (положим как seed в `lib/db/seed.ts`). На `/settings` редактируется в `<textarea>` и сохраняется в `trainers.settings.promptTemplate`.

### Лейаут и навигация

- **Десктоп (≥768px):** сайдбар 240px фиксированный, пункты «Сегодня · База · Панель · Настройки». «+ Лид» как secondary-кнопка в шапке.
- **Мобильный (<768px):** нижний таб-бар (Сегодня · База · Панель · Настройки). «+ Лид» как FAB.
- **Контейнер** 1080px центрированный, фон — градиент по брендбуку (база `#0E1117` + radial cyan/violet).

### Дизайн-токены через Tailwind 4

В `globals.css`:

```css
@import 'tailwindcss';

@theme {
  --color-bg: #0E1117;
  --color-bg-2: #151923;
  --color-bg-3: #1B2030;
  --color-bg-glass: #141925;
  --color-tx: #E8ECF4;
  --color-tx-2: #9AA3B5;
  --color-tx-3: #5E6678;
  --color-cyan: #2CE6FF;
  --color-violet: #8B5CFF;
  --color-pink: #FF4FD8;
  --color-green: #36FF9D;
  --color-orange: #FF9F43;
  --color-blue: #4D7DFF;
  --color-line: rgb(255 255 255 / 0.09);
  --color-line-soft: rgb(255 255 255 / 0.055);

  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 22px;

  --font-display: 'Gerhaus', Georgia, serif;
  --font-sans: 'Nunito', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --ease-soft: cubic-bezier(.2, .7, .2, 1);

  --shadow-glow: 0 0 24px rgb(44 230 255 / 0.35);
  --shadow-glow-orange: 0 0 20px rgb(255 159 67 / 0.30);
}
```

Стекло, hairline-разделители, edge-highlight — через `@layer components`.

### Компоненты-атомы

`Button` (primary/secondary/ghost · sm/md/lg) · `Input` · `Select` · `Textarea` · `DatePicker` · `Badge` (профиль/статус/триггер) · `Card` (glass) · `Toast` · `Modal` · `Drawer` · `Skeleton` · `EmptyState`. Все мобилофрендли (hit-area ≥44px).

### Загрузка и обработка ошибок

- На каждой странице — `loading.tsx` со скелетоном по форме контента.
- `(app)/layout.tsx` имеет `error.tsx` с текстом из дизайн-системы.
- Серверные action'ы возвращают `{ ok: true, ... } | { ok: false, error: string }`. Ошибки полей крепятся под input'ом, общие — тостом.
- Тексты ошибок — из таблицы голоса дизайн-системы («Не сохранилось. Проверь соединение и попробуй ещё раз.», а не «Ошибка #5042»).

### Производительность

- На 200 клиентах вопросов нет; `/today` идёт одним SQL, без N+1.
- Server Components по умолчанию; `'use client'` только для интерактивных.
- `revalidatePath` после мутаций — не полный reload.

---

## 5. CSV-импорт

### Эталонная схема (15 колонок)

| # | Колонка CSV | Поле БД | Тип | Обязат. |
|---|---|---|---|---|
| 1 | Имя | name | text | да |
| 2 | Контакт | contact | text | нет |
| 3 | Профиль | profile | health/form/energy | нет |
| 4 | Статус | status | active/vacation/cooling/lead/prebook/left | да |
| 5 | Источник | source | reception/lift1..4/avito/referral/chat/base/other | нет |
| 6 | Личный факт | personal_fact | text | нет |
| 7 | Цель | goal | text | нет |
| 8 | Тренировок в неделю | sessions_per_week | int 0-7 | нет |
| 9 | Последняя тренировка | last_session_date | date | нет |
| 10 | Бронь на сентябрь | september_booking | bool | нет |
| 11 | Заметка | note | text | нет |
| 12 | Последнее касание | (создаёт touch) | date | нет |
| 13 | Тип касания | (создаёт touch.type) | message/call/training | нет |
| 14 | Дата создания | created_at | date | нет |
| 15 | Дата удаления | deleted_at | date | нет |

### Парсер

- `papaparse` + `zod` для построчной валидации.
- Словарь синонимов в `lib/csv/synonyms.ts`: «активный»→`active`, «отпуск»→`vacation`, «здоровье»→`health` и т.д.
- Терпимость к датам: `dd.mm.yyyy`, `yyyy-mm-dd`, `dd/mm/yy`, Excel serial (число дней с 1900-01-00). Двузначные годы: 00-29→2000+, 30-99→1900+.
- Терпимость к bool: «да/нет», «yes/no», «true/false», `1/0`, пусто = false.
- Кодировка: декодируем файл через `TextDecoder('utf-8', { fatal: true })`; при `TypeError` — повтор с `windows-1251`. В `papaparse` уходит уже декодированная строка.

### Транзакционность

Либо все строки попадают в базу, либо отчёт об ошибках построчно и **ничего не записано**. Никогда не импортируем частично молча.

### Дедупликация

UPSERT по `(trainer_id, contact)` если `contact` непустой; иначе по `(trainer_id, name)`. Дубликаты не создаём — обновляем существующего. Лог «добавлено N, обновлено M».

### UI /clients/import

1. Drag-and-drop или `<input type="file">`.
2. Превью первых 5 строк с подсветкой ошибок.
3. Кнопка «Импортировать» (primary cyan) — disabled, если есть ошибки.
4. Отчёт: «Добавлено: 12 · Обновлено: 5 · С ошибками: 2 (строки 7, 9)».

---

## 6. Безопасность

- **Middleware** защищает все маршруты, кроме `/login` и `/register` (последний — с дополнительным server-чеком пустоты `trainers`).
- **Хеш пароля:** `argon2id` (дефолты OWASP).
- **Rate-limit на `/login`:** 5 попыток/мин на IP. В v1 — в памяти (Map с TTL). При деплое на Vercel — заменить на Upstash KV.
- **Server actions** — валидация zod на входе; ошибки не раскрывают внутренних деталей.
- **Экспорт для Claude** — тип `ClientWithTrigger` физически не содержит `contact`.
- **Public API `/api/leads`** (V2): подпись токеном `LEADS_API_TOKEN`, zod-валидация, запись с `status='lead'` и `lead_payload = raw`. В v1 не подключается к лендингу.
- **Auth.js v5 (NextAuth v5):** JWT-сессия, `AUTH_SECRET` в env (новое имя; `NEXTAUTH_SECRET` работает как fallback).

### ENV

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/athome
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=http://localhost:3000
LEADS_API_TOKEN=<random>
```

`.env.example` коммитится; `.env.local` в .gitignore.

---

## 7. Этапы реализации (вертикальные срезы — подход A)

Каждая ступень — работающий продукт; можно остановиться после любой.

1. **Фундамент:** Next.js 16 настройки, Tailwind 4 с токенами брендбука, шрифты, лейауты `(auth)/login`/`(app)/...`, NextAuth credentials, `/register` с гейтом, Drizzle + Docker Postgres, миграции. **Готово:** вошёл, `/today` пустой со строкой «База пустая».
2. **CRUD клиентов:** схема `clients`, `/clients` (таблица desktop + список mobile), `/clients/[id]`, `/clients/new`, `/leads/new`. **Готово:** можно вести базу руками с телефона.
3. **Триггеры + «Сегодня»:** `computeTrigger`, SQL-запрос с LEFT JOIN LATERAL, `/today` со списком по приоритету, `/dev/triggers-sanity`. **Готово:** ритуал начинает иметь смысл.
4. **Касания + экспорт для Claude:** `touches`, server action `recordTouch`, кнопка «Скопировать для Claude», `/dev/export-sanity`. **Готово:** полный пятничный ритуал работает.
5. **Импорт CSV:** `/clients/import`, парсер, отчёт об ошибках, транзакция. **Готово:** можно мигрировать с Excel.
6. **Панель:** `weekly_stats`, форма строки недели, счётчики «сейчас», `/dashboard`. **Готово:** паритет с Excel-листом.
7. **Настройки:** `/settings` (промпт, пороги, смена пароля), вынос дефолтов в `trainers.settings`.

---

## 8. Риски и митигации

| Риск | Митигация |
|---|---|
| Логика триггеров ломается молча (нет автотестов) | `/dev/triggers-sanity` с 10 кейсами из спеки; ручной чек после каждой правки `compute.ts` |
| Контакты утекают в экспорт для Claude | Узкий тип `ClientWithTrigger` без `contact`; sanity-проверка в playground |
| CSV-парсер падает на кириллице | `papaparse` с автодетектом encoding; явный fallback на windows-1251 |
| Tailwind 4 + Next.js 16 — новая комбинация, тренировочные данные могли устареть | Перед кодом — читать `node_modules/next/dist/docs/01-app/` (требование AGENTS.md) |
| Импорт ломается на полу-готовых данных | Транзакция: либо все, либо отчёт без записи |
| Пользователь забыл .woff2 Gerhaus | `next/font/local` с fallback на serif; README предупреждает |

---

## 9. Определение готовности MVP

MVP готов, когда:

1. Вошёл по `/login` (после `/register` → seed одного тренера).
2. Добавил пару клиентов через UI; они видны в `/clients` и в карточке.
3. На `/today` появился триггер (через смещение даты или тестового клиента).
4. Отметил касание → триггер пропал, запись в истории.
5. Выбрал триггеры, нажал «Скопировать для Claude» → вставил в чат Claude, ответ собрался без правки формата.
6. Импортировал CSV из 30+ строк — все попали в базу, дубли не созданы.
7. На `/dashboard` заполнил строку недели — счётчики «сейчас» сходятся с базой.

---

## 10. Что не делаем (защита scope)

Из «Никогда» спеки:
- Автоотправка сообщений клиентам.
- TG-бот-рассыльщик.
- Расписание, абонементы, платежи.
- CRM-зоопарк (kanban сделок, скоринг, теги без лимита).

Из V2 — задел готов в схеме (`clients.leadPayload`, `api/leads/route.ts`), но в v1 не подключается.
