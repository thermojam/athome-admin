# Design: Этап 5 — Импорт CSV

**Дата:** 2026-06-19
**Контекст:** пятый из семи этапов MVP «Штаб». Этапы 1-4 завершены (auth+БД, CRUD клиентов, триггеры+/today, касания+экспорт для Claude). Импорт CSV — последний шаг до того, как тренер может бесшовно мигрировать с Excel.
**Источники:** `mvp-spec.md` (§Core-фичи, §Flow 1, §Экраны), `docs/superpowers/specs/2026-06-15-shtab-mvp-design.md` §5.
**Связанные решения этапов 3-4:** чистые функции в `lib/` + тонкие server actions + `/dev/*-sanity` playground вместо unit-тестов.

---

## 1. Цель и acceptance criteria

**Цель:** тренер открывает `/clients/import`, перетаскивает CSV (экспорт из Excel), видит превью с подсветкой ошибок, при отсутствии ошибок жмёт «Импортировать» — все клиенты в базе, повторный импорт того же файла никого не дублирует.

**Готово, когда:**

1. CSV из 30+ строк (реальный экспорт из Excel `client-base.xlsx`) импортируется без ручной правки.
2. Повторный импорт того же файла → 0 добавлено, N обновлено, дубли не созданы.
3. Файл с одной невалидной строкой → ничего не записано, отчёт показывает её.
4. Кириллица в `windows-1251` читается (fallback после `utf-8`).
5. Колонки 12+13 «Последнее касание»+«Тип касания» для **новых** клиентов создают `touches`-запись; для существующих (UPSERT) — игнорируются.
6. `/dev/import-sanity` зелёный по всем 10 эталонным кейсам.
7. На пустой `/clients` есть CTA «Импортируй таблицу» → ведёт на `/clients/import`.

---

## 2. Решения, принятые в brainstorming

| Открытый вопрос | Решение | Зачем |
|---|---|---|
| Колонки 12+13 при UPSERT существующего клиента | Игнорировать (touch создаётся **только при INSERT**) | Иначе повторный импорт одного файла расплодит дубли касаний. История касаний — зона ручных действий через UI Этапа 4. |
| Маппинг колонок CSV → поля БД | Строго: 15 канонических заголовков из спеки | Тренер — один пользователь, формат фиксированный (Excel-шаблон). Словарь синонимов заголовков избыточен в MVP. |
| Двухшаговый flow «превью → импорт» | Клиент держит `File` в памяти, на втором шаге re-upload | Нет server-state, нет JSON-payload на 500 строк. Парсинг дважды — миллисекунды для нашего объёма. |
| Лимит файла | 5000 строк / 2 МБ | Здоровый максимум для тренера-одиночки. Превышение — `file_error` без попытки парсить. |
| Encoding | `utf-8` strict → fallback `windows-1251` | Зафиксировано в §5 spec. |

---

## 3. Архитектура — модули и границы

```
lib/csv/
  synonyms.ts        15 канон. заголовков + словари значений (status/profile/source/touchType)
  parse.ts           decodeFile(buf), parseCsvText(text)
  coerce.ts          coerceDate, coerceBool, coerceInt, coerceEnum
  validate.ts        CsvRowSchema (zod) + validateRow(raw, lineNo)
  sanity-cases.ts    10 эталонных кейсов для playground

lib/clients/
  import.ts          server actions: previewImport, commitImport

app/(app)/clients/import/
  page.tsx           UI экрана импорта

components/import/
  ImportDropzone.tsx        file input + drag-and-drop
  ImportPreviewTable.tsx    превью 5 строк + подсветка ошибок
  ImportErrorList.tsx       полный список ошибок построчно
  ImportReport.tsx          финальный отчёт «Добавлено N · Обновлено M»

app/dev/import-sanity/
  page.tsx           прогон 10 кейсов через parseCsvText + validateRow
```

