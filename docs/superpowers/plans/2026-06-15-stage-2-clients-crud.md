# Этап 2: CRUD клиентов — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Можно вести базу клиентов через UI: создавать, редактировать, soft-deleтить, искать и фильтровать. Отдельно — быстрая форма «+ Лид» из 4 полей, доступная с любого экрана.

**Architecture:** Расширяем Drizzle-схему таблицей `clients` (всё уже описано в дизайн-доке §2). Server Actions в `lib/clients/actions.ts` — создание, апдейт, soft delete; запросы в `lib/clients/queries.ts`. Один компонент `ClientForm` используется и в `/clients/new`, и в `/clients/[id]`. Список `/clients` — таблица desktop + карточки mobile, с фильтрами по статусу/профилю/источнику и поиском по имени/контакту. `/leads/new` — облегчённая форма (4 поля, status='lead'). «+ Лид» CTA живёт в TopBar (desktop) и FAB (mobile).

**Tech Stack:** Drizzle ORM, Server Actions, zod, lucide-react, Tailwind 4. Без новых зависимостей.

**Без автотестов** — продолжаем policy этапа 1. Каждая задача завершается ручной проверкой в браузере / SQL.

**Стиль кода:** Линтер проекта переформатирует TS/TSX в 4-пробельный отступ + компактные скобки `{x}` (без пробелов внутри). Пиши сразу в этом стиле — иначе линтер перепрошьёт и diff будут шумные.

---

## File map

**Создаём:**
- `lib/zod/client.ts` — zod-схемы для форм (Create/Update/Lead)
- `lib/clients/labels.ts` — словари profile/status/source с кириллическими лейблами
- `lib/clients/actions.ts` — server actions: createClient, updateClient, softDeleteClient, createLead
- `lib/clients/queries.ts` — listClients (с фильтрами/поиском/пагинацией), getClient
- `components/ui/Select.tsx`
- `components/ui/Textarea.tsx`
- `components/ui/Badge.tsx`
- `components/client/ClientForm.tsx` — полная форма (используется в new и [id])
- `components/client/ClientsList.tsx` — таблица desktop + карточки mobile
- `components/client/ClientFilters.tsx` — поиск + фильтры (client component)
- `components/nav/TopBar.tsx` — десктопный хедер с «+ Лид»
- `components/nav/MobileFab.tsx` — мобильный FAB «+ Лид»
- `app/(app)/clients/new/page.tsx`
- `app/(app)/clients/[id]/page.tsx`
- `app/(app)/leads/new/page.tsx`
- `drizzle/0001_*.sql` — миграция (автоген)

**Меняем:**
- `lib/db/schema.ts` — добавляем таблицу `clients`, типы `Client`, `NewClient`, `ClientStatus`, `ClientProfile`, `ClientSource`
- `app/(app)/clients/page.tsx` — заглушка → реальный список
- `app/(app)/layout.tsx` — подключаем TopBar и MobileFab

---

## Task 1: Расширить схему БД таблицей clients

**Файлы:**
- Изменить: `lib/db/schema.ts`
- Создать: `drizzle/0001_*.sql` (автоген)

- [ ] **Step 1: Заменить содержимое `lib/db/schema.ts`**

```ts
import {pgTable, uuid, text, jsonb, timestamp, integer, boolean, date, index} from 'drizzle-orm/pg-core';
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

export const CLIENT_PROFILES = ['health', 'form', 'energy'] as const;
export const CLIENT_STATUSES = ['active', 'vacation', 'cooling', 'lead', 'prebook', 'left'] as const;
export const CLIENT_SOURCES = ['reception', 'lift1', 'lift2', 'lift3', 'lift4', 'avito', 'referral', 'chat', 'base', 'other'] as const;

export type ClientProfile = typeof CLIENT_PROFILES[number];
export type ClientStatus = typeof CLIENT_STATUSES[number];
export type ClientSource = typeof CLIENT_SOURCES[number];

export const trainers = pgTable('trainers', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    settings: jsonb('settings').$type<TrainerSettings>().notNull(),
    createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
});

export const clients = pgTable('clients', {
    id: uuid('id').primaryKey().defaultRandom(),
    trainerId: uuid('trainer_id').notNull().references(() => trainers.id),
    name: text('name').notNull(),
    contact: text('contact'),
    profile: text('profile', {enum: CLIENT_PROFILES}),
    status: text('status', {enum: CLIENT_STATUSES}).notNull(),
    source: text('source', {enum: CLIENT_SOURCES}),
    personalFact: text('personal_fact'),
    goal: text('goal'),
    sessionsPerWeek: integer('sessions_per_week'),
    lastSessionDate: date('last_session_date'),
    septemberBooking: boolean('september_booking').default(false),
    note: text('note'),
    leadPayload: jsonb('lead_payload'),
    deletedAt: timestamp('deleted_at', {withTimezone: true}),
    createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).defaultNow().notNull(),
}, (t) => ({
    trainerIdx: index('clients_trainer_idx').on(t.trainerId),
    statusIdx: index('clients_status_idx').on(t.trainerId, t.status),
    nameIdx: index('clients_name_idx').on(t.trainerId, t.name),
}));

export type Trainer = typeof trainers.$inferSelect;
export type NewTrainer = typeof trainers.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
```

- [ ] **Step 2: Сгенерировать миграцию**

```bash
npm run db:generate
```

Ожидается: появился новый файл `drizzle/0001_*.sql` с `CREATE TABLE "clients" ...` и обновлённый `drizzle/meta/_journal.json`.

- [ ] **Step 3: Применить миграцию**

```bash
npm run db:migrate
```

Ожидается: `migrations applied successfully!` без ошибок.

- [ ] **Step 4: Проверить структуру таблицы**

