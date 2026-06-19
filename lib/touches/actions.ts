'use server';

import {revalidatePath} from 'next/cache';
import {and, eq, isNull} from 'drizzle-orm';
import {db} from '@/lib/db';
import {clients, touches} from '@/lib/db/schema';
import type {TouchType} from '@/lib/db/schema';
import {TouchCreateSchema} from '@/lib/zod/touch';
import {requireTrainerId} from '@/lib/auth/require-trainer';

export type RecordTouchResult = {ok: true} | {ok: false; error: string};

export async function recordTouch(
    clientId: string,
    type: TouchType,
    note?: string | null,
): Promise<RecordTouchResult> {
    const trainerId = await requireTrainerId();

    const parsed = TouchCreateSchema.safeParse({type, note: note ?? undefined});
    if (!parsed.success) {
        return {ok: false, error: 'Проверь тип и заметку'};
    }

    const [owned] = await db
        .select({id: clients.id})
        .from(clients)
        .where(and(
            eq(clients.id, clientId),
            eq(clients.trainerId, trainerId),
            isNull(clients.deletedAt),
        ))
        .limit(1);

    if (!owned) {
        return {ok: false, error: 'Клиент не найден'};
    }

    const today = new Date().toISOString().slice(0, 10);

    await db.insert(touches).values({
        clientId,
        trainerId,
        type: parsed.data.type,
        touchedAt: today,
        note: parsed.data.note,
    });

    revalidatePath('/today');
    revalidatePath(`/clients/${clientId}`);
    return {ok: true};
}