**Принцип границ (как в этапах 3-4):**
- `lib/csv/*` — чистые функции. Не знают про БД, про Next.js, про React. Тестируются через playground.
- `lib/clients/import.ts` — тонкие server actions: парсят `FormData`, зовут pipeline, выполняют транзакцию. Никакой бизнес-логики.
- UI знает только про actions, никогда не дёргает `papaparse` или zod-схему напрямую.

---

## 4. Pipeline парсинга и валидации

### 4.1 `decodeFile(buf: ArrayBuffer): string`

```ts
try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf)
} catch (e) {
    if (e instanceof TypeError) {
        return new TextDecoder('windows-1251').decode(buf)
    }
    throw e
}
```

### 4.2 `parseCsvText(text: string): {rows: RawRow[]} | {fileError: string}`

- `Papa.parse(text, {header: true, skipEmptyLines: true})`.
- Заголовки нормализуем: `trim()`. Регистр оставляем как есть (15 канонических — единственный источник истины).
- Проверка: присутствуют **все** обязательные канонические заголовки («Имя», «Статус»). Если нет — `{fileError: 'Отсутствует обязательная колонка: "Имя"'}`.
- Лишние колонки в файле — игнорируем без предупреждения.
- Превышение лимита (5000 строк / 2 МБ) — `fileError`.
- **Маппинг ключей:** русские заголовки CSV → camelCase ключи перед валидацией. Таблица 15 в `lib/csv/synonyms.ts`: `'Имя' → 'name'`, `'Контакт' → 'contact'`, `'Последнее касание' → 'lastTouchDate'`, `'Тип касания' → 'lastTouchType'` и т.д. `RawRow` — это уже camelCase-объект со строковыми значениями.

### 4.3 `CsvRowSchema` (zod)

```ts
const CsvRowSchema = z.object({
    name: z.string().trim().min(1),
    contact: z.string().trim().optional().default(''),
    profile: z.preprocess(coerceProfile, z.enum(CLIENT_PROFILES).optional()),
    status: z.preprocess(coerceStatus, z.enum(CLIENT_STATUSES)),
    source: z.preprocess(coerceSource, z.enum(CLIENT_SOURCES).optional()),
    personalFact: z.string().trim().optional().default(''),
    goal: z.string().trim().optional().default(''),
    sessionsPerWeek: z.preprocess(coerceInt, z.number().int().min(0).max(7).optional()),
    lastSessionDate: z.preprocess(coerceDate, z.date().optional()),
    septemberBooking: z.preprocess(coerceBool, z.boolean()).default(false),
    note: z.string().trim().optional().default(''),
    lastTouchDate: z.preprocess(coerceDate, z.date().optional()),
    lastTouchType: z.preprocess(coerceTouchType, z.enum(TOUCH_TYPES).optional()),
    createdAt: z.preprocess(coerceDate, z.date().optional()),
    deletedAt: z.preprocess(coerceDate, z.date().optional()),
})
```

### 4.4 `validateRow(raw: RawRow, lineNo: number): {row: CsvRow, errors: []} | {errors: RowError[]}`

`RowError = {lineNo: number, field: string, message: string}`. Маппит zod issues в человекочитаемые сообщения через словари синонимов.

### 4.5 Терпимость к форматам (из §5 spec)

- **Даты:** `dd.mm.yyyy`, `yyyy-mm-dd`, `dd/mm/yy`, Excel serial (число дней с 1900-01-00). Двузначные годы: 00-29 → 2000+, 30-99 → 1900+.
- **Bool:** «да/нет», «yes/no», «true/false», «1/0», пусто → `false`.
- **Enum-значения** (status/profile/source/touchType): словарь синонимов в `lib/csv/synonyms.ts`. Примеры: «активный»→`active`, «отпуск»→`vacation`, «🟢 здоровье»→`health`, «сообщение»→`message`.

---

## 5. Server actions

```ts
// lib/clients/import.ts

export type PreviewResult =
    | { kind: 'file_error'; message: string }
    | { kind: 'ok'; total: number; previewRows: CsvRow[]; errors: RowError[] }

export type CommitResult =
    | { kind: 'file_error'; message: string }
    | { kind: 'has_errors'; errors: RowError[] }
    | { kind: 'imported'; added: number; updated: number }

export async function previewImport(formData: FormData): Promise<PreviewResult>
export async function commitImport(formData: FormData): Promise<CommitResult>
```

