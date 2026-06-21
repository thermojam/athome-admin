# Design: Этап 6 — Панель + weekly_stats

**Дата:** 2026-06-19
**Контекст:** шестой из семи этапов MVP «Штаб». Этапы 1-5 завершены. После Этапа 6 остаётся только `/settings` — финальный спринт.
**Источники:** `mvp-spec.md` (§Core-фичи строка 5, §Flow 2 «пятничный ритуал», §Экраны строка 5, §План событий аналитики), `docs/superpowers/specs/2026-06-15-shtab-mvp-design.md` §2 (schema weekly_stats), §4 (лейаут навигации), §7 (этап 6).
**Связанные решения этапов 3-5:** чистые функции в `lib/` + тонкие server actions + `/dev/*-sanity` playground вместо unit-тестов.

---

## 1. Цель и acceptance criteria

**Цель:** экран `/dashboard` показывает (1) живые счётчики «сейчас» по статусам клиентов и приоритетам триггеров, (2) форму для заполнения «пятничной строки недели», (3) таблицу истории прошлых строк. Тренер заполняет строку текущей недели за ≤5 минут раз в неделю; единственная health-метрика проекта — «недель подряд с заполненной строкой».

**Готово, когда:**

1. `/dashboard` открывается. Пустое состояние: «Первая пятница ещё впереди» + пустая форма для текущей недели.
2. Заполнил форму, сохранил → строка появилась в `weekly_stats`; видна в таблице истории.
3. Клик по строке истории → форма заполнилась её значениями, кнопка переключается с «Сохранить» на «Обновить».
4. Счётчики статусов соответствуют `SELECT status, COUNT(*) FROM clients` (проверка через `db:psql`).
5. Счётчики триггеров по приоритету = группировка того же `listTriggersForTrainer`, что и /today (один источник истины).
6. `/dev/dashboard-sanity` зелёный 5/5.
7. Навигация (сайдбар на десктопе, нижний таб-бар на мобильном) содержит пункт «Панель», ведущий на `/dashboard`.

---

## 2. Решения, принятые в brainstorming

| Открытый вопрос | Решение | Зачем |
|---|---|---|
| Как показывать триггеры в счётчиках | По приоритету: silent / high / medium / low | Совпадает с группировкой /today (`lib/today/group.ts`) — один источник истины, тренер видит знакомую раскладку. |
| Редактирование строк прошлых недель | Любая строка из таблицы истории редактируется | Тренер может исправить опечатку или дозаполнить забытую неделю — без этого данные «протухают». |
| Состояние формы по умолчанию | Развёрнута, поля пустые (или предзаполнены если строка уже есть) | Пятница — главный момент использования экрана, не должно быть лишнего клика. |
| Подход к агрегации | On-demand SQL при каждом запросе /dashboard | Соответствует принципу «last_contact НЕ хранится — вычисляется». Профиль нагрузки (один тренер, сотни клиентов) делает кэш избыточным. |
| Что хранится в форме недели | 6 источников лидов + trials + new_regulars + load_percent + note | Поля уже зафиксированы в schema `weekly_stats` от Этапа 1. Тренер вписывает руками — excel-стиль. |
| Глубина истории | Последние 12 недель в таблице | ~квартал. Достаточно чтобы увидеть тренд «жив ли ритуал». Старше — пока вне scope (V2). |

---

## 3. Архитектура — модули и границы

```
lib/weekly/
  week.ts            getWeekStart(date), recentWeeks(count, anchor)
  queries.ts         getWeeklyStat, listWeeklyHistory
  actions.ts         upsertWeeklyStat (server action)
  counters.ts        getNowCounters(trainerId) — все live агрегаты
  sanity-cases.ts    5 эталонных кейсов

lib/zod/
  weekly.ts          WeeklyStatSchema (валидация формы)

app/(app)/dashboard/
  page.tsx           server component: счётчики, форма, история

components/dashboard/
  CountersBlock.tsx       плитки статусов + триггеров
  WeeklyForm.tsx          'use client', useTransition, 9 числовых полей + note
  WeeklyHistoryTable.tsx  таблица последних 12 недель

app/(app)/dev/dashboard-sanity/
  page.tsx           прогон 5 кейсов
```

