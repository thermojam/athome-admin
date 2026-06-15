import {forwardRef, type TextareaHTMLAttributes} from 'react';
import {clsx} from 'clsx';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
    {label, error, className, id, ...rest},
    ref,
) {
    const taId = id ?? rest.name;
    return (
        <label htmlFor={taId} className="flex flex-col gap-1.5">
            {label && (
                <span className="text-[13px] text-tx-2 font-medium tracking-[0.01em]">{label}</span>
            )}
            <textarea
                ref={ref}
                id={taId}
                rows={rest.rows ?? 3}
                className={clsx(
                    'px-3 py-2 rounded-[var(--radius-sm)] bg-bg-3 text-tx resize-y',
                    'border border-line focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/40',
                    'transition-all duration-150 ease-[var(--ease-soft)]',
                    error && 'border-orange focus:border-orange focus:ring-orange/40',
                    className,
                )}
                aria-invalid={!!error}
                aria-describedby={error ? `${taId}-err` : undefined}
                {...rest}
            />
            {error && (
                <span id={`${taId}-err`} className="text-[13px] text-orange">{error}</span>
            )}
        </label>
    );
});
