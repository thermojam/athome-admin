'use server';

import {eq} from 'drizzle-orm';
import {redirect} from 'next/navigation';
import {db} from '@/lib/db';
import {trainers} from '@/lib/db/schema';
import {auth} from '@/lib/auth/config';
import {listClientsWithLastTouch} from '@/lib/triggers/query';
import {computeTrigger} from '@/lib/triggers/compute';
import {DEFAULT_THRESHOLDS, DEFAULT_PROMPT_TEMPLATE} from '@/lib/triggers/defaults';
import {buildClaudeExport, type BuildClaudeExportResult, type ClientForExport} from './claude';

async function requireTrainerId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');
    return session.user.id;
}

export async function buildExportForSelection(
    clientIds: string[],
): Promise<BuildClaudeExportResult> {
    const trainerId = await requireTrainerId();
    if (clientIds.length === 0) return {text: '', missing: []};

    const [trainer] = await db.select().from(trainers).where(eq(trainers.id, trainerId)).limit(1);
    const promptTemplate = trainer?.settings.promptTemplate ?? DEFAULT_PROMPT_TEMPLATE;
    const thresholds = trainer?.settings.thresholds ?? DEFAULT_THRESHOLDS;

    const all = await listClientsWithLastTouch(trainerId);
    const today = new Date();
    const idSet = new Set(clientIds);

    const selected: ClientForExport[] = [];
    for (const c of all) {
        if (!idSet.has(c.id)) continue;
        const trigger = computeTrigger(
            {status: c.status, septemberBooking: c.septemberBooking, deletedAt: c.deletedAt},
            c.lastTouchDate,
            today,
            thresholds,
        );
        if (!trigger) continue;
        selected.push({
            id: c.id,
            name: c.name,
            profile: c.profile,
            personalFact: c.personalFact,
            goal: c.goal,
            note: c.note,
            trigger,
        });
    }

    return buildClaudeExport(selected, promptTemplate);
}
