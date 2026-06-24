import Link from 'next/link';
import {Plus} from 'lucide-react';

export function TopBar() {
    return (
        <div className="hidden md:flex items-center justify-end px-8 pt-4">
            <div className="glass flex items-center rounded-[var(--radius-lg)] p-2">
                <Link
                    href="/leads/new"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-bold text-tx-2 transition-[transform,box-shadow,background-color,border-color,opacity] duration-200 ease-[var(--ease-soft)] hover:bg-white/[.035] hover:text-tx"
                >
                    <Plus size={16}/>
                    Лид
                </Link>
            </div>
        </div>
    );
}
