'use server';

import {revalidatePath} from 'next/cache';
import {eq} from 'drizzle-orm';
import {db} from '@/lib/db';
import {trainers} from '@/lib/db/schema';
import {requireTrainerId} from '@/lib/auth/require-trainer';
import {hashPassword, verifyPassword} from '@/lib/auth/password';
import {PasswordChangeSchema, TrainerSettingsFormSchema} from '@/lib/zod/settings';

export type SettingsActionResult =
    | {ok: true}
    | {ok: false; error: string; fieldErrors?: Record<string, string>};

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

export async function updateTrainerSettings(formData: FormData): Promise<SettingsActionResult> {
    const trainerId = await requireTrainerId();

    const parsed = TrainerSettingsFormSchema.safeParse({
        promptTemplate: formData.get('promptTemplate'),
        leadStaleDays: formData.get('leadStaleDays'),
        activeFreshDays: formData.get('activeFreshDays'),
        activeStaleDays: formData.get('activeStaleDays'),
        cooledStaleDays: formData.get('cooledStaleDays'),
        silentDays: formData.get('silentDays'),
    });

    if (!parsed.success) {
        return {ok: false, error: 'Проверь настройки', fieldErrors: collectFieldErrors(parsed.error)};
    }

    await db
        .update(trainers)
        .set({settings: parsed.data})
        .where(eq(trainers.id, trainerId));

    revalidatePath('/settings');
    revalidatePath('/today');
    revalidatePath('/dashboard');
    return {ok: true};
}

export async function changeTrainerPassword(formData: FormData): Promise<SettingsActionResult> {
    const trainerId = await requireTrainerId();

    const parsed = PasswordChangeSchema.safeParse({
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword'),
    });

    if (!parsed.success) {
        return {ok: false, error: 'Проверь пароль', fieldErrors: collectFieldErrors(parsed.error)};
    }

    const [trainer] = await db
        .select({passwordHash: trainers.passwordHash})
        .from(trainers)
        .where(eq(trainers.id, trainerId))
        .limit(1);

    if (!trainer) {
        return {ok: false, error: 'Тренер не найден'};
    }

    const currentOk = await verifyPassword(parsed.data.currentPassword, trainer.passwordHash);
    if (!currentOk) {
        return {
            ok: false,
            error: 'Проверь пароль',
            fieldErrors: {currentPassword: 'Текущий пароль не подошёл'},
        };
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await db
        .update(trainers)
        .set({passwordHash})
        .where(eq(trainers.id, trainerId));

    revalidatePath('/settings');
    return {ok: true};
}
