'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {clsx} from 'clsx';
import type {ReactNode} from 'react';

type Props = {
    href: string;
    icon: ReactNode;
    children: ReactNode;
    className?: string;
};

export function NavLink({href, icon, children, className}: Props) {
    const pathname = usePathname();
    const active = pathname === href || pathname.startsWith(href + '/');

    return (
        <Link
            href={href}
            className={clsx(
                'flex items-center gap-3 h-11 px-3 rounded-[var(--radius-sm)] text-[15px] transition-colors',
                active
                    ? 'bg-white/[.055] text-tx ring-1 ring-cyan/20 shadow-[0_0_20px_rgb(44_230_255_/_0.08)]'
                    : 'text-tx-2 hover:bg-white/[.035] hover:text-tx',
                className,
            )}
        >
            <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
            <span className="truncate">{children}</span>
        </Link>
    );
}
