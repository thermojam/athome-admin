import {db} from '@/lib/db';
import {clients} from '@/lib/db/schema';
import type {Client, ClientStatus, ClientProfile, ClientSource} from '@/lib/db/schema';
import {and, eq, ilike, or, isNull, inArray, desc} from 'drizzle-orm';

export type ListClientsFilter = {
    trainerId: string;
    search?: string;
    statuses?: ClientStatus[];
    profiles?: ClientProfile[];
    sources?: ClientSource[];
    includeDeleted?: boolean;
};

export async function listClients(filter: ListClientsFilter): Promise<Client[]> {
    const conds = [eq(clients.trainerId, filter.trainerId)];

    if (!filter.includeDeleted) {
        conds.push(isNull(clients.deletedAt));
    }

    if (filter.statuses && filter.statuses.length > 0) {
        conds.push(inArray(clients.status, filter.statuses));
    }

    if (filter.profiles && filter.profiles.length > 0) {
        conds.push(inArray(clients.profile, filter.profiles));
    }

    if (filter.sources && filter.sources.length > 0) {
        conds.push(inArray(clients.source, filter.sources));
    }

    if (filter.search && filter.search.trim() !== '') {
        const pattern = `%${filter.search.trim()}%`;
        conds.push(
            or(
                ilike(clients.name, pattern),
                ilike(clients.contact, pattern),
            )!,
        );
    }

    return db
        .select()
        .from(clients)
        .where(and(...conds))
        .orderBy(desc(clients.createdAt));
}

export async function getClient(trainerId: string, id: string): Promise<Client | null> {
    const [row] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, id), eq(clients.trainerId, trainerId)))
        .limit(1);
    return row ?? null;
}
