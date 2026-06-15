import {notFound} from 'next/navigation';
import {computeTrigger} from '@/lib/triggers/compute';
import {SANITY_CASES} from '@/lib/triggers/sanity-cases';
import {DEFAULT_THRESHOLDS} from '@/lib/triggers/defaults';

const TODAY = new Date('2026-06-15T12:00:00Z');

function makeLastTouchDate(today: Date, days: number | null): Date | null {
    if (days === null) return null;
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d;
}

export default function TriggersSanityPage() {
    if (process.env.NODE_ENV !== 'development') {
        notFound();
    }

    const rows = SANITY_CASES.map((c) => {
        const trigger = computeTrigger(
            {status: c.status, septemberBooking: c.septemberBooking, deletedAt: null},
            makeLastTouchDate(TODAY, c.daysSinceLastTouch),
            TODAY,
            DEFAULT_THRESHOLDS,
        );
        const actual = trigger ? {kind: trigger.kind, priority: trigger.priority} : null;
        const match =
            (actual === null && c.expected === null) ||
            (actual !== null && c.expected !== null && actual.kind === c.expected.kind && actual.priority === c.expected.priority);
        return {c, actual, match};
    });

    const passed = rows.filter((r) => r.match).length;

    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-2">Triggers sanity</h1>
            <p className="text-tx-2 text-[13px] mb-6 font-mono">
                {passed} / {rows.length} прошло
            </p>
            <div className="glass overflow-hidden">
                <table className="w-full text-[13px]">
                    <thead>
                    <tr className="text-left text-tx-2 text-[12px] font-mono uppercase tracking-wider">
                        <th className="py-2 px-3 font-normal">Кейс</th>
                        <th className="py-2 px-3 font-normal">Ожидалось</th>
                        <th className="py-2 px-3 font-normal">Получили</th>
                        <th className="py-2 px-3 font-normal text-right">Ок?</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="border-t hairline">
                            <td className="py-3 px-3 text-tx">{r.c.title}</td>
                            <td className="py-3 px-3 font-mono text-tx-2">
                                {r.c.expected ? `${r.c.expected.kind} / ${r.c.expected.priority}` : '—'}
                            </td>
                            <td className="py-3 px-3 font-mono text-tx-2">
                                {r.actual ? `${r.actual.kind} / ${r.actual.priority}` : '—'}
                            </td>
                            <td className="py-3 px-3 text-right">
                                {r.match
                                    ? <span className="text-green">✓</span>
                                    : <span className="text-orange">✗</span>}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
