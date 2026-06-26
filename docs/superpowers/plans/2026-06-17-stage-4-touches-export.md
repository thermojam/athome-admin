# Этап 4: Касания + экспорт для Claude — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** На `/today` появляются чекбоксы у триггеров и кнопка primary cyan «Скопировать для Claude (N)» — она собирает строки экспорта без `contact` и кладёт текст в буфер. Появляется быстрая кнопка «Отметил» (тип `message`, в один тап, оптимистично). В карточке клиента `/clients/[id]` — отдельная кнопка «Отметить касание» с модалкой выбора типа и заметкой и список истории касаний. Полный пятничный ритуал работает.

**Architecture:** Server action `recordTouch(clientId, type, note?)` пишет в `touches` с `touched_at = CURRENT_DATE` и ревалидирует `/today` и `/clients/[id]`. Server action `buildExportForSelection(ids)` гоняет один SQL через существующий `listClientsWithLastTouch`, прогоняет `computeTrigger` и собирает результат через чистую функцию `buildClaudeExport`. Инвариант безопасности: узкий тип `ClientForExport` физически не содержит поле `contact`, серверный action делает явный `pick`, sanity-страница `/dev/export-sanity` проверяет отсутствие `@` и `+7` в выводе. `/today` становится client-component-обёрткой (`TodayBoard`): держит selection, оптимистично убирает строку после quick-touch, открывает модалку «без личного факта», показывает тост.

**Tech Stack:** Server Actions, `useOptimistic` + `useTransition` (React 19), Drizzle ORM, `navigator.clipboard.writeText`. Без новых npm зависимостей.

**Без автотестов** — продолжаем policy. Sanity-страница `/dev/export-sanity` (5 кейсов) + ручной чек golden path заменяют unit-тесты.

**Стиль кода:** 4-пробельный отступ + компактные скобки `{x}` (линтер переформатирует иначе).

---

## File map

**Создаём:**
- `lib/zod/touch.ts` — `TouchCreateSchema`
- `lib/touches/actions.ts` — `recordTouch` server action
- `lib/touches/labels.ts` — `TOUCH_TYPE_LABELS`, `touchTypeLabel`
- `lib/touches/queries.ts` — `listTouchesForClient`
- `lib/export/claude.ts` — `buildClaudeExport`, типы `ClientForExport` и `BuildClaudeExportResult`
- `lib/export/actions.ts` — `buildExportForSelection` server action
- `lib/export/sanity-cases.ts` — 5 кейсов
- `components/ui/Modal.tsx` — примитив-модалка
- `components/today/TodayBoard.tsx` — client-обёртка `/today` (selection + quick touch + copy + modal + toast)
- `components/touch/TouchHistory.tsx` — список касаний на карточке клиента
- `components/touch/TouchActions.tsx` — кнопка «Отметить касание» + модалка с типом/заметкой
- `app/(app)/dev/export-sanity/page.tsx`

**Меняем:**
- `app/(app)/today/page.tsx` — `TodayList` → `TodayBoard` + сериализация groups
- `app/(app)/clients/[id]/page.tsx` — добавляем `TouchActions` и `TouchHistory`

**Удаляем:**
- `components/today/TodayList.tsx` — заменяется на `TodayBoard`
- `components/today/TriggerRow.tsx` — логика переехала внутрь `TodayBoard`

---

## Task 1: Zod-схема касания + server action `recordTouch`

**Файлы:**
- Создать: `lib/zod/touch.ts`
- Создать: `lib/touches/actions.ts`

- [ ] **Step 1: Создать `lib/zod/touch.ts`:**

```ts
import {z} from 'zod';
import {TOUCH_TYPES} from '@/lib/db/schema';

export const TouchCreateSchema = z.object({
    type: z.enum(TOUCH_TYPES),
    note: z
        .string()
        .trim()
        .max(500, 'Слишком длинная заметка')
        .optional()
        .transform((v) => (v && v !== '' ? v : null)),
});

export type TouchCreateInput = z.infer<typeof TouchCreateSchema>;
```

- [ ] **Step 2: Создать `lib/touches/actions.ts`:**

```ts
'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {and, eq, isNull} from 'drizzle-orm';
import {db} from '@/lib/db';
import {clients, touches} from '@/lib/db/schema';
import type {TouchType} from '@/lib/db/schema';
import {auth} from '@/lib/auth/config';
import {TouchCreateSchema} from '@/lib/zod/touch';

export type RecordTouchResult = {ok: true} | {ok: false; error: string};

async function requireTrainerId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');
    return session.user.id;
}

export async function recordTouch(
    clientId: string,
    type: TouchType,
    note?: string | null,
): Promise<RecordTouchResult> {
    const trainerId = await requireTrainerId();

    const parsed = TouchCreateSchema.safeParse({type, note: note ?? undefined});
    if (!parsed.success) {
        return {ok: false, error: 'Проверь тип и заметку'};
    }

    const [owned] = await db
        .select({id: clients.id})
        .from(clients)
        .where(and(
            eq(clients.id, clientId),
            eq(clients.trainerId, trainerId),
            isNull(clients.deletedAt),
        ))
        .limit(1);

    if (!owned) {
        return {ok: false, error: 'Клиент не найден'};
    }

    const today = new Date().toISOString().slice(0, 10);

    await db.insert(touches).values({
        clientId,
        trainerId,
        type: parsed.data.type,
        touchedAt: today,
        note: parsed.data.note,
    });

    revalidatePath('/today');
    revalidatePath(`/clients/${clientId}`);
    return {ok: true};
}
```

