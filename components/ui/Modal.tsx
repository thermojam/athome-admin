'use client';

import {useEffect, type ReactNode} from 'react';

type Props = {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
};

export function Modal({open, onClose, title, children}: Props) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="glass w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={title}
            >
                <h2 className="font-display uppercase text-[18px] tracking-wide mb-4">{title}</h2>
                {children}
            </div>
        </div>
    );
}
