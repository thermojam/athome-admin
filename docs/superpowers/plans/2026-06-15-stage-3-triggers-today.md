# Этап 3: Триггеры + «Сегодня» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** На `/today` появляется реальный список триггеров «кому пора написать» — сгруппирован по приоритету (тихий → high → medium → low). Логика триггеров живёт чистой функцией; есть dev-страница с 10 sanity-кейсами для ручной проверки.

**Architecture:** Один SQL-запрос с `LEFT JOIN LATERAL` отдаёт `(client, lastTouchDate)` для каждого активного клиента; `computeTrigger` в TS считает триггер; `groupAndSortTriggers` группирует по приоритету и сортирует внутри по `daysSince DESC`. Таблица `touches` создаётся в этом этапе, но пока без UI/actions — фоллбэк через `GREATEST(last_session_date, created_at)`. `/dev/triggers-sanity` доступен только в `NODE_ENV=development`.

**Tech Stack:** Drizzle ORM, raw SQL через `db.execute`, RSC. Без новых npm зависимостей.

**Без автотестов** — продолжаем policy. Sanity-страница `/dev/triggers-sanity` заменяет unit-тесты на ручной чек после каждой правки `compute.ts`.

**Стиль кода:** 4-пробельный отступ + компактные скобки `{x}` (линтер перепрошьёт иначе).

---

## File map

**Создаём:**
- `lib/triggers/compute.ts` — типы `Trigger`/`TriggerKind`/`TriggerPriority` + `computeTrigger` + `diffDays`
- `lib/triggers/query.ts` — `listClientsWithLastTouch` (SQL с LEFT JOIN LATERAL)
- `lib/triggers/sanity-cases.ts` — массив 10 эталонных кейсов
- `lib/today/group.ts` — `groupAndSortTriggers`
- `components/today/TriggerRow.tsx`
- `components/today/TodayList.tsx`
- `app/(app)/dev/triggers-sanity/page.tsx`
- `drizzle/0002_*.sql` (автоген)

**Меняем:**
- `lib/db/schema.ts` — добавляем таблицу `touches`, типы `Touch`/`NewTouch`/`TouchType`
- `app/(app)/today/page.tsx` — заглушка → реальный экран с триггерами

---

## Task 1: Таблица touches в схеме

**Файлы:**
- Изменить: `lib/db/schema.ts`
- Создать (autogen): `drizzle/0002_*.sql`

- [ ] **Step 1: Расширить `lib/db/schema.ts`** — добавить в конец файла (перед последним type-блоком) const и таблицу:

```ts
export const TOUCH_TYPES = ['message', 'call', 'training', 'other'] as const;
export type TouchType = typeof TOUCH_TYPES[number];

export const touches = pgTable('touches', {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull().references(() => clients.id, {onDelete: 'cascade'}),
    trainerId: uuid('trainer_id').notNull().references(() => trainers.id),
    type: text('type', {enum: TOUCH_TYPES}).notNull(),
    touchedAt: date('touched_at').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
}, (t) => ({
    clientIdx: index('touches_client_idx').on(t.clientId, t.touchedAt.desc()),
}));
```

И в самом конце добавить:

```ts
export type Touch = typeof touches.$inferSelect;
export type NewTouch = typeof touches.$inferInsert;
```

- [ ] **Step 2: Сгенерировать миграцию**

```bash
npm run db:generate
```

Ожидается: `drizzle/0002_*.sql` с `CREATE TABLE "touches"` + индекс `touches_client_idx` на `(client_id, touched_at DESC)`.

- [ ] **Step 3: Применить миграцию**

```bash
npm run db:migrate
```

Ожидается: `migrations applied successfully!`.

- [ ] **Step 4: Проверить структуру**

```bash
npm run db:psql -- -c "\d touches"
```

Ожидается: колонки `id`, `client_id`, `trainer_id`, `type`, `touched_at`, `note`, `created_at` + FK `client_id` на `clients` с `ON DELETE CASCADE` + FK `trainer_id` на `trainers` + индекс `touches_client_idx`.

