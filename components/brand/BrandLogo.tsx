import {clsx} from 'clsx';
import {useId} from 'react';

type Props = {
    size?: number;
    className?: string;
    decorative?: boolean;
};

export function BrandLogo({size = 64, className, decorative = true}: Props) {
    const uid = useId().replaceAll(':', '');
    const gradientId = `brand-stroke-${uid}`;
    const glowId = `brand-glow-${uid}`;

    return (
        <svg
            viewBox="0 0 82 81"
            width={size}
            height={size}
            className={clsx('shrink-0 overflow-visible', className)}
            role={decorative ? undefined : 'img'}
            aria-hidden={decorative ? true : undefined}
            aria-label={decorative ? undefined : 'Тренер у дома'}
        >
            <defs>
                <linearGradient id={gradientId} x1="8" y1="8" x2="73" y2="72">
                    <stop stopColor="#2CE6FF"/>
                    <stop offset="1" stopColor="#4D7DFF"/>
                </linearGradient>
                <filter id={glowId} x="-35%" y="-35%" width="170%" height="170%">
                    <feGaussianBlur stdDeviation="2.2" result="blur"/>
                    <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <g
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${glowId})`}
            >
                <path d="M9 68V35L37.5 9.5a5 5 0 0 1 6.5 0L73 35v33"/>
                <path d="M17 68V57a5 5 0 0 1 5-5h19M41 36v32M64 37 47 52.5 64 68"/>
            </g>
        </svg>
    );
}
