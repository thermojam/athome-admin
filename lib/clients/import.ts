'use server';

import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {and, eq, isNull} from 'drizzle-orm';
import {auth} from '@/lib/auth/config';
import {db} from '@/lib/db';
import {clients, touches} from '@/lib/db/schema';
import {decodeFile, parseCsvText, MAX_BYTES} from '@/lib/csv/parse';
import {validateRow} from '@/lib/csv/validate';
import type {CsvRow, RowError} from '@/lib/csv/validate';

export type PreviewResult =
    | {kind: 'file_error'; message: string}
    | {kind: 'ok'; total: number; previewRows: CsvRow[]; errors: RowError[]};

export type CommitResult =
    | {kind: 'file_error'; message: string}
    | {kind: 'has_errors'; errors: RowError[]}
    | {kind: 'imported'; added: number; updated: number};

async function requireTrainerId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');
    return session.user.id;
}

export async function previewImport(formData: FormData): Promise<PreviewResult> {
    await requireTrainerId();

    const file = formData.get('file');
    if (!(file instanceof File)) return {kind: 'file_error', message: 'Файл не передан.'};
    if (file.size === 0) return {kind: 'file_error', message: 'Файл пустой.'};
    if (file.size > MAX_BYTES) return {kind: 'file_error', message: `Слишком большой файл (${file.size} байт, лимит ${MAX_BYTES}).`};

    const buf = await file.arrayBuffer();
    const text = decodeFile(buf);

    const parsed = parseCsvText(text);
    if (parsed.kind === 'file_error') return parsed;

    const validated = parsed.rows.map((r, i) => validateRow(r, i + 2));
    const errors = validated.flatMap((v) => (v.ok ? [] : v.errors));
    const validRows = validated.flatMap((v) => (v.ok ? [v.row] : []));

    return {
        kind: 'ok',
        total: parsed.rows.length,
        previewRows: validRows.slice(0, 5),
        errors,
    };
}

export async function commitImport(formData: FormData): Promise<CommitResult> {
    const trainerId = await requireTrainerId();

    const file = formData.get('file');
    if (!(file instanceof File)) return {kind: 'file_error', message: 'Файл не передан.'};
    if (file.size > MAX_BYTES) return {kind: 'file_error', message: `Слишком большой файл.`};

    const buf = await file.arrayBuffer();
    const text = decodeFile(buf);

    const parsed = parseCsvText(text);
    if (parsed.kind === 'file_error') return parsed;

    const validated = parsed.rows.map((r, i) => validateRow(r, i + 2));
    const errors = validated.flatMap((v) => (v.ok ? [] : v.errors));
    if (errors.length > 0) return {kind: 'has_errors', errors};

    const rows = validated.flatMap((v) => (v.ok ? [v.row] : []));

    try {
        const result = await db.transaction(async (tx) => {
            let added = 0;
            let updated = 0;
            for (const row of rows) {
                const existing = await findExisting(tx, trainerId, row);
                if (existing) {
                    await tx
                        .update(clients)
                        .set({
                            name: row.name,
                            contact: row.contact,
                            profile: row.profile,
                            status: row.status,
                            source: row.source,
                            personalFact: row.personalFact,
                            goal: row.goal,
                            sessionsPerWeek: row.sessionsPerWeek,
                            lastSessionDate: row.lastSessionDate,
                            septemberBooking: row.septemberBooking,
                            note: row.note,
                            updatedAt: new Date(),
                        })
                        .where(and(eq(clients.id, existing.id), eq(clients.trainerId, trainerId)));
                    updated++;
                } else {
                    const [inserted] = await tx
                        .insert(clients)
                        .values({
                            trainerId,
                            name: row.name,
                            contact: row.contact,
                            profile: row.profile,
                            status: row.status,
                            source: row.source,
                            personalFact: row.personalFact,
                            goal: row.goal,
                            sessionsPerWeek: row.sessionsPerWeek,
                            lastSessionDate: row.lastSessionDate,
                            septemberBooking: row.septemberBooking,
                            note: row.note,
                            createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
                            deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
                        })
                        .returning({id: clients.id});

                    if (row.lastTouchDate && row.lastTouchType) {
                        await tx.insert(touches).values({
                            clientId: inserted.id,
                            trainerId,
                            type: row.lastTouchType,
                            touchedAt: row.lastTouchDate,
                            note: null,
                        });
                    }
                    added++;
                }
            }
            return {added, updated};
        });

        revalidatePath('/clients');
        revalidatePath('/today');
        return {kind: 'imported', added: result.added, updated: result.updated};
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {kind: 'file_error', message: `Импорт прерван: ${msg}`};
    }
}

type TxLike = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function findExisting(
    tx: TxLike,
    trainerId: string,
    row: CsvRow,
): Promise<{id: string} | null> {
    if (row.contact) {
        const rows = await tx
            .select({id: clients.id})
            .from(clients)
            .where(and(
                eq(clients.trainerId, trainerId),
                eq(clients.contact, row.contact),
                isNull(clients.deletedAt),
            ))
            .limit(1);
        if (rows[0]) return rows[0];
    }
    const byName = await tx
        .select({id: clients.id})
        .from(clients)
        .where(and(
            eq(clients.trainerId, trainerId),
            eq(clients.name, row.name),
            isNull(clients.contact),
            isNull(clients.deletedAt),
        ))
        .limit(1);
    return byName[0] ?? null;
}
