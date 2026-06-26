# Brand Book Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переработать весь интерфейс `athome-admin` в направлении B «Неоновая витрина», подключить знак из `public/favicon.png` и полностью удалить emoji из first-party кода, данных, экспорта, CSV и документации без изменения бизнес-логики.

**Architecture:** Семантические данные очищаются от presentation-поля `emoji`; иконки и tones определяются только в React-слое через Lucide mappings. Бренд-токены и повторяемые поверхности живут в `app/globals.css` и небольших UI-примитивах, а страницы собираются из `PageHeader`, `Card`, `StatusNotice`, `IconBadge` и существующих форм. Никаких новых зависимостей и миграций БД.

**Tech Stack:** Next.js 16.2.9 App Router, React 19.2.4, TypeScript strict, Tailwind CSS 4, lucide-react 1.18.0, Node test runner через `tsx`.

## Global Constraints

- Источник визуальных правил: `docs/superpowers/specs/2026-06-24-brand-book-redesign-design.md`.
- Перед Next.js-изменениями сверяться с `node_modules/next/dist/docs/`.
- Не менять маршруты, Server Actions, запросы к Postgres или схему БД.
- Не добавлять зависимости и универсальные абстракции для одноразовой разметки.
- В раскрытом desktop-сайдбаре и mobile top bar показывать только знак, без wordmark.
- Единственный primary CTA на каждом экране использует cyan `#2CE6FF`.
- Gerhaus/serif применяется только к коротким uppercase H1/H2; body остаётся Nunito, метаданные — JetBrains Mono.
- В first-party текстовых файлах не должно остаться Unicode emoji или emoji-like dingbat symbols.
- Временная папка `.superpowers/` не коммитится.
- Пользовательский `public/favicon.png` является входным ассетом; не заменять его другим изображением.
- Все изменения должны быть хирургическими: визуальный слой и emoji-контракты, без соседнего рефакторинга.

---

## File Map

### Новые файлы

- `components/brand/BrandLogo.tsx` — SVG-версия знака для интерфейса.
- `components/brand/semantic-icons.ts` — Lucide mappings для trigger group, trigger kind и touch type.
- `components/ui/PageHeader.tsx` — единый заголовок страницы.
- `components/ui/IconBadge.tsx` — компактная icon/tone-плашка.
- `components/ui/StatusNotice.tsx` — success/warning/error/info notice.
- `components/nav/MobileTopBar.tsx` — мобильный знак и название текущего раздела.
- `tests/no-emoji-source.test.ts` — защитный сканер first-party исходников.
- `tests/semantic-contracts.test.ts` — контракты trigger/labels/export/CSV без emoji.
- `tests/brand-assets.test.ts` — favicon и SVG-logo contracts.
- `tests/ui-primitives.test.tsx` — серверный render UI-примитивов.
- `tests/navigation-contracts.test.ts` — shell/logo/mobile navigation contracts.

### Основные изменяемые зоны

- `app/globals.css`, `app/layout.tsx`, `app/(app)/layout.tsx`, `app/(auth)/layout.tsx`.
- `components/ui/*`, `components/nav/*`.
- `lib/triggers/*`, `lib/today/group.ts`, `lib/clients/labels.ts`, `lib/touches/labels.ts`, `lib/csv/synonyms.ts`, `lib/export/*`.
- Все пользовательские страницы и их feature-компоненты.
- `design-system.md`, `README.md`, `docs/trainer-guide.md`, `docs/superpowers/{specs,plans}/*.md`.

---

### Task 1: Remove emoji from semantic data and add source guards

**Files:**
- Create: `tests/semantic-contracts.test.ts`
- Create: `tests/no-emoji-source.test.ts`
- Modify: `lib/triggers/compute.ts:4-80`
- Modify: `lib/today/group.ts:5-68`
- Modify: `lib/clients/labels.ts:3-33`
- Modify: `lib/touches/labels.ts:3-12`
- Modify: `lib/csv/synonyms.ts:50-54`
- Modify: `lib/export/sanity-cases.ts:3-84`
- Modify: `lib/weekly/sanity-cases.ts:7-13`
- Modify: `app/(app)/today/page.tsx:22-36`
- Modify: `components/today/TodayBoard.tsx:14-29,139-181`
- Modify: `components/dashboard/CountersBlock.tsx:15-59`
- Modify: `app/(app)/dev/triggers-sanity/page.tsx:62-66`
- Modify: `app/(app)/dev/export-sanity/page.tsx:27-35`
- Modify: `app/(app)/dev/dashboard-sanity/page.tsx:21-27`
- Modify: `app/(app)/dev/import-sanity/page.tsx:69-74`

**Interfaces:**
- Produces: `Trigger = {kind: TriggerKind; priority: TriggerPriority; daysSince: number}`.
- Produces: `TriggerGroup = {key: GroupKey; title: string; entries: TriggerEntry[]}`.
- Produces: plain-text `PROFILE_LABELS` and `TOUCH_TYPE_LABELS`.
- Consumers in later tasks must derive icons from semantic keys, never from returned strings.

- [ ] **Step 1: Write failing semantic contract tests**

```ts
// tests/semantic-contracts.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {computeTrigger} from '@/lib/triggers/compute';
import {groupAndSortTriggers} from '@/lib/today/group';
import {PROFILE_LABELS} from '@/lib/clients/labels';
import {TOUCH_TYPE_LABELS} from '@/lib/touches/labels';
import {PROFILE_SYNONYMS} from '@/lib/csv/synonyms';
import {buildClaudeExport} from '@/lib/export/claude';
import {DEFAULT_THRESHOLDS} from '@/lib/triggers/defaults';

const EMOJI = /[\u00A9\u00AE\u203C\u2049\u2122\u2139\u2600-\u27BF\u3030\u303D\u3297\u3299\uFE0F\u{1F000}-\u{1FAFF}]/u;

test('trigger and group models contain no presentation field', () => {
    const trigger = computeTrigger(
        {status: 'lead', septemberBooking: false, deletedAt: null},
        new Date('2026-06-01T00:00:00Z'),
        new Date('2026-06-24T00:00:00Z'),
        DEFAULT_THRESHOLDS,
    );
    assert.ok(trigger);
    assert.equal('emoji' in trigger, false);

    const groups = groupAndSortTriggers([{
        id: 'client-1',
        trainerId: 'trainer-1',
        name: 'Анна',
        contact: null,
        profile: 'health',
        status: 'lead',
        source: null,
        personalFact: null,
        goal: null,
        sessionsPerWeek: null,
        lastSessionDate: null,
        septemberBooking: false,
        note: null,
        leadPayload: null,
        createdAt: new Date('2026-06-01T00:00:00Z'),
        updatedAt: new Date('2026-06-01T00:00:00Z'),
        deletedAt: null,
        lastTouchDate: new Date('2026-06-01T00:00:00Z'),
    }], new Date('2026-06-24T00:00:00Z'), DEFAULT_THRESHOLDS);
    assert.equal('emoji' in groups[0], false);
});

test('labels, CSV synonyms and Claude export are plain text', () => {
    for (const label of [...Object.values(PROFILE_LABELS), ...Object.values(TOUCH_TYPE_LABELS)]) {
        assert.equal(EMOJI.test(label), false, label);
    }
    for (const synonym of Object.keys(PROFILE_SYNONYMS)) {
        assert.equal(EMOJI.test(synonym), false, synonym);
    }

    const result = buildClaudeExport([{
        id: 'client-1',
        name: 'Анна',
        profile: 'health',
        personalFact: 'любит утренние тренировки',
        goal: 'сила',
        note: null,
        trigger: {kind: 'active_stale', priority: 'medium', daysSince: 12},
    }], 'PROMPT');
    assert.equal(EMOJI.test(result.text), false);
    assert.match(result.text, /Анна · Здоровье · Активный без тренировки/);
});
```

