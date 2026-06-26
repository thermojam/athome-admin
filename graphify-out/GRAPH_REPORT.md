# Graph Report - brand-book-redesign  (2026-06-26)

## Corpus Check
- 145 files · ~74,199 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 935 nodes · 1505 edges · 77 communities (60 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8268015f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Client UI Forms & Lists|Client UI Forms & Lists]]
- [[_COMMUNITY_Auth, DB Schema & Client Queries|Auth, DB Schema & Client Queries]]
- [[_COMMUNITY_Project Docs & Conventions|Project Docs & Conventions]]
- [[_COMMUNITY_Graphify Pipeline Skill|Graphify Pipeline Skill]]
- [[_COMMUNITY_Claude Export Pipeline|Claude Export Pipeline]]
- [[_COMMUNITY_App Shell & Auth Bootstrap|App Shell & Auth Bootstrap]]
- [[_COMMUNITY_Dev Dependencies (package.json)|Dev Dependencies (package.json)]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Graphify Extraction Rules|Graphify Extraction Rules]]
- [[_COMMUNITY_Clients, Dashboard & Settings Pages|Clients, Dashboard & Settings Pages]]
- [[_COMMUNITY_Runtime Dependencies (package.json)|Runtime Dependencies (package.json)]]
- [[_COMMUNITY_Root Layout & Fonts|Root Layout & Fonts]]
- [[_COMMUNITY_Edge Auth Proxy|Edge Auth Proxy]]
- [[_COMMUNITY_NextAuth Type Augmentation|NextAuth Type Augmentation]]
- [[_COMMUNITY_Graphify Multi-Repo Merge|Graphify Multi-Repo Merge]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Graphify Deep Mode|Graphify Deep Mode]]
- [[_COMMUNITY_NextAuth API Route|NextAuth API Route]]
- [[_COMMUNITY_File Icon (boilerplate)|File Icon (boilerplate)]]
- [[_COMMUNITY_Globe Icon (boilerplate)|Globe Icon (boilerplate)]]
- [[_COMMUNITY_Next.js Logo (boilerplate)|Next.js Logo (boilerplate)]]
- [[_COMMUNITY_Vercel Logo (boilerplate)|Vercel Logo (boilerplate)]]
- [[_COMMUNITY_Window Icon (boilerplate)|Window Icon (boilerplate)]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]

