import type {ClientWithLastTouch} from '@/lib/triggers/query';
import {computeTrigger, type Trigger, type TriggerPriority} from '@/lib/triggers/compute';
import type {TrainerSettings} from '@/lib/db/schema';

export type TriggerEntry = {
    client: ClientWithLastTouch;
    trigger: Trigger;
};

export type GroupKey = 'silent' | 'high' | 'medium' | 'low';

export type TriggerGroup = {
    key: GroupKey;
    title: string;
    entries: TriggerEntry[];
};

const PRIORITY_ORDER: Record<TriggerPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
    info: 3,
};

export function groupAndSortTriggers(
    clients: ClientWithLastTouch[],
    today: Date,
    thresholds: TrainerSettings['thresholds'],
): TriggerGroup[] {
    const entries: TriggerEntry[] = [];
    for (const c of clients) {
        const trigger = computeTrigger(
            {status: c.status, septemberBooking: c.septemberBooking, deletedAt: c.deletedAt},
            c.lastTouchDate,
            today,
            thresholds,
        );
        if (trigger) entries.push({client: c, trigger});
    }

    const silent = entries.filter((e) => e.trigger.kind === 'silent');
    const rest = entries.filter((e) => e.trigger.kind !== 'silent');

    rest.sort((a, b) => {
        const p = PRIORITY_ORDER[a.trigger.priority] - PRIORITY_ORDER[b.trigger.priority];
        if (p !== 0) return p;
        return b.trigger.daysSince - a.trigger.daysSince;
    });

    silent.sort((a, b) => b.trigger.daysSince - a.trigger.daysSince);

    const groups: TriggerGroup[] = [];

    if (silent.length > 0) {
        groups.push({key: 'silent', title: 'Тихие', entries: silent});
    }

    const high = rest.filter((e) => e.trigger.priority === 'high');
    const medium = rest.filter((e) => e.trigger.priority === 'medium');
    const low = rest.filter((e) => e.trigger.priority === 'low' || e.trigger.priority === 'info');

    if (high.length > 0) groups.push({key: 'high', title: 'Срочно', entries: high});
    if (medium.length > 0) groups.push({key: 'medium', title: 'Скоро', entries: medium});
    if (low.length > 0) groups.push({key: 'low', title: 'Можно подождать', entries: low});

    return groups;
}
