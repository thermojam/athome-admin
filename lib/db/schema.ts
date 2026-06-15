import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { DEFAULT_THRESHOLDS, DEFAULT_PROMPT_TEMPLATE } from '@/lib/triggers/defaults';

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
  thresholds: { ...DEFAULT_THRESHOLDS },
};

export const trainers = pgTable('trainers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  settings: jsonb('settings').$type<TrainerSettings>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Trainer = typeof trainers.$inferSelect;
export type NewTrainer = typeof trainers.$inferInsert;
