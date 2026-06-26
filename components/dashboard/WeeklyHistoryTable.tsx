import Link from 'next/link';
import {formatWeekLabel} from '@/lib/weekly/week';
import type {WeeklyStat} from '@/lib/db/schema';

function totalLeads(w: WeeklyStat): number {
    return w.leadsReception + w.leadsLifts + w.leadsAvito + w.leadsReferral + w.leadsBase + w.leadsChat;
}

export function WeeklyHistoryTable({weeks, editingWeek}: {weeks: WeeklyStat[]; editingWeek: string}) {
    if (weeks.length === 0) {
        return <p className="text-tx-2 text-sm">Пока нет ни одной заполненной недели.</p>;
    }

    return (
        <section className="space-y-3">
            <h2 className="text-tx-2 text-xs uppercase tracking-wide">История</h2>
            <div className="glass glass-strong overflow-x-auto rounded-2xl border border-line/70">
                <table className="min-w-[640px] w-full text-sm">
                    <thead>
                        <tr className="bg-bg-3/70 text-left text-tx-2">
                            <th className="px-4 py-3 font-medium">Неделя</th>
                            <th className="px-4 py-3 font-medium text-right">Лидов</th>
                            <th className="px-4 py-3 font-medium text-right">Пробных</th>
                            <th className="px-4 py-3 font-medium text-right">Новых</th>
                            <th className="px-4 py-3 font-medium text-right">Загрузка</th>
                            <th className="px-4 py-3 font-medium">Заметка</th>
                        </tr>
                    </thead>
                    <tbody>
                        {weeks.map((w) => {
                            const isEditing = w.weekStart === editingWeek;
                            return (
                                <tr key={w.id} className={`border-b border-line-soft last:border-0 ${isEditing ? 'bg-bg-3/80' : ''}`}>
                                    <td className="px-4 py-3">
                                        <Link href={`/dashboard?week=${w.weekStart}`} className="text-cyan hover:underline">
                                            {formatWeekLabel(w.weekStart)}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-tx">{totalLeads(w)}</td>
                                    <td className="px-4 py-3 text-right font-mono text-tx">{w.trials}</td>
                                    <td className="px-4 py-3 text-right font-mono text-tx">{w.newRegulars}</td>
                                    <td className="px-4 py-3 text-right font-mono text-tx">{w.loadPercent ?? '—'}%</td>
                                    <td className="px-4 py-3 text-[13px] text-tx-2">{w.note ?? ''}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
