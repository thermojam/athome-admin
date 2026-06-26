import {forwardRef, type ButtonHTMLAttributes} from 'react';
import {clsx} from 'clsx';
import {LoaderCircle} from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
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
    sm: 'h-9 px-3 text-[13px]',
    md: 'h-11 px-5 text-[15px]',
    lg: 'h-[52px] px-7 text-[16px]',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
    {variant = 'secondary', size = 'md', className, disabled, loading = false, children, ...rest},
    ref,
) {
    return (
        <button
            ref={ref}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={clsx(
                'relative inline-flex items-center justify-center gap-2 rounded-full font-sans font-bold',
                'transition-[transform,box-shadow,background-color,border-color,opacity] duration-200 ease-[var(--ease-soft)]',
                'disabled:pointer-events-none disabled:opacity-50',
                variantClasses[variant],
                sizeClasses[size],
                className,
            )}
            {...rest}
        >
            {loading && <LoaderCircle size={16} className="animate-spin" aria-hidden="true"/>}
            {children}
        </button>
    );
});
