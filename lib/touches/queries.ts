import {and, desc, eq} from 'drizzle-orm';
import {db} from '@/lib/db';
import {touches} from '@/lib/db/schema';
import type {Touch} from '@/lib/db/schema';

export async function listTouchesForClient(
    trainerId: string,
    clientId: string,
): Promise<Touch[]> {
    return db
        .select()
        .from(touches)
        .where(and(
            eq(touches.clientId, clientId),
            eq(touches.trainerId, trainerId),
        ))
        .orderBy(desc(touches.touchedAt), desc(touches.createdAt));
}