- [ ] **Step 5: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat(db): таблица touches со схемой и индексом"
```

---

## Task 2: computeTrigger — чистая функция

**Файлы:**
- Создать: `lib/triggers/compute.ts`

- [ ] **Step 1: Создать `lib/triggers/compute.ts`:**

```ts
import type {ClientStatus} from '@/lib/db/schema';
import type {TrainerSettings} from '@/lib/db/schema';

export type TriggerKind = 'lead_stale' | 'vacation_no_prebook' | 'active_stale' | 'cooled_stale' | 'silent';
export type TriggerPriority = 'high' | 'medium' | 'low' | 'info';
export type Trigger = {
    kind: TriggerKind;
    priority: TriggerPriority;
    daysSince: number;
    emoji: string;
};

export function diffDays(today: Date, then: Date): number {
    const MS_PER_DAY = 86_400_000;
    const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const b = Date.UTC(then.getFullYear(), then.getMonth(), then.getDate());
    return Math.floor((a - b) / MS_PER_DAY);
}

type TriggerInputClient = {
    status: ClientStatus;
    septemberBooking: boolean | null;
    deletedAt: Date | null;
};

export function computeTrigger(
    client: TriggerInputClient,
    lastTouchDate: Date | null,
    today: Date,
    thresholds: TrainerSettings['thresholds'],
): Trigger | null {
    if (client.deletedAt) return null;
    if (client.status === 'left') return null;

    const daysSince = lastTouchDate ? diffDays(today, lastTouchDate) : Number.POSITIVE_INFINITY;

    if (daysSince >= thresholds.silentDays) {
        return {kind: 'silent', priority: 'high', daysSince, emoji: 'silent'};
    }

    switch (client.status) {
        case 'lead':
            if (daysSince >= thresholds.leadStaleDays) {
                return {kind: 'lead_stale', priority: 'high', daysSince, emoji: 'high'};
            }
            return null;

        case 'vacation':
            if (!client.septemberBooking) {
                return {kind: 'vacation_no_prebook', priority: 'medium', daysSince, emoji: 'medium'};
            }
            return null;

        case 'active':
            if (daysSince >= thresholds.activeStaleDays) {
                return {kind: 'active_stale', priority: 'high', daysSince, emoji: 'high'};
            }
            if (daysSince >= thresholds.activeFreshDays) {
                return {kind: 'active_stale', priority: 'medium', daysSince, emoji: 'medium'};
            }
            return null;

        case 'cooling':
            if (daysSince >= thresholds.cooledStaleDays) {
                return {kind: 'cooled_stale', priority: 'medium', daysSince, emoji: 'low'};
            }
            return null;

        case 'prebook':
            return null;
    }
}

export const TRIGGER_LABELS: Record<TriggerKind, string> = {
    lead_stale: 'Лид без касания',
    vacation_no_prebook: 'Отпуск без предзаписи',
    active_stale: 'Активный без тренировки',
    cooled_stale: 'Остывший',
    silent: 'Тихий — давно не касались',
};
```

- [ ] **Step 2: Verify**

```bash
npm run lint
npm run build 2>&1 | tail -5
```

Ожидается: оба чистые.

- [ ] **Step 3: Commit**

```bash
git add lib/triggers/compute.ts
git commit -m "feat(triggers): чистая функция computeTrigger + типы + diffDays"
```

---

## Task 3: SQL-запрос listClientsWithLastTouch

**Файлы:**
- Создать: `lib/triggers/query.ts`

- [ ] **Step 1: Создать `lib/triggers/query.ts`:**

```ts
import {sql} from 'drizzle-orm';
import {db} from '@/lib/db';
import type {Client} from '@/lib/db/schema';

export type ClientWithLastTouch = Client & {lastTouchDate: Date | null};

