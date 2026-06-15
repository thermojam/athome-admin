import type {HTMLAttributes} from 'react';
import {clsx} from 'clsx';

type Props = HTMLAttributes<HTMLDivElement>;

export function Card({className, children, ...rest}: Props) {
    return (
        <div className={clsx('glass p-5', className)} {...rest}>
            {children}
        </div>
    );
}
