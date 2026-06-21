# Этап 6 — Панель + weekly_stats: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Запустить `/dashboard`: счётчики «сейчас» (статусы клиентов + триггеры по приоритету) + форма пятничной строки недели (UPSERT по `(trainer_id, week_start)`) + история 12 недель. Включает вынос `requireTrainerId` в общий хелпер (5-е дублирование = порог из memory) и создание таблицы `weekly_stats` (миграция).

**Architecture:** Чистые функции `lib/weekly/{week,counters}.ts` (без БД, без UI) → тонкие server actions/queries `lib/weekly/{actions,queries}.ts` → server-component страница `/dashboard` + три presentational компонента в `components/dashboard/`. On-demand агрегация — никакого кэша. Sanity playground `/dev/dashboard-sanity` вместо unit-тестов.

**Tech Stack:** Next.js 16 + React 19 (server actions, useTransition), TypeScript strict, Drizzle ORM (drizzle-kit для миграций), `zod`, Tailwind 4, `lucide-react`.

**Project overrides (важно):**
- **Без автотестов** — sanity-страницы `/dev/*-sanity` вместо vitest. Не предлагать `npm test`.
- **Стиль кода:** 4 пробела, компактные скобки `{x}` без пробелов.
- **Дизайн-токены:** `bg-bg-2`, `text-tx`, `text-tx-2`, `bg-cyan`, `border-line`, `glass`, `hairline` — НЕ стандартные tailwind `cyan-600`/`zinc-*`.
- **Дубли `requireTrainerId` (5+):** этот план включает рефактор. После Этапа 6 хелпер живёт в `lib/auth/require-trainer.ts`.
- **`weekly_stats` миграция:** таблица есть только в спеке Этапа 1, в фактической `lib/db/schema.ts` отсутствует. Task 1 добавляет её + generate/apply миграции.

**Спека:** `docs/superpowers/specs/2026-06-19-stage-6-panel-weekly-design.md` — открывай при сомнениях.

---

## File Structure

**Создаются:**
- `lib/auth/require-trainer.ts` — общий `requireTrainerId()` (рефактор, 5-е дублирование триггерит порог)
- `lib/weekly/week.ts` — `getWeekStart`, `formatWeekLabel`
- `lib/weekly/counters.ts` — `groupTriggersByPriority`, `getNowCounters`
- `lib/weekly/queries.ts` — `getWeeklyStat`, `listWeeklyHistory`
- `lib/weekly/actions.ts` — server action `upsertWeeklyStat`
- `lib/weekly/sanity-cases.ts` — 5 эталонных кейсов
- `lib/zod/weekly.ts` — `WeeklyStatSchema`
- `app/(app)/dashboard/page.tsx` — server component
- `app/(app)/dev/dashboard-sanity/page.tsx` — sanity playground
- `components/dashboard/CountersBlock.tsx` — плитки статусов + триггеров
- `components/dashboard/WeeklyForm.tsx` — `'use client'`, 9 чисел + textarea note
- `components/dashboard/WeeklyHistoryTable.tsx` — таблица 12 недель

**Модифицируются:**
- `lib/db/schema.ts` — добавить `weeklyStats` таблицу + типы `WeeklyStat`/`NewWeeklyStat`
- `lib/clients/actions.ts`, `lib/touches/actions.ts`, `lib/export/actions.ts`, `lib/clients/import.ts` — удалить локальный `requireTrainerId`, импортировать из `@/lib/auth/require-trainer`
- `drizzle/migrations/0003_*.sql` — новая миграция (создаст drizzle-kit)

**Без изменений** (но используются):
- `lib/triggers/query.ts::listTriggersForTrainer` — переиспользуется в counters
- `lib/triggers/compute.ts::computeTrigger` — используется для группировки
- `components/nav/Sidebar.tsx`, `components/nav/MobileTabBar.tsx` — `/dashboard` уже в навигации

---

## Task 1: weekly_stats — schema + миграция

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/migrations/0003_*.sql` (через drizzle-kit)

- [ ] **Step 1: Добавить импорт `uniqueIndex` в начало `lib/db/schema.ts`**

Текущая строка:
```ts
import {pgTable, uuid, text, jsonb, timestamp, integer, boolean, date, index} from 'drizzle-orm/pg-core';
```

Заменить на:
```ts
import {pgTable, uuid, text, jsonb, timestamp, integer, boolean, date, index, uniqueIndex} from 'drizzle-orm/pg-core';
```

- [ ] **Step 2: Добавить таблицу `weeklyStats` и типы в конец `lib/db/schema.ts`**

В конец файла, после `export type NewTouch = typeof touches.$inferInsert;`:

```ts
export const weeklyStats = pgTable('weekly_stats', {
    id: uuid('id').primaryKey().defaultRandom(),
    trainerId: uuid('trainer_id').notNull().references(() => trainers.id),
    weekStart: date('week_start').notNull(),
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
    createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).defaultNow().notNull(),
}, (t) => ({
    uniqWeek: uniqueIndex('weekly_stats_trainer_week_uniq').on(t.trainerId, t.weekStart),
}));

