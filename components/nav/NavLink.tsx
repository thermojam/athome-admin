'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {clsx} from 'clsx';
import type {ReactNode} from 'react';

type Props = {
    href: string;
    icon: ReactNode;
    children: ReactNode;
};

export function NavLink({href, icon, children}: Props) {
    const pathname = usePathname();
    const active = pathname === href || pathname.startsWith(href + '/');

    return (
        <Link
            href={href}
            className={clsx(
                'flex items-center gap-3 h-11 px-3 rounded-[var(--radius-sm)] text-[15px] transition-colors',
                active ? 'bg-bg-3 text-tx' : 'text-tx-2 hover:bg-bg-3 hover:text-tx',
            )}
        >
            <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
            <span>{children}</span>
        </Link>
    );
}