- [ ] **Step 2: Write a failing source scan limited to product source**

```ts
// tests/no-emoji-source.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {extname, join} from 'node:path';

const EMOJI = /[\u00A9\u00AE\u203C\u2049\u2122\u2139\u2600-\u27BF\u3030\u303D\u3297\u3299\uFE0F\u{1F000}-\u{1FAFF}]/u;
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.mjs']);
const ROOTS = ['app', 'components', 'lib', 'tests'];

function collect(path: string): string[] {
    if (statSync(path).isFile()) return TEXT_EXTENSIONS.has(extname(path)) ? [path] : [];
    return readdirSync(path).flatMap((name) => collect(join(path, name)));
}

test('product source contains no Unicode emoji', () => {
    const hits = ROOTS.flatMap(collect).flatMap((file) => {
        const lines = readFileSync(file, 'utf8').split('\n');
        return lines.flatMap((line, index) => EMOJI.test(line) ? [`${file}:${index + 1}`] : []);
    });
    assert.deepEqual(hits, []);
});
```

- [ ] **Step 3: Run tests and verify RED**

Run:

```bash
npx tsx --test tests/semantic-contracts.test.ts tests/no-emoji-source.test.ts
```

Expected: FAIL because `Trigger`, `TriggerGroup`, labels, sanity pages and UI still contain emoji.

- [ ] **Step 4: Remove presentation fields from trigger and group models**

```ts
// lib/triggers/compute.ts
export type Trigger = {
    kind: TriggerKind;
    priority: TriggerPriority;
    daysSince: number;
};

// Every computeTrigger return uses only:
return {kind: 'silent', priority: 'high', daysSince};
return {kind: 'lead_stale', priority: 'high', daysSince};
return {kind: 'vacation_no_prebook', priority: 'medium', daysSince};
return {kind: 'active_stale', priority: 'high', daysSince};
return {kind: 'active_stale', priority: 'medium', daysSince};
return {kind: 'cooled_stale', priority: 'low', daysSince};
```

```ts
// lib/today/group.ts
export type TriggerGroup = {
    key: GroupKey;
    title: string;
    entries: TriggerEntry[];
};

if (silent.length > 0) groups.push({key: 'silent', title: 'Тихие', entries: silent});
if (high.length > 0) groups.push({key: 'high', title: 'Срочно', entries: high});
if (medium.length > 0) groups.push({key: 'medium', title: 'Скоро', entries: medium});
if (low.length > 0) groups.push({key: 'low', title: 'Можно подождать', entries: low});
```

- [ ] **Step 5: Replace data labels and CSV synonyms with plain text**

```ts
// lib/clients/labels.ts
export const PROFILE_LABELS: Record<ClientProfile, string> = {
    health: 'Здоровье',
    form: 'Форма',
    energy: 'Энергия',
};
```

```ts
// lib/touches/labels.ts
export const TOUCH_TYPE_LABELS: Record<TouchType, string> = {
    message: 'Сообщение',
    call: 'Звонок',
    training: 'Тренировка',
    other: 'Другое',
};
```

```ts
// lib/csv/synonyms.ts
export const PROFILE_SYNONYMS: Record<string, ClientProfile> = {
    'здоровье': 'health', 'health': 'health',
    'форма': 'form', 'form': 'form',
    'энергия': 'energy', 'energy': 'energy',
};
```

- [ ] **Step 6: Update all consumers to compile without `emoji`**

Remove `emoji` from `BoardEntry`, `BoardGroup`, `/today` mapping, export sanity objects and weekly fake groups. Temporarily render only text in `TodayBoard` and `CountersBlock`; semantic icons are added in Task 2.

Replace sanity status cells with accessible text:

```tsx
<span className={ok ? 'text-green' : 'text-orange'}>
    {ok ? 'Пройдено' : 'Ошибка'}
</span>
```

- [ ] **Step 7: Run focused and type checks**

Run:

```bash
npx tsx --test tests/semantic-contracts.test.ts tests/no-emoji-source.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

```bash
git add tests app components lib
git commit -m "refactor: remove emoji from semantic data"
```

---

### Task 2: Add brand assets, semantic icon mappings and global visual tokens

**Files:**
- Create: `components/brand/BrandLogo.tsx`
- Create: `components/brand/semantic-icons.ts`
- Create: `tests/brand-assets.test.ts`
- Modify: `.gitignore`
- Modify: `app/layout.tsx:1-43`
- Modify: `app/globals.css:3-82`
- Delete: `app/favicon.ico`
- Add existing user asset: `public/favicon.png`

**Interfaces:**
- Produces: `BrandLogo({size?: number; className?: string; decorative?: boolean})`.
- Produces: `TRIGGER_GROUP_VISUALS`, `TRIGGER_KIND_VISUALS`, `TOUCH_TYPE_ICONS`.
- Produces CSS classes `.glass`, `.glass-strong`, `.surface-row`, `.page-enter`, `.section-kicker`.

- [ ] **Step 1: Write failing asset tests**

```ts
// tests/brand-assets.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {existsSync, readFileSync} from 'node:fs';

test('brand favicon and SVG component exist', () => {
    assert.equal(existsSync('public/favicon.png'), true);
    assert.equal(existsSync('components/brand/BrandLogo.tsx'), true);
});

test('BrandLogo is a real inline SVG using the source aspect ratio', () => {
    const source = readFileSync('components/brand/BrandLogo.tsx', 'utf8');
    assert.match(source, /<svg/);
    assert.match(source, /viewBox="0 0 82 81"/);
    assert.doesNotMatch(source, /<img|next\/image/);
});