export type WeeklyStat = typeof weeklyStats.$inferSelect;
export type NewWeeklyStat = typeof weeklyStats.$inferInsert;
```

- [ ] **Step 3: Сгенерировать миграцию**

Run:
```bash
npm run db:generate
```
Expected: создан файл `drizzle/migrations/0003_*.sql` с `CREATE TABLE "weekly_stats"`. Открой и убедись что миграция создаёт таблицу со всеми полями + уникальный индекс.

- [ ] **Step 4: Применить миграцию к БД**

Run:
```bash
npm run db:migrate
```
Expected: `Migrations completed!` или подобное, без ошибок.

Проверка:
```bash
docker exec -i $(docker ps -qf "name=postgres") psql -U postgres -d athome -c "\d weekly_stats"
```
Expected: видна таблица с 14 колонками и индексом `weekly_stats_trainer_week_uniq`.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 6: Commit**

```bash
git add lib/db/schema.ts drizzle/migrations/ drizzle/meta/
git commit -m "feat(db): таблица weekly_stats + миграция 0003"
```

---

## Task 2: Рефактор requireTrainerId — вынос в общий хелпер

**Files:**
- Create: `lib/auth/require-trainer.ts`
- Modify: `lib/clients/actions.ts`, `lib/touches/actions.ts`, `lib/export/actions.ts`, `lib/clients/import.ts`

- [ ] **Step 1: Создать `lib/auth/require-trainer.ts`**

```ts
import {redirect} from 'next/navigation';
import {auth} from '@/lib/auth/config';

export async function requireTrainerId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }
    return session.user.id;
}
```

- [ ] **Step 2: Заменить в `lib/clients/actions.ts`**

Удалить локальное определение `async function requireTrainerId(): Promise<string> {...}` (строки 15-21 на момент написания плана).

В блок импортов добавить:
```ts
import {requireTrainerId} from '@/lib/auth/require-trainer';
```

Удалить теперь неиспользуемый `import {auth} from '@/lib/auth/config';` (если он больше нигде в файле не используется — проверить grep'ом).

Удалить `import {redirect} from 'next/navigation';` если `redirect` больше нигде в файле не используется (этот файл использует его в нескольких местах после `await db.update(...)` — оставить).

- [ ] **Step 3: Заменить в `lib/touches/actions.ts`**

Удалить локальное определение. Добавить импорт:
```ts
import {requireTrainerId} from '@/lib/auth/require-trainer';
```
Удалить неиспользуемые импорты `auth`, `redirect` по тому же принципу — проверить grep'ом перед удалением.

- [ ] **Step 4: Заменить в `lib/export/actions.ts`**

То же действие: удалить локальное `requireTrainerId`, импортировать из `@/lib/auth/require-trainer`.

- [ ] **Step 5: Заменить в `lib/clients/import.ts`**

То же действие.

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 7: Smoke-проверка через dev сервер**

Если `npm run dev` ещё не запущен — запустить и открыть `/today`, `/clients`. Auth должен работать как раньше.

- [ ] **Step 8: Commit**

```bash
git add lib/auth/require-trainer.ts lib/clients/actions.ts lib/touches/actions.ts lib/export/actions.ts lib/clients/import.ts
git commit -m "refactor(auth): вынести requireTrainerId в общий хелпер"
```

---

## Task 3: lib/weekly/week.ts — getWeekStart + formatWeekLabel

**Files:**
- Create: `lib/weekly/week.ts`

- [ ] **Step 1: Создать `lib/weekly/week.ts`**

```ts
const MONTHS_GENITIVE = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

// Возвращает понедельник ISO-недели в формате YYYY-MM-DD для заданной даты.
// Воскресенье считается частью предыдущей недели.
export function getWeekStart(d: Date): string {
    const day = d.getUTCDay();           // 0=Sun, 1=Mon, ..., 6=Sat
    const offset = day === 0 ? 6 : day - 1;
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset));
    return formatIso(monday);
}

// "2026-06-15" -> "15–21 июня"
// Если неделя пересекает месяц: "29 июня – 5 июля"
// Год показывается только если отличается от текущего: "23–29 декабря 2025"
export function formatWeekLabel(weekStart: string, today: Date = new Date()): string {
    const [y, m, d] = weekStart.split('-').map((s) => parseInt(s, 10));
    const start = new Date(Date.UTC(y, m - 1, d));
    const end = new Date(Date.UTC(y, m - 1, d + 6));

    const sameMonth = start.getUTCMonth() === end.getUTCMonth();
    const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
    const showYear = start.getUTCFullYear() !== today.getUTCFullYear();

    if (sameMonth && sameYear) {
        const month = MONTHS_GENITIVE[start.getUTCMonth()];
        const base = `${start.getUTCDate()}–${end.getUTCDate()} ${month}`;
        return showYear ? `${base} ${start.getUTCFullYear()}` : base;
    }

    const startMonth = MONTHS_GENITIVE[start.getUTCMonth()];
    const endMonth = MONTHS_GENITIVE[end.getUTCMonth()];
    const base = `${start.getUTCDate()} ${startMonth} – ${end.getUTCDate()} ${endMonth}`;
    return showYear ? `${base} ${start.getUTCFullYear()}` : base;
}

