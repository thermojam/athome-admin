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
                    'resize-y rounded-2xl border border-line bg-bg-3/80 px-3 py-2 text-tx',
                    'focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/30',
                    'transition-all duration-150 ease-[var(--ease-soft)]',
                    error && 'border-orange focus:border-orange focus:ring-orange/30',
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
