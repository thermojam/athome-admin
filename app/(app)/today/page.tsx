import {redirect} from 'next/navigation';
import {eq} from 'drizzle-orm';
import {auth} from '@/lib/auth/config';
import {db} from '@/lib/db';
import {trainers} from '@/lib/db/schema';
import {listClientsWithLastTouch} from '@/lib/triggers/query';
import {groupAndSortTriggers} from '@/lib/today/group';
import {TodayList} from '@/components/today/TodayList';
import {EmptyState} from '@/components/ui/EmptyState';
import {DEFAULT_THRESHOLDS} from '@/lib/triggers/defaults';

export default async function TodayPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const [trainer] = await db.select().from(trainers).where(eq(trainers.id, session.user.id)).limit(1);
    const thresholds = trainer?.settings.thresholds ?? DEFAULT_THRESHOLDS;

    const clients = await listClientsWithLastTouch(session.user.id);
    const groups = groupAndSortTriggers(clients, new Date(), thresholds);

    const totalTriggers = groups.reduce((sum, g) => sum + g.entries.length, 0);

    return (
        <>
            <div className="flex items-end justify-between mb-6">
                <h1 className="font-display uppercase text-[27px] tracking-wide">Сегодня</h1>
                {totalTriggers > 0 && (
                    <span className="text-tx-2 font-mono text-[12px]">{totalTriggers} триггеров</span>
                )}
            </div>
            {totalTriggers === 0 ? (
                <EmptyState
                    title="Триггеров нет"
                    hint="База под контролем — так держать."
                />
            ) : (
                <TodayList groups={groups}/>
            )}
        </>
    );
}