test('root metadata references the PNG favicon', () => {
    const source = readFileSync('app/layout.tsx', 'utf8');
    assert.match(source, /icons:\s*\{\s*icon:\s*'\/favicon\.png'/s);
});
```

- [ ] **Step 2: Run asset tests and verify RED**

Run:

```bash
npx tsx --test tests/brand-assets.test.ts
```

Expected: FAIL because `BrandLogo.tsx` and metadata icon are absent.

- [ ] **Step 3: Add the exact-purpose SVG component**

```tsx
// components/brand/BrandLogo.tsx
import {clsx} from 'clsx';
import {useId} from 'react';

type Props = {
    size?: number;
    className?: string;
    decorative?: boolean;
};

export function BrandLogo({size = 64, className, decorative = true}: Props) {
    const uid = useId().replaceAll(':', '');
    const gradientId = `brand-stroke-${uid}`;
    const glowId = `brand-glow-${uid}`;

    return (
        <svg
            viewBox="0 0 82 81"
            width={size}
            height={size}
            className={clsx('shrink-0 overflow-visible', className)}
            role={decorative ? undefined : 'img'}
            aria-hidden={decorative ? true : undefined}
            aria-label={decorative ? undefined : 'Тренер у дома'}
        >
            <defs>
                <linearGradient id={gradientId} x1="8" y1="8" x2="73" y2="72">
                    <stop stopColor="#2CE6FF"/>
                    <stop offset="1" stopColor="#4D7DFF"/>
                </linearGradient>
                <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
                    <feGaussianBlur stdDeviation="2.2" result="blur"/>
                    <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <g
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${glowId})`}
            >
                <path d="M9 68V35L37.5 9.5a5 5 0 0 1 6.5 0L73 35v33"/>
                <path d="M27 39v29M27 53h16M43 35v33M65 36 46 53l19 16"/>
            </g>
        </svg>
    );
}
```

- [ ] **Step 4: Add semantic icon mappings at the UI boundary**

```ts
// components/brand/semantic-icons.ts
import {
    BellOff,
    Circle,
    Clock3,
    Dumbbell,
    Ellipsis,
    MessageCircle,
    Phone,
    TriangleAlert,
    type LucideIcon,
} from 'lucide-react';
import type {TouchType} from '@/lib/db/schema';
import type {TriggerKind} from '@/lib/triggers/compute';
import type {GroupKey} from '@/lib/today/group';

export type SemanticTone = 'neutral' | 'cyan' | 'violet' | 'green' | 'orange';

export const TRIGGER_GROUP_VISUALS: Record<GroupKey, {icon: LucideIcon; tone: SemanticTone}> = {
    silent: {icon: BellOff, tone: 'orange'},
    high: {icon: TriangleAlert, tone: 'orange'},
    medium: {icon: Clock3, tone: 'violet'},
    low: {icon: Circle, tone: 'cyan'},
};

export const TRIGGER_KIND_VISUALS: Record<TriggerKind, {icon: LucideIcon; tone: SemanticTone}> = {
    silent: {icon: BellOff, tone: 'orange'},
    lead_stale: {icon: TriangleAlert, tone: 'orange'},
    vacation_no_prebook: {icon: Clock3, tone: 'violet'},
    active_stale: {icon: Clock3, tone: 'violet'},
    cooled_stale: {icon: Circle, tone: 'cyan'},
};

export const TOUCH_TYPE_ICONS: Record<TouchType, LucideIcon> = {
    message: MessageCircle,
    call: Phone,
    training: Dumbbell,
    other: Ellipsis,
};
```

- [ ] **Step 5: Expand brand tokens and reusable surfaces**

Replace `app/globals.css` component layer with the approved B-direction foundations:

```css
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
    --radius-xl: 30px;
    --font-display: var(--font-display-loaded, 'Gerhaus'), Georgia, serif;
    --font-sans: var(--font-sans-loaded, 'Nunito'), system-ui, sans-serif;
    --font-mono: var(--font-mono-loaded, 'JetBrains Mono'), monospace;
    --ease-soft: cubic-bezier(.2, .7, .2, 1);
    --shadow-glow: 0 0 0 1px rgb(44 230 255 / .45), 0 12px 36px rgb(44 230 255 / .32);
    --shadow-glow-orange: 0 0 22px rgb(255 159 67 / .28);
    --shadow-lift: 0 1px 2px rgb(0 0 0 / .4), 0 12px 34px rgb(0 0 0 / .34), 0 32px 80px rgb(0 0 0 / .26);
}

@layer base {
    html, body {
        min-height: 100vh;
        background: var(--color-bg);
        color: var(--color-tx);
        font-family: var(--font-sans);
        -webkit-font-smoothing: antialiased;
    }

    body {
        background-image:
            radial-gradient(95% 70% at 12% -8%, rgb(139 92 255 / .20), transparent 55%),
            radial-gradient(80% 58% at 88% 0%, rgb(44 230 255 / .12), transparent 52%),
            linear-gradient(180deg, #121624 0%, #0E1117 48%, #0A0D13 100%);
        background-attachment: fixed;
    }

    *:focus-visible {
        outline: 2px solid var(--color-cyan);
        outline-offset: 3px;
    }
}

@layer components {
    .glass {
        background-color: var(--color-bg-glass);
        background-image: linear-gradient(180deg, rgb(255 255 255 / .055), rgb(255 255 255 / .012));
        border: 1px solid var(--color-line);
        border-radius: var(--radius-lg);
        box-shadow: inset 0 1px 0 rgb(255 255 255 / .10), 0 8px 28px rgb(0 0 0 / .28);
        backdrop-filter: blur(18px);
    }

    .glass-strong {
        border-radius: var(--radius-xl);
        box-shadow: inset 0 1px 0 rgb(255 255 255 / .11), var(--shadow-lift);
    }

    .surface-row {
        border-top: 1px solid var(--color-line-soft);
        transition: background-color .2s var(--ease-soft), transform .2s var(--ease-soft);
    }

    .page-enter {
        animation: page-enter .6s var(--ease-soft) both;
    }

    .section-kicker {
        color: var(--color-cyan);
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: .18em;
        text-transform: uppercase;
    }

    .hairline {
        border-color: var(--color-line-soft);
    }
}

@keyframes page-enter {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 767px) {
    body { background-attachment: scroll; }
}

@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        scroll-behavior: auto !important;
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
    }
}
```

- [ ] **Step 6: Connect favicon metadata and ignore brainstorm output**

```ts
// app/layout.tsx metadata
export const metadata: Metadata = {
    title: 'Штаб',
    description: 'Админка тренера: база клиентов и пятничный ритуал',
    icons: {
        icon: '/favicon.png',
        shortcut: '/favicon.png',
        apple: '/favicon.png',
    },
};
```

Append to `.gitignore`:

```gitignore
/.superpowers/
```

Delete `app/favicon.ico`, because file-based metadata would otherwise compete with the approved PNG favicon.

- [ ] **Step 7: Run tests and checks**

Run:

```bash
npx tsx --test tests/brand-assets.test.ts tests/no-emoji-source.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit**

```bash
git add .gitignore app components/brand public/favicon.png tests/brand-assets.test.ts
git add -u app/favicon.ico
git commit -m "feat: add brand assets and visual tokens"
```

---

### Task 3: Upgrade UI primitives and shared page components

**Files:**
- Create: `components/ui/PageHeader.tsx`
- Create: `components/ui/IconBadge.tsx`
- Create: `components/ui/StatusNotice.tsx`
- Create: `tests/ui-primitives.test.tsx`
- Modify: `components/ui/Button.tsx`
- Modify: `components/ui/Card.tsx`
- Modify: `components/ui/Badge.tsx`
- Modify: `components/ui/Input.tsx`
- Modify: `components/ui/Select.tsx`
- Modify: `components/ui/Textarea.tsx`
- Modify: `components/ui/Modal.tsx`
- Modify: `components/ui/EmptyState.tsx`

**Interfaces:**
- Produces: `PageHeader({title, kicker?, meta?, action?})`.
- Produces: `IconBadge({icon, tone, label?})`.
- Produces: `StatusNotice({tone, title?, children, className?})`.
- Extends: `Button` with `loading?: boolean`.
- Extends: `Card` with `variant?: 'default' | 'strong'`.
- Extends: `Badge` with `dot?: boolean`.

- [ ] **Step 1: Write failing server-render tests**

```tsx
// tests/ui-primitives.test.tsx
import assert from 'node:assert/strict';
import test from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {TriangleAlert} from 'lucide-react';
import {Button} from '@/components/ui/Button';
import {PageHeader} from '@/components/ui/PageHeader';
import {StatusNotice} from '@/components/ui/StatusNotice';

test('loading button exposes busy state and stable label', () => {
    const html = renderToStaticMarkup(createElement(Button, {loading: true}, 'Сохранить'));
    assert.match(html, /aria-busy="true"/);
    assert.match(html, /Сохранить/);
});

test('PageHeader renders one h1 and optional metadata', () => {
    const html = renderToStaticMarkup(createElement(PageHeader, {
        title: 'Сегодня',
        kicker: 'Пятничный ритуал',
        meta: '8 сигналов',
    }));
    assert.equal((html.match(/<h1/g) ?? []).length, 1);
    assert.match(html, /Пятничный ритуал/);
    assert.match(html, /8 сигналов/);
});

test('warning notice has alert semantics and icon', () => {
    const html = renderToStaticMarkup(createElement(StatusNotice, {
        tone: 'warning',
        title: 'Нужен личный факт',
        icon: TriangleAlert,
        children: 'Допиши факт.',
    }));
    assert.match(html, /role="alert"/);
    assert.match(html, /Нужен личный факт/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npx tsx --test tests/ui-primitives.test.tsx
```

Expected: FAIL because shared components and `loading` prop do not exist.

- [ ] **Step 3: Implement the shared component interfaces**

```tsx
// components/ui/PageHeader.tsx
import type {ReactNode} from 'react';

type Props = {
    title: string;
    kicker?: string;
    meta?: ReactNode;
    action?: ReactNode;
};

export function PageHeader({title, kicker, meta, action}: Props) {
    return (
        <header className="mb-8 md:mb-10 flex items-end justify-between gap-5">
            <div>
                {kicker && <p className="section-kicker mb-3">{kicker}</p>}
                <h1 className="font-display uppercase text-[clamp(2rem,5vw,3.25rem)] leading-none tracking-[-0.02em]">
                    {title}
                </h1>
                {meta && <div className="mt-3 text-[12px] font-mono uppercase tracking-[0.12em] text-tx-3">{meta}</div>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </header>
    );
}
```

```tsx
// components/ui/IconBadge.tsx
import type {LucideIcon} from 'lucide-react';
import {clsx} from 'clsx';
import type {SemanticTone} from '@/components/brand/semantic-icons';

const tones: Record<SemanticTone, string> = {
    neutral: 'border-line bg-white/[.025] text-tx-2',
    cyan: 'border-cyan/30 bg-cyan/10 text-cyan',
    violet: 'border-violet/30 bg-violet/10 text-violet',
    green: 'border-green/30 bg-green/10 text-green',
    orange: 'border-orange/30 bg-orange/10 text-orange shadow-[var(--shadow-glow-orange)]',
};

export function IconBadge({icon: Icon, tone, label, className}: {
    icon: LucideIcon;
    tone: SemanticTone;
    label?: string;
    className?: string;
}) {
    return (
        <span className={clsx('inline-flex items-center gap-2 rounded-xl border px-2.5 py-2', tones[tone], className)}>
            <Icon size={16} aria-hidden="true"/>
            {label && <span className="text-[12px] font-mono uppercase tracking-[0.08em]">{label}</span>}
        </span>
    );
}
```

```tsx
// components/ui/StatusNotice.tsx
import type {LucideIcon} from 'lucide-react';
import {CircleAlert, CircleCheck, Info} from 'lucide-react';
import {clsx} from 'clsx';
import type {ReactNode} from 'react';

type Tone = 'success' | 'warning' | 'error' | 'info';
const defaults: Record<Tone, LucideIcon> = {
    success: CircleCheck,
    warning: CircleAlert,
    error: CircleAlert,
    info: Info,
};
const classes: Record<Tone, string> = {
    success: 'border-green/30 bg-green/5 text-green',
    warning: 'border-orange/30 bg-orange/5 text-orange',
    error: 'border-orange/40 bg-orange/8 text-orange',
    info: 'border-cyan/25 bg-cyan/5 text-cyan',
};

export function StatusNotice({tone, title, children, icon, className}: {
    tone: Tone;
    title?: string;
    children: ReactNode;
    icon?: LucideIcon;
    className?: string;
}) {
    const Icon = icon ?? defaults[tone];
    return (
        <div
            role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
            className={clsx('flex gap-3 rounded-2xl border px-4 py-3', classes[tone], className)}
        >
            <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true"/>
            <div className="text-[13px]">
                {title && <p className="font-semibold text-tx">{title}</p>}
                <div className="text-tx-2">{children}</div>
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Upgrade existing primitives minimally**

Implement these exact contracts:

```tsx
// Button core behavior
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
};

<button
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={clsx(
        'relative inline-flex items-center justify-center gap-2 rounded-full font-sans font-bold',
        'transition-[transform,box-shadow,background-color,border-color,opacity] duration-200 ease-[var(--ease-soft)]',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
    )}
>
    {loading && <LoaderCircle size={16} className="animate-spin" aria-hidden="true"/>}
    {children}
</button>
```

Use `Card variant="strong"` to append `glass-strong`; add `dot` to `Badge`; make all form fields `rounded-2xl`, `bg-bg-3/80`, `focus:ring-cyan/30`; change modal panel to `glass glass-strong rounded-[var(--radius-xl)]`; add optional `icon: LucideIcon` to `EmptyState`.

- [ ] **Step 5: Run tests and checks**

Run:

```bash
npx tsx --test tests/ui-primitives.test.tsx tests/no-emoji-source.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add components/ui tests/ui-primitives.test.tsx
git commit -m "feat: add branded UI primitives"
```

---

### Task 4: Redesign application shell and navigation

**Files:**
- Create: `components/nav/MobileTopBar.tsx`
- Create: `tests/navigation-contracts.test.ts`
- Modify: `components/nav/Sidebar.tsx`
- Modify: `components/nav/NavLink.tsx`
- Modify: `components/nav/TopBar.tsx`
- Modify: `components/nav/MobileTabBar.tsx`
- Modify: `components/nav/MobileFab.tsx`
- Modify: `app/(app)/layout.tsx`

**Interfaces:**
- `MobileTopBar()` derives the current section from `usePathname`.
- Sidebar brand link is `/today`, contains only `BrandLogo`, and has `aria-label="Открыть Сегодня"`.
- Existing route labels and hrefs remain unchanged.

- [ ] **Step 1: Write failing navigation source contracts**

```ts
// tests/navigation-contracts.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

test('desktop sidebar uses logo without wordmark', () => {
    const source = readFileSync('components/nav/Sidebar.tsx', 'utf8');
    assert.match(source, /BrandLogo/);
    assert.doesNotMatch(source, />\s*Штаб\s*</);
});

test('app shell includes mobile top bar and bottom tab bar', () => {
    const source = readFileSync('app/(app)/layout.tsx', 'utf8');
    assert.match(source, /MobileTopBar/);
    assert.match(source, /MobileTabBar/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npx tsx --test tests/navigation-contracts.test.ts
```

Expected: FAIL because Sidebar still renders wordmark and `MobileTopBar` is absent.

- [ ] **Step 3: Implement desktop shell**

Use this structure in `Sidebar.tsx`:

```tsx
<aside className="fixed inset-y-4 left-4 hidden w-[248px] flex-col md:flex glass glass-strong p-4">
    <Link
        href="/today"
        aria-label="Открыть Сегодня"
        className="mb-7 flex h-20 items-center justify-center rounded-2xl"
    >
        <BrandLogo size={72}/>
    </Link>
    <nav className="flex flex-1 flex-col gap-2">
        {/* existing four NavLink calls */}
    </nav>
    <form action={logout} className="border-t hairline pt-3">
        <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
            <LogOut size={16} aria-hidden="true"/>
            Выйти{session?.user?.name ? ` (${session.user.name})` : ''}
        </Button>
    </form>
</aside>
```

`NavLink` active classes:

```ts
active
    ? 'bg-white/[.055] text-tx ring-1 ring-cyan/20 shadow-[0_0_20px_rgb(44_230_255_/_0.08)]'
    : 'text-tx-2 hover:bg-white/[.035] hover:text-tx'
```

- [ ] **Step 4: Implement mobile top and bottom navigation**

```tsx
// components/nav/MobileTopBar.tsx
'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {BrandLogo} from '@/components/brand/BrandLogo';

const TITLES: Array<[string, string]> = [
    ['/clients', 'База'],
    ['/leads', 'Новый лид'],
    ['/dashboard', 'Панель'],
    ['/settings', 'Настройки'],
    ['/today', 'Сегодня'],
];

export function MobileTopBar() {
    const pathname = usePathname();
    const title = TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'Штаб';
    return (
        <header className="fixed inset-x-3 top-3 z-40 flex h-16 items-center gap-3 px-4 md:hidden glass">
            <Link href="/today" aria-label="Открыть Сегодня">
                <BrandLogo size={42}/>
            </Link>
            <span className="font-display uppercase tracking-wide">{title}</span>
        </header>
    );
}
```

Restyle `MobileTabBar` as `glass` inset by 12px with rounded corners. Keep `MobileFab` above it at `bottom-24`, but use a glass background with cyan icon/ring/glow rather than a filled cyan surface:

```tsx
className="md:hidden fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full glass text-cyan ring-1 ring-cyan/40 shadow-[0_0_28px_rgb(44_230_255_/_0.24)]"
```

Keep the FAB visible on protected routes; it is a secondary glass action, so it does not compete with the page primary CTA.

- [ ] **Step 5: Update app layout spacing**

```tsx
<div className="min-h-screen">
    <Sidebar/>
    <main className="min-h-screen pb-28 pt-24 md:ml-[280px] md:pb-0 md:pt-0">
        <TopBar/>
        <div className="page-enter mx-auto w-full max-w-[1080px] px-4 py-6 md:px-8 md:py-12">
            {children}
        </div>
    </main>
    <MobileTopBar/>
    <MobileTabBar/>
    <MobileFab/>
</div>
```

- [ ] **Step 6: Run tests and checks**

Run:

```bash
npx tsx --test tests/navigation-contracts.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add app/'(app)'/layout.tsx components/nav tests/navigation-contracts.test.ts
git commit -m "feat: redesign application navigation"
```

---

### Task 5: Redesign authentication screens

**Files:**
- Modify: `app/(auth)/layout.tsx`
- Modify: `app/(auth)/login/page.tsx`
- Modify: `app/(auth)/register/page.tsx`

**Interfaces:**
- Auth behavior and Server Actions remain unchanged.
- Each page contains one H1 and one primary button.
- `BrandLogo` is decorative inside an accessible layout heading context.

- [ ] **Step 1: Add failing auth contracts to `tests/navigation-contracts.test.ts`**

```ts
test('auth screens render the brand logo and strong card', () => {
    for (const file of ['app/(auth)/login/page.tsx', 'app/(auth)/register/page.tsx']) {
        const source = readFileSync(file, 'utf8');
        assert.match(source, /BrandLogo/);
        assert.match(source, /variant="strong"/);
    }
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
npx tsx --test tests/navigation-contracts.test.ts
```

Expected: FAIL because auth pages do not use the logo or strong card.

- [ ] **Step 3: Apply the approved auth composition**

```tsx
// Shared shape inside login/register page
<Card variant="strong" className="p-6 md:p-8">
    <div className="mb-7 flex justify-center">
        <BrandLogo size={76}/>
    </div>
    <p className="section-kicker mb-3 text-center">Тренер у дома</p>
    <h1 className="font-display text-center uppercase text-[32px] leading-none">
        {/* Вход or Завести тренера */}
    </h1>
    {/* existing copy and form */}
</Card>
```

Use `StatusNotice tone="error"` for login errors. Pass `loading` only where current Server Action state exposes pending; do not introduce a new client wrapper solely for loading.

`app/(auth)/layout.tsx` becomes:

```tsx
export default function AuthLayout({children}: {children: React.ReactNode}) {
    return (
        <main className="min-h-screen px-4 py-10 md:grid md:place-items-center">
            <div className="mx-auto w-full max-w-[460px] page-enter">{children}</div>
        </main>
    );
}
```

- [ ] **Step 4: Run tests and checks**

Run:

```bash
npx tsx --test tests/navigation-contracts.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/'(auth)' tests/navigation-contracts.test.ts
git commit -m "feat: redesign authentication screens"
```

---

### Task 6: Redesign Today board with semantic icons

**Files:**
- Create: `tests/trigger-visuals.test.ts`
- Modify: `app/(app)/today/page.tsx`
- Modify: `components/today/TodayBoard.tsx`

**Interfaces:**
- `BoardEntry` carries only `triggerKind`, `priority`, `daysSince`.
- `BoardGroup` carries only `key`, `title`, `entries`.
- Icon selection uses `TRIGGER_GROUP_VISUALS` and `TRIGGER_KIND_VISUALS`.

- [ ] **Step 1: Write failing icon mapping test**

```ts
// tests/trigger-visuals.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {TRIGGER_GROUP_VISUALS, TRIGGER_KIND_VISUALS} from '@/components/brand/semantic-icons';

test('all trigger groups and kinds have explicit visuals', () => {
    assert.deepEqual(Object.keys(TRIGGER_GROUP_VISUALS).sort(), ['high', 'low', 'medium', 'silent']);
    assert.deepEqual(Object.keys(TRIGGER_KIND_VISUALS).sort(), [
        'active_stale',
        'cooled_stale',
        'lead_stale',
        'silent',
        'vacation_no_prebook',
    ]);
});

test('TodayBoard consumes semantic mappings instead of presentation data', () => {
    const source = readFileSync('components/today/TodayBoard.tsx', 'utf8');
    assert.match(source, /TRIGGER_GROUP_VISUALS/);
    assert.match(source, /TRIGGER_KIND_VISUALS/);
    assert.match(source, /IconBadge/);
});
```

- [ ] **Step 2: Run test**

Run:

```bash
npx tsx --test tests/trigger-visuals.test.ts
```

Expected: FAIL because `TodayBoard` does not yet consume the mappings.

- [ ] **Step 3: Replace page header**

```tsx
<PageHeader
    title="Сегодня"
    kicker="Пятничный ритуал"
    meta={total > 0 ? `${total} сигналов` : 'База под контролем'}
/>
```

Keep the existing empty-state copy. Add `CircleCheck` to `EmptyState` only through its new `icon` prop.

- [ ] **Step 4: Render group and trigger semantics**

Inside each group:

```tsx
const GroupIcon = TRIGGER_GROUP_VISUALS[g.key].icon;
const groupTone = TRIGGER_GROUP_VISUALS[g.key].tone;

<h2 className="mb-4 flex items-center gap-3">
    <IconBadge icon={GroupIcon} tone={groupTone}/>
    <span className="font-display uppercase text-[18px]">{g.title}</span>
    <span className="font-mono text-[12px] text-tx-3">{g.entries.length}</span>
</h2>
```

Inside each row:

```tsx
const visual = TRIGGER_KIND_VISUALS[e.triggerKind];

<IconBadge icon={visual.icon} tone={visual.tone}/>
```

Replace quick touch text with:

```tsx
<button aria-label={`Отметить сообщением: ${e.name}`} ...>
    <Check size={15} aria-hidden="true"/>
    <span>Отметить</span>
</button>
```

Use `Button loading={copyPending}` for export. Keep the existing optimistic removal, clipboard behavior, modal and text.

- [ ] **Step 5: Use branded surfaces**

- Toolbar: `glass rounded-2xl p-3 md:p-4`.
- Group container: `glass glass-strong overflow-hidden`.
- Rows: `surface-row first:border-t-0 px-4 py-4 md:px-5`.
- Toast: `StatusNotice tone="success"` inside the existing fixed container.
- Modal actions: exactly one primary action.

- [ ] **Step 6: Run focused and project checks**

Run:

```bash
npx tsx --test tests/trigger-visuals.test.ts tests/semantic-contracts.test.ts tests/no-emoji-source.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add app/'(app)'/today components/today tests/trigger-visuals.test.ts
git commit -m "feat: redesign today board"
```

---

### Task 7: Redesign clients, client forms and touch history

**Files:**
- Create: `tests/client-visuals.test.ts`
- Modify: `app/(app)/clients/page.tsx`
- Modify: `app/(app)/clients/new/page.tsx`
- Modify: `app/(app)/clients/[id]/page.tsx`
- Modify: `app/(app)/leads/new/page.tsx`
- Modify: `components/client/ClientsList.tsx`
- Modify: `components/client/ClientFilters.tsx`
- Modify: `components/client/ClientForm.tsx`
- Modify: `components/touch/TouchActions.tsx`
- Modify: `components/touch/TouchHistory.tsx`

**Interfaces:**
- Profile representation is `Badge dot tone + plain label`.
- Touch representation is `TOUCH_TYPE_ICONS[type] + TOUCH_TYPE_LABELS[type]`.
- Forms continue using existing Server Actions and validation results.
- `ClientForm` adds `submitVariant?: 'primary' | 'secondary'`, defaulting to `primary`.

- [ ] **Step 1: Write failing client visual contracts**

```ts
// tests/client-visuals.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {TOUCH_TYPE_ICONS} from '@/components/brand/semantic-icons';

test('all touch types have Lucide mappings', () => {
    assert.deepEqual(Object.keys(TOUCH_TYPE_ICONS).sort(), ['call', 'message', 'other', 'training']);
});

test('client pages use shared page headers and notices', () => {
    assert.match(readFileSync('app/(app)/clients/page.tsx', 'utf8'), /PageHeader/);
    assert.match(readFileSync('app/(app)/clients\/[id]\/page.tsx', 'utf8'), /StatusNotice/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npx tsx --test tests/client-visuals.test.ts
```

Expected: FAIL because client pages do not yet use shared components.

- [ ] **Step 3: Redesign list page and filters**

Use:

```tsx
<PageHeader
    title="База"
    kicker="Клиенты и лиды"
    meta={`${clients.length} записей`}
    action={
        <Link href="/clients/new">
            <Button variant="primary"><Plus size={16}/>Клиент</Button>
        </Link>
    }
/>
```

Wrap filters in `Card variant="strong"`. Add `Search` inside a local relative wrapper without changing `Input` API. Render profile filters and list profiles as:

```tsx
<Badge tone={profileTone[p]} dot>{PROFILE_LABELS[p]}</Badge>
```

Wrap desktop table in `glass glass-strong overflow-hidden`; mobile cards use `Card`.

- [ ] **Step 4: Redesign client and lead forms**

- Replace page H1 blocks in `/clients/new` and `/leads/new` with `PageHeader`.
- Use `Card variant="strong"`.
- Change `ClientForm` submit button to `loading={pending}`.
- Add `submitVariant = 'primary'` to `ClientForm` props and pass it to `Button`.
- `/clients/new` keeps the default primary submit.
- `/clients/[id]` passes `submitVariant="secondary"` because `TouchActions` is the single primary CTA on that screen.
- Replace inline generic errors with `StatusNotice tone="error"`.
- Keep every field name, default value and validation contract unchanged.

- [ ] **Step 5: Redesign client detail and touches**

Use `PageHeader` with the existing `TouchActions` as action and plain-text metadata below the H1.

Replace notices:

```tsx
<StatusNotice tone="warning" title="Нужен личный факт">
    Без личного факта сообщение не соберётся. Допиши — и клиент попадёт в экспорт.
</StatusNotice>
```

```tsx
<StatusNotice tone="info" title="Клиент удалён">
    Редактирование сохранит правки, но клиент не появится в списке без восстановления.
</StatusNotice>
```

In `TouchHistory`:

```tsx
const Icon = TOUCH_TYPE_ICONS[t.type];
<span className="flex items-center gap-2 text-tx">
    <Icon size={16} className="text-cyan" aria-hidden="true"/>
    {touchTypeLabel(t.type)}
</span>
```

In `TouchActions`, add `MessageCircle` to the opening button and use `Button loading={pending}` for submit.

- [ ] **Step 6: Run tests and checks**

Run:

```bash
npx tsx --test tests/client-visuals.test.ts tests/semantic-contracts.test.ts tests/no-emoji-source.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add app/'(app)'/clients app/'(app)'/leads components/client components/touch tests/client-visuals.test.ts
git commit -m "feat: redesign client workflows"
```

---

### Task 8: Redesign CSV import states

**Files:**
- Create: `tests/import-ui-contracts.test.ts`
- Modify: `app/(app)/clients/import/page.tsx`
- Modify: `components/import/ImportDropzone.tsx`
- Modify: `components/import/ImportErrorList.tsx`
- Modify: `components/import/ImportPreviewTable.tsx`
- Modify: `components/import/ImportReport.tsx`

**Interfaces:**
- Import phase state and Server Actions remain unchanged.
- Idle, parsing, file error, preview, committing and imported states each use shared branded components.

- [ ] **Step 1: Write failing import UI contracts**

```ts
// tests/import-ui-contracts.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

test('import page uses shared page header and has no local page padding', () => {
    const source = readFileSync('app/(app)/clients/import/page.tsx', 'utf8');
    assert.match(source, /PageHeader/);
    assert.doesNotMatch(source, /className="p-6 max-w-3xl/);
});

test('dropzone uses a real upload icon', () => {
    assert.match(readFileSync('components/import/ImportDropzone.tsx', 'utf8'), /Upload/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npx tsx --test tests/import-ui-contracts.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Apply import page composition**

```tsx
<div className="mx-auto max-w-4xl space-y-6">
    <PageHeader
        title="Импорт CSV"
        kicker="Массовое обновление базы"
        meta="До 5000 строк · UTF-8 или Windows-1251"
    />
    {/* existing phase switch */}
</div>
```

Use `StatusNotice tone="info"` for parsing/committing, `tone="error"` for file errors, and `tone="success"` in `ImportReport`.

- [ ] **Step 4: Redesign dropzone and tables**

Dropzone core:

```tsx
<label className={clsx(
    'glass glass-strong flex min-h-64 cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 text-center',
    over ? 'border-cyan bg-cyan/5 shadow-[var(--shadow-glow)]' : 'border-line',
    disabled && 'pointer-events-none opacity-50',
)}>
    <Upload size={34} className="mb-4 text-cyan" aria-hidden="true"/>
    <p className="font-semibold text-tx">Перетащи CSV или выбери файл</p>
    <p className="mt-2 text-[12px] font-mono text-tx-3">15 колонок · до 5000 строк</p>
</label>
```

Wrap preview table in `glass glass-strong overflow-x-auto`; use `StatusNotice` for errors/report; keep all row and commit logic unchanged.

- [ ] **Step 5: Run tests and checks**

Run:

```bash
npx tsx --test tests/import-ui-contracts.test.ts tests/semantic-contracts.test.ts tests/no-emoji-source.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add app/'(app)'/clients/import components/import tests/import-ui-contracts.test.ts
git commit -m "feat: redesign CSV import"
```

---

### Task 9: Redesign dashboard and settings

**Files:**
- Create: `tests/dashboard-settings-contracts.test.ts`
- Modify: `app/(app)/dashboard/page.tsx`
- Modify: `components/dashboard/WeeklyForm.tsx`
- Modify: `components/dashboard/WeeklyHistoryTable.tsx`
- Modify: `components/dashboard/CountersBlock.tsx`
- Modify: `app/(app)/settings/page.tsx`
- Modify: `components/settings/SettingsForms.tsx`

**Interfaces:**
- Dashboard metrics use semantic Lucide icons and existing `NowCounters`.
- Weekly form fields and settings form fields keep exact names and Server Actions.
- Settings save state uses `StatusNotice`/`CircleCheck`.

- [ ] **Step 1: Write failing source contracts**

```ts
// tests/dashboard-settings-contracts.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';

test('dashboard and settings use PageHeader', () => {
    assert.match(readFileSync('app/(app)/dashboard/page.tsx', 'utf8'), /PageHeader/);
    assert.match(readFileSync('app/(app)/settings/page.tsx', 'utf8'), /PageHeader/);
});

test('settings success states use StatusNotice', () => {
    assert.match(readFileSync('components/settings/SettingsForms.tsx', 'utf8'), /StatusNotice/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npx tsx --test tests/dashboard-settings-contracts.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Redesign dashboard page and counters**

Use:

```tsx
<PageHeader
    title="Панель"
    kicker="Неделя и загрузка"
    meta="12 недель истории"
/>
```

Replace first-time block with `StatusNotice tone="info"`.

Refactor `Tile` locally, not into a generic new component:

```tsx
function Tile({value, label, icon: Icon, tone = 'neutral'}: {
    value: number;
    label: string;
    icon: LucideIcon;
    tone?: SemanticTone;
}) {
    return (
        <Card className="p-4 md:p-5">
            <IconBadge icon={Icon} tone={tone}/>
            <div className="mt-5 font-mono text-3xl text-tx">{value}</div>
            <div className="mt-1 text-[13px] text-tx-2">{label}</div>
        </Card>
    );
}
```

Use explicit local mappings:

```tsx
const STATUS_TILES: Array<{key: ClientStatus; label: string; icon: LucideIcon}> = [
    {key: 'active', label: 'Активные', icon: Activity},
    {key: 'prebook', label: 'Предзапись', icon: CalendarCheck2},
    {key: 'cooling', label: 'Остывают', icon: Snowflake},
    {key: 'vacation', label: 'В отпуске', icon: Plane},
    {key: 'lead', label: 'Лиды', icon: UserPlus},
    {key: 'left', label: 'Ушли', icon: UserMinus},
];

const PRIORITY_TILES: Array<{key: GroupKey; label: string}> = [
    {key: 'silent', label: 'Тихие'},
    {key: 'high', label: 'Срочно'},
    {key: 'medium', label: 'Скоро'},
    {key: 'low', label: 'Низкий'},
];
```

For priority cards, read `icon` and `tone` from `TRIGGER_GROUP_VISUALS[p.key]`. No status counting logic changes.

- [ ] **Step 4: Redesign weekly form and history**

- `WeeklyForm` outer surface: `Card variant="strong"`.
- Replace native note textarea with shared `Textarea`.
- Reuse shared `Input` for `NumField` while preserving names/min/default/error.
- Submit with `Button loading={pending}`.
- Wrap history table in `glass glass-strong overflow-x-auto`.
- Keep selected week highlight and links unchanged.

- [ ] **Step 5: Redesign settings**

Use `PageHeader title="Настройки" kicker="Правила Штаба"`.

Split existing forms into two `Card variant="strong"` blocks. Preserve all field names. Replace saved text:

```tsx
{settingsSaved && (
    <StatusNotice tone="success">Настройки сохранены.</StatusNotice>
)}
```

```tsx
{passwordSaved && (
    <StatusNotice tone="success">Пароль изменён.</StatusNotice>
)}
```

Use `loading={settingsPending}` for the only primary settings button and `loading={passwordPending}` for the secondary password button.

- [ ] **Step 6: Run tests and checks**

Run:

```bash
npx tsx --test tests/dashboard-settings-contracts.test.ts tests/no-emoji-source.test.ts lib/settings/validation.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add app/'(app)'/dashboard app/'(app)'/settings components/dashboard components/settings tests/dashboard-settings-contracts.test.ts
git commit -m "feat: redesign dashboard and settings"
```

---

### Task 10: Bring development sanity pages into the same system

**Files:**
- Modify: `app/(app)/dev/triggers-sanity/page.tsx`
- Modify: `app/(app)/dev/export-sanity/page.tsx`
- Modify: `app/(app)/dev/dashboard-sanity/page.tsx`
- Modify: `app/(app)/dev/import-sanity/page.tsx`

**Interfaces:**
- Sanity computation and expected values remain unchanged.
- Visual status uses `CircleCheck`/`CircleAlert` and text.

- [ ] **Step 1: Add failing source contract**

Append to `tests/dashboard-settings-contracts.test.ts`:

```ts
test('sanity pages use semantic status icons', () => {
    for (const file of [
        'app/(app)/dev/triggers-sanity/page.tsx',
        'app/(app)/dev/export-sanity/page.tsx',
        'app/(app)/dev/dashboard-sanity/page.tsx',
        'app/(app)/dev/import-sanity/page.tsx',
    ]) {
        const source = readFileSync(file, 'utf8');
        assert.match(source, /CircleCheck/);
        assert.match(source, /CircleAlert/);
    }
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
npx tsx --test tests/dashboard-settings-contracts.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Apply common sanity layout**

Each page uses:

```tsx
<PageHeader
    title="... sanity"
    kicker="Development only"
    meta={`${passed} / ${rows.length} прошло`}
/>
```

Status cell:

```tsx
{ok
    ? <CircleCheck size={17} className="text-green" aria-label="Пройдено"/>
    : <CircleAlert size={17} className="text-orange" aria-label="Ошибка"/>}
```

Use `glass glass-strong` around tables/cards. Remove local `p-6 max-w-*` wrappers so the app layout owns page spacing.

- [ ] **Step 4: Run tests and checks**

Run:

```bash
npx tsx --test tests/dashboard-settings-contracts.test.ts tests/no-emoji-source.test.ts
npx tsc --noEmit
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/'(app)'/dev tests/dashboard-settings-contracts.test.ts
git commit -m "style: align development sanity pages"
```

---

### Task 11: Update documentation, enforce repository-wide emoji removal and verify end-to-end

**Files:**
- Modify: `tests/no-emoji-source.test.ts`
- Modify: `design-system.md`
- Modify: `README.md`
- Modify: `docs/trainer-guide.md`
- Modify: `mvp-spec.md`
- Modify: `docs/superpowers/specs/*.md`
- Modify: `docs/superpowers/plans/*.md`
- Regenerate: `graphify-out/graph.json`
- Regenerate: `graphify-out/graph.html`
- Regenerate: `graphify-out/GRAPH_REPORT.md`

**Interfaces:**
- Final scanner covers all first-party text files except generated/runtime/vendor directories.
- Documentation describes the actual icon-based UI and CSV compatibility.

- [ ] **Step 1: Broaden the emoji guard and verify RED**

Replace the root configuration and directory traversal in `tests/no-emoji-source.test.ts`:

```ts
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.mjs', '.md', '.json']);
const IGNORED_DIRECTORIES = new Set([
    '.git',
    '.next',
    '.superpowers',
    'node_modules',
    'public',
    'graphify-out',
]);

function collect(path: string): string[] {
    if (statSync(path).isFile()) return TEXT_EXTENSIONS.has(extname(path)) ? [path] : [];
    return readdirSync(path).flatMap((name) => {
        if (IGNORED_DIRECTORIES.has(name)) return [];
        return collect(join(path, name));
    });
}

const ROOTS = ['.'];
```

Run:

```bash
npx tsx --test tests/no-emoji-source.test.ts
```

Expected: FAIL with historical documentation paths.

- [ ] **Step 2: Remove emoji from first-party documentation contextually**

Find all remaining symbols:

```bash
rg -n --pcre2 "[\\x{00A9}\\x{00AE}\\x{203C}\\x{2049}\\x{2122}\\x{2139}\\x{2600}-\\x{27BF}\\x{3030}\\x{303D}\\x{3297}\\x{3299}\\x{FE0F}\\x{1F000}-\\x{1FAFF}]" \
  README.md design-system.md mvp-spec.md docs app components lib tests
```

Apply this semantic replacement table while preserving sentence meaning:

| Previous visual role | Text replacement |
|---|---|
| silent speaker symbol | `тихий` or `silent` |
| red/orange/yellow/green circles | `high`, `medium`, `low`, `health`, or the adjacent Russian label |
| message/phone/training symbols | `Сообщение`, `Звонок`, `Тренировка` |
| success/error dingbats | `Пройдено`, `Ошибка` |
| decorative stars/diamonds/hearts | remove the symbol, keep the label |

Do not rewrite historical architecture decisions; only remove presentation symbols and update statements that explicitly said emoji were retained.

- [ ] **Step 3: Update current documentation to match the implementation**

`design-system.md` must state:

```md
- Emoji запрещены в UI, semantic data, exports и CSV aliases.
- Trigger/touch visuals live in `components/brand/semantic-icons.ts`.
- Brand mark source is `public/favicon.png`; interface rendering is `BrandLogo`.
- Direction B uses `glass-strong`, 22–30px card radii, larger page headings and controlled cyan/violet glow.
```

`README.md` must state:

```md
- `public/favicon.png` is the browser favicon source.
- `components/brand/BrandLogo.tsx` is the UI SVG mark.
- CSV profile values are text-only: `здоровье`, `форма`, `энергия`.
```

`docs/trainer-guide.md` must describe visible icon+text actions without showing emoji.

- [ ] **Step 4: Run the complete automated suite**

Start local infrastructure:

```bash
npm run db:up
npm run db:migrate
```

Run:

```bash
npx tsx --test \
  tests/no-emoji-source.test.ts \
  tests/semantic-contracts.test.ts \
  tests/brand-assets.test.ts \
  tests/ui-primitives.test.tsx \
  tests/navigation-contracts.test.ts \
  tests/trigger-visuals.test.ts \
  tests/client-visuals.test.ts \
  tests/import-ui-contracts.test.ts \
  tests/dashboard-settings-contracts.test.ts \
  lib/settings/validation.test.ts
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all tests pass; typecheck/lint/build exit 0.

- [ ] **Step 5: Run visual verification on desktop and mobile**

Start:

```bash
npm run dev
```

Use the browser verification skill and inspect at 1440x900 and 390x844:

1. `/login` or `/register`: favicon, logo, one H1, one primary CTA.
2. `/today`: empty and populated board, group icons, export modal, toast, quick touch.
3. `/clients`: filters, table, mobile cards, empty state.
4. `/clients/new`, `/leads/new`, `/clients/[id]`: forms, notice, touch modal/history.
5. `/clients/import`: idle, parsing, error, preview and imported states.
6. `/dashboard`: metric cards, weekly form, selected history row.
7. `/settings`: saved states, password form.
8. `/dev/*`: consistent status icons and surfaces.

For every route verify:

- no emoji;
- only one cyan primary CTA;
- no fixed-navigation overlap;
- keyboard focus visible;
- icon labels remain understandable without color;
- reduced-motion mode removes entrance/hover motion;
- no browser console errors.

- [ ] **Step 6: Refresh graph artifacts**

Run:

```bash
graphify update .
```

Expected: `graphify-out/graph.json`, `graphify-out/graph.html` and `graphify-out/GRAPH_REPORT.md` regenerate and include `BrandLogo`, `PageHeader`, `StatusNotice`, `IconBadge`, `MobileTopBar`.

- [ ] **Step 7: Review the final diff**

Run:

```bash
git status --short
git diff --check
git diff --stat
rg -n --pcre2 "[\\x{00A9}\\x{00AE}\\x{203C}\\x{2049}\\x{2122}\\x{2139}\\x{2600}-\\x{27BF}\\x{3030}\\x{303D}\\x{3297}\\x{3299}\\x{FE0F}\\x{1F000}-\\x{1FAFF}]" \
  README.md design-system.md mvp-spec.md docs app components lib tests
```

Expected:

- no unexpected untracked `.superpowers/` files;
- `git diff --check` has no output;
- final `rg` has no output;
- every changed line traces to the approved redesign.

- [ ] **Step 8: Commit final documentation and verification artifacts**

```bash
git add README.md design-system.md mvp-spec.md docs tests/no-emoji-source.test.ts
git add graphify-out/graph.json graphify-out/graph.html graphify-out/GRAPH_REPORT.md
git commit -m "docs: align project with brand redesign"
```

If `graphify-out/*` is ignored or intentionally untracked, omit it from `git add` and report that the artifacts were refreshed locally.
