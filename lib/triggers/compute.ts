import type {ClientStatus} from '@/lib/db/schema';
import type {TrainerSettings} from '@/lib/db/schema';

export type TriggerKind = 'lead_stale' | 'vacation_no_prebook' | 'active_stale' | 'cooled_stale' | 'silent';
export type TriggerPriority = 'high' | 'medium' | 'low' | 'info';
export type Trigger = {
    kind: TriggerKind;
    priority: TriggerPriority;
    daysSince: number;
    emoji: string;
};

export function diffDays(today: Date, then: Date): number {
    const MS_PER_DAY = 86_400_000;
    const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const b = Date.UTC(then.getFullYear(), then.getMonth(), then.getDate());
    return Math.floor((a - b) / MS_PER_DAY);
}

type TriggerInputClient = {
    status: ClientStatus;
    septemberBooking: boolean | null;
    deletedAt: Date | null;
};

export function computeTrigger(
    client: TriggerInputClient,
    lastTouchDate: Date | null,
    today: Date,
    thresholds: TrainerSettings['thresholds'],
): Trigger | null {
    if (client.deletedAt) return null;
    if (client.status === 'left') return null;

    const daysSince = lastTouchDate ? diffDays(today, lastTouchDate) : Number.POSITIVE_INFINITY;

    if (daysSince >= thresholds.silentDays) {
        return {kind: 'silent', priority: 'high', daysSince, emoji: '🔇'};
    }

    switch (client.status) {
        case 'lead':
            if (daysSince >= thresholds.leadStaleDays) {
                return {kind: 'lead_stale', priority: 'high', daysSince, emoji: '🔴'};
            }
            return null;

        case 'vacation':
            if (!client.septemberBooking) {
                return {kind: 'vacation_no_prebook', priority: 'medium', daysSince, emoji: '🟠'};
            }
            return null;

        case 'active':
            if (daysSince >= thresholds.activeStaleDays) {
                return {kind: 'active_stale', priority: 'high', daysSince, emoji: '🔴'};
            }
            if (daysSince >= thresholds.activeFreshDays) {
                return {kind: 'active_stale', priority: 'medium', daysSince, emoji: '🟠'};
            }
            return null;

        case 'cooling':
            if (daysSince >= thresholds.cooledStaleDays) {
                return {kind: 'cooled_stale', priority: 'low', daysSince, emoji: '🟡'};
            }
            return null;

        case 'prebook':
            return null;
    }
}

export const TRIGGER_LABELS: Record<TriggerKind, string> = {
    lead_stale: 'Лид без касания',
    vacation_no_prebook: 'Отпуск без предзаписи',
    active_stale: 'Активный без тренировки',
    cooled_stale: 'Остывший',
    silent: 'Тихий — давно не касались',
};