**Принцип границ:**
- `lib/weekly/week.ts` и `counters.ts` — чистые/тонкие функции. Без UI.
- `actions.ts` и `queries.ts` — тонкие обёртки над Drizzle.
- Компоненты `dashboard/*` — presentational; всё знание про БД остаётся в `lib/weekly/*`.
- Существующий `lib/triggers/query.ts::listTriggersForTrainer` переиспользуется как источник для триггерных счётчиков — НЕ дублируется новым SQL.

---

## 4. Счётчики «сейчас» — `lib/weekly/counters.ts`

```ts
export type PriorityCounts = {silent: number; high: number; medium: number; low: number};

export type NowCounters = {
    statuses: Record<ClientStatus, number>;
    triggersByPriority: PriorityCounts;
    totalClients: number;
    leadsLast7Days: number;
};

// Чистая функция — тестируется в sanity-кейсе 5.
export function groupTriggersByPriority(triggers: ClientWithTrigger[]): PriorityCounts

export async function getNowCounters(trainerId: string): Promise<NowCounters>
```

**Реализация:** три источника:
1. `SELECT status, COUNT(*) FROM clients WHERE trainer_id=$1 AND deleted_at IS NULL GROUP BY status` → `statuses`. Заполнить все 6 ключей (включая нули).
2. `listTriggersForTrainer(trainerId)` (уже есть от Этапа 3) → группировка результатов в памяти по `computeTrigger().priority`. `totalClients` = длина массива.
3. `SELECT COUNT(*) FROM clients WHERE trainer_id=$1 AND status='lead' AND created_at >= now() - interval '7 days'` → `leadsLast7Days`.

Все запросы изолированы по `trainerId`. Возвращает один объект.

**Источник истины:** триггерные счётчики берутся из того же запроса, что использует `/today` — это гарантирует, что число «high: 3» на /dashboard и три красные строки на /today всегда совпадают.

---

## 5. Неделя — `lib/weekly/week.ts`

```ts
export function getWeekStart(d: Date): string
export function formatWeekLabel(weekStart: string): string  // "15–21 июня"
```

**`getWeekStart`:** возвращает понедельник ISO-недели в формате `YYYY-MM-DD`. Воскресенье считается частью предыдущей недели. Корректно через границу года.

**`formatWeekLabel`:** для отображения в таблице истории. `2026-06-15` → `"15–21 июня"`. Если неделя пересекает месяц: `"29 июня – 5 июля"`. Год показывается только если отличается от текущего: `"23–29 декабря 2025"`.

Обе функции чистые. Sanity-кейсы покрывают: понедельник, воскресенье, переход через год, переход через месяц.

---

## 6. Queries и Server actions

```ts
// lib/weekly/queries.ts
export async function getWeeklyStat(trainerId: string, weekStart: string): Promise<WeeklyStat | null>
export async function listWeeklyHistory(trainerId: string, weeksBack: number = 12): Promise<WeeklyStat[]>

// lib/weekly/actions.ts
'use server';
export type UpsertResult = {ok: true} | {ok: false; fieldErrors: Record<string, string>};
export async function upsertWeeklyStat(formData: FormData): Promise<UpsertResult>
```

**`upsertWeeklyStat`:**
1. `requireTrainerId()` (копия из `lib/clients/actions.ts` — 5-е дублирование, но по правилу memory `project-shtab-state` это запускает рефакторинг → вынести в `lib/auth/require-trainer.ts` **прямо в этом этапе** как контролируемый чистильщик).
2. Извлекает `weekStart` (hidden input) и 9 числовых полей + `note` из FormData.
3. Валидирует через `WeeklyStatSchema` (zod):
   - все числа: `int >= 0`
   - `loadPercent`: `int 0–100`, опционально
   - `weekStart`: строка `/^\d{4}-\d{2}-\d{2}$/`
4. `INSERT INTO weekly_stats ... ON CONFLICT (trainer_id, week_start) DO UPDATE SET ...`. В Drizzle через `onConflictDoUpdate({target: [...], set: {...}})`.
5. `revalidatePath('/dashboard')` → возврат `{ok:true}`.

`listWeeklyHistory`: `ORDER BY week_start DESC LIMIT 12`. Возвращает массив (включая текущую неделю если она уже сохранена).

`getWeeklyStat`: точный поиск по `(trainerId, weekStart)`, возвращает `WeeklyStat | null`.

---

## 7. UI `/dashboard` — server component

**Server component `app/(app)/dashboard/page.tsx`:**