```bash
npm run db:psql -- -c "\d clients"
```

Ожидается: таблица с колонками `id`, `trainer_id`, `name`, `contact`, `profile`, `status`, `source`, `personal_fact`, `goal`, `sessions_per_week`, `last_session_date`, `september_booking`, `note`, `lead_payload`, `deleted_at`, `created_at`, `updated_at`. Три индекса: `clients_trainer_idx`, `clients_status_idx`, `clients_name_idx`. FK на `trainers.id`.

- [ ] **Step 5: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat(db): таблица clients с enum-полями и индексами"
```

---

## Task 2: Словари лейблов profile/status/source

**Файлы:**
- Создать: `lib/clients/labels.ts`

- [ ] **Step 1: Создать `lib/clients/labels.ts`**

```ts
import type {ClientProfile, ClientStatus, ClientSource} from '@/lib/db/schema';

export const PROFILE_LABELS: Record<ClientProfile, string> = {
    health: 'Здоровье',
    form: 'Форма',
    energy: 'Энергия',
};

export const STATUS_LABELS: Record<ClientStatus, string> = {
    active: 'Активный',
    vacation: 'Отпуск',
    cooling: 'Остыл',
    lead: 'Лид',
    prebook: 'Предзапись',
    left: 'Ушёл',
};

export const SOURCE_LABELS: Record<ClientSource, string> = {
    reception: 'Ресепшн',
    lift1: 'Лифт ЖК-1',
    lift2: 'Лифт ЖК-2',
    lift3: 'Лифт ЖК-3',
    lift4: 'Лифт ЖК-4',
    avito: 'Авито',
    referral: 'Рефералка',
    chat: 'Чат ЖК',
    base: 'База',
    other: 'Другое',
};

export function profileLabel(p: ClientProfile | null | undefined): string {
    return p ? PROFILE_LABELS[p] : '—';
}

export function statusLabel(s: ClientStatus): string {
    return STATUS_LABELS[s];
}

export function sourceLabel(s: ClientSource | null | undefined): string {
    return s ? SOURCE_LABELS[s] : '—';
}
```

- [ ] **Step 2: Manual verify (sanity-сборка)**

```bash
npm run lint && npm run build 2>&1 | tail -5
```

Ожидается: lint и build без ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/clients/labels.ts
git commit -m "feat(clients): словари лейблов для profile/status/source"
```

---

## Task 3: zod-схемы для форм клиента и лида

**Файлы:**
- Создать: `lib/zod/client.ts`

- [ ] **Step 1: Создать `lib/zod/client.ts`**

```ts
import {z} from 'zod';
import {CLIENT_PROFILES, CLIENT_STATUSES, CLIENT_SOURCES} from '@/lib/db/schema';

const dateOrEmpty = z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Дата в формате YYYY-MM-DD')
    .transform((v) => (v === '' ? null : v));

const intOrEmpty = z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d+$/.test(v), 'Целое число')
    .transform((v) => (v === '' ? null : parseInt(v, 10)));

const trimmedOrNull = z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v));

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
    z.preprocess(
        (v) => (v === '' || v == null ? null : v),
        z.enum(values).nullable(),
    );

export const ClientCreateSchema = z.object({
    name: z.string().trim().min(1, 'Имя обязательно').max(120),
    contact: trimmedOrNull.nullable(),
    profile: optionalEnum(CLIENT_PROFILES),
    status: z.enum(CLIENT_STATUSES),
    source: optionalEnum(CLIENT_SOURCES),
    personalFact: trimmedOrNull.nullable(),
    goal: trimmedOrNull.nullable(),
    sessionsPerWeek: intOrEmpty.nullable(),
    lastSessionDate: dateOrEmpty.nullable(),
    septemberBooking: z.preprocess((v) => v === 'on' || v === true, z.boolean()),
    note: trimmedOrNull.nullable(),
});

export const ClientUpdateSchema = ClientCreateSchema;

export const LeadCreateSchema = z.object({
    name: z.string().trim().min(1, 'Имя обязательно').max(120),
    contact: trimmedOrNull.nullable(),
    source: optionalEnum(CLIENT_SOURCES),
    personalFact: trimmedOrNull.nullable(),
});

export type ClientCreateInput = z.infer<typeof ClientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;
export type LeadCreateInput = z.infer<typeof LeadCreateSchema>;
```

- [ ] **Step 2: Manual verify**

```bash
npm run lint
```

Ожидается: без ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/zod/client.ts
git commit -m "feat(clients): zod-схемы ClientCreate/ClientUpdate/LeadCreate"
```

---

## Task 4: Query helpers — listClients и getClient

**Файлы:**
- Создать: `lib/clients/queries.ts`

- [ ] **Step 1: Создать `lib/clients/queries.ts`**

```ts
import {db} from '@/lib/db';
import {clients} from '@/lib/db/schema';
import type {Client, ClientStatus, ClientProfile, ClientSource} from '@/lib/db/schema';
import {and, eq, ilike, or, isNull, inArray, desc} from 'drizzle-orm';

export type ListClientsFilter = {
    trainerId: string;
    search?: string;
    statuses?: ClientStatus[];
    profiles?: ClientProfile[];
    sources?: ClientSource[];
    includeDeleted?: boolean;
};

export async function listClients(filter: ListClientsFilter): Promise<Client[]> {
    const conds = [eq(clients.trainerId, filter.trainerId)];

    if (!filter.includeDeleted) {
        conds.push(isNull(clients.deletedAt));
    }

    if (filter.statuses && filter.statuses.length > 0) {
        conds.push(inArray(clients.status, filter.statuses));
    }

    if (filter.profiles && filter.profiles.length > 0) {
        conds.push(inArray(clients.profile, filter.profiles));
    }

    if (filter.sources && filter.sources.length > 0) {
        conds.push(inArray(clients.source, filter.sources));
    }

    if (filter.search && filter.search.trim() !== '') {
        const pattern = `%${filter.search.trim()}%`;
        conds.push(
            or(
                ilike(clients.name, pattern),
                ilike(clients.contact, pattern),
            )!,
        );
    }

    return db
        .select()
        .from(clients)
        .where(and(...conds))
        .orderBy(desc(clients.createdAt));
}

