# Graph Report - .  (2026-06-19)

## Corpus Check
- Corpus is ~42,606 words - fits in a single context window. You may not need a graph.

## Summary
- 403 nodes · 688 edges · 28 communities (18 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.81)
- Token cost: 270,336 input · 14,231 output

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

## God Nodes (most connected - your core abstractions)
1. `graphify pipeline` - 19 edges
2. `compilerOptions` - 16 edges
3. `Button` - 11 edges
4. `scripts` - 11 edges
5. `db` - 10 edges
6. `Extraction subagent prompt template` - 10 edges
7. `Shtab MVP Design Spec` - 10 edges
8. `Step 6 - Generate Obsidian vault and HTML` - 9 edges
9. `Design System: Штаб` - 9 edges
10. `MVP Specification — Штаб` - 9 edges

## Surprising Connections (you probably didn't know these)
- `LoginPage()` --calls--> `trainersExist()`  [EXTRACTED]
  app/(auth)/login/page.tsx → lib/auth/register.ts
- `RegisterPage()` --calls--> `trainersExist()`  [EXTRACTED]
  app/(auth)/register/page.tsx → lib/auth/register.ts
- `ClientPage()` --calls--> `profileLabel()`  [EXTRACTED]
  app/(app)/clients/[id]/page.tsx → lib/clients/labels.ts
- `ClientPage()` --calls--> `sourceLabel()`  [EXTRACTED]
  app/(app)/clients/[id]/page.tsx → lib/clients/labels.ts
- `ClientPage()` --calls--> `statusLabel()`  [EXTRACTED]
  app/(app)/clients/[id]/page.tsx → lib/clients/labels.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Full graphify pipeline (steps 0-9)** — graphify_skill_step0_github, graphify_skill_step1_install, graphify_skill_step2_detect, graphify_skill_step3_extract, graphify_skill_step4_build, graphify_skill_step5_label, graphify_skill_step6_export, graphify_skill_step9_manifest [EXTRACTED 1.00]
- **Three-part extraction (AST + semantic + merge)** — graphify_skill_part_a_ast, graphify_skill_part_b_semantic, graphify_skill_part_c_merge [EXTRACTED 1.00]
- **Export format ecosystem** — references_exports_wiki, references_exports_neo4j, references_exports_falkordb, references_exports_svg, references_exports_graphml, references_exports_mcp [EXTRACTED 0.95]
- **Stage 1→2→3→4 plan progression** — plans_stage1, plans_stage2, plans_stage3, plans_stage4 [EXTRACTED 1.00]
- **Design spec derives from mvp+design+agents** — specs_shtab_mvp_design, mvp_spec, design_system, agents_nextjs_rules [EXTRACTED 1.00]
- **Export safety invariant chain** — specs_buildClaudeExport, concept_invariant_no_contact, concept_dev_export_sanity [EXTRACTED 1.00]

## Communities (28 total, 10 thin omitted)

### Community 0 - "Client UI Forms & Lists"
Cohesion: 0.07
Nodes (44): ClientForm(), Props, profileTone, statusTone, ActionResult, collectFieldErrors(), createClient(), createLead() (+36 more)

### Community 1 - "Auth, DB Schema & Client Queries"
Cohesion: 0.08
Nodes (34): {handlers, signIn, signOut, auth}, ListClientsFilter, db, Client, ClientProfile, clients, ClientSource, NewClient (+26 more)

### Community 2 - "Project Docs & Conventions"
Cohesion: 0.06
Nodes (47): Next.js 16 agent rules, Goal-Driven Execution, Claude behavioral guidelines, Simplicity First, Surgical Changes, Think Before Coding, /dev/export-sanity page, Пятничный ритуал (+39 more)

### Community 3 - "Graphify Pipeline Skill"
Cohesion: 0.05
Nodes (48): graphify skill registration, Community detection (cluster), --directed mode (DiGraph), Step B0 - Check extraction cache, Gemini backend for semantic extraction, general-purpose subagent type, God Nodes, graph.html interactive visualization (+40 more)

### Community 4 - "Claude Export Pipeline"
Cohesion: 0.09
Nodes (27): ClientStatus, TrainerSettings, buildExportForSelection(), requireTrainerId(), buildClaudeExport(), BuildClaudeExportResult, ClientForExport, ACTIVE_STALE_MEDIUM (+19 more)

### Community 5 - "App Shell & Auth Bootstrap"
Cohesion: 0.11
Nodes (19): registerFirstTrainer(), RegisterResult, RegisterSchema, trainersExist(), DEFAULT_TRAINER_SETTINGS, LoginPage(), MobileFab(), MobileTabBar() (+11 more)

### Community 6 - "Dev Dependencies (package.json)"
Cohesion: 0.07
Nodes (28): devDependencies, dotenv, drizzle-kit, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, tsx (+20 more)

### Community 7 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 8 - "Graphify Extraction Rules"
Cohesion: 0.14
Nodes (16): EXTRACTED/INFERRED/AMBIGUOUS audit trail, Fast path - existing graph query, calls edge direction rule, Confidence score rubric (1.0/0.95/0.85/0.75/0.65/0.55), file_type enum (code|document|paper|image|rationale|concept), YAML frontmatter propagation, Hyperedges (3+ node group relationships), Node ID format rules (+8 more)

### Community 9 - "Clients, Dashboard & Settings Pages"
Cohesion: 0.20
Nodes (8): ClientFilters(), ClientsList(), ClientsPage(), parseList(), SP, listClients(), EmptyState(), Props

### Community 10 - "Runtime Dependencies (package.json)"
Cohesion: 0.15
Nodes (13): dependencies, argon2, @auth/drizzle-adapter, clsx, drizzle-orm, lucide-react, next, next-auth (+5 more)

### Community 11 - "Root Layout & Fonts"
Cohesion: 0.40
Nodes (3): jetbrains, metadata, nunito

### Community 12 - "Edge Auth Proxy"
Cohesion: 0.50
Nodes (3): authEdgeConfig, { auth }, config

### Community 13 - "NextAuth Type Augmentation"
Cohesion: 0.50
Nodes (3): JWT, Session, User

### Community 14 - "Graphify Multi-Repo Merge"
Cohesion: 0.67
Nodes (3): graphify merge-graphs command, Monorepo subfolder merge, Multi-repo cross-repo merge

## Knowledge Gaps
- **157 isolated node(s):** `SP`, `TODAY`, `nunito`, `jetbrains`, `metadata` (+152 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `graphify pipeline` connect `Graphify Pipeline Skill` to `Graphify Extraction Rules`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `Button` connect `App Shell & Auth Bootstrap` to `Client UI Forms & Lists`, `Clients, Dashboard & Settings Pages`, `Auth, DB Schema & Client Queries`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `Fast path - existing graph query` connect `Graphify Extraction Rules` to `Graphify Pipeline Skill`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `SP`, `TODAY`, `nunito` to the rest of the system?**
  _172 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Client UI Forms & Lists` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Auth, DB Schema & Client Queries` be split into smaller, more focused modules?**
  _Cohesion score 0.08078431372549019 - nodes in this community are weakly interconnected._
- **Should `Project Docs & Conventions` be split into smaller, more focused modules?**
  _Cohesion score 0.057624113475177305 - nodes in this community are weakly interconnected._