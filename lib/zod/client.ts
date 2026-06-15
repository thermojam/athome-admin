import {z} from 'zod';
import {CLIENT_PROFILES, CLIENT_STATUSES, CLIENT_SOURCES} from '@/lib/db/schema';

const dateOrEmpty = z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Дата в формате YYYY-MM-DD')
    .transform((v) => (v === '' ? null : v));

const intOrEmpty = z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d+$/.test(v), 'Целое число')
    .transform((v) => (v === '' ? null : parseInt(v, 10)));

const trimmedOrNull = z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v));

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
    z.preprocess(
        (v) => (v === '' || v == null ? null : v),
        z.enum(values).nullable(),
    );

export const ClientCreateSchema = z.object({
    name: z.string().trim().min(1, 'Имя обязательно').max(120),
    contact: trimmedOrNull.nullable(),
    profile: optionalEnum(CLIENT_PROFILES),
    status: z.enum(CLIENT_STATUSES),
    source: optionalEnum(CLIENT_SOURCES),
    personalFact: trimmedOrNull.nullable(),
    goal: trimmedOrNull.nullable(),
    sessionsPerWeek: intOrEmpty.nullable(),
    lastSessionDate: dateOrEmpty.nullable(),
    septemberBooking: z.preprocess((v) => v === 'on' || v === true, z.boolean()),
    note: trimmedOrNull.nullable(),
});

export const ClientUpdateSchema = ClientCreateSchema;

export const LeadCreateSchema = z.object({
    name: z.string().trim().min(1, 'Имя обязательно').max(120),
    contact: trimmedOrNull.nullable(),
    source: optionalEnum(CLIENT_SOURCES),
    personalFact: trimmedOrNull.nullable(),
});

export type ClientCreateInput = z.infer<typeof ClientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof ClientUpdateSchema>;
export type LeadCreateInput = z.infer<typeof LeadCreateSchema>;