export async function getClient(trainerId: string, id: string): Promise<Client | null> {
    const [row] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, id), eq(clients.trainerId, trainerId)))
        .limit(1);
    return row ?? null;
}
```

- [ ] **Step 2: Manual verify**

```bash
npm run lint && npm run build 2>&1 | tail -5
```

Ожидается: lint и build без ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/clients/queries.ts
git commit -m "feat(clients): query helpers listClients, getClient, countActiveClients"
```

---

## Task 5: Server actions — create, update, soft delete, createLead

**Файлы:**
- Создать: `lib/clients/actions.ts`

- [ ] **Step 1: Создать `lib/clients/actions.ts`**

```ts
'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {and, eq} from 'drizzle-orm';
import {db} from '@/lib/db';
import {clients} from '@/lib/db/schema';
import {auth} from '@/lib/auth/config';
import {ClientCreateSchema, ClientUpdateSchema, LeadCreateSchema} from '@/lib/zod/client';

export type ActionResult =
    | {ok: true; id?: string}
    | {ok: false; error: string; fieldErrors?: Record<string, string>};

async function requireTrainerId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }
    return session.user.id;
}

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

export async function createClient(formData: FormData): Promise<ActionResult> {
    const trainerId = await requireTrainerId();

    const parsed = ClientCreateSchema.safeParse({
        name: formData.get('name'),
        contact: formData.get('contact'),
        profile: formData.get('profile'),
        status: formData.get('status'),
        source: formData.get('source'),
        personalFact: formData.get('personalFact'),
        goal: formData.get('goal'),
        sessionsPerWeek: formData.get('sessionsPerWeek'),
        lastSessionDate: formData.get('lastSessionDate'),
        septemberBooking: formData.get('septemberBooking'),
        note: formData.get('note'),
    });

    if (!parsed.success) {
        return {ok: false, error: 'Проверь поля и попробуй ещё раз', fieldErrors: collectFieldErrors(parsed.error)};
    }

    const [row] = await db
        .insert(clients)
        .values({trainerId, ...parsed.data})
        .returning({id: clients.id});

    revalidatePath('/clients');
    redirect(`/clients/${row.id}`);
}

export async function updateClient(id: string, formData: FormData): Promise<ActionResult> {
    const trainerId = await requireTrainerId();

    const parsed = ClientUpdateSchema.safeParse({
        name: formData.get('name'),
        contact: formData.get('contact'),
        profile: formData.get('profile'),
        status: formData.get('status'),
        source: formData.get('source'),
        personalFact: formData.get('personalFact'),
        goal: formData.get('goal'),
        sessionsPerWeek: formData.get('sessionsPerWeek'),
        lastSessionDate: formData.get('lastSessionDate'),
        septemberBooking: formData.get('septemberBooking'),
        note: formData.get('note'),
    });

    if (!parsed.success) {
        return {ok: false, error: 'Проверь поля и попробуй ещё раз', fieldErrors: collectFieldErrors(parsed.error)};
    }

    await db
        .update(clients)
        .set({...parsed.data, updatedAt: new Date()})
        .where(and(eq(clients.id, id), eq(clients.trainerId, trainerId)));

    revalidatePath('/clients');
    revalidatePath(`/clients/${id}`);
    return {ok: true};
}

export async function softDeleteClient(id: string): Promise<void> {
    const trainerId = await requireTrainerId();

    await db
        .update(clients)
        .set({deletedAt: new Date(), updatedAt: new Date()})
        .where(and(eq(clients.id, id), eq(clients.trainerId, trainerId)));

    revalidatePath('/clients');
    redirect('/clients');
}

export async function createLead(formData: FormData): Promise<ActionResult> {
    const trainerId = await requireTrainerId();

    const parsed = LeadCreateSchema.safeParse({
        name: formData.get('name'),
        contact: formData.get('contact'),
        source: formData.get('source'),
        personalFact: formData.get('personalFact'),
    });

    if (!parsed.success) {
        return {ok: false, error: 'Проверь поля и попробуй ещё раз', fieldErrors: collectFieldErrors(parsed.error)};
    }

    const [row] = await db
        .insert(clients)
        .values({
            trainerId,
            name: parsed.data.name,
            contact: parsed.data.contact,
            source: parsed.data.source,
            personalFact: parsed.data.personalFact,
            status: 'lead',
        })
        .returning({id: clients.id});

    revalidatePath('/clients');
    revalidatePath('/today');
    redirect(`/clients/${row.id}`);
}
```

- [ ] **Step 2: Manual verify**

```bash
npm run lint && npm run build 2>&1 | tail -5
```

