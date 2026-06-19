# Этап 5 — Импорт CSV: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Запустить `/clients/import` — тренер загружает CSV (экспорт из Excel, 15 канонических колонок), видит превью с подсветкой ошибок, при отсутствии ошибок одним кликом импортирует клиентов; повторный импорт того же файла никого не дублирует (UPSERT по `contact` или `name`).

**Architecture:** Чистый pipeline `lib/csv/*` (parse → coerce → validate, без БД и без React) + тонкие server actions `lib/clients/import.ts` (`previewImport` + `commitImport`) + UI `/clients/import` (client component с состояниями idle/parsing/preview/committing/imported). Sanity playground `/dev/import-sanity` вместо unit-тестов (паттерн из этапов 3-4). Транзакция всё-или-ничего, touches из CSV создаются только при INSERT.

**Tech Stack:** Next.js 16 + React 19 (server actions, 'use client'), TypeScript strict, Drizzle ORM, `papaparse`, `zod`, Tailwind 4.

**Project overrides (важно):**
- **Без автотестов** — sanity-страницы `/dev/*-sanity` вместо vitest. Не предлагать `npm test` или vitest.
- **Стиль кода:** 4 пробела, компактные скобки `{x}` без пробелов (как в `lib/db/schema.ts`).
- **Технический долг:** `requireTrainerId` уже дублируется в 3 файлах. Этот план добавит 4-й. Это сознательно — выносить в общий хелпер только при 5+ употреблениях (см. memory `project-shtab-state`).

**Спека:** `docs/superpowers/specs/2026-06-19-stage-5-csv-import-design.md` — открывай при сомнениях.

---

## File Structure

**Создаются:**
- `lib/csv/synonyms.ts` — 15 канонических заголовков + словари значений (статус/профиль/источник/тип касания/bool)
- `lib/csv/coerce.ts` — `coerceString`, `coerceDate`, `coerceBool`, `coerceInt`, фабрика `coerceEnum`
- `lib/csv/parse.ts` — `decodeFile(buf)`, `parseCsvText(text)`
- `lib/csv/validate.ts` — `CsvRowSchema`, `validateRow`, типы `CsvRow`, `RawRow`, `RowError`
- `lib/csv/sanity-cases.ts` — 10 эталонных кейсов
- `lib/clients/import.ts` — server actions `previewImport`, `commitImport`
- `app/dev/import-sanity/page.tsx` — playground для прогона кейсов
- `app/(app)/clients/import/page.tsx` — клиентский UI экрана импорта
- `components/import/ImportDropzone.tsx` — drag-and-drop + file input
- `components/import/ImportPreviewTable.tsx` — таблица 5 первых валидных строк
- `components/import/ImportErrorList.tsx` — список ошибок построчно
- `components/import/ImportReport.tsx` — итоговый «Добавлено N · Обновлено M»

**Модифицируются:**
- `app/(app)/clients/page.tsx` — CTA «Импортируй таблицу» на пустом состоянии → `/clients/import`

---

## Task 1: lib/csv/synonyms.ts — канонические заголовки и словари значений

**Files:**
- Create: `lib/csv/synonyms.ts`

- [ ] **Step 1: Создать `lib/csv/synonyms.ts`**

```ts
import {CLIENT_PROFILES, CLIENT_STATUSES, CLIENT_SOURCES, TOUCH_TYPES} from '@/lib/db/schema';
import type {ClientProfile, ClientStatus, ClientSource, TouchType} from '@/lib/db/schema';

export const CANONICAL_HEADERS = [
    'Имя',
    'Контакт',
    'Профиль',
    'Статус',
    'Источник',
    'Личный факт',
    'Цель',
    'Тренировок в неделю',
    'Последняя тренировка',
    'Бронь на сентябрь',
    'Заметка',
    'Последнее касание',
    'Тип касания',
    'Дата создания',
    'Дата удаления',
] as const;

export const HEADER_TO_KEY: Record<typeof CANONICAL_HEADERS[number], string> = {
    'Имя': 'name',
    'Контакт': 'contact',
    'Профиль': 'profile',
    'Статус': 'status',
    'Источник': 'source',
    'Личный факт': 'personalFact',
    'Цель': 'goal',
    'Тренировок в неделю': 'sessionsPerWeek',
    'Последняя тренировка': 'lastSessionDate',
    'Бронь на сентябрь': 'septemberBooking',
    'Заметка': 'note',
    'Последнее касание': 'lastTouchDate',
    'Тип касания': 'lastTouchType',
    'Дата создания': 'createdAt',
    'Дата удаления': 'deletedAt',
};

export const REQUIRED_HEADERS: ReadonlyArray<typeof CANONICAL_HEADERS[number]> = ['Имя', 'Статус'];

export const STATUS_SYNONYMS: Record<string, ClientStatus> = {
    'активный': 'active', 'активная': 'active', 'active': 'active',
    'отпуск': 'vacation', 'в отпуске': 'vacation', 'vacation': 'vacation',
    'остыл': 'cooling', 'остывает': 'cooling', 'cooling': 'cooling',
    'лид': 'lead', 'lead': 'lead',
    'предзапись': 'prebook', 'prebook': 'prebook',
    'ушёл': 'left', 'ушел': 'left', 'left': 'left',
};

export const PROFILE_SYNONYMS: Record<string, ClientProfile> = {
    'здоровье': 'health', '🟢 здоровье': 'health', 'health': 'health',
    'форма': 'form', '💪 форма': 'form', 'form': 'form',
    'энергия': 'energy', '⚡ энергия': 'energy', 'energy': 'energy',
};

export const SOURCE_SYNONYMS: Record<string, ClientSource> = {
    'ресепшн': 'reception', 'ресепшен': 'reception', 'reception': 'reception',
    'лифт 1': 'lift1', 'лифт1': 'lift1', 'lift1': 'lift1',
    'лифт 2': 'lift2', 'лифт2': 'lift2', 'lift2': 'lift2',
    'лифт 3': 'lift3', 'лифт3': 'lift3', 'lift3': 'lift3',
    'лифт 4': 'lift4', 'лифт4': 'lift4', 'lift4': 'lift4',
    'авито': 'avito', 'avito': 'avito',
    'рекомендация': 'referral', 'сарафан': 'referral', 'referral': 'referral',
    'чат': 'chat', 'chat': 'chat',
    'база': 'base', 'base': 'base',
    'другое': 'other', 'other': 'other',
};

export const TOUCH_TYPE_SYNONYMS: Record<string, TouchType> = {
    'сообщение': 'message', 'message': 'message',
    'звонок': 'call', 'call': 'call',
    'тренировка': 'training', 'training': 'training',
    'другое': 'other', 'other': 'other',
};

export const BOOL_TRUE = new Set(['да', 'yes', 'true', '1', 'y', 'д']);
export const BOOL_FALSE = new Set(['нет', 'no', 'false', '0', 'n', 'н', '']);
```

