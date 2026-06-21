'use server';

import {revalidatePath} from 'next/cache';
import {db} from '@/lib/db';
import {weeklyStats} from '@/lib/db/schema';
import {requireTrainerId} from '@/lib/auth/require-trainer';
import {WeeklyStatSchema} from '@/lib/zod/weekly';

export type UpsertResult = {ok: true} | {ok: false; error: string; fieldErrors?: Record<string, string>};

function collectFieldErrors(error: import('zod').ZodError): Record<string, string> {
    const errs: Record<string, string> = {};
    for (const issue of error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && !errs[key]) {
            errs[key] = issue.message;
        }
    }
    return errs;
}

export async function upsertWeeklyStat(formData: FormData): Promise<UpsertResult> {
    const trainerId = await requireTrainerId();

    const parsed = WeeklyStatSchema.safeParse({
        weekStart: formData.get('weekStart'),
        leadsReception: formData.get('leadsReception'),
        leadsLifts: formData.get('leadsLifts'),
        leadsAvito: formData.get('leadsAvito'),
        leadsReferral: formData.get('leadsReferral'),
        leadsBase: formData.get('leadsBase'),
        leadsChat: formData.get('leadsChat'),
        trials: formData.get('trials'),
        newRegulars: formData.get('newRegulars'),
        loadPercent: formData.get('loadPercent'),
        note: formData.get('note'),
    });

    if (!parsed.success) {
        return {ok: false, error: 'Проверь поля', fieldErrors: collectFieldErrors(parsed.error)};
    }

    const data = parsed.data;

    await db
        .insert(weeklyStats)
        .values({trainerId, ...data})
        .onConflictDoUpdate({
            target: [weeklyStats.trainerId, weeklyStats.weekStart],
            set: {
                leadsReception: data.leadsReception,
                leadsLifts: data.leadsLifts,
                leadsAvito: data.leadsAvito,
                leadsReferral: data.leadsReferral,
                leadsBase: data.leadsBase,
                leadsChat: data.leadsChat,
                trials: data.trials,
                newRegulars: data.newRegulars,
                loadPercent: data.loadPercent,
                note: data.note,
                updatedAt: new Date(),
            },
        });

    revalidatePath('/dashboard');
    return {ok: true};
}