Ожидается: lint и build без ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/clients/actions.ts
git commit -m "feat(clients): server actions create/update/softDelete/createLead"
```

---

## Task 6: UI-атомы Select, Textarea, Badge

**Файлы:**
- Создать: `components/ui/Select.tsx`
- Создать: `components/ui/Textarea.tsx`
- Создать: `components/ui/Badge.tsx`

- [ ] **Step 1: `components/ui/Select.tsx`**

```tsx
import {forwardRef, type SelectHTMLAttributes, type ReactNode} from 'react';
import {clsx} from 'clsx';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    error?: string;
    children: ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
    {label, error, className, id, children, ...rest},
    ref,
) {
    const selectId = id ?? rest.name;
    return (
        <label htmlFor={selectId} className="flex flex-col gap-1.5">
            {label && (
                <span className="text-[13px] text-tx-2 font-medium tracking-[0.01em]">{label}</span>
            )}
            <select
                ref={ref}
                id={selectId}
                className={clsx(
                    'h-11 px-3 rounded-[var(--radius-sm)] bg-bg-3 text-tx',
                    'border border-line focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/40',
                    'transition-all duration-150 ease-[var(--ease-soft)]',
                    error && 'border-orange focus:border-orange focus:ring-orange/40',
                    className,
                )}
                aria-invalid={!!error}
                aria-describedby={error ? `${selectId}-err` : undefined}
                {...rest}
            >
                {children}
            </select>
            {error && (
                <span id={`${selectId}-err`} className="text-[13px] text-orange">{error}</span>
            )}
        </label>
    );
});
```

- [ ] **Step 2: `components/ui/Textarea.tsx`**

```tsx
import {forwardRef, type TextareaHTMLAttributes} from 'react';
import {clsx} from 'clsx';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
    {label, error, className, id, ...rest},
    ref,
) {
    const taId = id ?? rest.name;
    return (
        <label htmlFor={taId} className="flex flex-col gap-1.5">
            {label && (
                <span className="text-[13px] text-tx-2 font-medium tracking-[0.01em]">{label}</span>
            )}
            <textarea
                ref={ref}
                id={taId}
                rows={rest.rows ?? 3}
                className={clsx(
                    'px-3 py-2 rounded-[var(--radius-sm)] bg-bg-3 text-tx resize-y',
                    'border border-line focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/40',
                    'transition-all duration-150 ease-[var(--ease-soft)]',
                    error && 'border-orange focus:border-orange focus:ring-orange/40',
                    className,
                )}
                aria-invalid={!!error}
                aria-describedby={error ? `${taId}-err` : undefined}
                {...rest}
            />
            {error && (
                <span id={`${taId}-err`} className="text-[13px] text-orange">{error}</span>
            )}
        </label>
    );
});
```

- [ ] **Step 3: `components/ui/Badge.tsx`**

```tsx
import type {HTMLAttributes} from 'react';
import {clsx} from 'clsx';

type Tone = 'neutral' | 'cyan' | 'violet' | 'pink' | 'green' | 'orange';

type Props = HTMLAttributes<HTMLSpanElement> & {
    tone?: Tone;
};

const toneClasses: Record<Tone, string> = {
    neutral: 'bg-bg-3 text-tx-2',
    cyan: 'bg-cyan/10 text-cyan ring-1 ring-cyan/30',
    violet: 'bg-violet/10 text-violet ring-1 ring-violet/30',
    pink: 'bg-pink/10 text-pink ring-1 ring-pink/30',
    green: 'bg-green/10 text-green ring-1 ring-green/30',
    orange: 'bg-orange/10 text-orange ring-1 ring-orange/30',
};

export function Badge({tone = 'neutral', className, children, ...rest}: Props) {
    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1 px-2 h-6 rounded-[var(--radius-sm)] text-[12px] font-mono tracking-[0.02em]',
                toneClasses[tone],
                className,
            )}
            {...rest}
        >
            {children}
        </span>
    );
}
```

- [ ] **Step 4: Manual verify**

```bash
npm run lint && npm run build 2>&1 | tail -5
```

Ожидается: lint и build без ошибок.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Select.tsx components/ui/Textarea.tsx components/ui/Badge.tsx
git commit -m "feat(ui): атомы Select, Textarea, Badge"
```

---

## Task 7: ClientForm — общий компонент формы клиента

**Файлы:**
- Создать: `components/client/ClientForm.tsx`

- [ ] **Step 1: Создать `components/client/ClientForm.tsx`**

```tsx
'use client';

import {useActionState} from 'react';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {Textarea} from '@/components/ui/Textarea';
import {Button} from '@/components/ui/Button';
import {CLIENT_PROFILES, CLIENT_STATUSES, CLIENT_SOURCES, type Client} from '@/lib/db/schema';
import {PROFILE_LABELS, STATUS_LABELS, SOURCE_LABELS} from '@/lib/clients/labels';
import type {ActionResult} from '@/lib/clients/actions';

type Props = {
    action: (state: ActionResult | null, formData: FormData) => Promise<ActionResult>;
    initial?: Client;
    submitLabel: string;
};

export function ClientForm({action, initial, submitLabel}: Props) {
    const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
    const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};

    return (
        <form action={formAction} className="flex flex-col gap-4">
            <Input
                name="name"
                label="Имя"
                required
                defaultValue={initial?.name ?? ''}
                error={fieldErrors.name}
                autoFocus={!initial}
            />
            <Input
                name="contact"
                label="Контакт (TG-ник, телефон)"
                defaultValue={initial?.contact ?? ''}
                error={fieldErrors.contact}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select name="status" label="Статус" defaultValue={initial?.status ?? 'lead'} error={fieldErrors.status}>
                    {CLIENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                </Select>
                <Select name="profile" label="Профиль" defaultValue={initial?.profile ?? ''} error={fieldErrors.profile}>
                    <option value="">— не выбран —</option>
                    {CLIENT_PROFILES.map((p) => (
                        <option key={p} value={p}>{PROFILE_LABELS[p]}</option>
                    ))}
                </Select>
            </div>
            <Select name="source" label="Источник" defaultValue={initial?.source ?? ''} error={fieldErrors.source}>
                <option value="">— не выбран —</option>
                {CLIENT_SOURCES.map((s) => (
                    <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                ))}
            </Select>
            <Textarea
                name="personalFact"
                label="Личный факт (нужен для экспорта в Claude)"
                defaultValue={initial?.personalFact ?? ''}
                error={fieldErrors.personalFact}
                rows={2}
            />
            <Input
                name="goal"
                label="Цель"
                defaultValue={initial?.goal ?? ''}
                error={fieldErrors.goal}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                    name="sessionsPerWeek"
                    type="number"
                    min={0}
                    max={7}
                    label="Тренировок/неделю"
                    defaultValue={initial?.sessionsPerWeek?.toString() ?? ''}
                    error={fieldErrors.sessionsPerWeek}
                />
                <Input
                    name="lastSessionDate"
                    type="date"
                    label="Последняя тренировка"
                    defaultValue={initial?.lastSessionDate ?? ''}
                    error={fieldErrors.lastSessionDate}
                />
                <label className="flex items-center gap-2 mt-6">
                    <input
                        type="checkbox"
                        name="septemberBooking"
                        defaultChecked={initial?.septemberBooking ?? false}
                        className="w-4 h-4 accent-[var(--color-cyan)]"
                    />
                    <span className="text-[15px] text-tx">Бронь на сентябрь</span>
                </label>
            </div>
            <Textarea
                name="note"
                label="Заметка"
                defaultValue={initial?.note ?? ''}
                error={fieldErrors.note}
                rows={3}
            />
            {state && !state.ok && !Object.keys(fieldErrors).length && (
                <p className="text-[13px] text-orange">{state.error}</p>
            )}
            <Button type="submit" variant="primary" size="lg" disabled={pending} className="mt-2">
                {pending ? 'Сохраняю…' : submitLabel}
            </Button>
        </form>
    );
}
```