- [ ] **Step 2: Type-check проходит**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/csv/synonyms.ts
git commit -m "feat(csv): синонимы значений и канонические заголовки"
```

---

## Task 2: lib/csv/coerce.ts — приведение строк к каноническим типам

**Files:**
- Create: `lib/csv/coerce.ts`

- [ ] **Step 1: Создать `lib/csv/coerce.ts`**

```ts
import {BOOL_TRUE, BOOL_FALSE} from './synonyms';

export type CoerceResult<T> = {ok: true; value: T} | {ok: false; reason: string};

export function coerceString(raw: unknown): string {
    if (raw == null) return '';
    return String(raw).trim();
}

export function coerceBool(raw: unknown): CoerceResult<boolean> {
    const s = coerceString(raw).toLowerCase();
    if (BOOL_TRUE.has(s)) return {ok: true, value: true};
    if (BOOL_FALSE.has(s)) return {ok: true, value: false};
    return {ok: false, reason: `Не похоже на bool: "${s}"`};
}

export function coerceInt(raw: unknown): CoerceResult<number | null> {
    const s = coerceString(raw);
    if (s === '') return {ok: true, value: null};
    if (!/^-?\d+$/.test(s)) return {ok: false, reason: `Не целое число: "${s}"`};
    return {ok: true, value: parseInt(s, 10)};
}

export function coerceEnum<T extends string>(
    raw: unknown,
    synonyms: Record<string, T>,
    label: string,
): CoerceResult<T | null> {
    const s = coerceString(raw).toLowerCase();
    if (s === '') return {ok: true, value: null};
    const hit = synonyms[s];
    if (!hit) return {ok: false, reason: `Неизвестное значение для ${label}: "${s}"`};
    return {ok: true, value: hit};
}

// Возвращает YYYY-MM-DD string или null.
// Понимает: dd.mm.yyyy, dd/mm/yyyy, dd.mm.yy, dd/mm/yy, yyyy-mm-dd, Excel serial (число).
export function coerceDate(raw: unknown): CoerceResult<string | null> {
    const s = coerceString(raw);
    if (s === '') return {ok: true, value: null};

    // Excel serial: целое число (или дробное — округляем вниз).
    if (/^\d+(\.\d+)?$/.test(s)) {
        const serial = parseInt(s, 10);
        // Excel base: 1899-12-30 (учитывает баг с 1900 годом).
        const ms = (serial - 25569) * 86400 * 1000;
        const d = new Date(ms);
        if (Number.isNaN(d.getTime())) return {ok: false, reason: `Неверный Excel serial: "${s}"`};
        return {ok: true, value: formatIsoDate(d)};
    }

    // yyyy-mm-dd
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (iso) {
        const [, y, m, d] = iso;
        return validateYmd(parseInt(y, 10), parseInt(m, 10), parseInt(d, 10), s);
    }

    // dd.mm.yyyy | dd/mm/yyyy | dd.mm.yy | dd/mm/yy
    const dmy = /^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/.exec(s);
    if (dmy) {
        const day = parseInt(dmy[1], 10);
        const mon = parseInt(dmy[2], 10);
        let year = parseInt(dmy[3], 10);
        if (dmy[3].length === 2) year = year <= 29 ? 2000 + year : 1900 + year;
        return validateYmd(year, mon, day, s);
    }

    return {ok: false, reason: `Не распознан формат даты: "${s}"`};
}

function validateYmd(y: number, m: number, d: number, src: string): CoerceResult<string> {
    if (m < 1 || m > 12 || d < 1 || d > 31) return {ok: false, reason: `Неверная дата: "${src}"`};
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
        return {ok: false, reason: `Неверная дата: "${src}"`};
    }
    return {ok: true, value: formatIsoDate(dt)};
}

function formatIsoDate(d: Date): string {
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
git add lib/csv/coerce.ts
git commit -m "feat(csv): coerce — дата/bool/int/enum через словарь"
```

---

## Task 3: lib/csv/parse.ts — декодирование файла и парсинг CSV-текста

**Files:**
- Create: `lib/csv/parse.ts`

- [ ] **Step 1: Проверить что `papaparse` уже в зависимостях**

Run: `grep -n papaparse package.json`
Expected: строка `"papaparse": "..."`. Если нет — `npm i papaparse @types/papaparse`.

- [ ] **Step 2: Создать `lib/csv/parse.ts`**

```ts
import Papa from 'papaparse';
import {CANONICAL_HEADERS, HEADER_TO_KEY, REQUIRED_HEADERS} from './synonyms';

export const MAX_ROWS = 5000;
export const MAX_BYTES = 2 * 1024 * 1024;

export type RawRow = Record<string, string>;

export type ParseResult =
    | {kind: 'file_error'; message: string}
    | {kind: 'ok'; rows: RawRow[]};

export function decodeFile(buf: ArrayBuffer): string {
    try {
        return new TextDecoder('utf-8', {fatal: true}).decode(buf);
    } catch (e) {
        if (e instanceof TypeError) {
            return new TextDecoder('windows-1251').decode(buf);
        }
        throw e;
    }
}

export function parseCsvText(text: string): ParseResult {
    if (text.length === 0) return {kind: 'file_error', message: 'Файл пустой.'};

    const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
    });

    if (result.errors.length > 0) {
        const first = result.errors[0];
        return {kind: 'file_error', message: `Ошибка парсинга CSV: ${first.message}`};
    }

    const headers = result.meta.fields ?? [];
    for (const required of REQUIRED_HEADERS) {
        if (!headers.includes(required)) {
            return {kind: 'file_error', message: `Отсутствует обязательная колонка: "${required}"`};
        }
    }

    if (result.data.length > MAX_ROWS) {
        return {kind: 'file_error', message: `Слишком много строк: ${result.data.length} (лимит ${MAX_ROWS})`};
    }

    const knownHeaders = headers.filter((h): h is typeof CANONICAL_HEADERS[number] =>
        (CANONICAL_HEADERS as readonly string[]).includes(h),
    );

    const rows: RawRow[] = result.data.map((raw) => {
        const mapped: RawRow = {};
        for (const header of knownHeaders) {
            const key = HEADER_TO_KEY[header];
            mapped[key] = (raw[header] ?? '').toString();
        }
        return mapped;
    });

    return {kind: 'ok', rows};
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 4: Commit**

