import type {ReactNode} from 'react';

type Props = {
    title: string;
    kicker?: string;
    meta?: ReactNode;
    action?: ReactNode;
};

export function PageHeader({title, kicker, meta, action}: Props) {
    return (
        <header className="mb-8 flex items-end justify-between gap-5 md:mb-10">
            <div>
                {kicker && <p className="section-kicker mb-3">{kicker}</p>}
                <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] uppercase leading-none tracking-[-0.02em]">
                    {title}
                </h1>
                {meta && (
                    <div className="mt-3 font-mono text-[12px] uppercase tracking-[0.12em] text-tx-3">
                        {meta}
                    </div>
                )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </header>
    );
}
