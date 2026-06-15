import {forwardRef, type ButtonHTMLAttributes} from 'react';
import {clsx} from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
};

const variantClasses: Record<Variant, string> = {
    primary:
        'bg-cyan text-bg shadow-[var(--shadow-glow)] hover:-translate-y-0.5 ring-1 ring-cyan/40',
    secondary:
        'glass text-tx hover:bg-bg-3',
    ghost:
        'text-tx-2 hover:text-tx hover:bg-bg-3',
};

const sizeClasses: Record<Size, string> = {
    sm: 'h-9 px-3 text-[13px] rounded-[var(--radius-sm)]',
    md: 'h-11 px-4 text-[15px] rounded-[var(--radius-md)]',
    lg: 'h-14 px-6 text-[17px] rounded-[var(--radius-md)] font-medium',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
    {variant = 'secondary', size = 'md', className, disabled, children, ...rest},
    ref,
) {
    return (
        <button
            ref={ref}
            disabled={disabled}
            className={clsx(
                'inline-flex items-center justify-center gap-2 font-sans transition-all duration-200 ease-[var(--ease-soft)]',
                'disabled:opacity-50 disabled:pointer-events-none',
                variantClasses[variant],
                sizeClasses[size],
                className,
            )}
            {...rest}
        >
            {children}
        </button>
    );
});
