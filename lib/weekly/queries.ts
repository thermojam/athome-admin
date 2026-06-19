import {and, desc, eq} from 'drizzle-orm';
import {db} from '@/lib/db';
import {weeklyStats} from '@/lib/db/schema';
import type {WeeklyStat} from '@/lib/db/schema';

export async function getWeeklyStat(trainerId: string, weekStart: string): Promise<WeeklyStat | null> {
    const rows = await db
        .select()
        .from(weeklyStats)
        .where(and(eq(weeklyStats.trainerId, trainerId), eq(weeklyStats.weekStart, weekStart)))
        .limit(1);
    return rows[0] ?? null;
}

export async function listWeeklyHistory(trainerId: string, weeksBack: number = 12): Promise<WeeklyStat[]> {
    return await db
        .select()
        .from(weeklyStats)
        .where(eq(weeklyStats.trainerId, trainerId))
        .orderBy(desc(weeklyStats.weekStart))
        .limit(weeksBack);
}