Обе функции:
1. Зовут `requireTrainerId()` (как в `lib/touches/actions.ts`).
2. Извлекают `File` из `FormData`, читают `arrayBuffer()`.
3. `decodeFile` → `parseCsvText` → `validateRow` для каждой строки.

`previewImport` возвращает первые **5 валидных** строк (для UI-таблицы) и **все** ошибки (полный список).

`commitImport` дополнительно проверяет: если `errors.length > 0` — возвращает `has_errors` без записи (защита от race). Иначе открывает транзакцию.

---

## 6. Транзакция и UPSERT

```ts
await db.transaction(async (tx) => {
    let added = 0, updated = 0
    for (const row of rows) {
        const dedupKey = row.contact
            ? { trainer_id, contact: row.contact }
            : { trainer_id, name: row.name }

        const existing = await findClient(tx, dedupKey)

        if (existing) {
            await updateClientFields(tx, existing.id, row)
            updated++
        } else {
            const [client] = await insertClient(tx, trainer_id, row)
            added++

            if (row.lastTouchDate && row.lastTouchType) {
                await tx.insert(touches).values({
                    client_id: client.id,
                    trainer_id,
                    type: row.lastTouchType,
                    touched_at: row.lastTouchDate,
                    note: null,
                })
            }
        }
    }
    return { added, updated }
})
```

**Важно:**
- Дедуп-ключ: `contact` если непустой, иначе `name`.
- Touch из CSV создаётся **только при INSERT** (см. §2).
- Любая ошибка внутри транзакции → rollback, UI получает `file_error: 'Импорт прерван: …'`. Никаких частичных импортов (зафиксировано в §5 spec и Flow 1 mvp-spec).
- `created_at` (колонка 14) и `deleted_at` (колонка 15): системные поля. При **INSERT** — если в CSV передан, используем; иначе дефолт БД. При **UPSERT** — не перезаписываем (история создания клиента в БД важнее, чем строка в CSV).

---

## 7. UI flow `/clients/import`

### Состояния экрана

| Состояние | Что видит пользователь | Что происходит |
|---|---|---|
| `idle` | Большой dropzone с надписью «Перетащи CSV или нажми, чтобы выбрать» + `<input type="file" accept=".csv">` | Ждём `File` |
| `parsing` | Спиннер «Парсим файл…» | Идёт `previewImport(formData)` |
| `file_error` | Красный баннер с сообщением + кнопка «Выбрать другой файл» | `kind:'file_error'` |
| `preview` | Счётчик «Всего: N · Ошибок: K»; таблица первых 5 валидных строк; список ошибок построчно; кнопка primary cyan «Импортировать N клиентов» (disabled если K>0) | `kind:'ok'` |
| `committing` | Спиннер «Импортируем…» | Идёт `commitImport(formData)` с тем же `File` |
| `imported` | Зелёный отчёт «Добавлено: 12 · Обновлено: 5»; кнопка «Перейти к клиентам» → `/clients` | `kind:'imported'` |

### Мобильная вёрстка

- Dropzone — крупный `<label>` с file input, размер тач-цели ≥ 56px.
- Таблица превью — горизонтальный скролл (`overflow-x-auto`).
- Кнопки primary cyan, как в этапе 4 (`TouchActions`).

### CTA на пустом `/clients`

Меняем текст пустого состояния (был «База пустая. Импортируй таблицу или добавь первого клиента» с двумя CTA) — оба CTA уже на месте; обновляем ссылку «Импортируй таблицу» → `/clients/import`.

---

## 8. Sanity playground `/dev/import-sanity`

10 эталонных кейсов в `lib/csv/sanity-cases.ts`:

