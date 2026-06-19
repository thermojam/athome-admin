import {pgTable, uuid, text, jsonb, timestamp, integer, boolean, date, index, uniqueIndex} from 'drizzle-orm/pg-core';
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

export type Trainer = typeof trainers.$inferSelect;
export type NewTrainer = typeof trainers.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Touch = typeof touches.$inferSelect;
export type NewTouch = typeof touches.$inferInsert;

export const weeklyStats = pgTable('weekly_stats', {
    id: uuid('id').primaryKey().defaultRandom(),
    trainerId: uuid('trainer_id').notNull().references(() => trainers.id),
    weekStart: date('week_start').notNull(),
    leadsReception: integer('leads_reception').default(0).notNull(),
    leadsLifts: integer('leads_lifts').default(0).notNull(),
    leadsAvito: integer('leads_avito').default(0).notNull(),
    leadsReferral: integer('leads_referral').default(0).notNull(),
    leadsBase: integer('leads_base').default(0).notNull(),
    leadsChat: integer('leads_chat').default(0).notNull(),
    trials: integer('trials').default(0).notNull(),
    newRegulars: integer('new_regulars').default(0).notNull(),
    loadPercent: integer('load_percent'),
    note: text('note'),
    createdAt: timestamp('created_at', {withTimezone: true}).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).defaultNow().notNull(),
}, (t) => ({
    uniqWeek: uniqueIndex('weekly_stats_trainer_week_uniq').on(t.trainerId, t.weekStart),
}));

export type WeeklyStat = typeof weeklyStats.$inferSelect;
export type NewWeeklyStat = typeof weeklyStats.$inferInsert;
