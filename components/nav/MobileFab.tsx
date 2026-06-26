import Link from 'next/link';
import {Plus} from 'lucide-react';

export function MobileFab() {
    return (
        <Link
            href="/leads/new"
            className="md:hidden fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full glass text-cyan ring-1 ring-cyan/40 shadow-[0_0_28px_rgb(44_230_255_/_0.24)]"
            aria-label="Новый лид"
        >
            <Plus size={28}/>
        </Link>
    );
}
