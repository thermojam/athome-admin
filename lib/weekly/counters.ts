import {and, eq, isNull, sql, count, gte} from 'drizzle-orm';
import {db} from '@/lib/db';
import {clients, trainers, CLIENT_STATUSES} from '@/lib/db/schema';
import type {ClientStatus} from '@/lib/db/schema';
import {listClientsWithLastTouch} from '@/lib/triggers/query';
import {groupAndSortTriggers} from '@/lib/today/group';
import type {TriggerGroup} from '@/lib/today/group';
import {DEFAULT_THRESHOLDS} from '@/lib/triggers/defaults';

export type PriorityCounts = {silent: number; high: number; medium: number; low: number};

export type NowCounters = {
    statuses: Record<ClientStatus, number>;
    triggersByPriority: PriorityCounts;
    totalClients: number;
    leadsLast7Days: number;
};

export function groupTriggersByPriority(groups: TriggerGroup[]): PriorityCounts {
    const out: PriorityCounts = {silent: 0, high: 0, medium: 0, low: 0};
    for (const g of groups) {
        out[g.key] = g.entries.length;
    }
    return out;
}

export async function getNowCounters(trainerId: string): Promise<NowCounters> {
    const emptyStatuses = Object.fromEntries(CLIENT_STATUSES.map((s) => [s, 0])) as Record<ClientStatus, number>;

    const [statusRows, allClients, leadsRow, trainerRow] = await Promise.all([
        db
            .select({status: clients.status, n: count()})
            .from(clients)
            .where(and(eq(clients.trainerId, trainerId), isNull(clients.deletedAt)))
            .groupBy(clients.status),
        listClientsWithLastTouch(trainerId),
        db
            .select({n: count()})
            .from(clients)
            .where(and(
                eq(clients.trainerId, trainerId),
                eq(clients.status, 'lead'),
                isNull(clients.deletedAt),
                gte(clients.createdAt, sql`now() - interval '7 days'`),
            )),
        db.select().from(trainers).where(eq(trainers.id, trainerId)).limit(1),
    ]);

    const thresholds = trainerRow[0]?.settings.thresholds ?? DEFAULT_THRESHOLDS;
    const groups = groupAndSortTriggers(allClients, new Date(), thresholds);

    const statuses = {...emptyStatuses};
    for (const row of statusRows) {
        statuses[row.status] = row.n;
    }

    return {
        statuses,
        triggersByPriority: groupTriggersByPriority(groups),
        totalClients: allClients.length,
        leadsLast7Days: leadsRow[0]?.n ?? 0,
    };
}