function formatIso(d: Date): string {
    const y = d.getUTCFullYear().toString().padStart(4, '0');
    const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/weekly/week.ts
git commit -m "feat(weekly): getWeekStart + formatWeekLabel"
```

---

## Task 4: lib/weekly/counters.ts — groupTriggersByPriority + getNowCounters

**Files:**
- Create: `lib/weekly/counters.ts`

- [ ] **Step 1: Создать `lib/weekly/counters.ts`**

```ts
import {and, eq, isNull, sql, count, gte} from 'drizzle-orm';
import {db} from '@/lib/db';
import {clients, CLIENT_STATUSES} from '@/lib/db/schema';
import type {ClientStatus} from '@/lib/db/schema';
import {listTriggersForTrainer} from '@/lib/triggers/query';
import type {ClientWithTrigger} from '@/lib/triggers/query';

export type PriorityCounts = {silent: number; high: number; medium: number; low: number};

export type NowCounters = {
    statuses: Record<ClientStatus, number>;
    triggersByPriority: PriorityCounts;
    totalClients: number;
    leadsLast7Days: number;
};

export function groupTriggersByPriority(triggers: ClientWithTrigger[]): PriorityCounts {
    const out: PriorityCounts = {silent: 0, high: 0, medium: 0, low: 0};
    for (const t of triggers) {
        if (t.trigger.priority === 'silent') out.silent++;
        else if (t.trigger.priority === 'high') out.high++;
        else if (t.trigger.priority === 'medium') out.medium++;
        else if (t.trigger.priority === 'low') out.low++;
    }
    return out;
}

export async function getNowCounters(trainerId: string): Promise<NowCounters> {
    const emptyStatuses = Object.fromEntries(CLIENT_STATUSES.map((s) => [s, 0])) as Record<ClientStatus, number>;

    const [statusRows, triggers, leadsRow] = await Promise.all([
        db
            .select({status: clients.status, n: count()})
            .from(clients)
            .where(and(eq(clients.trainerId, trainerId), isNull(clients.deletedAt)))
            .groupBy(clients.status),
        listTriggersForTrainer(trainerId),
        db
            .select({n: count()})
            .from(clients)
            .where(and(
                eq(clients.trainerId, trainerId),
                eq(clients.status, 'lead'),
                isNull(clients.deletedAt),
                gte(clients.createdAt, sql`now() - interval '7 days'`),
            )),
    ]);

    const statuses = {...emptyStatuses};
    for (const row of statusRows) {
        statuses[row.status] = row.n;
    }

    return {
        statuses,
        triggersByPriority: groupTriggersByPriority(triggers),
        totalClients: triggers.length,
        leadsLast7Days: leadsRow[0]?.n ?? 0,
    };
}
```

> Проверь сигнатуру `listTriggersForTrainer` (она существует от Этапа 3). Если возвращаемый тип называется не `ClientWithTrigger`, а как-то иначе — поправь импорт и тип параметра `groupTriggersByPriority`. Поле `.trigger.priority` должно содержать одно из `'silent' | 'high' | 'medium' | 'low'` — это из `computeTrigger` Этапа 3.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок. Если ошибка в импорте `ClientWithTrigger` — посмотри `lib/triggers/query.ts` экспорты и используй правильное имя типа.

- [ ] **Step 3: Commit**

```bash
git add lib/weekly/counters.ts
git commit -m "feat(weekly): groupTriggersByPriority + getNowCounters"
```

---

## Task 5: lib/weekly/sanity-cases.ts — 5 эталонных кейсов

**Files:**
- Create: `lib/weekly/sanity-cases.ts`

- [ ] **Step 1: Создать `lib/weekly/sanity-cases.ts`**

```ts
import type {ClientWithTrigger} from '@/lib/triggers/query';
import {getWeekStart, formatWeekLabel} from './week';
import {groupTriggersByPriority} from './counters';

export type SanityCase = {id: string; label: string; ok: boolean; details: string};

function fakeTrigger(priority: 'silent' | 'high' | 'medium' | 'low'): ClientWithTrigger {
    return {
        client: {id: 'x', name: 'x'} as never,
        lastTouchDate: null,
        trigger: {kind: 'lead_stale' as never, priority, label: 'x'},
    } as ClientWithTrigger;
}

export function runSanityCases(): SanityCase[] {
    const out: SanityCase[] = [];

    // 1. Понедельник возвращает себя
    {
        const got = getWeekStart(new Date(Date.UTC(2026, 5, 15)));
        const exp = '2026-06-15';
        out.push({id: 'monday', label: '1. getWeekStart(понедельник) → тот же день', ok: got === exp, details: `${got} vs ${exp}`});
    }

    // 2. Воскресенье → предыдущий понедельник
    {
        const got = getWeekStart(new Date(Date.UTC(2026, 5, 21)));
        const exp = '2026-06-15';
        out.push({id: 'sunday', label: '2. getWeekStart(вс 21.06) → пн 15.06', ok: got === exp, details: `${got} vs ${exp}`});
    }

    // 3. Переход через год: 01.01.2027 (пятница) → 28.12.2026
    {
        const got = getWeekStart(new Date(Date.UTC(2027, 0, 1)));
        const exp = '2026-12-28';
        out.push({id: 'year_boundary', label: '3. getWeekStart(пт 01.01.2027) → пн 28.12.2026', ok: got === exp, details: `${got} vs ${exp}`});
    }

    // 4. formatWeekLabel внутри месяца
    {
        const today = new Date(Date.UTC(2026, 5, 19));
        const got = formatWeekLabel('2026-06-15', today);
        const exp = '15–21 июня';
        out.push({id: 'label_in_month', label: '4. formatWeekLabel внутри июня', ok: got === exp, details: `"${got}" vs "${exp}"`});
    }

    // 5. groupTriggersByPriority
    {
        const triggers = [
            fakeTrigger('silent'), fakeTrigger('silent'),
            fakeTrigger('high'), fakeTrigger('high'), fakeTrigger('high'),
            fakeTrigger('medium'),
            fakeTrigger('low'), fakeTrigger('low'), fakeTrigger('low'), fakeTrigger('low'),
        ];
        const got = groupTriggersByPriority(triggers);
        const exp = {silent: 2, high: 3, medium: 1, low: 4};
        const ok = got.silent === exp.silent && got.high === exp.high && got.medium === exp.medium && got.low === exp.low;
        out.push({id: 'group_priority', label: '5. groupTriggersByPriority — 2/3/1/4', ok, details: `${JSON.stringify(got)} vs ${JSON.stringify(exp)}`});
    }

    return out;
}
```

> Если type assertion `as never` вызывает ругань ESLint — оставь её, она нужна потому что мы делаем фейковые объекты без полной структуры `ClientWithTrigger`. Это sandbox sanity, а не прод.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/weekly/sanity-cases.ts
git commit -m "feat(weekly): 5 sanity-кейсов для week + counters"
```

---

## Task 6: /dev/dashboard-sanity playground

**Files:**
- Create: `app/(app)/dev/dashboard-sanity/page.tsx`

- [ ] **Step 1: Создать страницу**

```tsx
import {runSanityCases} from '@/lib/weekly/sanity-cases';

export default function DashboardSanityPage() {
    const results = runSanityCases();
    const passed = results.filter((r) => r.ok).length;

    return (
        <div className="p-6 max-w-4xl">
            <h1 className="text-2xl font-semibold mb-2">Dashboard sanity</h1>
            <p className="mb-4 text-tx-2">{passed}/{results.length} зелёных.</p>
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b border-line text-left">
                        <th className="py-2 pr-3 w-12">#</th>
                        <th className="py-2 pr-3">Кейс</th>
                        <th className="py-2 pr-3 w-20">Статус</th>
                        <th className="py-2 pr-3">Детали</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((r, i) => (
                        <tr key={r.id} className="border-b border-line-soft align-top">
                            <td className="py-2 pr-3 text-tx-3">{i + 1}</td>
                            <td className="py-2 pr-3 text-tx">{r.label}</td>
                            <td className="py-2 pr-3">{r.ok ? '✅' : '❌'}</td>
                            <td className="py-2 pr-3 font-mono text-xs text-tx-2">{r.details}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

- [ ] **Step 2: Открыть в браузере**

Open: `http://localhost:<dev-port>/dev/dashboard-sanity`
Expected: «5/5 зелёных». Если есть красные — фикс соответствующий модуль (`week.ts` или `counters.ts`), не кейсы.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/dev/dashboard-sanity/page.tsx"
git commit -m "feat(dev): /dev/dashboard-sanity playground (5 кейсов)"
```

---

## Task 7: lib/weekly/queries.ts — getWeeklyStat + listWeeklyHistory

**Files:**
- Create: `lib/weekly/queries.ts`

- [ ] **Step 1: Создать `lib/weekly/queries.ts`**

```ts
import {and, desc, eq} from 'drizzle-orm';
import {db} from '@/lib/db';
import {weeklyStats} from '@/lib/db/schema';
import type {WeeklyStat} from '@/lib/db/schema';

export async function getWeeklyStat(trainerId: string, weekStart: string): Promise<WeeklyStat | null> {
    const rows = await db
        .select()
        .from(weeklyStats)
        .where(and(eq(weeklyStats.trainerId, trainerId), eq(weeklyStats.weekStart, weekStart)))
        .limit(1);
    return rows[0] ?? null;
}

export async function listWeeklyHistory(trainerId: string, weeksBack: number = 12): Promise<WeeklyStat[]> {
    return await db
        .select()
        .from(weeklyStats)
        .where(eq(weeklyStats.trainerId, trainerId))
        .orderBy(desc(weeklyStats.weekStart))
        .limit(weeksBack);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/weekly/queries.ts
git commit -m "feat(weekly): getWeeklyStat + listWeeklyHistory"
```

---

## Task 8: lib/zod/weekly.ts — WeeklyStatSchema

**Files:**
- Create: `lib/zod/weekly.ts`

- [ ] **Step 1: Создать `lib/zod/weekly.ts`**

```ts
import {z} from 'zod';

// Принимает строки из FormData ('' / '5' / '120') → number.
// Пустая строка трактуется как 0.
function coerceInt(raw: unknown): number | undefined {
    if (raw == null) return undefined;
    const s = String(raw).trim();
    if (s === '') return 0;
    if (!/^\d+$/.test(s)) return undefined;
    return parseInt(s, 10);
}

function coerceIntNullable(raw: unknown): number | null | undefined {
    if (raw == null) return null;
    const s = String(raw).trim();
    if (s === '') return null;
    if (!/^\d+$/.test(s)) return undefined;
    return parseInt(s, 10);
}

const intGTE0 = z.preprocess(coerceInt, z.number({error: 'Целое число ≥ 0'}).int().min(0));
const intPercent = z.preprocess(
    coerceIntNullable,
    z.number({error: 'От 0 до 100'}).int().min(0).max(100).nullable(),
);

export const WeeklyStatSchema = z.object({
    weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата YYYY-MM-DD'),
    leadsReception: intGTE0,
    leadsLifts: intGTE0,
    leadsAvito: intGTE0,
    leadsReferral: intGTE0,
    leadsBase: intGTE0,
    leadsChat: intGTE0,
    trials: intGTE0,
    newRegulars: intGTE0,
    loadPercent: intPercent,
    note: z
        .string()
        .trim()
        .optional()
        .transform((v) => (v && v.length > 0 ? v : null)),
});

export type WeeklyStatInput = z.infer<typeof WeeklyStatSchema>;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/zod/weekly.ts
git commit -m "feat(weekly): WeeklyStatSchema (zod) с coerceInt/intPercent"
```

---

## Task 9: lib/weekly/actions.ts — upsertWeeklyStat

**Files:**
- Create: `lib/weekly/actions.ts`

- [ ] **Step 1: Создать `lib/weekly/actions.ts`**

```ts
'use server';

import {revalidatePath} from 'next/cache';
import {db} from '@/lib/db';
import {weeklyStats} from '@/lib/db/schema';
import {requireTrainerId} from '@/lib/auth/require-trainer';
import {WeeklyStatSchema} from '@/lib/zod/weekly';

export type UpsertResult = {ok: true} | {ok: false; error: string; fieldErrors?: Record<string, string>};

function collectFieldErrors(error: import('zod').ZodError): Record<string, string> {
    const errs: Record<string, string> = {};
    for (const issue of error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !errs[key]) {
            errs[key] = issue.message;
        }
    }
    return errs;
}

export async function upsertWeeklyStat(formData: FormData): Promise<UpsertResult> {
    const trainerId = await requireTrainerId();

    const parsed = WeeklyStatSchema.safeParse({
        weekStart: formData.get('weekStart'),
        leadsReception: formData.get('leadsReception'),
        leadsLifts: formData.get('leadsLifts'),
        leadsAvito: formData.get('leadsAvito'),
        leadsReferral: formData.get('leadsReferral'),
        leadsBase: formData.get('leadsBase'),
        leadsChat: formData.get('leadsChat'),
        trials: formData.get('trials'),
        newRegulars: formData.get('newRegulars'),
        loadPercent: formData.get('loadPercent'),
        note: formData.get('note'),
    });

    if (!parsed.success) {
        return {ok: false, error: 'Проверь поля', fieldErrors: collectFieldErrors(parsed.error)};
    }

    const data = parsed.data;

    await db
        .insert(weeklyStats)
        .values({trainerId, ...data})
        .onConflictDoUpdate({
            target: [weeklyStats.trainerId, weeklyStats.weekStart],
            set: {
                leadsReception: data.leadsReception,
                leadsLifts: data.leadsLifts,
                leadsAvito: data.leadsAvito,
                leadsReferral: data.leadsReferral,
                leadsBase: data.leadsBase,
                leadsChat: data.leadsChat,
                trials: data.trials,
                newRegulars: data.newRegulars,
                loadPercent: data.loadPercent,
                note: data.note,
                updatedAt: new Date(),
            },
        });

    revalidatePath('/dashboard');
    return {ok: true};
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/weekly/actions.ts
git commit -m "feat(weekly): upsertWeeklyStat — UPSERT по (trainer_id, week_start)"
```

---

## Task 10: components/dashboard/CountersBlock.tsx

**Files:**
- Create: `components/dashboard/CountersBlock.tsx`

- [ ] **Step 1: Создать компонент**

```tsx
import type {NowCounters} from '@/lib/weekly/counters';
import type {ClientStatus} from '@/lib/db/schema';

const STATUS_LABELS: Record<ClientStatus, string> = {
    active: 'Активные',
    prebook: 'Предзапись',
    cooling: 'Остывают',
    vacation: 'В отпуске',
    lead: 'Лиды',
    left: 'Ушли',
};

const STATUS_ORDER: ClientStatus[] = ['active', 'prebook', 'cooling', 'vacation', 'lead', 'left'];

const PRIORITY_TILES: Array<{key: 'silent' | 'high' | 'medium' | 'low'; emoji: string; label: string}> = [
    {key: 'silent', emoji: '🔇', label: 'Тихие'},
    {key: 'high', emoji: '🔴', label: 'Срочно'},
    {key: 'medium', emoji: '🟡', label: 'Скоро'},
    {key: 'low', emoji: '🟢', label: 'Низкий'},
];

function Tile({value, label, accent}: {value: number; label: string; accent?: boolean}) {
    return (
        <div className={`glass rounded-lg p-4 flex flex-col gap-1 ${accent ? 'ring-1 ring-cyan/40' : ''}`}>
            <div className="text-3xl font-semibold text-tx">{value}</div>
            <div className="text-xs text-tx-2">{label}</div>
        </div>
    );
}

export function CountersBlock({counters}: {counters: NowCounters}) {
    return (
        <section className="space-y-3">
            <p className="text-tx-2 text-sm">
                Всего клиентов: <span className="text-tx font-medium">{counters.totalClients}</span>
                {' · '}
                Новых лидов за 7 дней: <span className="text-tx font-medium">{counters.leadsLast7Days}</span>
            </p>

            <div>
                <h2 className="text-tx-2 text-xs uppercase tracking-wide mb-2">По статусу</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {STATUS_ORDER.map((s) => (
                        <Tile key={s} value={counters.statuses[s]} label={STATUS_LABELS[s]} />
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-tx-2 text-xs uppercase tracking-wide mb-2">По приоритету триггеров</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {PRIORITY_TILES.map((p) => (
                        <Tile
                            key={p.key}
                            value={counters.triggersByPriority[p.key]}
                            label={`${p.emoji} ${p.label}`}
                            accent={p.key === 'high' || p.key === 'silent'}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/CountersBlock.tsx
git commit -m "feat(dashboard): CountersBlock — плитки статусов и приоритетов"
```

---

## Task 11: components/dashboard/WeeklyForm.tsx

**Files:**
- Create: `components/dashboard/WeeklyForm.tsx`

- [ ] **Step 1: Создать компонент**

```tsx
'use client';

import {useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {upsertWeeklyStat} from '@/lib/weekly/actions';
import {Button} from '@/components/ui/Button';
import {formatWeekLabel} from '@/lib/weekly/week';
import type {WeeklyStat} from '@/lib/db/schema';

type Props = {
    weekStart: string;
    initial: WeeklyStat | null;
};

const NUMERIC_FIELDS: Array<{name: keyof WeeklyStat; label: string}> = [
    {name: 'leadsReception', label: 'Ресепшн'},
    {name: 'leadsLifts', label: 'Лифты'},
    {name: 'leadsAvito', label: 'Авито'},
    {name: 'leadsReferral', label: 'Сарафан'},
    {name: 'leadsBase', label: 'База'},
    {name: 'leadsChat', label: 'Чат'},
    {name: 'trials', label: 'Пробные'},
    {name: 'newRegulars', label: 'Новые постоянные'},
];

export function WeeklyForm({weekStart, initial}: Props) {
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [pending, startTransition] = useTransition();
    const router = useRouter();
    const isUpdate = initial !== null;

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await upsertWeeklyStat(fd);
            if (result.ok) {
                setFieldErrors({});
                router.refresh();
            } else {
                setFieldErrors(result.fieldErrors ?? {});
            }
        });
    }

    function val(name: keyof WeeklyStat): string | number {
        if (!initial) return '';
        const v = initial[name];
        if (v == null) return '';
        return v as string | number;
    }

    return (
        <form onSubmit={onSubmit} className="glass rounded-lg p-4 space-y-4">
            <header>
                <h2 className="text-tx text-lg font-medium">Неделя {formatWeekLabel(weekStart)}</h2>
                <p className="text-tx-2 text-xs">{weekStart}</p>
            </header>

            <input type="hidden" name="weekStart" value={weekStart} />

            <div>
                <h3 className="text-tx-2 text-xs uppercase tracking-wide mb-2">Лиды по источникам</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {NUMERIC_FIELDS.slice(0, 6).map((f) => (
                        <NumField key={f.name} name={f.name} label={f.label} defaultValue={val(f.name)} error={fieldErrors[f.name]} />
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-tx-2 text-xs uppercase tracking-wide mb-2">Тренировки</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {NUMERIC_FIELDS.slice(6).map((f) => (
                        <NumField key={f.name} name={f.name} label={f.label} defaultValue={val(f.name)} error={fieldErrors[f.name]} />
                    ))}
                    <NumField name="loadPercent" label="Загрузка %" defaultValue={val('loadPercent')} error={fieldErrors.loadPercent} placeholder="0–100" />
                </div>
            </div>

            <div>
                <label className="block text-tx-2 text-xs uppercase tracking-wide mb-2">Заметка</label>
                <textarea
                    name="note"
                    defaultValue={(initial?.note ?? '') as string}
                    rows={2}
                    className="w-full bg-bg-2 border border-line rounded-md p-2 text-tx text-sm"
                />
            </div>

            <Button type="submit" variant="primary" size="md" disabled={pending}>
                {isUpdate ? 'Обновить' : 'Сохранить'}
            </Button>
        </form>
    );
}

function NumField({
    name, label, defaultValue, error, placeholder,
}: {
    name: string;
    label: string;
    defaultValue: string | number;
    error?: string;
    placeholder?: string;
}) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-tx-2 text-xs">{label}</span>
            <input
                type="number"
                inputMode="numeric"
                min={0}
                name={name}
                defaultValue={defaultValue}
                placeholder={placeholder ?? '0'}
                className="bg-bg-2 border border-line rounded-md px-3 py-2 text-tx"
            />
            {error && <span className="text-pink text-xs">{error}</span>}
        </label>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/WeeklyForm.tsx
git commit -m "feat(dashboard): WeeklyForm — 9 чисел + note + useTransition"
```

---

## Task 12: components/dashboard/WeeklyHistoryTable.tsx

**Files:**
- Create: `components/dashboard/WeeklyHistoryTable.tsx`

- [ ] **Step 1: Создать компонент**

```tsx
import Link from 'next/link';
import {formatWeekLabel} from '@/lib/weekly/week';
import type {WeeklyStat} from '@/lib/db/schema';

function totalLeads(w: WeeklyStat): number {
    return w.leadsReception + w.leadsLifts + w.leadsAvito + w.leadsReferral + w.leadsBase + w.leadsChat;
}

export function WeeklyHistoryTable({weeks, editingWeek}: {weeks: WeeklyStat[]; editingWeek: string}) {
    if (weeks.length === 0) {
        return <p className="text-tx-2 text-sm">Пока нет ни одной заполненной недели.</p>;
    }

    return (
        <section>
            <h2 className="text-tx-2 text-xs uppercase tracking-wide mb-2">История</h2>
            <div className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-bg-2 text-left text-tx-2">
                            <th className="py-2 px-3 font-medium">Неделя</th>
                            <th className="py-2 px-3 font-medium text-right">Лидов</th>
                            <th className="py-2 px-3 font-medium text-right">Пробных</th>
                            <th className="py-2 px-3 font-medium text-right">Новых</th>
                            <th className="py-2 px-3 font-medium text-right">Загрузка</th>
                            <th className="py-2 px-3 font-medium">Заметка</th>
                        </tr>
                    </thead>
                    <tbody>
                        {weeks.map((w) => {
                            const isEditing = w.weekStart === editingWeek;
                            return (
                                <tr key={w.id} className={`border-b border-line-soft last:border-0 ${isEditing ? 'bg-bg-3' : ''}`}>
                                    <td className="py-2 px-3">
                                        <Link href={`/dashboard?week=${w.weekStart}`} className="text-cyan hover:underline">
                                            {formatWeekLabel(w.weekStart)}
                                        </Link>
                                    </td>
                                    <td className="py-2 px-3 text-right text-tx">{totalLeads(w)}</td>
                                    <td className="py-2 px-3 text-right text-tx">{w.trials}</td>
                                    <td className="py-2 px-3 text-right text-tx">{w.newRegulars}</td>
                                    <td className="py-2 px-3 text-right text-tx">{w.loadPercent ?? '—'}%</td>
                                    <td className="py-2 px-3 text-tx-2 text-xs">{w.note ?? ''}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/WeeklyHistoryTable.tsx
git commit -m "feat(dashboard): WeeklyHistoryTable — 12 недель с кликом на редактирование"
```

---

## Task 13: app/(app)/dashboard/page.tsx — server component

**Files:**
- Create: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Создать страницу**

```tsx
import {requireTrainerId} from '@/lib/auth/require-trainer';
import {getNowCounters} from '@/lib/weekly/counters';
import {getWeeklyStat, listWeeklyHistory} from '@/lib/weekly/queries';
import {getWeekStart} from '@/lib/weekly/week';
import {CountersBlock} from '@/components/dashboard/CountersBlock';
import {WeeklyForm} from '@/components/dashboard/WeeklyForm';
import {WeeklyHistoryTable} from '@/components/dashboard/WeeklyHistoryTable';

type SP = Promise<{week?: string}>;

export default async function DashboardPage({searchParams}: {searchParams: SP}) {
    const trainerId = await requireTrainerId();
    const sp = await searchParams;
    const editingWeek = sp.week && /^\d{4}-\d{2}-\d{2}$/.test(sp.week)
        ? sp.week
        : getWeekStart(new Date());

    const [counters, history, current] = await Promise.all([
        getNowCounters(trainerId),
        listWeeklyHistory(trainerId, 12),
        getWeeklyStat(trainerId, editingWeek),
    ]);

    const isFirstTime = history.length === 0 && current === null;

    return (
        <div className="space-y-6">
            <h1 className="font-display uppercase text-[27px] tracking-wide">Панель</h1>

            {isFirstTime && (
                <div className="glass rounded-lg p-3 text-tx-2 text-sm">
                    Первая пятница ещё впереди — заполни строку, когда наступит.
                </div>
            )}

            <WeeklyForm weekStart={editingWeek} initial={current} />
            <CountersBlock counters={counters} />
            <WeeklyHistoryTable weeks={history} editingWeek={editingWeek} />
        </div>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Открыть в браузере**

Open: `http://localhost:<dev-port>/dashboard`
Expected: пустая база → плашка «Первая пятница ещё впереди», форма для текущей недели, пустые счётчики, пустая таблица истории.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/dashboard/page.tsx"
git commit -m "feat(dashboard): /dashboard server component"
```

---

## Task 14: Ручная верификация

**Files:** не меняет код.

- [ ] **Step 1: Open `/dev/dashboard-sanity` → 5/5 зелёных**

- [ ] **Step 2: Open `/dashboard`** — пустое состояние

Должно быть видно:
- заголовок «Панель»
- плашка «Первая пятница ещё впереди» (если БД свежая)
- пустая форма
- счётчики (нули или с предыдущими импортированными клиентами)
- пустая таблица истории

- [ ] **Step 3: Заполнить форму текущей недели**

Заполни 3-4 числовых поля (например: ресепшн 2, авито 1, пробные 3, новые 1), нажми «Сохранить».

Expected:
- кнопка переключается на «Обновить»
- в таблице истории появилась строка для этой недели
- счётчики не изменились (они про клиентов, не про недели)

- [ ] **Step 4: Изменить значения и нажать «Обновить»**

Поменяй одно число, нажми «Обновить» → строка истории показывает новые значения.

- [ ] **Step 5: Перейти на /dashboard?week=YYYY-MM-DD прошлой недели**

Через URL bar или клик по любой существующей строке истории.

Expected: форма пустая (для этой недели данных нет) с заголовком «Неделя X–Y …». Сохрани → строка появилась.

- [ ] **Step 6: Тест валидации**

Введи в одно из числовых полей `-5` или `abc` → server action вернёт `ok:false`, ошибка под полем красным.

- [ ] **Step 7: Проверить счётчики vs реальные данные**

Через `npm run db:psql`:
```sql
SELECT status, COUNT(*) FROM clients WHERE deleted_at IS NULL GROUP BY status;
```
Числа должны совпадать с плитками на `/dashboard` (для статусов).

Триггерные счётчики должны совпадать с количеством строк на `/today` для соответствующих приоритетов.

- [ ] **Step 8: Проверить навигацию**

Открой `/today` и `/clients` — пункт «Панель» в сайдбаре и нижнем таб-баре подсвечен только когда ты на `/dashboard`.

- [ ] **Step 9: Type-check полный проект**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 10: Финальный коммит, если правил что-то по результату**

```bash
git add <changed>
git commit -m "fix(dashboard): <конкретная проблема>"
```

---

## Acceptance checklist (Definition of Done)

- [ ] Миграция 0003 применена, таблица `weekly_stats` существует в БД
- [ ] `requireTrainerId` импортируется из `lib/auth/require-trainer` во всех 5 server-action файлах
- [ ] `/dev/dashboard-sanity`: 5/5 зелёных
- [ ] `/dashboard` открывается, показывает счётчики, форму, историю
- [ ] Сохранение строки текущей недели работает, кнопка переключается «Сохранить» ↔ «Обновить»
- [ ] Клик по строке истории редактирует ту неделю (URL `?week=`)
- [ ] Валидация чисел: `-5`/`abc` → fieldErrors под полем
- [ ] Счётчики статусов = SQL агрегат `clients`
- [ ] Счётчики триггеров по приоритету = группировка `listTriggersForTrainer`
- [ ] `npx tsc --noEmit` — 0 ошибок
- [ ] Memory project-shtab-state обновлена: «Этапы 1-6 готовы»

---

## Notes for the executor

- **Стиль:** 4 пробела, `{x}` без пробелов. Дизайн-токены проекта (`bg-bg-2`, `text-tx-2`, `bg-cyan`, `glass`, `hairline`, `border-line`), не tailwind `cyan-600`/`zinc-*`.
- **Без тестов:** не предлагать vitest. Sanity-страница = единственный sanity-механизм.
- **Drizzle UPSERT:** `onConflictDoUpdate({target: [...], set: {...}})` — синтаксис уже использовался в проекте, не выдумывай.
- **`listTriggersForTrainer` сигнатура:** проверь экспорт из `lib/triggers/query.ts` перед написанием counters.ts. Возможно тип называется не `ClientWithTrigger` — поправь импорт под факт.
- **`fakeTrigger` в sanity:** type assertion `as never` нужен потому что мы делаем неполный объект для теста чистой функции. Если ESLint ругается — игнорируй для этой строки.
- **Навигация:** Sidebar/MobileTabBar уже содержат пункт «Панель» → `/dashboard`. Ничего менять не нужно.
- **Если что-то непонятно** — открой `docs/superpowers/specs/2026-06-19-stage-6-panel-weekly-design.md`.
