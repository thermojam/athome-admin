import {sql} from 'drizzle-orm';
import {db} from '@/lib/db';
import type {Client} from '@/lib/db/schema';

export type ClientWithLastTouch = Client & {lastTouchDate: Date | null};

export async function listClientsWithLastTouch(trainerId: string): Promise<ClientWithLastTouch[]> {
    const rows = await db.execute<{
        id: string;
        trainer_id: string;
        name: string;
        contact: string | null;
        profile: string | null;
        status: string;
        source: string | null;
        personal_fact: string | null;
        goal: string | null;
        sessions_per_week: number | null;
        last_session_date: string | null;
        september_booking: boolean | null;
        note: string | null;
        lead_payload: unknown;
        deleted_at: Date | null;
        created_at: Date;
        updated_at: Date;
        last_touch_date: string | null;
    }>(sql`
        SELECT
            c.*,
            GREATEST(
                c.last_session_date,
                c.created_at::date,
                COALESCE(lt.touched_at, '1970-01-01'::date)
            ) AS last_touch_date
        FROM clients c
        LEFT JOIN LATERAL (
            SELECT touched_at FROM touches t
            WHERE t.client_id = c.id
            ORDER BY t.touched_at DESC
            LIMIT 1
        ) lt ON true
        WHERE c.trainer_id = ${trainerId}
          AND c.deleted_at IS NULL
          AND c.status <> 'left'
    `);

    return rows.rows.map((r) => ({
        id: r.id,
        trainerId: r.trainer_id,
        name: r.name,
        contact: r.contact,
        profile: r.profile as Client['profile'],
        status: r.status as Client['status'],
        source: r.source as Client['source'],
        personalFact: r.personal_fact,
        goal: r.goal,
        sessionsPerWeek: r.sessions_per_week,
        lastSessionDate: r.last_session_date,
        septemberBooking: r.september_booking,
        note: r.note,
        leadPayload: r.lead_payload,
        deletedAt: r.deleted_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        lastTouchDate: r.last_touch_date ? new Date(r.last_touch_date) : null,
    }));
}
