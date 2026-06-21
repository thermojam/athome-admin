import type {Touch} from '@/lib/db/schema';
import {touchTypeLabel} from '@/lib/touches/labels';

function formatTouchDate(d: string): string {
    const [y, m, day] = d.split('-');
    return `${day}.${m}.${y}`;
}

export function TouchHistory({touches}: {touches: Touch[]}) {
    if (touches.length === 0) {
        return (
            <p className="text-tx-3 text-[13px] font-mono">Касаний пока нет.</p>
        );
    }
    return (
        <div className="glass overflow-hidden">
            {touches.map((t) => (
                <div key={t.id} className="px-4 py-3 border-t hairline first:border-t-0">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-tx text-[14px]">{touchTypeLabel(t.type)}</span>
                        <span className="text-tx-3 text-[12px] font-mono">{formatTouchDate(t.touchedAt)}</span>
                    </div>
                    {t.note && <p className="text-tx-2 text-[13px] mt-1">{t.note}</p>}
                </div>
            ))}
        </div>
    );
}