- [ ] **Step 2: Manual verify**

```bash
npm run lint && npm run build 2>&1 | tail -5
```

Ожидается: lint и build без ошибок.

- [ ] **Step 3: Commit**

```bash
git add components/client/ClientForm.tsx
git commit -m "feat(client): общий компонент ClientForm для new/edit"
```

---

## Task 8: `/clients/new` — страница создания

**Файлы:**
- Создать: `app/(app)/clients/new/page.tsx`

- [ ] **Step 1: Создать `app/(app)/clients/new/page.tsx`**

```tsx
import {Card} from '@/components/ui/Card';
import {ClientForm} from '@/components/client/ClientForm';
import {createClient, type ActionResult} from '@/lib/clients/actions';

export default function NewClientPage() {
    async function action(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
        'use server';
        return createClient(formData);
    }

    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-6">Новый клиент</h1>
            <Card>
                <ClientForm action={action} submitLabel="Создать"/>
            </Card>
        </>
    );
}
```

- [ ] **Step 2: Manual verify**

```bash
npm run dev > /tmp/dev.log 2>&1 &
sleep 8

# нужен залогиненный тренер; если ещё не создавал — сделай через /register в браузере или seed-скриптом
echo "=== /clients/new без сессии → /login ==="
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/clients/new

kill %1 2>/dev/null
wait %1 2>/dev/null
```

Ожидается: 307 redirect на `/login?callbackUrl=...`. Без визуального теста пока, форма проверится в Task 11 после подключения навигации.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/clients/new"
git commit -m "feat(clients): страница /clients/new с ClientForm"
```

---

## Task 9: `/clients/[id]` — страница карточки

**Файлы:**
- Создать: `app/(app)/clients/[id]/page.tsx`

- [ ] **Step 1: Создать `app/(app)/clients/[id]/page.tsx`**

```tsx
import {notFound, redirect} from 'next/navigation';
import {auth} from '@/lib/auth/config';
import {getClient} from '@/lib/clients/queries';
import {updateClient, softDeleteClient, type ActionResult} from '@/lib/clients/actions';
import {Card} from '@/components/ui/Card';
import {Button} from '@/components/ui/Button';
import {ClientForm} from '@/components/client/ClientForm';
import {profileLabel, statusLabel, sourceLabel} from '@/lib/clients/labels';

export default async function ClientPage({params}: {params: Promise<{id: string}>}) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const {id} = await params;
    const client = await getClient(session.user.id, id);
    if (!client) notFound();

    async function update(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
        'use server';
        return updateClient(id, formData);
    }

    async function remove() {
        'use server';
        await softDeleteClient(id);
    }

    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-2">{client.name}</h1>
            <p className="text-tx-2 text-[13px] font-mono mb-6">
                {statusLabel(client.status)} · {profileLabel(client.profile)} · {sourceLabel(client.source)}
            </p>
            {!client.personalFact && (
                <div className="mb-4 px-4 py-3 rounded-[var(--radius-sm)] border border-orange/40 bg-orange/5 text-[13px] text-orange">
                    Без личного факта сообщение не соберётся. Допиши — и клиент попадёт в экспорт.
                </div>
            )}
            {client.deletedAt && (
                <div className="mb-4 px-4 py-3 rounded-[var(--radius-sm)] border border-line bg-bg-3 text-[13px] text-tx-2">
                    Клиент удалён {client.deletedAt.toISOString().slice(0, 10)}. Редактирование сохраняет правки, но клиент не появится в списке без отдельного восстановления.
                </div>
            )}
            <Card>
                <ClientForm action={update} initial={client} submitLabel="Сохранить"/>
            </Card>
            {!client.deletedAt && (
                <form action={remove} className="mt-6">
                    <Button type="submit" variant="ghost" size="sm">
                        Удалить (soft)
                    </Button>
                </form>
            )}
        </>
    );
}
```

- [ ] **Step 2: Manual verify через прямой URL (со фикс-id)**

```bash
# создай тестового клиента вручную через psql
npm run db:psql -- -c "
INSERT INTO clients (trainer_id, name, status, source, personal_fact, contact)
SELECT id, 'Тест Клиент', 'active', 'reception', 'любит пиццу', 'tg:test'
FROM trainers LIMIT 1
RETURNING id;
"