```bash
git add lib/csv/parse.ts package.json
git commit -m "feat(csv): decodeFile + parseCsvText с проверкой заголовков"
```

---

## Task 4: lib/csv/validate.ts — построчная валидация в CsvRow

**Files:**
- Create: `lib/csv/validate.ts`

- [ ] **Step 1: Создать `lib/csv/validate.ts`**

```ts
import type {ClientProfile, ClientStatus, ClientSource, TouchType} from '@/lib/db/schema';
import {coerceBool, coerceDate, coerceEnum, coerceInt, coerceString} from './coerce';
import {STATUS_SYNONYMS, PROFILE_SYNONYMS, SOURCE_SYNONYMS, TOUCH_TYPE_SYNONYMS} from './synonyms';
import type {RawRow} from './parse';

export type CsvRow = {
    name: string;
    contact: string | null;
    profile: ClientProfile | null;
    status: ClientStatus;
    source: ClientSource | null;
    personalFact: string | null;
    goal: string | null;
    sessionsPerWeek: number | null;
    lastSessionDate: string | null;
    septemberBooking: boolean;
    note: string | null;
    lastTouchDate: string | null;
    lastTouchType: TouchType | null;
    createdAt: string | null;
    deletedAt: string | null;
};

export type RowError = {lineNo: number; field: string; message: string};

export type ValidateResult =
    | {ok: true; row: CsvRow}
    | {ok: false; errors: RowError[]};

export function validateRow(raw: RawRow, lineNo: number): ValidateResult {
    const errors: RowError[] = [];
    const push = (field: string, message: string) => errors.push({lineNo, field, message});

    const name = coerceString(raw.name);
    if (name === '') push('name', 'Имя обязательно');

    const contact = coerceString(raw.contact);

    const profile = coerceEnum<ClientProfile>(raw.profile, PROFILE_SYNONYMS, 'профиля');
    if (!profile.ok) push('profile', profile.reason);

    const status = coerceEnum<ClientStatus>(raw.status, STATUS_SYNONYMS, 'статуса');
    if (!status.ok) push('status', status.reason);
    else if (status.value === null) push('status', 'Статус обязателен');

    const source = coerceEnum<ClientSource>(raw.source, SOURCE_SYNONYMS, 'источника');
    if (!source.ok) push('source', source.reason);

    const sessions = coerceInt(raw.sessionsPerWeek);
    if (!sessions.ok) push('sessionsPerWeek', sessions.reason);
    else if (sessions.value !== null && (sessions.value < 0 || sessions.value > 7)) {
        push('sessionsPerWeek', 'Должно быть 0–7');
    }

    const lastSession = coerceDate(raw.lastSessionDate);
    if (!lastSession.ok) push('lastSessionDate', lastSession.reason);

    const septemberBooking = coerceBool(raw.septemberBooking);
    if (!septemberBooking.ok) push('septemberBooking', septemberBooking.reason);

    const lastTouchDate = coerceDate(raw.lastTouchDate);
    if (!lastTouchDate.ok) push('lastTouchDate', lastTouchDate.reason);

    const lastTouchType = coerceEnum<TouchType>(raw.lastTouchType, TOUCH_TYPE_SYNONYMS, 'типа касания');
    if (!lastTouchType.ok) push('lastTouchType', lastTouchType.reason);

    const createdAt = coerceDate(raw.createdAt);
    if (!createdAt.ok) push('createdAt', createdAt.reason);

    const deletedAt = coerceDate(raw.deletedAt);
    if (!deletedAt.ok) push('deletedAt', deletedAt.reason);

    if (errors.length > 0) return {ok: false, errors};

    return {
        ok: true,
        row: {
            name,
            contact: contact === '' ? null : contact,
            profile: profile.ok ? profile.value : null,
            status: (status.ok ? status.value : null) as ClientStatus,
            source: source.ok ? source.value : null,
            personalFact: nullIfEmpty(coerceString(raw.personalFact)),
            goal: nullIfEmpty(coerceString(raw.goal)),
            sessionsPerWeek: sessions.ok ? sessions.value : null,
            lastSessionDate: lastSession.ok ? lastSession.value : null,
            septemberBooking: septemberBooking.ok ? septemberBooking.value : false,
            note: nullIfEmpty(coerceString(raw.note)),
            lastTouchDate: lastTouchDate.ok ? lastTouchDate.value : null,
            lastTouchType: lastTouchType.ok ? lastTouchType.value : null,
            createdAt: createdAt.ok ? createdAt.value : null,
            deletedAt: deletedAt.ok ? deletedAt.value : null,
        },
    };
}

function nullIfEmpty(s: string): string | null {
    return s === '' ? null : s;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/csv/validate.ts
git commit -m "feat(csv): validateRow → CsvRow или массив RowError"
```

---

## Task 5: lib/csv/sanity-cases.ts — 10 эталонных кейсов

**Files:**
- Create: `lib/csv/sanity-cases.ts`