1. **Минимум** — только «Имя» и «Статус», все опциональные пусты → 1 валидная строка, 0 ошибок.
2. **Полный happy path** — все 15 колонок заполнены корректно.
3. **Кириллица win-1251** — байтовый буфер в `windows-1251` декодируется правильно (через `decodeFile`).
4. **Дата `dd.mm.yyyy`** — «15.03.2025» → `Date(2025, 2, 15)`.
5. **Excel serial** — `45000` → `2023-03-09`.
6. **Bool varianty** — «да», «1», «true», пусто, «нет» → корректные `true`/`false`.
7. **Синоним статуса** — «активный» → `active` через словарь.
8. **Неизвестный статус** — «непонятно» → `RowError{field:'status'}`.
9. **Отсутствует заголовок «Имя»** — `parseCsvText` возвращает `fileError`.
10. **UPSERT (sandbox)** — два прохода с тем же `contact`: первый INSERT, второй UPDATE; счётчики `added=1, updated=1`.

Кейсы 1-9 — чистые: прогон через `parseCsvText` + `validateRow`. Кейс 10 — отдельная маленькая sandbox-функция, имитирующая dedup-логику без реальной БД (массив вместо таблицы).

UI playground: страница `/dev/import-sanity` показывает таблицу «Кейс → ожидаемо → получено → ✅/❌», как `/dev/export-sanity` и `/dev/triggers-sanity` в этапах 3-4.

---

## 9. Что вне scope

- Маппинг через UI (выбор «эта колонка — это name»). MVP: только канонические 15 заголовков.
- Загрузка `.xlsx` напрямую. MVP: только CSV (тренер делает Export → CSV в Excel).
- Streaming-парсинг для огромных файлов. Лимит 5000 строк закрывает всё реально нужное.
- Прогресс-бар на коммите. Транзакция атомарна, прогресс не показываем — спиннер.
- Откат отдельной строки или «импортировать только валидные». Спека: всё или ничего.
- Идемпотентность touches при повторном INSERT того же клиента — невозможно по логике (повторный = UPSERT, touch не создаётся).

---

## 10. Известные риски

| Риск | Митигация |
|---|---|
| Excel экспортирует CSV с BOM | `papaparse` сам обрабатывает BOM в UTF-8 файлах. |
| Excel ставит даты как `'15.03.25'` без века | `coerceDate` обрабатывает: 00-29 → 2000+, 30-99 → 1900+. |
| Тренер залил файл с лишней пустой строкой в конце | `skipEmptyLines: true` в `papaparse`. |
| Тренер залил файл с дублями внутри (один контакт дважды) | Первый — INSERT, второй — UPDATE того же. Счётчики `added=1, updated=1`. Дублей в БД нет. |
| Encoding не угадался (например, KOI8-R) | `windows-1251` декодирует любые байты без ошибок, но кириллица будет искажена. Тренер увидит «крокозябры» в превью → перевыгрузит файл в UTF-8. |
| Транзакция упала на 200-й строке из 500 | Rollback → `file_error: 'Импорт прерван на строке 200: <db error>'`. Пользователь правит файл и пробует заново. |

---

## 11. Связь с предыдущими этапами

- **Этап 2** (`lib/clients/actions.ts`, `lib/zod/client.ts`): `ClientCreateSchema` уже есть, но CSV-схема **не равна** ему — CSV принимает строковые «активный»/«15.03.25» и приводит к каноническим значениям. Не пытаемся переиспользовать.
- **Этап 3** (`lib/triggers/sanity-cases.ts`, `/dev/triggers-sanity`): паттерн playground повторяем 1-в-1.
- **Этап 4** (`lib/touches/actions.ts`, `recordTouch`): touches из CSV вставляем **напрямую в транзакции**, не через `recordTouch` (тот делает свою валидацию + revalidate, нам не нужно).
- **Технический долг** `requireTrainerId` теперь будет в 4-м файле (`lib/clients/import.ts`). Всё ещё не повод выносить — порог 5+ файлов из memory project_shtab_state.md.

---

## 12. Что после Этапа 5

Этап 6 — Панель + `weekly_stats` (агрегация недели для ритуала). После Этапа 7 — обновить graphify-граф (`/graphify --update`) для финального снимка MVP.
