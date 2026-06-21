import Link from 'next/link';
import {Plus} from 'lucide-react';

export function MobileFab() {
    return (
        <Link
            href="/leads/new"
            className="md:hidden fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-cyan text-bg shadow-[var(--shadow-glow)] flex items-center justify-center"
            aria-label="Новый лид"
        >
            <Plus size={28}/>
        </Link>
    );
}
