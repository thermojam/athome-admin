'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {and, eq} from 'drizzle-orm';
import {db} from '@/lib/db';
import {clients} from '@/lib/db/schema';
import {ClientCreateSchema, ClientUpdateSchema, LeadCreateSchema} from '@/lib/zod/client';
import {requireTrainerId} from '@/lib/auth/require-trainer';

export type ActionResult =
    | {ok: true; id?: string}
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

export async function createClient(formData: FormData): Promise<ActionResult> {
    const trainerId = await requireTrainerId();

    const parsed = ClientCreateSchema.safeParse({
        name: formData.get('name'),
        contact: formData.get('contact'),
        profile: formData.get('profile'),
        status: formData.get('status'),
        source: formData.get('source'),
        personalFact: formData.get('personalFact'),
        goal: formData.get('goal'),
        sessionsPerWeek: formData.get('sessionsPerWeek'),
        lastSessionDate: formData.get('lastSessionDate'),
        septemberBooking: formData.get('septemberBooking'),
        note: formData.get('note'),
    });

    if (!parsed.success) {
        return {ok: false, error: 'Проверь поля и попробуй ещё раз', fieldErrors: collectFieldErrors(parsed.error)};
    }

    const [row] = await db
        .insert(clients)
        .values({trainerId, ...parsed.data})
        .returning({id: clients.id});

    revalidatePath('/clients');
    redirect(`/clients/${row.id}`);
}

export async function updateClient(id: string, formData: FormData): Promise<ActionResult> {
    const trainerId = await requireTrainerId();

    const parsed = ClientUpdateSchema.safeParse({
        name: formData.get('name'),
        contact: formData.get('contact'),
        profile: formData.get('profile'),
        status: formData.get('status'),
        source: formData.get('source'),
        personalFact: formData.get('personalFact'),
        goal: formData.get('goal'),
        sessionsPerWeek: formData.get('sessionsPerWeek'),
        lastSessionDate: formData.get('lastSessionDate'),
        septemberBooking: formData.get('septemberBooking'),
        note: formData.get('note'),
    });

    if (!parsed.success) {
        return {ok: false, error: 'Проверь поля и попробуй ещё раз', fieldErrors: collectFieldErrors(parsed.error)};
    }

    await db
        .update(clients)
        .set({...parsed.data, updatedAt: new Date()})
        .where(and(eq(clients.id, id), eq(clients.trainerId, trainerId)));

    revalidatePath('/clients');
    revalidatePath(`/clients/${id}`);
    return {ok: true};
}

export async function softDeleteClient(id: string): Promise<void> {
    const trainerId = await requireTrainerId();

    await db
        .update(clients)
        .set({deletedAt: new Date(), updatedAt: new Date()})
        .where(and(eq(clients.id, id), eq(clients.trainerId, trainerId)));

    revalidatePath('/clients');
    redirect('/clients');
}

export async function createLead(formData: FormData): Promise<ActionResult> {
    const trainerId = await requireTrainerId();

    const parsed = LeadCreateSchema.safeParse({
        name: formData.get('name'),
        contact: formData.get('contact'),
        source: formData.get('source'),
        personalFact: formData.get('personalFact'),
    });

    if (!parsed.success) {
        return {ok: false, error: 'Проверь поля и попробуй ещё раз', fieldErrors: collectFieldErrors(parsed.error)};
    }

    const [row] = await db
        .insert(clients)
        .values({
            trainerId,
            name: parsed.data.name,
            contact: parsed.data.contact,
            source: parsed.data.source,
            personalFact: parsed.data.personalFact,
            status: 'lead',
        })
        .returning({id: clients.id});

    revalidatePath('/clients');
    revalidatePath('/today');
    redirect(`/clients/${row.id}`);
}
