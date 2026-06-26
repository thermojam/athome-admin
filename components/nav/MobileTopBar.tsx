'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {BrandLogo} from '@/components/brand/BrandLogo';

const TITLES: Array<[string, string]> = [
    ['/clients', 'База'],
    ['/leads', 'Новый лид'],
    ['/dashboard', 'Панель'],
    ['/settings', 'Настройки'],
    ['/today', 'Сегодня'],
];

export function MobileTopBar() {
    const pathname = usePathname();
    const title = TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'Штаб';

    return (
        <header className="fixed inset-x-3 top-3 z-40 flex h-16 items-center gap-3 px-4 md:hidden glass">
            <Link href="/today" aria-label="Открыть Сегодня">
                <BrandLogo size={42}/>
            </Link>
            <span className="font-display text-[15px] uppercase tracking-[0.16em] text-tx">{title}</span>
        </header>
    );
}
