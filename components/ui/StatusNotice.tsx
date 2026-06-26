import {clsx} from 'clsx';
import {CircleAlert, CircleCheck, Info, type LucideIcon} from 'lucide-react';
import type {ReactNode} from 'react';

type Tone = 'success' | 'warning' | 'error' | 'info';

type Props = {
    tone: Tone;
    title?: string;
    children: ReactNode;
    icon?: LucideIcon;
    className?: string;
};

const defaults: Record<Tone, LucideIcon> = {
    success: CircleCheck,
    warning: CircleAlert,
    error: CircleAlert,
    info: Info,
};

const classes: Record<Tone, string> = {
    success: 'border-green/30 bg-green/5 text-green',
    warning: 'border-orange/30 bg-orange/5 text-orange',
    error: 'border-orange/40 bg-orange/8 text-orange',
    info: 'border-cyan/25 bg-cyan/5 text-cyan',
};

export function StatusNotice({tone, title, children, icon, className}: Props) {
    const Icon = icon ?? defaults[tone];

    return (
        <div
            role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
            className={clsx('flex gap-3 rounded-2xl border px-4 py-3', classes[tone], className)}
        >
            <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true"/>
            <div className="text-[13px]">
                {title && <p className="font-semibold text-tx">{title}</p>}
                <div className="text-tx-2">{children}</div>
            </div>
        </div>
    );
}