export async function listClientsWithLastTouch(trainerId: string): Promise<ClientWithLastTouch[]> {
    const rows = await db.execute<{
        id: string;
        trainer_id: string;
        name: string;
        contact: string | null;
        profile: string | null;
        status: string;
        source: string | null;
        personal_fact: string | null;
        goal: string | null;
        sessions_per_week: number | null;
        last_session_date: string | null;
        september_booking: boolean | null;
        note: string | null;
        lead_payload: unknown;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
        last_touch_date: string | null;
    }>(sql`
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
            ORDER BY t.touched_at DESC
            LIMIT 1
        ) lt ON true
        WHERE c.trainer_id = ${trainerId}
          AND c.deleted_at IS NULL
          AND c.status <> 'left'
    `);

    return rows.rows.map((r) => ({
        id: r.id,
        trainerId: r.trainer_id,
        name: r.name,
        contact: r.contact,
        profile: r.profile as Client['profile'],
        status: r.status as Client['status'],
        source: r.source as Client['source'],
        personalFact: r.personal_fact,
        goal: r.goal,
        sessionsPerWeek: r.sessions_per_week,
        lastSessionDate: r.last_session_date,
        septemberBooking: r.september_booking,
        note: r.note,
        leadPayload: r.lead_payload,
        deletedAt: r.deleted_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        lastTouchDate: r.last_touch_date ? new Date(r.last_touch_date) : null,
    }));
}
```

- [ ] **Step 2: Verify**

```bash
npm run lint
npm run build 2>&1 | tail -5
```

Ожидается: чисто.

- [ ] **Step 3: Smoke-проверка через sql shell**

```bash
npm run db:psql -- -c "
SELECT c.id, c.name, c.status,
GREATEST(c.last_session_date, c.created_at::date, COALESCE(lt.touched_at, '1970-01-01'::date)) AS last_touch_date
FROM clients c
LEFT JOIN LATERAL (
    SELECT touched_at FROM touches t WHERE t.client_id = c.id ORDER BY t.touched_at DESC LIMIT 1
) lt ON true
WHERE c.deleted_at IS NULL AND c.status <> 'left'
LIMIT 5;
"
```

Ожидается: запрос исполняется без ошибок (может вернуть 0 строк, если клиентов нет — это ок).

- [ ] **Step 4: Commit**

```bash
git add lib/triggers/query.ts
git commit -m "feat(triggers): listClientsWithLastTouch с LEFT JOIN LATERAL"
```

---

## Task 4: Группировка и сортировка триггеров

**Файлы:**
- Создать: `lib/today/group.ts`

- [ ] **Step 1: Создать `lib/today/group.ts`:**

```ts
import type {ClientWithLastTouch} from '@/lib/triggers/query';
import {computeTrigger, type Trigger, type TriggerPriority} from '@/lib/triggers/compute';
import type {TrainerSettings} from '@/lib/db/schema';

export type TriggerEntry = {
    client: ClientWithLastTouch;
    trigger: Trigger;
};

export type GroupKey = 'silent' | 'high' | 'medium' | 'low';

export type TriggerGroup = {
    key: GroupKey;
    title: string;
    emoji: string;
    entries: TriggerEntry[];
};

const PRIORITY_ORDER: Record<TriggerPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
    info: 3,
};

export function groupAndSortTriggers(
    clients: ClientWithLastTouch[],
    today: Date,
    thresholds: TrainerSettings['thresholds'],
): TriggerGroup[] {
    const entries: TriggerEntry[] = [];
    for (const c of clients) {
        const trigger = computeTrigger(
            {status: c.status, septemberBooking: c.septemberBooking, deletedAt: c.deletedAt},
            c.lastTouchDate,
            today,
            thresholds,
        );
        if (trigger) entries.push({client: c, trigger});
    }

    const silent = entries.filter((e) => e.trigger.kind === 'silent');
    const rest = entries.filter((e) => e.trigger.kind !== 'silent');

    rest.sort((a, b) => {
        const p = PRIORITY_ORDER[a.trigger.priority] - PRIORITY_ORDER[b.trigger.priority];
        if (p !== 0) return p;
        return b.trigger.daysSince - a.trigger.daysSince;
    });

    silent.sort((a, b) => b.trigger.daysSince - a.trigger.daysSince);

    const groups: TriggerGroup[] = [];

    if (silent.length > 0) {
        groups.push({key: 'silent', title: 'Тихие', emoji: 'silent', entries: silent});
    }

    const high = rest.filter((e) => e.trigger.priority === 'high');
    const medium = rest.filter((e) => e.trigger.priority === 'medium');
    const low = rest.filter((e) => e.trigger.priority === 'low' || e.trigger.priority === 'info');

    if (high.length > 0) groups.push({key: 'high', title: 'Срочно', emoji: 'high', entries: high});
    if (medium.length > 0) groups.push({key: 'medium', title: 'Средне', emoji: 'medium', entries: medium});
    if (low.length > 0) groups.push({key: 'low', title: 'Можно подождать', emoji: 'low', entries: low});

    return groups;
}
```

- [ ] **Step 2: Verify**

```bash
npm run lint
npm run build 2>&1 | tail -5
```

Ожидается: чисто.

- [ ] **Step 3: Commit**

```bash
git add lib/today/group.ts
git commit -m "feat(today): groupAndSortTriggers — silent сверху, потом по приоритету"
```

---

## Task 5: TriggerRow и TodayList компоненты

**Файлы:**
- Создать: `components/today/TriggerRow.tsx`
- Создать: `components/today/TodayList.tsx`

- [ ] **Step 1: `components/today/TriggerRow.tsx`**

```tsx
import Link from 'next/link';
import {ChevronRight} from 'lucide-react';
import type {TriggerEntry} from '@/lib/today/group';
import {TRIGGER_LABELS} from '@/lib/triggers/compute';
import {profileLabel} from '@/lib/clients/labels';