```ts
// Чтение query param: какую неделю редактировать (по умолчанию — текущая).
const editingWeek = sp.week ?? getWeekStart(new Date());

const [counters, history, current] = await Promise.all([
    getNowCounters(trainerId),
    listWeeklyHistory(trainerId, 12),
    getWeeklyStat(trainerId, editingWeek),
]);
```

Layout:
```
<h1>Панель</h1>
<WeeklyForm weekStart={editingWeek} initial={current} />
<CountersBlock counters={counters} />
<WeeklyHistoryTable weeks={history} editingWeek={editingWeek} />
```

**Пустое состояние:** если `history.length === 0 && current === null` — над формой плашка «Первая пятница ещё впереди — заполни строку, когда наступит». Форма всё равно показана.

### 7.1 CountersBlock

Сетка плиток, как в design-system (используем `glass` token из Этапа 1).

Над сеткой компактная строка: «Всего клиентов: **N** · Новых лидов за 7 дней: **M**».

Ряд 1 — статусы клиентов (6 плиток):
- Active, Prebook, Cooling, Vacation, Lead, Left.

Ряд 2 — триггеры по приоритету (4 плитки):
- 🔇 Silent, 🔴 High, 🟡 Medium, 🟢 Low.

Каждая плитка: большое число + подпись + цветовой акцент (через проектные токены `bg-cyan`/`text-pink`/etc).

### 7.2 WeeklyForm

`'use client'`, форма с 9 числовыми инпутами и textarea note. Поля по группам:

**Лиды по источникам (6 input number):**
- Ресепшн (`leadsReception`)
- Лифты (`leadsLifts`)
- Авито (`leadsAvito`)
- Сарафан (`leadsReferral`)
- База (`leadsBase`)
- Чат (`leadsChat`)

**Тренировки (3 input):**
- Пробные (`trials`)
- Новые постоянные (`newRegulars`)
- Загрузка % (`loadPercent`, опционально)

**Заметка** — `<textarea>`.

Hidden `<input name="weekStart" value={weekStart}>`.

CTA: «**Сохранить**» если `initial == null`, иначе «**Обновить**» (primary cyan).

Использует `useTransition` + server action. После success — `router.refresh()`. При `ok:false` — показать `fieldErrors` под нужными полями (как в существующих формах клиентов).

### 7.3 WeeklyHistoryTable

Колонки: Неделя · Лидов всего · Пробных · Новых · Загрузка % · ...

Клик по строке → переход на `/dashboard?week=YYYY-MM-DD` (форма заполнится для редактирования). Текущая редактируемая неделя выделена.

«Лидов всего» считается на лету = сумма 6 источников.

Пустое состояние таблицы: «Пока нет ни одной заполненной недели».

---

## 8. Zod schema — `lib/zod/weekly.ts`

```ts
const intGTE0 = z.preprocess(coerceInt, z.number().int().min(0));
const intPercent = z.preprocess(coerceInt, z.number().int().min(0).max(100).nullable());

export const WeeklyStatSchema = z.object({
    weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    leadsReception: intGTE0,
    leadsLifts: intGTE0,
    leadsAvito: intGTE0,
    leadsReferral: intGTE0,
    leadsBase: intGTE0,
    leadsChat: intGTE0,
    trials: intGTE0,
    newRegulars: intGTE0,
    loadPercent: intPercent,
    note: z.string().trim().optional().transform(v => v && v.length > 0 ? v : null),
});
```

`coerceInt` — простой preprocess: `'' → 0`, иначе `parseInt`. Не путать с `lib/csv/coerce.ts::coerceInt` (тот возвращает `CoerceResult` с reason). Локальный helper в этом же файле.

---

## 9. Sanity playground `/dev/dashboard-sanity`

5 эталонных кейсов в `lib/weekly/sanity-cases.ts`:

1. **getWeekStart(2026-06-15) → '2026-06-15'** (понедельник возвращает себя).
2. **getWeekStart(2026-06-21) → '2026-06-15'** (воскресенье — часть предыдущей недели).
3. **getWeekStart(2027-01-01) → '2026-12-28'** (переход через год, пятница).
4. **recentWeeks(3, 2026-06-19) → [2026-06-15, 2026-06-08, 2026-06-01]**.
5. **Группировка триггеров** — массив фиктивных `ClientWithTrigger` из 10 клиентов с известными priority → `triggersByPriority` совпадает с ожиданием. Тестирует чистую функцию `groupTriggersByPriority(triggers)`, которую `getNowCounters` использует поверх `listTriggersForTrainer`.

