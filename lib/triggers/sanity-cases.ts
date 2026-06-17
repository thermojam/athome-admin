import type {ClientStatus} from '@/lib/db/schema';
import type {TriggerKind, TriggerPriority} from './compute';

export type SanityCase = {
    title: string;
    status: ClientStatus;
    septemberBooking: boolean;
    daysSinceLastTouch: number | null;
    expected: {kind: TriggerKind; priority: TriggerPriority} | null;
};

export const SANITY_CASES: SanityCase[] = [
    {
        title: 'Активный, 5 дней без касания — нет триггера',
        status: 'active',
        septemberBooking: false,
        daysSinceLastTouch: 5,
        expected: null,
    },
    {
        title: 'Активный, 10 дней — medium active_stale',
        status: 'active',
        septemberBooking: false,
        daysSinceLastTouch: 10,
        expected: {kind: 'active_stale', priority: 'medium'},
    },
    {
        title: 'Активный, 21 день — high active_stale',
        status: 'active',
        septemberBooking: false,
        daysSinceLastTouch: 21,
        expected: {kind: 'active_stale', priority: 'high'},
    },
    {
        title: 'Лид, 2 дня — нет триггера',
        status: 'lead',
        septemberBooking: false,
        daysSinceLastTouch: 2,
        expected: null,
    },
    {
        title: 'Лид, 3 дня — high lead_stale',
        status: 'lead',
        septemberBooking: false,
        daysSinceLastTouch: 3,
        expected: {kind: 'lead_stale', priority: 'high'},
    },
    {
        title: 'Отпуск с предзаписью на сентябрь — нет триггера',
        status: 'vacation',
        septemberBooking: true,
        daysSinceLastTouch: 1,
        expected: null,
    },
    {
        title: 'Отпуск без предзаписи — medium vacation_no_prebook',
        status: 'vacation',
        septemberBooking: false,
        daysSinceLastTouch: 1,
        expected: {kind: 'vacation_no_prebook', priority: 'medium'},
    },
    {
        title: 'Остывший, 29 дней — нет триггера',
        status: 'cooling',
        septemberBooking: false,
        daysSinceLastTouch: 29,
        expected: null,
    },
    {
        title: 'Остывший, 30 дней — low cooled_stale',
        status: 'cooling',
        septemberBooking: false,
        daysSinceLastTouch: 30,
        expected: {kind: 'cooled_stale', priority: 'low'},
    },
    {
        title: 'Активный, 45 дней — silent (страховка перекрывает active_stale)',
        status: 'active',
        septemberBooking: false,
        daysSinceLastTouch: 45,
        expected: {kind: 'silent', priority: 'high'},
    },
];
