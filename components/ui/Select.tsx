import {forwardRef, type SelectHTMLAttributes, type ReactNode} from 'react';
import {clsx} from 'clsx';

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    error?: string;
    children: ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
    {label, error, className, id, children, ...rest},
    ref,
) {
    const selectId = id ?? rest.name;
    return (
        <label htmlFor={selectId} className="flex flex-col gap-1.5">
            {label && (
                <span className="text-[13px] text-tx-2 font-medium tracking-[0.01em]">{label}</span>
            )}
            <select
                ref={ref}
                id={selectId}
                className={clsx(
                    'h-11 px-3 rounded-[var(--radius-sm)] bg-bg-3 text-tx',
                    'border border-line focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/40',
                    'transition-all duration-150 ease-[var(--ease-soft)]',
                    error && 'border-orange focus:border-orange focus:ring-orange/40',
                    className,
                )}
                aria-invalid={!!error}
                aria-describedby={error ? `${selectId}-err` : undefined}
                {...rest}
            >
                {children}
            </select>
            {error && (
                <span id={`${selectId}-err`} className="text-[13px] text-orange">{error}</span>
            )}
        </label>
    );
});