# возьми вернувшийся id и проверь рендер страницы
npm run build 2>&1 | tail -5
```

Ожидается: build чистый. Проверка содержимого страницы — после Task 11 в браузере.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/clients/[id]"
git commit -m "feat(clients): страница карточки /clients/[id] с редактированием и soft delete"
```

---

## Task 10: ClientsList и ClientFilters — список с поиском и фильтрами

**Файлы:**
- Создать: `components/client/ClientsList.tsx`
- Создать: `components/client/ClientFilters.tsx`

- [ ] **Step 1: `components/client/ClientFilters.tsx`**

```tsx
'use client';

import {useRouter, useSearchParams, usePathname} from 'next/navigation';
import {useTransition} from 'react';
import {Input} from '@/components/ui/Input';
import {CLIENT_STATUSES, CLIENT_PROFILES, type ClientStatus, type ClientProfile} from '@/lib/db/schema';
import {STATUS_LABELS, PROFILE_LABELS} from '@/lib/clients/labels';

export function ClientFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const [pending, start] = useTransition();

    const search = params.get('q') ?? '';
    const statuses = new Set((params.get('status') ?? '').split(',').filter(Boolean));
    const profiles = new Set((params.get('profile') ?? '').split(',').filter(Boolean));
    const includeDeleted = params.get('deleted') === '1';

    function update(next: URLSearchParams) {
        start(() => router.replace(`${pathname}?${next.toString()}`));
    }

    function setSearch(v: string) {
        const next = new URLSearchParams(params.toString());
        if (v.trim() === '') next.delete('q');
        else next.set('q', v.trim());
        update(next);
    }

    function toggleStatus(s: ClientStatus) {
        const next = new URLSearchParams(params.toString());
        const current = new Set(statuses);
        if (current.has(s)) current.delete(s);
        else current.add(s);
        if (current.size === 0) next.delete('status');
        else next.set('status', Array.from(current).join(','));
        update(next);
    }

    function toggleProfile(p: ClientProfile) {
        const next = new URLSearchParams(params.toString());
        const current = new Set(profiles);
        if (current.has(p)) current.delete(p);
        else current.add(p);
        if (current.size === 0) next.delete('profile');
        else next.set('profile', Array.from(current).join(','));
        update(next);
    }

    function toggleDeleted() {
        const next = new URLSearchParams(params.toString());
        if (includeDeleted) next.delete('deleted');
        else next.set('deleted', '1');
        update(next);
    }

    return (
        <div className={`flex flex-col gap-3 ${pending ? 'opacity-60' : ''}`}>
            <Input
                name="q"
                placeholder="Поиск по имени или контакту"
                defaultValue={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
            />
            <div className="flex flex-wrap gap-2">
                {CLIENT_STATUSES.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => toggleStatus(s)}
                        className={`px-3 h-8 rounded-[var(--radius-sm)] text-[13px] border border-line transition-colors ${
                            statuses.has(s) ? 'bg-cyan/10 border-cyan/40 text-cyan' : 'bg-bg-3 text-tx-2 hover:text-tx'
                        }`}
                    >
                        {STATUS_LABELS[s]}
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap gap-2">
                {CLIENT_PROFILES.map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => toggleProfile(p)}
                        className={`px-3 h-8 rounded-[var(--radius-sm)] text-[13px] border border-line transition-colors ${
                            profiles.has(p) ? 'bg-violet/10 border-violet/40 text-violet' : 'bg-bg-3 text-tx-2 hover:text-tx'
                        }`}
                    >
                        {PROFILE_LABELS[p]}
                    </button>
                ))}
            </div>
            <label className="flex items-center gap-2 text-[13px] text-tx-2">
                <input type="checkbox" checked={includeDeleted} onChange={toggleDeleted} className="w-4 h-4 accent-[var(--color-cyan)]"/>
                Показывать удалённых
            </label>
        </div>
    );
}
```

- [ ] **Step 2: `components/client/ClientsList.tsx`**

```tsx
import Link from 'next/link';
import type {Client} from '@/lib/db/schema';
import {Badge} from '@/components/ui/Badge';
import {profileLabel, statusLabel, sourceLabel} from '@/lib/clients/labels';

const profileTone: Record<string, 'green' | 'pink' | 'cyan' | 'neutral'> = {
    health: 'green',
    form: 'pink',
    energy: 'cyan',
};

const statusTone: Record<string, 'orange' | 'violet' | 'neutral'> = {
    lead: 'orange',
    prebook: 'violet',
};

export function ClientsList({clients}: {clients: Client[]}) {
    if (clients.length === 0) {
        return (
            <p className="text-tx-2 py-12 text-center">
                Никого не нашлось. Сбрось фильтры или добавь клиента кнопкой «+ Клиент».
            </p>
        );
    }

    return (
        <>
            {/* Desktop таблица */}
            <table className="hidden md:table w-full text-[14px] mt-6">
                <thead>
                <tr className="text-left text-tx-2 text-[12px] font-mono uppercase tracking-wider">
                    <th className="py-2 px-3 font-normal">Имя</th>
                    <th className="py-2 px-3 font-normal">Статус</th>
                    <th className="py-2 px-3 font-normal">Профиль</th>
                    <th className="py-2 px-3 font-normal">Источник</th>
                    <th className="py-2 px-3 font-normal">Контакт</th>
                </tr>
                </thead>
                <tbody>
                {clients.map((c) => (
                    <tr key={c.id} className="border-t hairline hover:bg-bg-3 transition-colors">
                        <td className="py-3 px-3">
                            <Link href={`/clients/${c.id}`} className="text-tx hover:text-cyan">{c.name}</Link>
                            {c.deletedAt && <span className="ml-2 text-tx-3 text-[12px]">(удалён)</span>}
                        </td>
                        <td className="py-3 px-3">
                            <Badge tone={statusTone[c.status] ?? 'neutral'}>{statusLabel(c.status)}</Badge>
                        </td>
                        <td className="py-3 px-3">
                            {c.profile && <Badge tone={profileTone[c.profile] ?? 'neutral'}>{profileLabel(c.profile)}</Badge>}
                        </td>
                        <td className="py-3 px-3 text-tx-2">{sourceLabel(c.source)}</td>
                        <td className="py-3 px-3 text-tx-2 font-mono text-[13px]">{c.contact ?? '—'}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Mobile карточки */}
            <ul className="md:hidden flex flex-col gap-3 mt-4">
                {clients.map((c) => (
                    <li key={c.id} className="glass p-4">
                        <Link href={`/clients/${c.id}`} className="block">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-tx text-[16px] font-medium">{c.name}</span>
                                <Badge tone={statusTone[c.status] ?? 'neutral'}>{statusLabel(c.status)}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-tx-2 text-[13px]">
                                {c.profile && <span>{profileLabel(c.profile)}</span>}
                                {c.contact && <span className="font-mono">{c.contact}</span>}
                            </div>
                            {c.deletedAt && <p className="text-tx-3 text-[12px] mt-2">удалён</p>}
                        </Link>
                    </li>
                ))}
            </ul>
        </>
    );
}
```

