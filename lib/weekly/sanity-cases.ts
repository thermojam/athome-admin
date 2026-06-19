import {getWeekStart, formatWeekLabel} from './week';
import {groupTriggersByPriority} from './counters';
import type {TriggerGroup, GroupKey} from '@/lib/today/group';

export type SanityCase = {id: string; label: string; ok: boolean; details: string};

function fakeGroup(key: GroupKey, count: number): TriggerGroup {
    return {
        key,
        title: key,
        emoji: '·',
        entries: Array.from({length: count}, () => ({} as unknown as TriggerGroup['entries'][number])),
    };
}

export function runSanityCases(): SanityCase[] {
    const out: SanityCase[] = [];

    // 1. Понедельник возвращает себя
    {
        const got = getWeekStart(new Date(Date.UTC(2026, 5, 15)));
        const exp = '2026-06-15';
        out.push({id: 'monday', label: '1. getWeekStart(понедельник) → тот же день', ok: got === exp, details: `${got} vs ${exp}`});
    }

    // 2. Воскресенье → предыдущий понедельник
    {
        const got = getWeekStart(new Date(Date.UTC(2026, 5, 21)));
        const exp = '2026-06-15';
        out.push({id: 'sunday', label: '2. getWeekStart(вс 21.06) → пн 15.06', ok: got === exp, details: `${got} vs ${exp}`});
    }

    // 3. Переход через год: 01.01.2027 (пятница) → 28.12.2026
    {
        const got = getWeekStart(new Date(Date.UTC(2027, 0, 1)));
        const exp = '2026-12-28';
        out.push({id: 'year_boundary', label: '3. getWeekStart(пт 01.01.2027) → пн 28.12.2026', ok: got === exp, details: `${got} vs ${exp}`});
    }

    // 4. formatWeekLabel внутри месяца
    {
        const today = new Date(Date.UTC(2026, 5, 19));
        const got = formatWeekLabel('2026-06-15', today);
        const exp = '15–21 июня';
        out.push({id: 'label_in_month', label: '4. formatWeekLabel внутри июня', ok: got === exp, details: `"${got}" vs "${exp}"`});
    }

    // 5. groupTriggersByPriority
    {
        const groups: TriggerGroup[] = [
            fakeGroup('silent', 2),
            fakeGroup('high', 3),
            fakeGroup('medium', 1),
            fakeGroup('low', 4),
        ];
        const got = groupTriggersByPriority(groups);
        const exp = {silent: 2, high: 3, medium: 1, low: 4};
        const ok = got.silent === exp.silent && got.high === exp.high && got.medium === exp.medium && got.low === exp.low;
        out.push({id: 'group_priority', label: '5. groupTriggersByPriority — 2/3/1/4', ok, details: `${JSON.stringify(got)} vs ${JSON.stringify(exp)}`});
    }

    return out;
}