Кейсы 1-4 чистые. Кейс 5 — небольшая фабрика данных с in-memory массивом, как в `lib/csv/sanity-cases.ts`.

UI playground повторяет паттерн `/dev/import-sanity`: таблица «#·Кейс·Статус·Детали», счётчик «N/N зелёных».

---

## 10. Навигация

Spec §4 уже описывает: десктоп — сайдбар «Сегодня · База · Панель · Настройки»; мобильный — нижний таб-бар «Сегодня · База · Панель · ⚙».

Сейчас (по состоянию Этапов 1-5) сайдбар/таб-бар вероятно содержит только «Сегодня · База». Добавить пункт «Панель» → `/dashboard`. Пункт «Настройки» добавится в Этапе 7.

Если навигационный компонент находится в `components/layout/Sidebar.tsx` / `components/layout/MobileNav.tsx` — отредактировать оба. Это не unrelated refactoring: добавление пункта явно требуется Acceptance criteria #7.

---

## 11. Технический долг — `requireTrainerId` рефакторинг

По правилу memory `project-shtab-state`: дублирование `requireTrainerId` уже в 4 файлах (`lib/clients/actions.ts`, `lib/touches/actions.ts`, `lib/export/actions.ts`, `lib/clients/import.ts`). Этап 6 добавит **5-й** (`lib/weekly/actions.ts`). Это запускает порог.

**В этом этапе:**
1. Создать `lib/auth/require-trainer.ts` с единственным `export async function requireTrainerId(): Promise<string>`.
2. Заменить 4 существующих определения на `import {requireTrainerId} from '@/lib/auth/require-trainer'`.
3. Использовать его же в новом `lib/weekly/actions.ts`.

Это минимальный фокусированный рефактор. Не трогать ничего другого в этих файлах.

---

## 12. Что вне scope

- Графики/тренды (line chart недель). Только таблица истории.
- Экспорт строки недели в CSV. YAGNI.
- Авто-подсчёт `trials`/`new_regulars` через анализ `touches` или `clients.status` history. MVP: тренер вписывает руками — это excel-стиль лист.
- Напоминание «не забудь заполнить пятницу» (V2 по mvp-spec).
- Сравнение «эта неделя vs прошлая» (delta индикаторы). YAGNI до V2.
- Редактирование/удаление строки недели через корзину. Только UPSERT, удаление через `db:studio` если очень нужно.

---

## 13. Известные риски

| Риск | Митигация |
|---|---|
| Тренер вписал большое случайное число (опечатка), оно ломает sanity таблицы истории | Текст инпутов large + clear labels. UPSERT упрощает исправление: переоткрыл, поправил, сохранил. |
| Часовой пояс: `getWeekStart` опирается на локальное время сервера | В проекте dates хранятся как `date` (без timezone) и собираются в строку YYYY-MM-DD на сервере. Логика `getWeekStart` использует только `Date#getUTC*` — стабильно. |
| Triggers query (listTriggersForTrainer) тяжёлая, /dashboard станет медленным | Запросы `Promise.all` параллельно. Если станет медленно при 1000+ клиентов — добавим `unstable_cache` с тегами (подход C из brainstorming). Не сейчас. |
| Конфликт UPSERT при одновременном открытии формы в двух вкладках | Сценарий не реалистичен (один тренер). Если случится — последнее «Сохранить» победит, никаких потерь данных кроме перезаписи. |

---

## 14. Связь с предыдущими этапами

- **Этап 1:** таблица `weekly_stats` уже в schema, миграции применены. Не трогаем.
- **Этап 3:** `lib/triggers/compute.ts::computeTrigger` и `lib/triggers/query.ts::listTriggersForTrainer` переиспользуются в `counters.ts`. Один источник истины с /today.
- **Этап 4:** паттерн форм с server action и `useTransition` копируется из `recordTouch` + `TouchActions`.
- **Этап 5:** паттерн `/dev/*-sanity` повторяем 1-в-1; стиль форм (FormData → server action → discriminated UpsertResult).
- **Технический долг:** этот этап триггерит вынос `requireTrainerId` (см. §11).

---

## 15. Что после Этапа 6

Финальный Этап 7 — `/settings`: textarea промпт-шаблона, инпуты порогов триггеров, форма смены пароля. После Этапа 7 — `/graphify --update` для финального снимка графа MVP (явно зафиксировано в memory).
