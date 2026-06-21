# Stage 7 Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/settings` placeholder with prompt-template editing, trigger-threshold editing, and password change for the current trainer.

**Architecture:** Keep `trainers.settings` as the single storage point; no schema migration. Add pure zod validation for settings/password inputs, thin authenticated server actions, and one client form component rendered by the server `/settings` page.

**Tech Stack:** Next.js 16 App Router, React Server/Client Components, Server Actions, Drizzle, zod, argon2.

## Global Constraints

- Match existing UI style: `glass`, `Input`, `Textarea`, `Button`, compact mobile-first forms.
- Every server action must call `requireTrainerId()`.
- Do not change trigger behavior beyond reading saved threshold values.
- Do not touch unrelated dirty files: `docker-compose.yml`, `graphify-out/`.
- Read relevant `node_modules/next/dist/docs/` guides before Next.js-specific changes.

---

### Task 1: Validation

**Files:**
- Create: `lib/settings/validation.test.ts`
- Create: `lib/zod/settings.ts`

**Interfaces:**
- Produces: `TrainerSettingsFormSchema`, `PasswordChangeSchema`, `SettingsFormInput`, `PasswordChangeInput`.

- [ ] **Step 1: Write failing tests for settings and password validation.**
- [ ] **Step 2: Run `npx tsx --test lib/settings/validation.test.ts` and verify RED.**
- [ ] **Step 3: Implement minimal zod schemas.**
- [ ] **Step 4: Re-run the test and verify GREEN.**

### Task 2: Server Actions

**Files:**
- Create: `lib/settings/actions.ts`

**Interfaces:**
- Consumes: schemas from `lib/zod/settings.ts`, `requireTrainerId()`, `hashPassword()`, `verifyPassword()`.
- Produces: `updateTrainerSettings(formData)`, `changeTrainerPassword(formData)`.

- [ ] **Step 1: Add authenticated action to update `trainers.settings`.**
- [ ] **Step 2: Add authenticated action to verify current password and update `passwordHash`.**
- [ ] **Step 3: Revalidate `/settings`, `/today`, and `/dashboard` after settings changes.**

### Task 3: `/settings` UI

**Files:**
- Modify: `app/(app)/settings/page.tsx`
- Create: `components/settings/SettingsForms.tsx`

**Interfaces:**
- Consumes: server actions from `lib/settings/actions.ts` and existing UI primitives.

- [ ] **Step 1: Load current trainer settings on the server page.**
- [ ] **Step 2: Render prompt textarea and five threshold number inputs.**
- [ ] **Step 3: Render password form with current password, new password, and confirmation.**
- [ ] **Step 4: Show field errors and a small success message without adding new routes or modals.**
- [ ] **Step 5: Run `npx tsc --noEmit` and `npm run lint`.**