- [ ] **Step 1: Создать `lib/csv/sanity-cases.ts`**

```ts
import type {CsvRow, RowError} from './validate';

export type ParseExpected =
    | {kind: 'file_error'; messageContains: string}
    | {kind: 'ok'; expectFirstRow?: Partial<CsvRow>; expectErrors?: Partial<RowError>[]; expectRowCount?: number};

export type SanityCase = {
    id: string;
    label: string;
    csv: string;
    expected: ParseExpected;
};

const HEADERS = 'Имя,Контакт,Профиль,Статус,Источник,Личный факт,Цель,Тренировок в неделю,Последняя тренировка,Бронь на сентябрь,Заметка,Последнее касание,Тип касания,Дата создания,Дата удаления';

export const SANITY_CASES: SanityCase[] = [
    {
        id: 'minimum',
        label: '1. Минимум: только Имя и Статус',
        csv: `Имя,Статус\nАнна,активный`,
        expected: {kind: 'ok', expectRowCount: 1, expectFirstRow: {name: 'Анна', status: 'active'}},
    },
    {
        id: 'happy_full',
        label: '2. Полный happy-path — все 15 колонок',
        csv: `${HEADERS}\nИван,@ivan,форма,активный,ресепшн,любит борщ,набрать 5 кг,3,2026-06-10,да,VIP,2026-06-15,звонок,2024-01-01,`,
        expected: {
            kind: 'ok',
            expectRowCount: 1,
            expectFirstRow: {
                name: 'Иван',
                contact: '@ivan',
                profile: 'form',
                status: 'active',
                source: 'reception',
                sessionsPerWeek: 3,
                lastSessionDate: '2026-06-10',
                septemberBooking: true,
                lastTouchDate: '2026-06-15',
                lastTouchType: 'call',
            },
        },
    },
    {
        id: 'date_dotted',
        label: '3. Дата dd.mm.yyyy',
        csv: `Имя,Статус,Последняя тренировка\nОля,активный,15.03.2025`,
        expected: {kind: 'ok', expectFirstRow: {lastSessionDate: '2025-03-15'}},
    },
    {
        id: 'date_excel_serial',
        label: '4. Excel serial 45000 → 2023-03-09',
        csv: `Имя,Статус,Последняя тренировка\nСерж,активный,45000`,
        expected: {kind: 'ok', expectFirstRow: {lastSessionDate: '2023-03-09'}},
    },
    {
        id: 'bool_variants',
        label: '5. Bool: да/1/true/пусто/нет',
        csv: `Имя,Статус,Бронь на сентябрь\nA,активный,да\nB,активный,1\nC,активный,true\nD,активный,\nE,активный,нет`,
        expected: {kind: 'ok', expectRowCount: 5},
    },
    {
        id: 'status_synonym',
        label: '6. «активный» → active через словарь',
        csv: `Имя,Статус\nЛена,Активный`,
        expected: {kind: 'ok', expectFirstRow: {status: 'active'}},
    },
    {
        id: 'unknown_status',
        label: '7. Неизвестный статус → ошибка строки',
        csv: `Имя,Статус\nПётр,непонятно`,
        expected: {kind: 'ok', expectErrors: [{lineNo: 2, field: 'status'}]},
    },
    {
        id: 'missing_required_header',
        label: '8. Нет колонки «Имя» → file_error',
        csv: `Статус\nактивный`,
        expected: {kind: 'file_error', messageContains: 'Имя'},
    },
    {
        id: 'two_digit_year',
        label: '9. Двузначный год: 15/03/25 → 2025; 15/03/85 → 1985',
        csv: `Имя,Статус,Последняя тренировка\nЮ,активный,15/03/25\nС,активный,15/03/85`,
        expected: {kind: 'ok', expectRowCount: 2},
    },
    {
        id: 'bad_date',
        label: '10. Неверная дата 32.13.2025 → ошибка строки',
        csv: `Имя,Статус,Последняя тренировка\nК,активный,32.13.2025`,
        expected: {kind: 'ok', expectErrors: [{lineNo: 2, field: 'lastSessionDate'}]},
    },
];
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/csv/sanity-cases.ts
git commit -m "feat(csv): 10 sanity-кейсов для парсера и валидатора"
```

> Замечание: кейс «3. Кириллица win-1251» вынесен в Task 7 (там нужно тестировать `decodeFile(ArrayBuffer)`, а sanity-страница работает со строками). Кейс «10. UPSERT» проверяется руками в Task 12 — это БД-кейс.

---

## Task 6: app/dev/import-sanity/page.tsx — playground

**Files:**
- Create: `app/dev/import-sanity/page.tsx`

- [ ] **Step 1: Создать страницу**