- [ ] **Step 3: Verify**

```bash
npm run lint
npm run build 2>&1 | tail -5
```

Ожидается: оба чистые.

- [ ] **Step 4: Commit**

```bash
git add lib/zod/touch.ts lib/touches/actions.ts
git commit -m "feat(touches): server action recordTouch + zod-схема"
```

---

## Task 2: Лейблы типов касаний

**Файлы:**
- Создать: `lib/touches/labels.ts`

- [ ] **Step 1: Создать `lib/touches/labels.ts`:**

```ts
import type {TouchType} from '@/lib/db/schema';

export const TOUCH_TYPE_LABELS: Record<TouchType, string> = {
    message: 'Сообщение',
    call: 'Звонок',
    training: 'Тренировка',
    other: 'Другое',
};

export function touchTypeLabel(t: TouchType): string {
    return TOUCH_TYPE_LABELS[t];
}
```

- [ ] **Step 2: Verify**

```bash
npm run lint
```

Ожидается: чисто.

- [ ] **Step 3: Commit**

```bash
git add lib/touches/labels.ts
git commit -m "feat(touches): лейблы типов касаний"
```

---

## Task 3: Modal-примитив

**Файлы:**
- Создать: `components/ui/Modal.tsx`

- [ ] **Step 1: Создать `components/ui/Modal.tsx`:**

```tsx
'use client';

import {useEffect, type ReactNode} from 'react';

type Props = {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
};

export function Modal({open, onClose, title, children}: Props) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="glass w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <h2 className="font-display uppercase text-[18px] tracking-wide mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
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
git add components/ui/Modal.tsx
git commit -m "feat(ui): Modal-примитив с Escape и lock scroll"
```

---

## Task 4: `buildClaudeExport` — чистая функция + узкий тип

**Файлы:**
- Создать: `lib/export/claude.ts`

- [ ] **Step 1: Создать `lib/export/claude.ts`:**

```ts
import type {ClientProfile} from '@/lib/db/schema';
import type {Trigger} from '@/lib/triggers/compute';
import {TRIGGER_LABELS} from '@/lib/triggers/compute';
import {profileLabel} from '@/lib/clients/labels';

// Инвариант безопасности: тип НЕ содержит поле contact.
// Любая утечка контакта в Claude — это баг типа.
export type ClientForExport = {
    id: string;
    name: string;
    profile: ClientProfile | null;
    personalFact: string | null;
    goal: string | null;
    note: string | null;
    trigger: Trigger;
};

export type BuildClaudeExportResult = {
    text: string;
    missing: {id: string; name: string}[];
};

export function buildClaudeExport(
    selected: ClientForExport[],
    promptTemplate: string,
): BuildClaudeExportResult {
    const withFact: ClientForExport[] = [];
    const missing: {id: string; name: string}[] = [];

    for (const c of selected) {
        if (c.personalFact && c.personalFact.trim() !== '') {
            withFact.push(c);
        } else {
            missing.push({id: c.id, name: c.name});
        }
    }

    if (withFact.length === 0) {
        return {text: '', missing};
    }

    const lines = withFact.map((c) => [
        c.name,
        profileLabel(c.profile),
        TRIGGER_LABELS[c.trigger.kind],
        `${Number.isFinite(c.trigger.daysSince) ? c.trigger.daysSince : '∞'}д без касания`,
        c.goal ?? '—',
        c.personalFact,
        c.note ?? '—',
    ].join(' · '));

    return {text: `${promptTemplate}\n\n---\n\n${lines.join('\n')}`, missing};
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
git add lib/export/claude.ts
git commit -m "feat(export): buildClaudeExport — чистая функция + ClientForExport без contact"
```

---

## Task 5: Sanity-кейсы для экспорта

**Файлы:**
- Создать: `lib/export/sanity-cases.ts`

- [ ] **Step 1: Создать `lib/export/sanity-cases.ts`:**

