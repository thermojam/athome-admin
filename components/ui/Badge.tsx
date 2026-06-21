import type {HTMLAttributes} from 'react';
import {clsx} from 'clsx';

type Tone = 'neutral' | 'cyan' | 'violet' | 'pink' | 'green' | 'orange';

type Props = HTMLAttributes<HTMLSpanElement> & {
    tone?: Tone;
};

const toneClasses: Record<Tone, string> = {
    neutral: 'bg-bg-3 text-tx-2',
    cyan: 'bg-cyan/10 text-cyan ring-1 ring-cyan/30',
    violet: 'bg-violet/10 text-violet ring-1 ring-violet/30',
    pink: 'bg-pink/10 text-pink ring-1 ring-pink/30',
    green: 'bg-green/10 text-green ring-1 ring-green/30',
    orange: 'bg-orange/10 text-orange ring-1 ring-orange/30',
};

export function Badge({tone = 'neutral', className, children, ...rest}: Props) {
    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1 px-2 h-6 rounded-[var(--radius-sm)] text-[12px] font-mono tracking-[0.02em]',
                toneClasses[tone],
                className,
            )}
            {...rest}
        >
            {children}
        </span>
    );
}