```tsx
import {parseCsvText} from '@/lib/csv/parse';
import {validateRow} from '@/lib/csv/validate';
import {SANITY_CASES} from '@/lib/csv/sanity-cases';
import type {SanityCase} from '@/lib/csv/sanity-cases';

type CaseResult = {ok: boolean; details: string};

function runCase(c: SanityCase): CaseResult {
    const parsed = parseCsvText(c.csv);

    if (c.expected.kind === 'file_error') {
        if (parsed.kind !== 'file_error') return {ok: false, details: `Ожидали file_error, получили ok с ${parsed.rows.length} строк.`};
        const has = parsed.message.includes(c.expected.messageContains);
        return {ok: has, details: parsed.message};
    }

    if (parsed.kind === 'file_error') return {ok: false, details: `Ожидали ok, получили file_error: ${parsed.message}`};

    const exp = c.expected;
    if (exp.expectRowCount !== undefined && parsed.rows.length !== exp.expectRowCount) {
        return {ok: false, details: `Строк: ${parsed.rows.length}, ожидали ${exp.expectRowCount}.`};
    }

    const validated = parsed.rows.map((r, i) => validateRow(r, i + 2));

    if (exp.expectErrors !== undefined) {
        const allErrors = validated.flatMap((v) => (v.ok ? [] : v.errors));
        for (const e of exp.expectErrors) {
            const hit = allErrors.find((a) =>
                (e.lineNo === undefined || a.lineNo === e.lineNo) &&
                (e.field === undefined || a.field === e.field),
            );
            if (!hit) return {ok: false, details: `Не найдена ошибка ${JSON.stringify(e)}. Все: ${JSON.stringify(allErrors)}`};
        }
        return {ok: true, details: `Ошибок: ${allErrors.length}`};
    }

    if (exp.expectFirstRow !== undefined) {
        const first = validated[0];
        if (!first.ok) return {ok: false, details: `Первая строка с ошибками: ${JSON.stringify(first.errors)}`};
        for (const [k, v] of Object.entries(exp.expectFirstRow)) {
            const actual = (first.row as Record<string, unknown>)[k];
            if (actual !== v) return {ok: false, details: `Поле ${k}: ${JSON.stringify(actual)} ≠ ${JSON.stringify(v)}`};
        }
        return {ok: true, details: `Поля совпали`};
    }

    return {ok: true, details: `ok (${parsed.rows.length} строк)`};
}

export default function ImportSanityPage() {
    const results = SANITY_CASES.map((c) => ({c, r: runCase(c)}));
    const passed = results.filter(({r}) => r.ok).length;

    return (
        <div className="p-6 max-w-4xl">
            <h1 className="text-2xl font-semibold mb-2">Import sanity</h1>
            <p className="mb-4 text-zinc-600">{passed}/{results.length} зелёных.</p>
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b text-left">
                        <th className="py-2 pr-3 w-12">#</th>
                        <th className="py-2 pr-3">Кейс</th>
                        <th className="py-2 pr-3 w-20">Статус</th>
                        <th className="py-2 pr-3">Детали</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map(({c, r}, i) => (
                        <tr key={c.id} className="border-b align-top">
                            <td className="py-2 pr-3 text-zinc-400">{i + 1}</td>
                            <td className="py-2 pr-3">{c.label}</td>
                            <td className="py-2 pr-3">{r.ok ? '✅' : '❌'}</td>
                            <td className="py-2 pr-3 font-mono text-xs">{r.details}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

- [ ] **Step 2: Запустить dev и открыть playground**

Run: `npm run dev` (если ещё не запущен)
Open: `http://localhost:3000/dev/import-sanity`
Expected: «10/10 зелёных». Все строки ✅.

- [ ] **Step 3: Если есть красные — починить соответствующий модуль (`lib/csv/*`), не sanity-cases**

Sanity-кейсы — источник истины. Если факт не совпадает с ожидаемым — поправляй парсер/валидатор/coerce, не подгоняй кейсы.

- [ ] **Step 4: Commit**

```bash
git add app/dev/import-sanity/page.tsx
git commit -m "feat(dev): /dev/import-sanity playground (10 кейсов)"
```

---

## Task 7: lib/clients/import.ts — previewImport

**Files:**
- Create: `lib/clients/import.ts`

- [ ] **Step 1: Создать файл с `previewImport`**

```ts
'use server';

import {redirect} from 'next/navigation';
import {auth} from '@/lib/auth/config';
import {decodeFile, parseCsvText} from '@/lib/csv/parse';
import {validateRow} from '@/lib/csv/validate';
import type {CsvRow, RowError} from '@/lib/csv/validate';
import {MAX_BYTES} from '@/lib/csv/parse';

export type PreviewResult =
    | {kind: 'file_error'; message: string}
    | {kind: 'ok'; total: number; previewRows: CsvRow[]; errors: RowError[]};

async function requireTrainerId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');
    return session.user.id;
}

export async function previewImport(formData: FormData): Promise<PreviewResult> {
    await requireTrainerId();

    const file = formData.get('file');
    if (!(file instanceof File)) return {kind: 'file_error', message: 'Файл не передан.'};
    if (file.size === 0) return {kind: 'file_error', message: 'Файл пустой.'};
    if (file.size > MAX_BYTES) return {kind: 'file_error', message: `Слишком большой файл (${file.size} байт, лимит ${MAX_BYTES}).`};

    const buf = await file.arrayBuffer();
    const text = decodeFile(buf);

    const parsed = parseCsvText(text);
    if (parsed.kind === 'file_error') return parsed;

    const validated = parsed.rows.map((r, i) => validateRow(r, i + 2));
    const errors = validated.flatMap((v) => (v.ok ? [] : v.errors));
    const validRows = validated.flatMap((v) => (v.ok ? [v.row] : []));

    return {
        kind: 'ok',
        total: parsed.rows.length,
        previewRows: validRows.slice(0, 5),
        errors,
    };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add lib/clients/import.ts
git commit -m "feat(import): previewImport — file_error/ok с превью и ошибками"
```

---

## Task 8: lib/clients/import.ts — commitImport с транзакцией и UPSERT

**Files:**
- Modify: `lib/clients/import.ts`

- [ ] **Step 1: Добавить `commitImport` в `lib/clients/import.ts`**

В конец файла (после `previewImport`):