```ts
import type {ClientForExport} from './claude';

const ACTIVE_STALE_MEDIUM = {
    kind: 'active_stale' as const,
    priority: 'medium' as const,
    daysSince: 12,
    emoji: 'medium',
};

export type ExportSanityCase = {
    title: string;
    selected: ClientForExport[];
    expectedMissingNames: string[];
    expectedTextHas: string[];
};

export const EXPORT_SANITY_CASES: ExportSanityCase[] = [
    {
        title: 'Один клиент с фактом → строка собирается',
        selected: [{
            id: 'c1',
            name: 'Аня',
            profile: 'health',
            personalFact: 'тренируется к свадьбе сестры',
            goal: 'тонус',
            note: null,
            trigger: ACTIVE_STALE_MEDIUM,
        }],
        expectedMissingNames: [],
        expectedTextHas: ['Аня', 'тренируется к свадьбе сестры', '12д без касания'],
    },
    {
        title: 'Один без факта → text пустой, missing содержит имя',
        selected: [{
            id: 'c2',
            name: 'Боря',
            profile: 'form',
            personalFact: null,
            goal: null,
            note: null,
            trigger: ACTIVE_STALE_MEDIUM,
        }],
        expectedMissingNames: ['Боря'],
        expectedTextHas: [],
    },
    {
        title: 'Один с фактом, один с пробелами → второй в missing, первый собирается',
        selected: [
            {
                id: 'c3', name: 'Вика', profile: 'energy',
                personalFact: 'бегает марафоны', goal: 'выносливость',
                note: 'выходные занята', trigger: ACTIVE_STALE_MEDIUM,
            },
            {
                id: 'c4', name: 'Гена', profile: null,
                personalFact: '   ', goal: null, note: null,
                trigger: ACTIVE_STALE_MEDIUM,
            },
        ],
        expectedMissingNames: ['Гена'],
        expectedTextHas: ['Вика', 'бегает марафоны', 'выходные занята'],
    },
    {
        title: 'Текст содержит шаблон-префикс и разделитель ---',
        selected: [{
            id: 'c5', name: 'Дима', profile: 'health',
            personalFact: 'играет в баскет', goal: 'спина',
            note: null, trigger: ACTIVE_STALE_MEDIUM,
        }],
        expectedMissingNames: [],
        expectedTextHas: ['SANITY_PROMPT', '---', 'Дима'],
    },
    {
        title: 'daysSince=Infinity → отображается как ∞',
        selected: [{
            id: 'c6', name: 'Женя', profile: null,
            personalFact: 'не любит мобайл-формат', goal: null,
            note: null,
            trigger: {kind: 'silent', priority: 'high', daysSince: Number.POSITIVE_INFINITY, emoji: 'silent'},
        }],
        expectedMissingNames: [],
        expectedTextHas: ['Женя', '∞д без касания'],
    },
];

export const SANITY_PROMPT = 'SANITY_PROMPT';
```

- [ ] **Step 2: Verify**

```bash
npm run lint
```

Ожидается: чисто.

- [ ] **Step 3: Commit**

```bash
git add lib/export/sanity-cases.ts
git commit -m "feat(export): 5 sanity-кейсов для buildClaudeExport"
```

---

## Task 6: Dev-страница `/dev/export-sanity`

**Файлы:**
- Создать: `app/(app)/dev/export-sanity/page.tsx`

- [ ] **Step 1: Создать `app/(app)/dev/export-sanity/page.tsx`:**

```tsx
import {notFound} from 'next/navigation';
import {buildClaudeExport} from '@/lib/export/claude';
import {EXPORT_SANITY_CASES, SANITY_PROMPT} from '@/lib/export/sanity-cases';

export default function ExportSanityPage() {
    if (process.env.NODE_ENV !== 'development') notFound();

    const rows = EXPORT_SANITY_CASES.map((c) => {
        const {text, missing} = buildClaudeExport(c.selected, SANITY_PROMPT);
        const expectedMissing = [...c.expectedMissingNames].sort().join(',');
        const actualMissing = missing.map((m) => m.name).sort().join(',');
        const missingOk = expectedMissing === actualMissing;
        const textHasOk = c.expectedTextHas.every((s) => text.includes(s));
        const noContactOk = !text.includes('@') && !text.includes('+7');
        return {c, text, missing, missingOk, textHasOk, noContactOk, allOk: missingOk && textHasOk && noContactOk};
    });

    const passed = rows.filter((r) => r.allOk).length;

    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-2">Export sanity</h1>
            <p className="text-tx-2 text-[13px] font-mono mb-6">{passed} / {rows.length} прошло</p>
            <div className="flex flex-col gap-4">
                {rows.map((r, i) => (
                    <div key={i} className="glass p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[14px]">{r.c.title}</span>
                            <span className={r.allOk ? 'text-green' : 'text-orange'}>{r.allOk ? 'Пройдено' : 'Ошибка'}</span>
                        </div>
                        <div className="text-[12px] font-mono text-tx-2 grid grid-cols-3 gap-2 mb-2">
                            <div>missing совпадает: {r.missingOk ? 'Пройдено' : 'Ошибка'}</div>
                            <div>текст содержит ожидаемое: {r.textHasOk ? 'Пройдено' : 'Ошибка'}</div>
                            <div>контакт не утёк: {r.noContactOk ? 'Пройдено' : 'Ошибка'}</div>
                        </div>
                        <pre className="text-[12px] font-mono text-tx-2 whitespace-pre-wrap bg-bg-3 p-3 rounded-[var(--radius-sm)]">{r.text || '— пусто —'}</pre>
                        {r.missing.length > 0 && (
                            <div className="text-[12px] font-mono text-tx-3 mt-2">
                                missing: {r.missing.map((m) => m.name).join(', ')}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}
```

