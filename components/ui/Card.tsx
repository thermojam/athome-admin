import type {HTMLAttributes} from 'react';
import {clsx} from 'clsx';

type Props = HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'strong';
};

export function Card({className, children, variant = 'default', ...rest}: Props) {
    return (
        <div className={clsx('glass p-5', variant === 'strong' && 'glass-strong', className)} {...rest}>
            {children}
        </div>
    );
}
