import {clsx} from 'clsx';
import type {LucideIcon} from 'lucide-react';
import type {SemanticTone} from '@/components/brand/semantic-icons';

type Props = {
    icon: LucideIcon;
    tone: SemanticTone;
    label?: string;
    className?: string;
};

const tones: Record<SemanticTone, string> = {
    neutral: 'border-line bg-white/[.025] text-tx-2',
    cyan: 'border-cyan/30 bg-cyan/10 text-cyan',
    violet: 'border-violet/30 bg-violet/10 text-violet',
    green: 'border-green/30 bg-green/10 text-green',
    orange: 'border-orange/30 bg-orange/10 text-orange shadow-[var(--shadow-glow-orange)]',
};

export function IconBadge({icon: Icon, tone, label, className}: Props) {
    return (
        <span
            className={clsx(
                'inline-flex items-center gap-2 rounded-xl border px-2.5 py-2',
                tones[tone],
                className,
            )}
        >
            <Icon size={16} aria-hidden="true"/>
            {label && <span className="font-mono text-[12px] uppercase tracking-[0.08em]">{label}</span>}
        </span>
    );
}