## God Nodes (most connected - your core abstractions)
1. `requireTrainerId()` - 22 edges
2. `graphify pipeline` - 19 edges
3. `Этап 6 — Панель + weekly_stats: Implementation Plan` - 18 edges
4. `Этап 1: Фундамент — Implementation Plan` - 17 edges
5. `Этап 5 — Импорт CSV: Implementation Plan` - 17 edges
6. `Button` - 16 edges
7. `db` - 16 edges
8. `compilerOptions` - 16 edges
9. `Этап 2: CRUD клиентов — Implementation Plan` - 16 edges
10. `Этап 4: Касания + экспорт для Claude — Implementation Plan` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Simplicity First` --semantically_similar_to--> `Без автотестов — sanity pages only`  [INFERRED] [semantically similar]
  CLAUDE.md → docs/superpowers/specs/2026-06-15-shtab-mvp-design.md
- `DashboardPage()` --calls--> `requireTrainerId()`  [EXTRACTED]
  app/(app)/dashboard/page.tsx → lib/auth/require-trainer.ts
- `DashboardPage()` --calls--> `getNowCounters()`  [EXTRACTED]
  app/(app)/dashboard/page.tsx → lib/weekly/counters.ts
- `DashboardSanityPage()` --calls--> `runSanityCases()`  [EXTRACTED]
  app/(app)/dev/dashboard-sanity/page.tsx → lib/weekly/sanity-cases.ts
- `SettingsPage()` --calls--> `requireTrainerId()`  [EXTRACTED]
  app/(app)/settings/page.tsx → lib/auth/require-trainer.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Full graphify pipeline (steps 0-9)** — graphify_skill_step0_github, graphify_skill_step1_install, graphify_skill_step2_detect, graphify_skill_step3_extract, graphify_skill_step4_build, graphify_skill_step5_label, graphify_skill_step6_export, graphify_skill_step9_manifest [EXTRACTED 1.00]
- **Three-part extraction (AST + semantic + merge)** — graphify_skill_part_a_ast, graphify_skill_part_b_semantic, graphify_skill_part_c_merge [EXTRACTED 1.00]
- **Export format ecosystem** — references_exports_wiki, references_exports_neo4j, references_exports_falkordb, references_exports_svg, references_exports_graphml, references_exports_mcp [EXTRACTED 0.95]
- **Stage 1→2→3→4 plan progression** — plans_stage1, plans_stage2, plans_stage3, plans_stage4 [EXTRACTED 1.00]
- **Design spec derives from mvp+design+agents** — specs_shtab_mvp_design, mvp_spec, design_system, agents_nextjs_rules [EXTRACTED 1.00]
- **Export safety invariant chain** — specs_buildClaudeExport, concept_invariant_no_contact, concept_dev_export_sanity [EXTRACTED 1.00]

## Communities (77 total, 17 thin omitted)

### Community 0 - "Client UI Forms & Lists"
Cohesion: 0.14
Nodes (18): ClientFilters(), profileTone, ClientsList(), profileTone, statusTone, PROFILE_LABELS, STATUS_LABELS, ClientsPage() (+10 more)

### Community 1 - "Auth, DB Schema & Client Queries"
Cohesion: 0.11
Nodes (21): ListClientsFilter, Client, clients, ClientSource, NewClient, NewTouch, NewTrainer, NewWeeklyStat (+13 more)

### Community 2 - "Project Docs & Conventions"
Cohesion: 0.20
Nodes (10): Брендбук «Тренер у дома» v2.0, Голос пустых состояний, Glass card recipe, Один cyan-CTA на экран, Palette (cyan, violet, green, pink, orange), Typography (Gerhaus, Nunito, JetBrains Mono), Gerhaus display font, Public fonts README (Gerhaus instructions) (+2 more)

### Community 3 - "Graphify Pipeline Skill"
Cohesion: 0.17
Nodes (12): Community detection (cluster), --directed mode (DiGraph), God Nodes, graph.json output, GRAPH_REPORT.md output, Step 2.5 - Video and audio transcription, Step 4 - Build graph, cluster, analyze, Surprising Connections (+4 more)

### Community 4 - "Claude Export Pipeline"
Cohesion: 0.06
Nodes (52): {handlers, signIn, signOut, auth}, SemanticTone, TOUCH_TYPE_ICONS, TRIGGER_GROUP_VISUALS, TRIGGER_KIND_VISUALS, CountersBlock(), PRIORITY_TILES, STATUS_TILES (+44 more)

### Community 5 - "App Shell & Auth Bootstrap"
Cohesion: 0.06
Nodes (43): registerFirstTrainer(), RegisterResult, RegisterSchema, trainersExist(), BrandLogo(), Props, DEFAULT_TRAINER_SETTINGS, TrainerSettings (+35 more)

### Community 6 - "Dev Dependencies (package.json)"
Cohesion: 0.05
Nodes (41): dependencies, argon2, @auth/drizzle-adapter, clsx, drizzle-orm, lucide-react, next, next-auth (+33 more)

### Community 7 - "TypeScript Config"
Cohesion: 0.06
Nodes (33): 10. Проверка, 11. Критерии готовности, 1. Цель, 2.1. Логотип, 2.2. Полное удаление emoji, 2.3. Семантические замены, 2. Утверждённые решения, 3.1. Палитра (+25 more)

### Community 8 - "Graphify Extraction Rules"
Cohesion: 0.12
Nodes (18): EXTRACTED/INFERRED/AMBIGUOUS audit trail, Fast path - existing graph query, general-purpose subagent type, Step B2 - Parallel subagent dispatch, calls edge direction rule, Confidence score rubric (1.0/0.95/0.85/0.75/0.65/0.55), file_type enum (code|document|paper|image|rationale|concept), YAML frontmatter propagation (+10 more)

### Community 9 - "Clients, Dashboard & Settings Pages"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 10 - "Runtime Dependencies (package.json)"
Cohesion: 0.09
Nodes (38): commitImport(), CommitResult, previewImport(), PreviewResult, TxLike, coerceBool(), coerceDate(), coerceEnum() (+30 more)

### Community 11 - "Root Layout & Fonts"
Cohesion: 0.40
Nodes (3): jetbrains, metadata, nunito

### Community 12 - "Edge Auth Proxy"
Cohesion: 0.50
Nodes (3): authEdgeConfig, {auth}, config

### Community 13 - "NextAuth Type Augmentation"
Cohesion: 0.50
Nodes (3): JWT, Session, User

### Community 14 - "Graphify Multi-Repo Merge"
Cohesion: 0.67
Nodes (3): graphify merge-graphs command, Monorepo subfolder merge, Multi-repo cross-repo merge

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (16): requireTrainerId(), collectFieldErrors(), createClient(), createLead(), softDeleteClient(), updateClient(), SettingsPage(), ClientCreateInput (+8 more)

### Community 29 - "Community 29"
Cohesion: 0.05
Nodes (39): 10. Что не делаем (защита scope), 1. Архитектура и стек, 2. Схема данных (Drizzle), 3. Триггеры (ядро системы), 4. Экспорт для Claude и UI-каркас, 5. CSV-импорт, 6. Безопасность, 7. Этапы реализации (вертикальные срезы — подход A) (+31 more)

### Community 30 - "Community 30"
Cohesion: 0.09
Nodes (26): DashboardPage(), SP, DashboardSanityPage(), NUMERIC_FIELDS, Props, WeeklyForm(), WeeklyHistoryTable(), WeeklyStat (+18 more)

### Community 31 - "Community 31"
Cohesion: 0.08
Nodes (23): 1. Зависимости, 2. ENV, 3. Postgres, 4. Dev-сервер, Acceptance — конец этапа 1, File map, Task 0: Сверить с docs Next.js 16, Task 10: Server action register с гейтом «trainers пуст» (+15 more)

### Community 32 - "Community 32"
Cohesion: 0.09
Nodes (21): 10. Перспективы доработки, 11. Что не стоит добавлять без отдельного решения, 12. Критерий, что MVP работает, 1. Быстрый старт, 2. Основной еженедельный сценарий, 3. Экран «Сегодня», 4. База клиентов, 5. Импорт CSV (+13 more)

### Community 33 - "Community 33"
Cohesion: 0.09
Nodes (21): 10. Известные риски, 11. Связь с предыдущими этапами, 12. Что после Этапа 5, 1. Цель и acceptance criteria, 2. Решения, принятые в brainstorming, 3. Архитектура — модули и границы, 4.1 `decodeFile(buf: ArrayBuffer): string`, 4.2 `parseCsvText(text: string): {rows: RawRow[]} | {fileError: string}` (+13 more)

### Community 34 - "Community 34"
Cohesion: 0.10
Nodes (19): 10. Навигация, 11. Технический долг — `requireTrainerId` рефакторинг, 12. Что вне scope, 13. Известные риски, 14. Связь с предыдущими этапами, 15. Что после Этапа 6, 1. Цель и acceptance criteria, 2. Решения, принятые в brainstorming (+11 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (18): Acceptance checklist (Definition of Done), File Structure, Notes for the executor, Task 10: components/dashboard/CountersBlock.tsx, Task 11: components/dashboard/WeeklyForm.tsx, Task 12: components/dashboard/WeeklyHistoryTable.tsx, Task 13: app/(app)/dashboard/page.tsx — server component, Task 14: Ручная верификация (+10 more)

### Community 36 - "Community 36"
Cohesion: 0.18
Nodes (11): ClientForm(), Props, ActionResult, SOURCE_LABELS, CLIENT_SOURCES, Card(), Props, Props (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.11
Nodes (17): Acceptance checklist (Definition of Done), File Structure, Notes for the executor, Task 10: ImportPreviewTable, ImportErrorList, ImportReport, Task 11: app/(app)/clients/import/page.tsx — UI flow, Task 12: CTA «Импортируй таблицу» на пустом /clients, Task 13: Ручная верификация на реальном CSV, Task 1: lib/csv/synonyms.ts — канонические заголовки и словари значений (+9 more)

### Community 38 - "Community 38"
Cohesion: 0.12
Nodes (16): Acceptance — конец этапа 2, File map, Task 10: ClientsList и ClientFilters — список с поиском и фильтрами, Task 11: `/clients` — реальный список вместо заглушки, Task 12: `/leads/new` — быстрая форма лида, Task 13: TopBar + MobileFab с «+ Лид» CTA, Task 1: Расширить схему БД таблицей clients, Task 2: Словари лейблов profile/status/source (+8 more)

### Community 39 - "Community 39"
Cohesion: 0.12
Nodes (16): Definition of Done Этапа 4, File map, Task 10: История касаний — query + компонент, Task 11: TouchActions — кнопка «Отметить касание» с модалкой, Task 12: Подключить TouchActions и TouchHistory к `/clients/[id]`, Task 13: Финальная проверка пятничного ритуала, Task 1: Zod-схема касания + server action `recordTouch`, Task 2: Лейблы типов касаний (+8 more)

### Community 40 - "Community 40"
Cohesion: 0.13
Nodes (15): Core-фичи (5, оценка: 2–3 недели вечерами с AI), Flow 1 — Вход → первая ценность (≤10 минут), Flow 2 — Пятничный ритуал (основной, еженедельный), Flow 3 — Новый лид (с ресепшна/QR/Авито, вручную в v1), Flow 4 — Критический сценарий: «тихая потеря», MVP-спецификация: «Штаб» — админка тренера, User flows, V2 (после того, как ритуал прожил месяц в проде) (+7 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (13): Part A - Structural extraction for code files, Part B - Semantic extraction (parallel subagents), Part C - Merge AST + semantic into final extraction, Step 0 - GitHub repos and multi-path merge (only if a URL or several paths), Step 1 - Ensure graphify is installed, Step 2.5 - Video and audio (only if video files detected), Step 3 - Extract entities and relationships, Step 4 - Build graph, cluster, analyze, generate outputs (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.15
Nodes (12): Acceptance — конец этапа 3, File map, Task 1: Таблица touches в схеме, Task 2: computeTrigger — чистая функция, Task 3: SQL-запрос listClientsWithLastTouch, Task 4: Группировка и сортировка триггеров, Task 5: TriggerRow и TodayList компоненты, Task 6: `/today` — реальный экран триггеров (+4 more)

### Community 43 - "Community 43"
Cohesion: 0.12
Nodes (16): Brand Book Redesign Implementation Plan, File Map, Global Constraints, Task 10: Bring development sanity pages into the same system, Task 11: Update documentation, enforce repository-wide emoji removal and verify end-to-end, Task 1: Remove emoji from semantic data and add source guards, Task 2: Add brand assets, semantic icon mappings and global visual tokens, Task 3: Upgrade UI primitives and shared page components (+8 more)

### Community 44 - "Community 44"
Cohesion: 0.19
Nodes (11): changeTrainerPassword(), collectFieldErrors(), SettingsActionResult, updateTrainerSettings(), validSettings, PasswordChangeInput, PasswordChangeSchema, RawTrainerSettingsFormSchema (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (8): /dev/export-sanity page, Пятничный ритуал, Инвариант: контакта нет в экспорте, Quick-touch с useOptimistic, Касание (touch), ERD: trainers/clients/touches/weekly_stats, Этап 4: Касания + экспорт — Plan, buildClaudeExport with narrow type

### Community 46 - "Community 46"
Cohesion: 0.20
Nodes (9): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Usage (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.22
Nodes (10): graphify skill registration, graphify pipeline, Step 0 - GitHub clone, Step 1 - Ensure graphify installed, Step 9 - Save manifest, cost, cleanup, report, Step 2 - Detect files, /graphify add <url>, graphify.ingest module (+2 more)

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (9): Tailwind: каркас конфига для шага M, Движение (из брендбука, 1:1), Дизайн-система: «Штаб» — админка тренера, Компоненты, Палитра (из брендбука, 1:1), Пустые состояния и ошибки (голос §11: прямо, тепло, без сюсюканья), Радиусы и стекло (адаптация), Сетка и отступы (+1 more)

### Community 49 - "Community 49"
Cohesion: 0.38
Nodes (7): Step B0 - Check extraction cache, Gemini backend for semantic extraction, Part A - AST structural extraction, Part B - Semantic extraction via subagents, Part C - Merge AST + semantic, Step 3 - Extraction (AST + semantic), Post-commit auto-rebuild hook

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 52 - "Community 52"
Cohesion: 0.25
Nodes (8): graph.html interactive visualization, Step 6 - Generate Obsidian vault and HTML, Token reduction benchmark, FalkorDB export and push, GraphML export, Neo4j export and push, SVG export, Wiki export

### Community 53 - "Community 53"
Cohesion: 0.25
Nodes (7): Запуск, Полезные команды, Стек, Структура, Чтобы сбросить базу, Шрифты, Штаб — админка тренера

### Community 54 - "Community 54"
Cohesion: 0.21
Nodes (12): Next.js 16 agent rules, Tailwind 4 theme tokens, 🔇 Тихий — страховка-приоритет 45+ дней, Этап 1: Фундамент — Plan, Этап 2: CRUD клиентов — Plan, Этап 3: Триггеры + Сегодня — Plan, Tech stack: Next.js 16 + React 19 + Drizzle + Auth.js v5, computeTrigger pure function (+4 more)

### Community 55 - "Community 55"
Cohesion: 0.54
Nodes (6): profileLabel(), sourceLabel(), statusLabel(), getClient(), ClientPage(), listTouchesForClient()

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (6): Goal-Driven Execution, Claude behavioral guidelines, Simplicity First, Surgical Changes, Think Before Coding, Без автотестов — sanity pages only

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (5): 152-ФЗ ПДн mitigations, 5 Core Features, Neon Postgres (prod) / Docker (local), Никогда: автоотправка сообщений, last_contact НЕ хранится — вычисляется

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (5): Global Constraints, Stage 7 Settings Implementation Plan, Task 1: Validation, Task 2: Server Actions, Task 3: `/settings` UI

### Community 59 - "Community 59"
Cohesion: 0.33
Nodes (6): Debounce window for watcher, --watch background folder watcher, build_merge (preserves edge direction), graph_diff after update, --update incremental re-extraction, save_manifest

### Community 60 - "Community 60"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 61 - "Community 61"
Cohesion: 0.50
Nodes (3): Gerhaus (заголовки), Nunito и JetBrains Mono, Шрифты «Штаба»

### Community 62 - "Community 62"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 63 - "Community 63"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 64 - "Community 64"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 67 - "Community 67"
Cohesion: 0.33
Nodes (4): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution

### Community 70 - "Community 70"
Cohesion: 0.40
Nodes (3): IGNORED_DIRECTORIES, ROOTS, TEXT_EXTENSIONS

## Knowledge Gaps
- **492 isolated node(s):** `Phase`, `SP`, `SP`, `CaseResult`, `TODAY` (+487 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `graphify pipeline` connect `Community 47` to `Graphify Pipeline Skill`, `Graphify Extraction Rules`, `Community 41`, `Community 46`, `Community 49`, `Community 52`, `Community 59`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `PageHeader()` connect `Claude Export Pipeline` to `Client UI Forms & Lists`, `Community 36`, `App Shell & Auth Bootstrap`, `Runtime Dependencies (package.json)`, `Community 55`, `Community 30`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `requireTrainerId()` connect `Community 28` to `Auth, DB Schema & Client Queries`, `Claude Export Pipeline`, `Runtime Dependencies (package.json)`, `Community 44`, `Community 30`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `Phase`, `SP`, `SP` to the rest of the system?**
  _507 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Client UI Forms & Lists` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Auth, DB Schema & Client Queries` be split into smaller, more focused modules?**
  _Cohesion score 0.11494252873563218 - nodes in this community are weakly interconnected._
- **Should `Claude Export Pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.057512797350195724 - nodes in this community are weakly interconnected._