- [ ] **Step 2: Verify**

```bash
npm run lint
npm run build 2>&1 | tail -5
```

Ожидается: чисто.

- [ ] **Step 3: Запустить dev и открыть страницу**

```bash
npm run dev
```

Открыть `http://localhost:3000/dev/export-sanity`. Ожидается: `5 / 5 прошло`, все строки зелёные. Прод-режим: страница даёт 404 (проверка ниже — опционально).

- [ ] **Step 4: Commit**

```bash
git add 'app/(app)/dev/export-sanity/page.tsx'
git commit -m "feat(dev): /dev/export-sanity playground с 5 кейсами"
```

---

## Task 7: Server action `buildExportForSelection`

**Файлы:**
- Создать: `lib/export/actions.ts`

- [ ] **Step 1: Создать `lib/export/actions.ts`:**

```ts
'use server';

import {eq} from 'drizzle-orm';
import {redirect} from 'next/navigation';
import {db} from '@/lib/db';
import {trainers} from '@/lib/db/schema';
import {auth} from '@/lib/auth/config';
import {listClientsWithLastTouch} from '@/lib/triggers/query';
import {computeTrigger} from '@/lib/triggers/compute';
import {DEFAULT_THRESHOLDS, DEFAULT_PROMPT_TEMPLATE} from '@/lib/triggers/defaults';
import {buildClaudeExport, type BuildClaudeExportResult, type ClientForExport} from './claude';

async function requireTrainerId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');
    return session.user.id;
}

export async function buildExportForSelection(
    clientIds: string[],
): Promise<BuildClaudeExportResult> {
    const trainerId = await requireTrainerId();
    if (clientIds.length === 0) return {text: '', missing: []};

    const [trainer] = await db.select().from(trainers).where(eq(trainers.id, trainerId)).limit(1);
    const promptTemplate = trainer?.settings.promptTemplate ?? DEFAULT_PROMPT_TEMPLATE;
    const thresholds = trainer?.settings.thresholds ?? DEFAULT_THRESHOLDS;

    const all = await listClientsWithLastTouch(trainerId);
    const today = new Date();
    const idSet = new Set(clientIds);

    const selected: ClientForExport[] = [];
    for (const c of all) {
        if (!idSet.has(c.id)) continue;
        const trigger = computeTrigger(
            {status: c.status, septemberBooking: c.septemberBooking, deletedAt: c.deletedAt},
            c.lastTouchDate,
            today,
            thresholds,
        );
        if (!trigger) continue;
        selected.push({
            id: c.id,
            name: c.name,
            profile: c.profile,
            personalFact: c.personalFact,
            goal: c.goal,
            note: c.note,
            trigger,
        });
    }

    return buildClaudeExport(selected, promptTemplate);
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
git add lib/export/actions.ts
git commit -m "feat(export): server action buildExportForSelection с явным pick полей"
```

---

## Task 8: `TodayBoard` — client-обёртка для /today

**Файлы:**
- Создать: `components/today/TodayBoard.tsx`

- [ ] **Step 1: Создать `components/today/TodayBoard.tsx`:**