```ts
import {revalidatePath} from 'next/cache';
import {and, eq, isNull} from 'drizzle-orm';
import {db} from '@/lib/db';
import {clients, touches} from '@/lib/db/schema';

export type CommitResult =
    | {kind: 'file_error'; message: string}
    | {kind: 'has_errors'; errors: RowError[]}
    | {kind: 'imported'; added: number; updated: number};

export async function commitImport(formData: FormData): Promise<CommitResult> {
    const trainerId = await requireTrainerId();

    const file = formData.get('file');
    if (!(file instanceof File)) return {kind: 'file_error', message: 'Файл не передан.'};
    if (file.size > MAX_BYTES) return {kind: 'file_error', message: `Слишком большой файл.`};

    const buf = await file.arrayBuffer();
    const text = decodeFile(buf);

    const parsed = parseCsvText(text);
    if (parsed.kind === 'file_error') return parsed;

    const validated = parsed.rows.map((r, i) => validateRow(r, i + 2));
    const errors = validated.flatMap((v) => (v.ok ? [] : v.errors));
    if (errors.length > 0) return {kind: 'has_errors', errors};

    const rows = validated.flatMap((v) => (v.ok ? [v.row] : []));

    try {
        const result = await db.transaction(async (tx) => {
            let added = 0;
            let updated = 0;
            for (const row of rows) {
                const existing = await findExisting(tx, trainerId, row);
                if (existing) {
                    await tx
                        .update(clients)
                        .set({
                            name: row.name,
                            contact: row.contact,
                            profile: row.profile,
                            status: row.status,
                            source: row.source,
                            personalFact: row.personalFact,
                            goal: row.goal,
                            sessionsPerWeek: row.sessionsPerWeek,
                            lastSessionDate: row.lastSessionDate,
                            septemberBooking: row.septemberBooking,
                            note: row.note,
                            updatedAt: new Date(),
                        })
                        .where(and(eq(clients.id, existing.id), eq(clients.trainerId, trainerId)));
                    updated++;
                } else {
                    const [inserted] = await tx
                        .insert(clients)
                        .values({
                            trainerId,
                            name: row.name,
                            contact: row.contact,
                            profile: row.profile,
                            status: row.status,
                            source: row.source,
                            personalFact: row.personalFact,
                            goal: row.goal,
                            sessionsPerWeek: row.sessionsPerWeek,
                            lastSessionDate: row.lastSessionDate,
                            septemberBooking: row.septemberBooking,
                            note: row.note,
                            createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
                            deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
                        })
                        .returning({id: clients.id});

                    if (row.lastTouchDate && row.lastTouchType) {
                        await tx.insert(touches).values({
                            clientId: inserted.id,
                            trainerId,
                            type: row.lastTouchType,
                            touchedAt: row.lastTouchDate,
                            note: null,
                        });
                    }
                    added++;
                }
            }
            return {added, updated};
        });

        revalidatePath('/clients');
        revalidatePath('/today');
        return {kind: 'imported', added: result.added, updated: result.updated};
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {kind: 'file_error', message: `Импорт прерван: ${msg}`};
    }
}

async function findExisting(
    tx: typeof db,
    trainerId: string,
    row: CsvRow,
): Promise<{id: string} | null> {
    if (row.contact) {
        const rows = await tx
            .select({id: clients.id})
            .from(clients)
            .where(and(
                eq(clients.trainerId, trainerId),
                eq(clients.contact, row.contact),
                isNull(clients.deletedAt),
            ))
            .limit(1);
        if (rows[0]) return rows[0];
    }
    const byName = await tx
        .select({id: clients.id})
        .from(clients)
        .where(and(
            eq(clients.trainerId, trainerId),
            eq(clients.name, row.name),
            isNull(clients.contact),
            isNull(clients.deletedAt),
        ))
        .limit(1);
    return byName[0] ?? null;
}
```

