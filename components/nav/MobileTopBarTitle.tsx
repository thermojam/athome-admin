'use client';

import {usePathname} from 'next/navigation';

const TITLES: Array<[string, string]> = [
    ['/clients', 'База'],
    ['/leads', 'Новый лид'],
    ['/dashboard', 'Панель'],
    ['/settings', 'Настройки'],
    ['/today', 'Сегодня'],
];

export function MobileTopBarTitle() {
    const pathname = usePathname();
    const title = TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'Штаб';

    return (
        <span className="min-w-0 flex-1 truncate font-display text-[15px] uppercase tracking-[0.16em] text-tx">
            {title}
        </span>
    );
}