- [ ] **Step 3: Manual verify**

```bash
npm run lint && npm run build 2>&1 | tail -5
```

Ожидается: lint и build без ошибок.

- [ ] **Step 4: Commit**

```bash
git add components/client/ClientFilters.tsx components/client/ClientsList.tsx
git commit -m "feat(client): ClientsList (desktop таблица + mobile карточки) и ClientFilters"
```

---

## Task 11: `/clients` — реальный список вместо заглушки

**Файлы:**
- Изменить: `app/(app)/clients/page.tsx`

- [ ] **Step 1: Заменить `app/(app)/clients/page.tsx`**

```tsx
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {auth} from '@/lib/auth/config';
import {listClients} from '@/lib/clients/queries';
import {ClientsList} from '@/components/client/ClientsList';
import {ClientFilters} from '@/components/client/ClientFilters';
import {Button} from '@/components/ui/Button';
import {EmptyState} from '@/components/ui/EmptyState';
import {CLIENT_STATUSES, CLIENT_PROFILES, type ClientStatus, type ClientProfile} from '@/lib/db/schema';

type SP = Promise<{q?: string; status?: string; profile?: string; deleted?: string}>;

function parseList<T extends string>(s: string | undefined, allowed: readonly T[]): T[] {
    if (!s) return [];
    const allowedSet = new Set(allowed);
    return s.split(',').filter((v): v is T => allowedSet.has(v as T));
}

export default async function ClientsPage({searchParams}: {searchParams: SP}) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const sp = await searchParams;
    const statuses = parseList<ClientStatus>(sp.status, CLIENT_STATUSES);
    const profiles = parseList<ClientProfile>(sp.profile, CLIENT_PROFILES);

    const clients = await listClients({
        trainerId: session.user.id,
        search: sp.q,
        statuses: statuses.length ? statuses : undefined,
        profiles: profiles.length ? profiles : undefined,
        includeDeleted: sp.deleted === '1',
    });

    const noFilters = !sp.q && statuses.length === 0 && profiles.length === 0 && sp.deleted !== '1';
    const isEmpty = clients.length === 0 && noFilters;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display uppercase text-[27px] tracking-wide">База</h1>
                <Link href="/clients/new">
                    <Button variant="primary" size="md">+ Клиент</Button>
                </Link>
            </div>
            {isEmpty ? (
                <EmptyState
                    title="База пустая"
                    hint="Добавь первого клиента — или быстро заведи лида с любого экрана."
                    action={
                        <Link href="/clients/new">
                            <Button variant="primary" size="md">+ Клиент</Button>
                        </Link>
                    }
                />
            ) : (
                <>
                    <ClientFilters/>
                    <ClientsList clients={clients}/>
                </>
            )}
        </>
    );
}
```

- [ ] **Step 2: Manual verify**

```bash
# seed одного активного клиента, если ещё не делал
npm run db:psql -- -c "
INSERT INTO clients (trainer_id, name, status, profile, source, personal_fact, contact)
SELECT id, 'Тест Активный', 'active', 'health', 'reception', 'любит утро', 'tg:test1'
FROM trainers LIMIT 1
ON CONFLICT DO NOTHING;
"

npm run build 2>&1 | tail -5
```

Ожидается: build чистый.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/clients/page.tsx"
git commit -m "feat(clients): реальный список /clients с фильтрами и поиском"
```

---

## Task 12: `/leads/new` — быстрая форма лида

**Файлы:**
- Создать: `app/(app)/leads/new/page.tsx`

- [ ] **Step 1: Создать `app/(app)/leads/new/page.tsx`**

```tsx
import {Card} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {Textarea} from '@/components/ui/Textarea';
import {Button} from '@/components/ui/Button';
import {createLead} from '@/lib/clients/actions';
import {CLIENT_SOURCES} from '@/lib/db/schema';
import {SOURCE_LABELS} from '@/lib/clients/labels';