export function TriggerRow({entry}: {entry: TriggerEntry}) {
    const {client, trigger} = entry;
    return (
        <Link
            href={`/clients/${client.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-bg-3 transition-colors border-t hairline"
        >
            <span className="text-[20px] leading-none w-6 text-center" aria-hidden="true">{trigger.emoji}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-tx text-[15px] font-medium truncate">{client.name}</span>
                    {client.profile && (
                        <span className="text-tx-3 text-[12px] hidden md:inline">{profileLabel(client.profile)}</span>
                    )}
                </div>
                <div className="text-tx-2 text-[12px] font-mono mt-0.5">
                    {TRIGGER_LABELS[trigger.kind]} · {Number.isFinite(trigger.daysSince) ? `${trigger.daysSince}д` : '∞'} без касания
                </div>
            </div>
            <ChevronRight size={16} className="text-tx-3 shrink-0"/>
        </Link>
    );
}
```

- [ ] **Step 2: `components/today/TodayList.tsx`**

```tsx
import type {TriggerGroup} from '@/lib/today/group';
import {TriggerRow} from './TriggerRow';

export function TodayList({groups}: {groups: TriggerGroup[]}) {
    return (
        <div className="flex flex-col gap-6">
            {groups.map((g) => (
                <section key={g.key}>
                    <h2 className="font-display uppercase text-[15px] tracking-wide text-tx-2 mb-3 flex items-center gap-2">
                        <span aria-hidden="true">{g.emoji}</span>
                        <span>{g.title}</span>
                        <span className="text-tx-3 font-mono text-[12px]">· {g.entries.length}</span>
                    </h2>
                    <div className="glass overflow-hidden">
                        {g.entries.map((e) => (
                            <TriggerRow key={e.client.id} entry={e}/>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
```

- [ ] **Step 3: Verify**

```bash
npm run lint
npm run build 2>&1 | tail -5
```

Ожидается: чисто.

- [ ] **Step 4: Commit**

```bash
git add components/today/TriggerRow.tsx components/today/TodayList.tsx
git commit -m "feat(today): TriggerRow и TodayList — секции по приоритету"
```

---

## Task 6: `/today` — реальный экран триггеров

**Файлы:**
- Изменить (полностью): `app/(app)/today/page.tsx`

- [ ] **Step 1: Заменить `app/(app)/today/page.tsx`:**

```tsx
import {redirect} from 'next/navigation';
import {eq} from 'drizzle-orm';
import {auth} from '@/lib/auth/config';
import {db} from '@/lib/db';
import {trainers} from '@/lib/db/schema';
import {listClientsWithLastTouch} from '@/lib/triggers/query';
import {groupAndSortTriggers} from '@/lib/today/group';
import {TodayList} from '@/components/today/TodayList';
import {EmptyState} from '@/components/ui/EmptyState';
import {DEFAULT_THRESHOLDS} from '@/lib/triggers/defaults';

export default async function TodayPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const [trainer] = await db.select().from(trainers).where(eq(trainers.id, session.user.id)).limit(1);
    const thresholds = trainer?.settings.thresholds ?? DEFAULT_THRESHOLDS;

    const clients = await listClientsWithLastTouch(session.user.id);
    const groups = groupAndSortTriggers(clients, new Date(), thresholds);

    const totalTriggers = groups.reduce((sum, g) => sum + g.entries.length, 0);

    return (
        <>
            <div className="flex items-end justify-between mb-6">
                <h1 className="font-display uppercase text-[27px] tracking-wide">Сегодня</h1>
                {totalTriggers > 0 && (
                    <span className="text-tx-2 font-mono text-[12px]">{totalTriggers} триггеров</span>
                )}
            </div>
            {totalTriggers === 0 ? (
                <EmptyState
                    title="Триггеров нет"
                    hint="База под контролем — так держать."
                />
            ) : (
                <TodayList groups={groups}/>
            )}
        </>
    );
}
```

- [ ] **Step 2: Verify сборку + быстрый smoke-чек**

```bash
npm run lint
npm run build 2>&1 | tail -15
```

Ожидается: build чистый, `/today` всё ещё в роутере как `ƒ Dynamic`.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/today/page.tsx"
git commit -m "feat(today): реальный экран триггеров с группировкой и счётчиком"
```

---

## Task 7: Sanity-кейсы для триггеров

**Файлы:**
- Создать: `lib/triggers/sanity-cases.ts`

- [ ] **Step 1: Создать `lib/triggers/sanity-cases.ts`:**

```ts
import type {ClientStatus} from '@/lib/db/schema';
import type {TriggerKind, TriggerPriority} from './compute';

export type SanityCase = {
    title: string;
    status: ClientStatus;
    septemberBooking: boolean;
    daysSinceLastTouch: number | null;
    expected: {kind: TriggerKind; priority: TriggerPriority} | null;
};

export const SANITY_CASES: SanityCase[] = [
    {
        title: 'Активный, 5 дней без касания — нет триггера',
        status: 'active',
        septemberBooking: false,
        daysSinceLastTouch: 5,
        expected: null,
    },
    {
        title: 'Активный, 10 дней — medium active_stale',
        status: 'active',
        septemberBooking: false,
        daysSinceLastTouch: 10,
        expected: {kind: 'active_stale', priority: 'medium'},
    },
    {
        title: 'Активный, 21 день — high active_stale',
        status: 'active',
        septemberBooking: false,
        daysSinceLastTouch: 21,
        expected: {kind: 'active_stale', priority: 'high'},
    },
    {
        title: 'Лид, 2 дня — нет триггера',
        status: 'lead',
        septemberBooking: false,
        daysSinceLastTouch: 2,
        expected: null,
    },
    {
        title: 'Лид, 3 дня — high lead_stale',
        status: 'lead',
        septemberBooking: false,
        daysSinceLastTouch: 3,
        expected: {kind: 'lead_stale', priority: 'high'},
    },
    {
        title: 'Отпуск с предзаписью на сентябрь — нет триггера',
        status: 'vacation',
        septemberBooking: true,
        daysSinceLastTouch: 1,
        expected: null,
    },
    {
        title: 'Отпуск без предзаписи — medium vacation_no_prebook',
        status: 'vacation',
        septemberBooking: false,
        daysSinceLastTouch: 1,
        expected: {kind: 'vacation_no_prebook', priority: 'medium'},
    },
    {
        title: 'Остывший, 29 дней — нет триггера',
        status: 'cooling',
        septemberBooking: false,
        daysSinceLastTouch: 29,
        expected: null,
    },
    {
        title: 'Остывший, 30 дней — medium cooled_stale',
        status: 'cooling',
        septemberBooking: false,
        daysSinceLastTouch: 30,
        expected: {kind: 'cooled_stale', priority: 'medium'},
    },
    {
        title: 'Активный, 45 дней — silent (страховка перекрывает active_stale)',
        status: 'active',
        septemberBooking: false,
        daysSinceLastTouch: 45,
        expected: {kind: 'silent', priority: 'high'},
    },
];
```

- [ ] **Step 2: Verify**

```bash
npm run lint
```

Ожидается: чисто.

- [ ] **Step 3: Commit**

```bash
git add lib/triggers/sanity-cases.ts
git commit -m "feat(triggers): 10 эталонных sanity-кейсов для computeTrigger"
```

---

## Task 8: `/dev/triggers-sanity` — playground (только dev)

**Файлы:**
- Создать: `app/(app)/dev/triggers-sanity/page.tsx`

- [ ] **Step 1: Создать `app/(app)/dev/triggers-sanity/page.tsx`:**

```tsx
import {notFound} from 'next/navigation';
import {computeTrigger} from '@/lib/triggers/compute';
import {SANITY_CASES} from '@/lib/triggers/sanity-cases';
import {DEFAULT_THRESHOLDS} from '@/lib/triggers/defaults';

const TODAY = new Date('2026-06-15T12:00:00Z');

function makeLastTouchDate(today: Date, days: number | null): Date | null {
    if (days === null) return null;
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d;
}

export default function TriggersSanityPage() {
    if (process.env.NODE_ENV !== 'development') {
        notFound();
    }

    const rows = SANITY_CASES.map((c) => {
        const trigger = computeTrigger(
            {status: c.status, septemberBooking: c.septemberBooking, deletedAt: null},
            makeLastTouchDate(TODAY, c.daysSinceLastTouch),
            TODAY,
            DEFAULT_THRESHOLDS,
        );
        const actual = trigger ? {kind: trigger.kind, priority: trigger.priority} : null;
        const match =
            (actual === null && c.expected === null) ||
            (actual !== null && c.expected !== null && actual.kind === c.expected.kind && actual.priority === c.expected.priority);
        return {c, actual, match};
    });

    const passed = rows.filter((r) => r.match).length;

    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-2">Triggers sanity</h1>
            <p className="text-tx-2 text-[13px] mb-6 font-mono">
                {passed} / {rows.length} прошло
            </p>
            <div className="glass overflow-hidden">
                <table className="w-full text-[13px]">
                    <thead>
                    <tr className="text-left text-tx-2 text-[12px] font-mono uppercase tracking-wider">
                        <th className="py-2 px-3 font-normal">Кейс</th>
                        <th className="py-2 px-3 font-normal">Ожидалось</th>
                        <th className="py-2 px-3 font-normal">Получили</th>
                        <th className="py-2 px-3 font-normal text-right">Ок?</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="border-t hairline">
                            <td className="py-3 px-3 text-tx">{r.c.title}</td>
                            <td className="py-3 px-3 font-mono text-tx-2">
                                {r.c.expected ? `${r.c.expected.kind} / ${r.c.expected.priority}` : '—'}
                            </td>
                            <td className="py-3 px-3 font-mono text-tx-2">
                                {r.actual ? `${r.actual.kind} / ${r.actual.priority}` : '—'}
                            </td>
                            <td className="py-3 px-3 text-right">
                                {r.match
                                    ? <span className="text-green">Пройдено</span>
                                    : <span className="text-orange">Ошибка</span>}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run lint
npm run build 2>&1 | tail -20
```

Ожидается: `/dev/triggers-sanity` в роутере как `ƒ Dynamic`. Lint чистый.

- [ ] **Step 3: Manual sanity-проверка в dev**

```bash
npm run dev > /tmp/dev.log 2>&1 &
sleep 8
echo "=== GET /dev/triggers-sanity (логин предполагается у тебя есть; иначе /login) ==="
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/dev/triggers-sanity
kill %1 2>/dev/null
wait %1 2>/dev/null
```

Ожидается: 200 (если залогинен) или 307 (если нет). Без 500.

В браузере на залогиненной сессии: открыть `/dev/triggers-sanity` → видно «10 / 10 прошло», все строки с зелёной галочкой.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/dev"
git commit -m "feat(dev): /dev/triggers-sanity playground для проверки computeTrigger"
```

---

## Task 9: Финальная проверка флоу триггеров

**Файлы:** только manual verification — без новых файлов.

- [ ] **Step 1: Подготовить тестовые данные**

```bash
npm run db:psql -- -c "TRUNCATE clients CASCADE;"

# Несколько клиентов с разными статусами и датами last_session_date
npm run db:psql -- -c "
INSERT INTO clients (trainer_id, name, status, profile, source, personal_fact, contact, last_session_date)
SELECT id, 'Иван Активный (без триггера)', 'active', 'health', 'reception', 'любит утро', 'tg:ivan', CURRENT_DATE - INTERVAL '5 days' FROM trainers LIMIT 1;

INSERT INTO clients (trainer_id, name, status, profile, source, personal_fact, contact, last_session_date)
SELECT id, 'Мария Активная (medium)', 'active', 'form', 'avito', 'марафон', 'tg:maria', CURRENT_DATE - INTERVAL '12 days' FROM trainers LIMIT 1;

INSERT INTO clients (trainer_id, name, status, profile, source, personal_fact, contact, last_session_date)
SELECT id, 'Петр Активный (high)', 'active', 'energy', 'referral', 'офис', 'tg:petr', CURRENT_DATE - INTERVAL '25 days' FROM trainers LIMIT 1;

INSERT INTO clients (trainer_id, name, status, source, personal_fact, contact, created_at)
SELECT id, 'Алёна Лид (high)', 'lead', 'reception', 'после квиза', 'tg:alyona', (NOW() - INTERVAL '5 days') FROM trainers LIMIT 1;

INSERT INTO clients (trainer_id, name, status, source, personal_fact, contact, created_at)
SELECT id, 'Семён Тихий (silent)', 'cooling', 'base', 'старый', 'tg:semyon', (NOW() - INTERVAL '60 days') FROM trainers LIMIT 1;
"
```

- [ ] **Step 2: Запустить dev и проверить через curl базовые редиректы**

```bash
npm run dev > /tmp/dev.log 2>&1 &
sleep 8
echo "=== /today без сессии → /login ==="
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/today
kill %1 2>/dev/null
wait %1 2>/dev/null
```

Ожидается: 307 на `/login?callbackUrl=...`. Это подтверждает, что middleware всё ещё защищает страницу.

- [ ] **Step 3: Manual verify в браузере (залогиненный)**

1. Открыть `/today` — должно быть **4 триггера** в группах:
    - Тихие: 1 (Семён, 60+ дней)
    - Срочно: 2 (Пётр active 25 дней, Алёна лид 5 дней)
    - Средне: 1 (Мария active 12 дней)
2. Иван (5 дней, active) и тренер `mmensky@gmail.com`-собственный тренер — отсутствуют в списке.
3. Каждый триггер — кликабельная строка, ведёт на `/clients/[id]`.
4. Заголовок «СЕГОДНЯ» каплоком, справа «4 триггеров».
5. Открыть `/dev/triggers-sanity` — 10/10 прошло.

- [ ] **Step 4: Commit (если есть что коммитить — например, лог тестового запроса в отдельный markdown)**

Если файлов не создал и не менял — пропустить commit. Только zaпись о завершении этапа в виде комментария к этому файлу плана не нужна.

---

## Acceptance — конец этапа 3

После 9 задач (8 коммитов с кодом, Task 9 — verification only):

- [ ] `npm run build` чистый, все 14 маршрутов (включая `/dev/triggers-sanity`) в роутере.
- [ ] Таблица `touches` создана в БД (`\d touches` показывает структуру).
- [ ] `/today` показывает группы триггеров с правильной сортировкой: silent сверху, потом по приоритету (high → medium → low), внутри — по daysSince DESC.
- [ ] Клиенты со статусом `left` и soft-deleted не показываются на `/today`.
- [ ] `/today` с пустой базой триггеров — EmptyState «Триггеров нет. База под контролем — так держать.»
- [ ] Тапы по триггеру → карточка клиента `/clients/[id]`.
- [ ] `/dev/triggers-sanity` доступен в dev: 10/10 кейсов проходят зелёной галочкой.
- [ ] `/dev/triggers-sanity` в проде → 404.

Следующий этап (Этап 4: Касания + экспорт для Claude) откроет `touches.insert`, кнопку «отметить касание» с `useOptimistic`, экспорт-сборку без contact-полей и кнопку «Скопировать для Claude» на `/today`.