```tsx
'use client';

import {useState, useOptimistic, useTransition} from 'react';
import Link from 'next/link';
import {ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/Button';
import {Modal} from '@/components/ui/Modal';
import {recordTouch} from '@/lib/touches/actions';
import {buildExportForSelection} from '@/lib/export/actions';
import {TRIGGER_LABELS, type TriggerKind, type TriggerPriority} from '@/lib/triggers/compute';
import {profileLabel} from '@/lib/clients/labels';
import type {ClientProfile} from '@/lib/db/schema';

export type BoardEntry = {
    clientId: string;
    name: string;
    profile: ClientProfile | null;
    triggerKind: TriggerKind;
    priority: TriggerPriority;
    emoji: string;
    daysSince: number;
};

export type BoardGroup = {
    key: 'silent' | 'high' | 'medium' | 'low';
    title: string;
    emoji: string;
    entries: BoardEntry[];
};

type ModalState = {
    open: boolean;
    missing: {id: string; name: string}[];
    partial: string | null;
};

const EMPTY_MODAL: ModalState = {open: false, missing: [], partial: null};

export function TodayBoard({groups}: {groups: BoardGroup[]}) {
    const [optimisticGroups, removeOptimistically] = useOptimistic<BoardGroup[], string>(
        groups,
        (state, clientId) => state
            .map((g) => ({...g, entries: g.entries.filter((e) => e.clientId !== clientId)}))
            .filter((g) => g.entries.length > 0),
    );
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [pending, startTransition] = useTransition();
    const [modal, setModal] = useState<ModalState>(EMPTY_MODAL);
    const [toast, setToast] = useState<string | null>(null);

    const allIds = optimisticGroups.flatMap((g) => g.entries.map((e) => e.clientId));
    const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

    function toggle(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleAll() {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(allIds));
    }

    function showToast(msg: string) {
        setToast(msg);
        window.setTimeout(() => setToast(null), 3000);
    }

    function quickTouch(clientId: string) {
        startTransition(async () => {
            removeOptimistically(clientId);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(clientId);
                return next;
            });
            const res = await recordTouch(clientId, 'message');
            if (!res.ok) showToast(res.error);
        });
    }

    async function handleCopy() {
        const ids = [...selected];
        const {text, missing} = await buildExportForSelection(ids);
        if (missing.length > 0) {
            setModal({open: true, missing, partial: text || null});
            return;
        }
        if (text === '') {
            showToast('Нечего копировать.');
            return;
        }
        await navigator.clipboard.writeText(text);
        setSelected(new Set());
        showToast('В буфере. Вставляй в Claude.');
    }

    async function copyPartial() {
        if (!modal.partial) {
            setModal(EMPTY_MODAL);
            return;
        }
        await navigator.clipboard.writeText(modal.partial);
        setSelected(new Set());
        setModal(EMPTY_MODAL);
        showToast('Скопировано без клиентов без факта.');
    }

    return (
        <>
            <div className="flex items-center justify-between mb-4 gap-3">
                <label className="inline-flex items-center gap-2 text-tx-2 text-[13px] cursor-pointer">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-line bg-bg-3 accent-cyan"
                    />
                    <span>Выбрать все</span>
                </label>
                <Button
                    variant="primary"
                    size="md"
                    disabled={selected.size === 0 || pending}
                    onClick={handleCopy}
                >
                    Скопировать для Claude{selected.size > 0 ? ` (${selected.size})` : ''}
                </Button>
            </div>

            <div className="flex flex-col gap-6">
                {optimisticGroups.map((g) => (
                    <section key={g.key}>
                        <h2 className="font-display uppercase text-[15px] tracking-wide text-tx-2 mb-3 flex items-center gap-2">
                            <span aria-hidden="true">{g.emoji}</span>
                            <span>{g.title}</span>
                            <span className="text-tx-3 font-mono text-[12px]">· {g.entries.length}</span>
                        </h2>
                        <div className="glass overflow-hidden">
                            {g.entries.map((e) => (
                                <div
                                    key={e.clientId}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-bg-3 transition-colors border-t hairline first:border-t-0"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.has(e.clientId)}
                                        onChange={() => toggle(e.clientId)}
                                        className="h-4 w-4 rounded border-line bg-bg-3 accent-cyan shrink-0"
                                        aria-label={`Выбрать ${e.name}`}
                                    />
                                    <span className="text-[20px] leading-none w-6 text-center" aria-hidden="true">{e.emoji}</span>
                                    <Link href={`/clients/${e.clientId}`} className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-tx text-[15px] font-medium truncate">{e.name}</span>
                                            {e.profile && (
                                                <span className="text-tx-3 text-[12px] hidden md:inline">{profileLabel(e.profile)}</span>
                                            )}
                                        </div>
                                        <div className="text-tx-2 text-[12px] font-mono mt-0.5">
                                            {TRIGGER_LABELS[e.triggerKind]} · {Number.isFinite(e.daysSince) ? `${e.daysSince}д` : '∞'} без касания
                                        </div>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => quickTouch(e.clientId)}
                                        disabled={pending}
                                        className="shrink-0 text-[12px] text-green hover:text-tx px-2 py-1 rounded-[var(--radius-sm)] hover:bg-bg-3 disabled:opacity-50"
                                        aria-label={`Отметить сообщением: ${e.name}`}
                                    >
                                        Отметил
                                    </button>
                                    <ChevronRight size={16} className="text-tx-3 shrink-0"/>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <Modal
                open={modal.open}
                onClose={() => setModal(EMPTY_MODAL)}
                title="Без личного факта"
            >
                <p className="text-tx-2 text-[14px] mb-4">
                    У этих клиентов нет личного факта — без него сообщение не соберётся. Допиши факт в карточке или скопируй без них.
                </p>
                <ul className="flex flex-col gap-1 mb-6">
                    {modal.missing.map((m) => (
                        <li key={m.id}>
                            <Link href={`/clients/${m.id}`} className="text-cyan hover:underline text-[14px]">
                                {m.name}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" size="md" onClick={() => setModal(EMPTY_MODAL)}>
                        Допишу факт
                    </Button>
                    {modal.partial && (
                        <Button variant="primary" size="md" onClick={copyPartial}>
                            Скопировать без них
                        </Button>
                    )}
                </div>
            </Modal>

            {toast && (
                <div
                    role="status"
                    className="fixed bottom-24 md:bottom-6 right-6 z-50 glass px-4 py-3 text-[13px] text-tx"
                >
                    {toast}
                </div>
            )}
        </>
    );
}
```

- [ ] **Step 2: Verify**

```bash
npm run lint
npm run build 2>&1 | tail -10
```

Ожидается: чисто. Build не должен жаловаться на серверный импорт из client component — `recordTouch` и `buildExportForSelection` объявлены `'use server'`, это валидный паттерн.

