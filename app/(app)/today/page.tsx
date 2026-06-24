import {redirect} from 'next/navigation';
import {eq} from 'drizzle-orm';
import {CircleCheck} from 'lucide-react';
import {auth} from '@/lib/auth/config';
import {db} from '@/lib/db';
import {trainers} from '@/lib/db/schema';
import {listClientsWithLastTouch} from '@/lib/triggers/query';
import {groupAndSortTriggers} from '@/lib/today/group';
import {TodayBoard, type BoardGroup} from '@/components/today/TodayBoard';
import {EmptyState} from '@/components/ui/EmptyState';
import {PageHeader} from '@/components/ui/PageHeader';
import {DEFAULT_THRESHOLDS} from '@/lib/triggers/defaults';

export default async function TodayPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const [trainer] = await db.select().from(trainers).where(eq(trainers.id, session.user.id)).limit(1);
    const thresholds = trainer?.settings.thresholds ?? DEFAULT_THRESHOLDS;

    const clients = await listClientsWithLastTouch(session.user.id);
    const groups = groupAndSortTriggers(clients, new Date(), thresholds);

    const boardGroups: BoardGroup[] = groups.map((g) => ({
        key: g.key,
        title: g.title,
        entries: g.entries.map((e) => ({
            clientId: e.client.id,
            name: e.client.name,
            profile: e.client.profile,
            triggerKind: e.trigger.kind,
            priority: e.trigger.priority,
            daysSince: e.trigger.daysSince,
        })),
    }));

    const total = boardGroups.reduce((sum, g) => sum + g.entries.length, 0);

    return (
        <>
            <PageHeader
                title="Сегодня"
                kicker="Пятничный ритуал"
                meta={total > 0 ? `${total} сигналов` : 'База под контролем'}
            />
            {total === 0 ? (
                <EmptyState
                    title="Триггеров нет"
                    hint="База под контролем — так держать."
                    icon={CircleCheck}
                />
            ) : (
                <TodayBoard groups={boardGroups}/>
            )}
        </>
    );
}