export default function NewLeadPage() {
    async function action(formData: FormData) {
        'use server';
        const result = await createLead(formData);
        if (!result.ok) {
            throw new Error(result.error);
        }
    }

    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-2">Новый лид</h1>
            <p className="text-tx-2 text-[13px] mb-6">4 поля. Остальное — потом, из карточки.</p>
            <Card>
                <form action={action} className="flex flex-col gap-4">
                    <Input name="name" label="Имя" required autoFocus/>
                    <Input name="contact" label="Контакт (TG-ник, телефон)"/>
                    <Select name="source" label="Источник" defaultValue="">
                        <option value="">— не выбран —</option>
                        {CLIENT_SOURCES.map((s) => (
                            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                        ))}
                    </Select>
                    <Textarea name="personalFact" label="Личный факт (одна строка — что запомнить)" rows={2}/>
                    <Button type="submit" variant="primary" size="lg" className="mt-2">Создать</Button>
                </form>
            </Card>
        </>
    );
}
```

- [ ] **Step 2: Manual verify**

```bash
npm run build 2>&1 | tail -5
```

Ожидается: build чистый, `/leads/new` появилась в списке маршрутов.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/leads/new"
git commit -m "feat(leads): /leads/new — быстрая форма из 4 полей"
```

---

## Task 13: TopBar + MobileFab с «+ Лид» CTA

**Файлы:**
- Создать: `components/nav/TopBar.tsx`
- Создать: `components/nav/MobileFab.tsx`
- Изменить: `app/(app)/layout.tsx`

- [ ] **Step 1: `components/nav/TopBar.tsx`**

```tsx
import Link from 'next/link';
import {Plus} from 'lucide-react';
import {Button} from '@/components/ui/Button';

export function TopBar() {
    return (
        <div className="hidden md:flex items-center justify-end px-8 py-4 border-b hairline">
            <Link href="/leads/new">
                <Button variant="secondary" size="sm">
                    <Plus size={16}/>
                    Лид
                </Button>
            </Link>
        </div>
    );
}
```

- [ ] **Step 2: `components/nav/MobileFab.tsx`**

```tsx
import Link from 'next/link';
import {Plus} from 'lucide-react';

export function MobileFab() {
    return (
        <Link
            href="/leads/new"
            className="md:hidden fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-cyan text-bg shadow-[var(--shadow-glow)] flex items-center justify-center"
            aria-label="Новый лид"
        >
            <Plus size={28}/>
        </Link>
    );
}
```

- [ ] **Step 3: Изменить `app/(app)/layout.tsx`** — подключить TopBar и MobileFab. Полностью заменить:

```tsx
import {redirect} from 'next/navigation';
import {auth} from '@/lib/auth/config';
import {Sidebar} from '@/components/nav/Sidebar';
import {MobileTabBar} from '@/components/nav/MobileTabBar';
import {TopBar} from '@/components/nav/TopBar';
import {MobileFab} from '@/components/nav/MobileFab';

export default async function AppLayout({children}: {children: React.ReactNode}) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    return (
        <div className="min-h-screen flex">
            <Sidebar/>
            <main className="flex-1 pb-24 md:pb-0 flex flex-col">
                <TopBar/>
                <div className="max-w-[1080px] w-full mx-auto px-4 md:px-8 py-6 md:py-10">
                    {children}
                </div>
            </main>
            <MobileTabBar/>
            <MobileFab/>
        </div>
    );
}
```

- [ ] **Step 4: Manual verify полного флоу**

```bash
npm run lint && npm run build 2>&1 | tail -20
```

Ожидается: build с маршрутами `/clients`, `/clients/new`, `/clients/[id]`, `/leads/new`, плюс прежние.

Затем в браузере (вручную):

1. Зайти `/clients/new`, заполнить полную форму (имя, статус=active, профиль=health, источник=reception, личный факт, цель, 3 тренировки/неделю, дата прошлой тренировки, бронь на сентябрь, заметка). Нажать «Создать» → должно перебросить на `/clients/<id>` с заполненной формой.
2. На `/clients/<id>` поменять имя, сохранить — увидеть обновлённую шапку.
3. На `/clients` — клиент в списке. Фильтр «Активный» оставляет его; фильтр «Лид» прячет.
4. На любом экране нажать «+ Лид» (TopBar на десктопе, FAB на мобильном) → `/leads/new`. Заполнить 4 поля → перебрасывает на карточку, статус «Лид».
5. На `/clients/<id>` нажать «Удалить (soft)» → редирект на `/clients`. Клиент исчез. Включить «Показывать удалённых» — появился с пометкой «(удалён)».

- [ ] **Step 5: Commit**

```bash
git add components/nav/TopBar.tsx components/nav/MobileFab.tsx "app/(app)/layout.tsx"
git commit -m "feat(nav): TopBar и MobileFab с «+ Лид» CTA"
```

---

## Acceptance — конец этапа 2

После 13 задач:

- [ ] `npm run build` чистый, все 11 маршрутов (включая `/clients/[id]`, `/clients/new`, `/leads/new`) в роутере.
- [ ] Можно создать полную карточку клиента через `/clients/new` — все 11 полей сохраняются.
- [ ] Можно редактировать клиента в `/clients/[id]` — изменения отражаются на `/clients`.
- [ ] Поиск в `/clients` работает по имени и контакту (ILIKE), фильтры по статусу/профилю мульти-выбор через query string.
- [ ] Soft delete с кнопки в карточке: клиент пропадает из списка по умолчанию, виден с тогглом «Показывать удалённых».
- [ ] «+ Лид» с любого экрана (TopBar desktop, FAB mobile) → `/leads/new` → 4 поля → клиент со `status='lead'`.
- [ ] Желтая плашка «Без личного факта…» появляется в карточке клиента, если `personalFact` пуст.
- [ ] Все формы рендерятся в стиле дизайн-системы: glass-карточки, токены брендбука, шрифты, hover-состояния.

Следующий этап — Этап 3 (Триггеры + «Сегодня»). Запускается отдельным планом и опирается на `clients` и `touches` (последнее добавится там же).