> Дедуп-логика: **если у CSV-строки есть contact** — ищем существующего по `contact`. Если у CSV-строки contact пустой — ищем по `name` среди тех, у кого тоже `contact IS NULL`. Это предотвращает ложные срабатывания «новый клиент с тем же именем, но другим контактом» (не должно быть UPSERT'а).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок. Если `tx` тип не выводится — заменить на `Parameters<Parameters<typeof db.transaction>[0]>[0]`.

- [ ] **Step 3: Commit**

```bash
git add lib/clients/import.ts
git commit -m "feat(import): commitImport — транзакция, UPSERT, touches только при INSERT"
```

---

## Task 9: ImportDropzone компонент

**Files:**
- Create: `components/import/ImportDropzone.tsx`

- [ ] **Step 1: Создать компонент**

```tsx
'use client';

import {useRef, useState} from 'react';

type Props = {
    onFile: (file: File) => void;
    disabled?: boolean;
};

export function ImportDropzone({onFile, disabled}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [over, setOver] = useState(false);

    return (
        <label
            className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${over ? 'border-cyan-500 bg-cyan-50' : 'border-zinc-300'} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={(e) => {e.preventDefault(); setOver(true);}}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                const f = e.dataTransfer.files[0];
                if (f) onFile(f);
            }}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                }}
            />
            <p className="text-zinc-600">Перетащи CSV или нажми, чтобы выбрать файл.</p>
            <p className="text-xs text-zinc-400 mt-1">15 колонок, до 5000 строк, UTF-8 или Windows-1251.</p>
        </label>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add components/import/ImportDropzone.tsx
git commit -m "feat(import): ImportDropzone — drag-and-drop + file input"
```

---

## Task 10: ImportPreviewTable, ImportErrorList, ImportReport

**Files:**
- Create: `components/import/ImportPreviewTable.tsx`
- Create: `components/import/ImportErrorList.tsx`
- Create: `components/import/ImportReport.tsx`

- [ ] **Step 1: `components/import/ImportPreviewTable.tsx`**

```tsx
import type {CsvRow} from '@/lib/csv/validate';

const COLS: Array<[keyof CsvRow, string]> = [
    ['name', 'Имя'],
    ['contact', 'Контакт'],
    ['status', 'Статус'],
    ['profile', 'Профиль'],
    ['source', 'Источник'],
    ['lastSessionDate', 'Посл. трен.'],
    ['lastTouchDate', 'Посл. касание'],
];

export function ImportPreviewTable({rows}: {rows: CsvRow[]}) {
    if (rows.length === 0) return <p className="text-zinc-500 text-sm">Нет валидных строк для превью.</p>;
    return (
        <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-zinc-50 border-b text-left">
                        {COLS.map(([, label]) => (
                            <th key={label} className="py-2 px-3 font-medium">{label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                            {COLS.map(([key, label]) => (
                                <td key={label} className="py-2 px-3 font-mono text-xs">
                                    {String(r[key] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

- [ ] **Step 2: `components/import/ImportErrorList.tsx`**

```tsx
import type {RowError} from '@/lib/csv/validate';

export function ImportErrorList({errors}: {errors: RowError[]}) {
    if (errors.length === 0) return null;
    return (
        <div className="border border-rose-300 rounded-lg p-3 bg-rose-50">
            <p className="font-medium mb-2">Ошибки в файле ({errors.length}):</p>
            <ul className="text-sm space-y-1">
                {errors.slice(0, 50).map((e, i) => (
                    <li key={i}>
                        <span className="font-mono text-zinc-500">Строка {e.lineNo}</span> · <span className="font-medium">{e.field}</span>: {e.message}
                    </li>
                ))}
                {errors.length > 50 && <li className="text-zinc-500">...и ещё {errors.length - 50}.</li>}
            </ul>
        </div>
    );
}
```

- [ ] **Step 3: `components/import/ImportReport.tsx`**

```tsx
import Link from 'next/link';

export function ImportReport({added, updated}: {added: number; updated: number}) {
    return (
        <div className="border border-emerald-300 rounded-lg p-4 bg-emerald-50">
            <p className="font-medium mb-2">Готово.</p>
            <p>Добавлено: <strong>{added}</strong> · Обновлено: <strong>{updated}</strong></p>
            <Link href="/clients" className="inline-block mt-3 px-4 py-2 rounded-md bg-cyan-600 text-white">
                Перейти к клиентам
            </Link>
        </div>
    );
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 5: Commit**

```bash
git add components/import/ImportPreviewTable.tsx components/import/ImportErrorList.tsx components/import/ImportReport.tsx
git commit -m "feat(import): PreviewTable, ErrorList, Report"
```

---

## Task 11: app/(app)/clients/import/page.tsx — UI flow

**Files:**
- Create: `app/(app)/clients/import/page.tsx`

- [ ] **Step 1: Создать страницу импорта**

```tsx
'use client';

import {useState, useTransition} from 'react';
import {previewImport, commitImport} from '@/lib/clients/import';
import type {PreviewResult, CommitResult} from '@/lib/clients/import';
import {ImportDropzone} from '@/components/import/ImportDropzone';
import {ImportPreviewTable} from '@/components/import/ImportPreviewTable';
import {ImportErrorList} from '@/components/import/ImportErrorList';
import {ImportReport} from '@/components/import/ImportReport';

type Phase =
    | {kind: 'idle'}
    | {kind: 'parsing'}
    | {kind: 'preview'; result: PreviewResult}
    | {kind: 'committing'; result: PreviewResult}
    | {kind: 'imported'; report: {added: number; updated: number}};

export default function ImportPage() {
    const [phase, setPhase] = useState<Phase>({kind: 'idle'});
    const [file, setFile] = useState<File | null>(null);
    const [pending, startTransition] = useTransition();

    function onFile(f: File) {
        setFile(f);
        setPhase({kind: 'parsing'});
        startTransition(async () => {
            const fd = new FormData();
            fd.append('file', f);
            const result = await previewImport(fd);
            setPhase({kind: 'preview', result});
        });
    }

    function onImport() {
        if (!file || phase.kind !== 'preview') return;
        const previewResult = phase.result;
        setPhase({kind: 'committing', result: previewResult});
        startTransition(async () => {
            const fd = new FormData();
            fd.append('file', file);
            const r: CommitResult = await commitImport(fd);
            if (r.kind === 'imported') {
                setPhase({kind: 'imported', report: {added: r.added, updated: r.updated}});
            } else if (r.kind === 'has_errors') {
                setPhase({kind: 'preview', result: {kind: 'ok', total: previewResult.kind === 'ok' ? previewResult.total : 0, previewRows: [], errors: r.errors}});
            } else {
                setPhase({kind: 'preview', result: r});
            }
        });
    }

    function reset() {
        setFile(null);
        setPhase({kind: 'idle'});
    }

    return (
        <div className="p-6 max-w-3xl space-y-4">
            <h1 className="text-2xl font-semibold">Импорт CSV</h1>

            {phase.kind === 'idle' && <ImportDropzone onFile={onFile} />}

            {phase.kind === 'parsing' && (
                <p className="text-zinc-500">Парсим файл…</p>
            )}

            {phase.kind === 'preview' && phase.result.kind === 'file_error' && (
                <>
                    <div className="border border-rose-300 rounded-lg p-3 bg-rose-50">{phase.result.message}</div>
                    <button onClick={reset} className="px-4 py-2 rounded-md border">Выбрать другой файл</button>
                </>
            )}

            {phase.kind === 'preview' && phase.result.kind === 'ok' && (
                <>
                    <p className="text-zinc-600">Всего строк: {phase.result.total} · Ошибок: {phase.result.errors.length}</p>
                    {phase.result.errors.length === 0 && (
                        <ImportPreviewTable rows={phase.result.previewRows} />
                    )}
                    <ImportErrorList errors={phase.result.errors} />
                    <div className="flex gap-2">
                        <button
                            onClick={onImport}
                            disabled={phase.result.errors.length > 0 || pending}
                            className="px-4 py-2 rounded-md bg-cyan-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Импортировать {phase.result.total - phase.result.errors.length} клиентов
                        </button>
                        <button onClick={reset} className="px-4 py-2 rounded-md border">Отмена</button>
                    </div>
                </>
            )}

            {phase.kind === 'committing' && <p className="text-zinc-500">Импортируем…</p>}

            {phase.kind === 'imported' && <ImportReport added={phase.report.added} updated={phase.report.updated} />}
        </div>
    );
}
```

- [ ] **Step 2: Запустить dev, открыть `/clients/import`**

Open: `http://localhost:3000/clients/import` (после `npm run dev`).
Expected: видно dropzone «Перетащи CSV…».

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/clients/import/page.tsx
git commit -m "feat(import): UI экрана импорта со всеми состояниями"
```

---

## Task 12: CTA «Импортируй таблицу» на пустом /clients

**Files:**
- Modify: `app/(app)/clients/page.tsx`

- [ ] **Step 1: Прочитать текущее пустое состояние**

Run: `grep -n "Импортируй\|База пустая\|пустая" app/\(app\)/clients/page.tsx`
Найти блок пустого состояния (если он есть).

- [ ] **Step 2: Убедиться что CTA ведёт на `/clients/import`**

В пустом состоянии должна быть кнопка/ссылка вида:
```tsx
<Link href="/clients/import" className="px-4 py-2 rounded-md bg-cyan-600 text-white">
    Импортируй таблицу
</Link>
```

Если её нет — добавить рядом с существующим «+ Клиент». Если есть с другим href — поправить на `/clients/import`. Если страница не различает пустое состояние — добавить ветвь `clients.length === 0`.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 4: Commit (если есть изменения)**

```bash
git add app/\(app\)/clients/page.tsx
git commit -m "feat(clients): CTA «Импортируй таблицу» на пустом состоянии"
```

---

## Task 13: Ручная верификация на реальном CSV

**Files:** не изменяет код. Проверочный сценарий.

- [ ] **Step 1: Создать тестовый CSV в `/tmp/clients-test.csv`**

```
Имя,Контакт,Профиль,Статус,Источник,Личный факт,Цель,Тренировок в неделю,Последняя тренировка,Бронь на сентябрь,Заметка,Последнее касание,Тип касания,Дата создания,Дата удаления
Анна Иванова,@anna_iv,форма,активный,ресепшн,любит йогу,похудеть 5 кг,3,15.06.2026,да,,15.06.2026,звонок,01.01.2025,
Борис Петров,+79991234567,энергия,активный,авито,предприниматель,поддержать форму,2,10.06.2026,нет,,10.06.2026,сообщение,15.05.2026,
Виктория,,здоровье,лид,чат,,,,,нет,напомнить через 3 дня,,,,
Гриша Сидоров,@grisha,форма,отпуск,рекомендация,футболист,травма колена,1,01.05.2026,нет,,01.05.2026,тренировка,01.02.2025,
Дима К.,@dima_k,форма,ушёл,база,,,,,нет,,,,,01.06.2026
```

5 клиентов: 2 active с касаниями, 1 lead без контакта, 1 vacation, 1 left с deletedAt.

- [ ] **Step 2: Открыть `/clients/import` и загрузить файл**

Open: `http://localhost:3000/clients/import`
Действие: drag-and-drop файла.

Expected: видно превью первых строк, «Всего строк: 5 · Ошибок: 0», кнопка «Импортировать 5 клиентов» активна.

- [ ] **Step 3: Импортировать**

Action: клик «Импортировать 5 клиентов».

Expected: отчёт «Добавлено: 5 · Обновлено: 0».

- [ ] **Step 4: Перейти в /clients и убедиться что все 5 видны (кроме `left` если фильтр по умолчанию его скрывает)**

Open: `/clients`.
Expected: видны Анна, Борис, Виктория, Гриша. Дима — в зависимости от фильтра.

- [ ] **Step 5: Открыть карточку Анны, проверить что туда попали поля + 1 касание (звонок 15.06.2026)**

Open: `/clients/<anna-id>`.
Expected: в `TouchHistory` ровно 1 запись типа «звонок» с датой `15.06.2026`. Все поля карточки заполнены корректно.

- [ ] **Step 6: Повторный импорт того же файла**

Action: ещё раз `/clients/import` → drag тот же файл → импортировать.

Expected: отчёт «Добавлено: 0 · Обновлено: 5». В карточке Анны всё ещё **1** касание (не 2).

- [ ] **Step 7: Тест file_error: загрузить файл без колонки «Имя»**

```
Статус
активный
```

Expected: красный баннер «Отсутствует обязательная колонка: "Имя"».

- [ ] **Step 8: Тест has_errors: одна строка с битой датой**

```
Имя,Статус,Последняя тренировка
Тест,активный,32.13.2025
```

Expected: «Всего строк: 1 · Ошибок: 1», список ошибок показывает строку 2 / lastSessionDate, кнопка «Импортировать» disabled.

- [ ] **Step 9: Тест кириллица win-1251**

Создать файл в Excel → Save As → `CSV (MS-DOS)` или `CSV (Windows)`. Открыть. Ожидание: имена читаются корректно (utf-8 fallback на win-1251 сработал).

Если кириллица сломана — проверить `decodeFile`: возможно byte-pattern UTF-8 валидный, но не текст. Это известное ограничение (win-1251 декодирует любые байты без TypeError); тренер увидит крокозябры и пересохранит файл в UTF-8.

- [ ] **Step 10: Commit финальный (если были правки кода по результатам ручной верификации)**

Если ничего не правили — пропустить. Иначе:
```bash
git add <changed files>
git commit -m "fix(import): <конкретная проблема>"
```

---

## Acceptance checklist (Definition of Done)

- [ ] `/dev/import-sanity`: 10/10 зелёных
- [ ] Реальный CSV из 5+ строк импортируется
- [ ] Повторный импорт того же файла: 0 added, N updated
- [ ] Файл без обязательного заголовка → file_error
- [ ] Файл с битой строкой → has_errors, ничего не записано
- [ ] Win-1251 кириллица читается из CSV (через Excel «CSV Windows»)
- [ ] Колонки 12+13 для новых клиентов создают touch; для существующих — игнорируются
- [ ] CTA «Импортируй таблицу» на пустом `/clients` ведёт на `/clients/import`
- [ ] `npx tsc --noEmit` — 0 ошибок
- [ ] Memory project_shtab_state обновлена: «Этап 5 готов»

---

## Notes for the executor

- **Стиль кода:** 4 пробела, `{x}` без пробелов. Иначе линтер пользователя сразу переформатирует. См. memory `feedback-code-style`.
- **Без тестов:** не предлагать `npm test` или vitest. Sanity-страница — единственный проверочный механизм для чистого pipeline.
- **`requireTrainerId`:** копируешь из `lib/clients/actions.ts`. Это 4-е дублирование — не выноси в общий хелпер (пороги: 5+, см. memory).
- **`db.transaction`:** в Drizzle. Используй `tx` вместо `db` внутри.
- **`papaparse` + Next.js 16:** `import Papa from 'papaparse'` работает в server context (наш файл `lib/clients/import.ts` имеет `'use server'`). На клиенте папу не подключаем.
- **Если что-то непонятно** — открой `docs/superpowers/specs/2026-06-19-stage-5-csv-import-design.md`. Спека покрывает любой open question.