- [ ] **Step 3: Commit**

```bash
git add components/today/TodayBoard.tsx
git commit -m "feat(today): TodayBoard — selection, quick-touch с useOptimistic, копирование для Claude"
```

---

## Task 9: Подключить `TodayBoard` к `/today` + удалить старые TodayList/TriggerRow

**Файлы:**
- Изменить: `app/(app)/today/page.tsx`
- Удалить: `components/today/TodayList.tsx`
- Удалить: `components/today/TriggerRow.tsx`

- [ ] **Step 1: Перезаписать `app/(app)/today/page.tsx`:**

```tsx
import {redirect} from 'next/navigation';
import {eq} from 'drizzle-orm';
import {auth} from '@/lib/auth/config';
import {db} from '@/lib/db';
import {trainers} from '@/lib/db/schema';
import {listClientsWithLastTouch} from '@/lib/triggers/query';
import {groupAndSortTriggers} from '@/lib/today/group';
import {TodayBoard, type BoardGroup} from '@/components/today/TodayBoard';
import {EmptyState} from '@/components/ui/EmptyState';
import {DEFAULT_THRESHOLDS} from '@/lib/triggers/defaults';

export default async function TodayPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const [trainer] = await db.select().from(trainers).where(eq(trainers.id, session.user.id)).limit(1);
    const thresholds = trainer?.settings.thresholds ?? DEFAULT_THRESHOLDS;

    const clients = await listClientsWithLastTouch(session.user.id);
    const groups = groupAndSortTriggers(clients, new Date(), thresholds);

    const boardGroups: BoardGroup[] = groups.map((g) => ({
        key: g.key,
        title: g.title,
        emoji: g.emoji,
        entries: g.entries.map((e) => ({
            clientId: e.client.id,
            name: e.client.name,
            profile: e.client.profile,
            triggerKind: e.trigger.kind,
            priority: e.trigger.priority,
            emoji: e.trigger.emoji,
            daysSince: e.trigger.daysSince,
        })),
    }));

    const total = boardGroups.reduce((sum, g) => sum + g.entries.length, 0);

    return (
        <>
            <div className="flex items-end justify-between mb-6">
                <h1 className="font-display uppercase text-[27px] tracking-wide">Сегодня</h1>
                {total > 0 && (
                    <span className="text-tx-2 font-mono text-[12px]">{total} триггеров</span>
                )}
            </div>
            {total === 0 ? (
                <EmptyState title="Триггеров нет" hint="База под контролем — так держать."/>
            ) : (
                <TodayBoard groups={boardGroups}/>
            )}
        </>
    );
}
```

- [ ] **Step 2: Удалить старые компоненты**

```bash
rm components/today/TodayList.tsx components/today/TriggerRow.tsx
```

- [ ] **Step 3: Verify**

```bash
npm run lint
npm run build 2>&1 | tail -10
```

