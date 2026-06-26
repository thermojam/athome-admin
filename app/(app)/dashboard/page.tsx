import {requireTrainerId} from '@/lib/auth/require-trainer';
import {getNowCounters} from '@/lib/weekly/counters';
import {getWeeklyStat, listWeeklyHistory} from '@/lib/weekly/queries';
import {getWeekStart} from '@/lib/weekly/week';
import {CountersBlock} from '@/components/dashboard/CountersBlock';
import {WeeklyForm} from '@/components/dashboard/WeeklyForm';
import {WeeklyHistoryTable} from '@/components/dashboard/WeeklyHistoryTable';
import {PageHeader} from '@/components/ui/PageHeader';
import {StatusNotice} from '@/components/ui/StatusNotice';

type SP = Promise<{week?: string}>;

export default async function DashboardPage({searchParams}: {searchParams: SP}) {
    const trainerId = await requireTrainerId();
    const sp = await searchParams;
    const editingWeek = sp.week && /^\d{4}-\d{2}-\d{2}$/.test(sp.week)
        ? sp.week
        : getWeekStart(new Date());

    const [counters, history, current] = await Promise.all([
        getNowCounters(trainerId),
        listWeeklyHistory(trainerId, 12),
        getWeeklyStat(trainerId, editingWeek),
    ]);

    const isFirstTime = history.length === 0 && current === null;

    return (
        <div className="space-y-8">
            <PageHeader
                title="Панель"
                kicker="Неделя и загрузка"
                meta="12 недель истории"
            />

            {isFirstTime && (
                <StatusNotice tone="info">
                    Первая пятница ещё впереди — заполни строку, когда наступит.
                </StatusNotice>
            )}

            <WeeklyForm weekStart={editingWeek} initial={current} />
            <CountersBlock counters={counters} />
            <WeeklyHistoryTable weeks={history} editingWeek={editingWeek} />
        </div>
    );
}