Ожидается: чисто. Никаких ссылок на удалённые TodayList/TriggerRow не остаётся (проверим grep'ом).

```bash
grep -rn "TriggerRow\|TodayList" app/ components/ lib/ || echo "no references"
```

Ожидается: `no references`.

- [ ] **Step 4: Ручная проверка golden path /today**

Запустить `npm run dev`. Открыть `/today` авторизованным тренером:

1. Видны секции триггеров с чекбоксами.
2. Выбрать одного клиента с `personal_fact` → кнопка «Скопировать для Claude (1)» активна → клик → тост «В буфере. Вставляй в Claude.» → вставить в любой текстовый редактор: строка содержит шаблон-промпт + имя клиента, НЕ содержит email/телефон.
3. Выбрать только клиента без `personal_fact` → клик «Скопировать» → открывается модалка «Без личного факта» с его именем (ссылка на карточку).
4. Выбрать клиента с фактом и без → модалка с одним именем + активна кнопка «Скопировать без них» → клик → тост.
5. Клик «Отметил» на любой строке → строка мгновенно пропадает (оптимистично) → после короткой задержки — counter «N триггеров» наверху обновляется.

- [ ] **Step 5: Commit**

```bash
git add 'app/(app)/today/page.tsx' components/today/
git commit -m "feat(today): TodayBoard подключён, старые TodayList/TriggerRow удалены"
```

---

## Task 10: История касаний — query + компонент

**Файлы:**
- Создать: `lib/touches/queries.ts`
- Создать: `components/touch/TouchHistory.tsx`

- [ ] **Step 1: Создать `lib/touches/queries.ts`:**

```ts
import {and, desc, eq} from 'drizzle-orm';
import {db} from '@/lib/db';
import {touches} from '@/lib/db/schema';
import type {Touch} from '@/lib/db/schema';

export async function listTouchesForClient(
    trainerId: string,
    clientId: string,
): Promise<Touch[]> {
    return db
        .select()
        .from(touches)
        .where(and(
            eq(touches.clientId, clientId),
            eq(touches.trainerId, trainerId),
        ))
        .orderBy(desc(touches.touchedAt), desc(touches.createdAt));
}
```

- [ ] **Step 2: Создать `components/touch/TouchHistory.tsx`:**

```tsx
import type {Touch} from '@/lib/db/schema';
import {touchTypeLabel} from '@/lib/touches/labels';

function formatTouchDate(d: string): string {
    const [y, m, day] = d.split('-');
    return `${day}.${m}.${y}`;
}

export function TouchHistory({touches}: {touches: Touch[]}) {
    if (touches.length === 0) {
        return (
            <p className="text-tx-3 text-[13px] font-mono">Касаний пока нет.</p>
        );
    }
    return (
        <div className="glass overflow-hidden">
            {touches.map((t) => (
                <div key={t.id} className="px-4 py-3 border-t hairline first:border-t-0">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-tx text-[14px]">{touchTypeLabel(t.type)}</span>
                        <span className="text-tx-3 text-[12px] font-mono">{formatTouchDate(t.touchedAt)}</span>
                    </div>
                    {t.note && <p className="text-tx-2 text-[13px] mt-1">{t.note}</p>}
                </div>
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
git add lib/touches/queries.ts components/touch/TouchHistory.tsx
git commit -m "feat(touches): listTouchesForClient + TouchHistory"
```

---

## Task 11: TouchActions — кнопка «Отметить касание» с модалкой

**Файлы:**
- Создать: `components/touch/TouchActions.tsx`

- [ ] **Step 1: Создать `components/touch/TouchActions.tsx`:**

```tsx
'use client';

import {useState, useTransition} from 'react';
import {Button} from '@/components/ui/Button';
import {Modal} from '@/components/ui/Modal';
import {Select} from '@/components/ui/Select';
import {Textarea} from '@/components/ui/Textarea';
import {recordTouch} from '@/lib/touches/actions';
import {TOUCH_TYPES, type TouchType} from '@/lib/db/schema';
import {TOUCH_TYPE_LABELS} from '@/lib/touches/labels';

export function TouchActions({clientId}: {clientId: string}) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<TouchType>('message');
    const [note, setNote] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function close() {
        setOpen(false);
        setError(null);
        setNote('');
        setType('message');
    }

    function submit() {
        setError(null);
        startTransition(async () => {
            const res = await recordTouch(clientId, type, note);
            if (!res.ok) {
                setError(res.error);
                return;
            }
            close();
        });
    }

    return (
        <>
            <Button variant="primary" size="md" onClick={() => setOpen(true)}>
                Отметить касание
            </Button>
            <Modal open={open} onClose={close} title="Отметить касание">
                <div className="flex flex-col gap-4">
                    <Select
                        label="Тип"
                        name="type"
                        value={type}
                        onChange={(e) => setType(e.target.value as TouchType)}
                    >
                        {TOUCH_TYPES.map((t) => (
                            <option key={t} value={t}>{TOUCH_TYPE_LABELS[t]}</option>
                        ))}
                    </Select>
                    <Textarea
                        label="Заметка (необязательно)"
                        name="note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        maxLength={500}
                    />
                    {error && <p className="text-orange text-[13px]">{error}</p>}
                    <div className="flex gap-3 justify-end">
                        <Button variant="ghost" size="md" onClick={close} disabled={pending}>
                            Отмена
                        </Button>
                        <Button variant="primary" size="md" onClick={submit} disabled={pending}>
                            Записать
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
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
git add components/touch/TouchActions.tsx
git commit -m "feat(touches): TouchActions — кнопка + модалка с типом и заметкой"
```

---

## Task 12: Подключить TouchActions и TouchHistory к `/clients/[id]`

**Файлы:**
- Изменить: `app/(app)/clients/[id]/page.tsx`

- [ ] **Step 1: Перезаписать `app/(app)/clients/[id]/page.tsx`:**

```tsx
import {notFound, redirect} from 'next/navigation';
import {auth} from '@/lib/auth/config';
import {getClient} from '@/lib/clients/queries';
import {listTouchesForClient} from '@/lib/touches/queries';
import {updateClient, softDeleteClient, type ActionResult} from '@/lib/clients/actions';
import {Card} from '@/components/ui/Card';
import {Button} from '@/components/ui/Button';
import {ClientForm} from '@/components/client/ClientForm';
import {TouchActions} from '@/components/touch/TouchActions';
import {TouchHistory} from '@/components/touch/TouchHistory';
import {profileLabel, statusLabel, sourceLabel} from '@/lib/clients/labels';

export default async function ClientPage({params}: {params: Promise<{id: string}>}) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const {id} = await params;
    const client = await getClient(session.user.id, id);
    if (!client) notFound();

    const touches = client.deletedAt ? [] : await listTouchesForClient(session.user.id, id);

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
            <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="font-display uppercase text-[27px] tracking-wide">{client.name}</h1>
                {!client.deletedAt && <TouchActions clientId={client.id}/>}
            </div>
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
            <Card className="mb-8">
                <ClientForm action={update} initial={client} submitLabel="Сохранить"/>
            </Card>

            {!client.deletedAt && (
                <section className="mb-8">
                    <h2 className="font-display uppercase text-[15px] tracking-wide text-tx-2 mb-3">История касаний</h2>
                    <TouchHistory touches={touches}/>
                </section>
            )}

            {!client.deletedAt && (
                <form action={remove}>
                    <Button type="submit" variant="ghost" size="sm">
                        Удалить (soft)
                    </Button>
                </form>
            )}
        </>
    );
}
```

- [ ] **Step 2: Verify**

```bash
npm run lint
npm run build 2>&1 | tail -10
```

Ожидается: чисто.

- [ ] **Step 3: Ручная проверка `/clients/[id]`**

`npm run dev` → открыть любого клиента:

1. В правом верхнем углу — primary cyan кнопка «Отметить касание».
2. Клик → открывается модалка с Select (типы: Сообщение / Звонок / Тренировка / Другое) и Textarea.
3. Выбрать «Звонок», написать заметку «договорились на четверг» → «Записать» → модалка закрывается.
4. Внизу страницы в секции «История касаний» появилась новая запись с типом, заметкой и сегодняшней датой.
5. Открыть `/today` — этот клиент пропал из триггеров (если был там).
6. На карточке удалённого (soft) клиента кнопка «Отметить касание» не отображается, секция истории тоже скрыта.

- [ ] **Step 4: Smoke БД**

```bash
npm run db:psql -- -c "SELECT id, client_id, type, touched_at, note FROM touches ORDER BY created_at DESC LIMIT 5;"
```

Ожидается: видны последние записи касаний, `touched_at` = сегодня.

- [ ] **Step 5: Commit**

```bash
git add 'app/(app)/clients/[id]/page.tsx'
git commit -m "feat(clients): TouchActions и история касаний на карточке клиента"
```

---

## Task 13: Финальная проверка пятничного ритуала

Это не код — это сценарий приёмки. Если что-то не сходится, фиксим точечно и коммитим отдельным шагом.

- [ ] **Step 1: Поднять чистое окружение**

```bash
npm run db:up
npm run db:migrate
npm run dev
```

- [ ] **Step 2: Сценарий**

Войти как существующий тренер. Подготовка данных (если ещё нет):

```bash
npm run db:psql -- -c "SELECT id, name, status, personal_fact FROM clients WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5;"
```

Если триггеров нет, через `/clients/[id]` искусственно состарить клиента: поменять `last_session_date` на 30+ дней назад:

```bash
npm run db:psql -- -c "UPDATE clients SET last_session_date = CURRENT_DATE - INTERVAL '25 days' WHERE name = '<имя>' RETURNING id, name;"
```

- [ ] **Step 3: Пройти ритуал**

1. `/today`: виден список триггеров.
2. «Выбрать все» → клик → счётчик кнопки совпадает с total.
3. «Скопировать для Claude (N)»: если есть без `personal_fact` — модалка; «Скопировать без них» — тост, в буфере текст. Иначе — сразу тост.
4. Вставить буфер в любой редактор: видны строки вида `Имя · Здоровье · Активный без тренировки · 12д без касания · цель · факт · заметка`. **Контактов и `@`/`+7` в тексте НЕТ.**
5. На одной строке клик «Отметить» — строка пропадает мгновенно, через 1-2 сек счётчик «N триггеров» наверху обновляется.
6. Открыть карточку этого клиента → «История касаний» содержит свежую запись `Сообщение` от сегодняшней даты.
7. На карточке клик «Отметить касание» → модалка → `Тренировка` + заметка «час 18:00» → «Записать» → в истории появилась вторая запись.

- [ ] **Step 4: `/dev/export-sanity` остался зелёным**

Открыть `http://localhost:3000/dev/export-sanity` — `5 / 5 прошло`, все строки зелёные. Если красное — починить и закоммитить как отдельный fix, не сюда.

- [ ] **Step 5: Финальный коммит-маркер этапа (опционально)**

Если по ходу ритуала что-то правилось:

```bash
git status
git diff
git add <изменённые-файлы>
git commit -m "fix(stage-4): корректировки по golden path"
```

Если всё чисто:

```bash
git log --oneline -15
```

Ожидается: ряд коммитов задач 1-12, история линейная.

---

## Definition of Done Этапа 4

- На `/today` есть чекбоксы у строк, primary cyan кнопка «Скопировать для Claude (N)», quick-touch «Отметил» работает оптимистично.
- В буфере после клика — текст с шаблон-промптом, разделителем `---` и строками клиентов БЕЗ `contact`.
- Модалка «Без личного факта» предлагает «Допишу факт» / «Скопировать без них» когда уместно.
- На `/clients/[id]` — кнопка «Отметить касание» с модалкой выбора типа + заметкой, ниже история касаний по убыванию даты.
- `/dev/export-sanity` показывает `5 / 5 прошло`, в т.ч. «контакт не утёк» — зелёный во всех кейсах.
- Таблица `touches` пополняется записями с `touched_at = CURRENT_DATE` через server action.
- Триггеры мгновенно пересчитываются после касания (revalidatePath работает).
