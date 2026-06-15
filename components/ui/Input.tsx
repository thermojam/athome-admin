import { forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label htmlFor={inputId} className="flex flex-col gap-1.5">
      {label && (
        <span className="text-[13px] text-tx-2 font-medium tracking-[0.01em]">{label}</span>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'h-11 px-3 rounded-[var(--radius-sm)] bg-bg-3 text-tx',
          'border border-line focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/40',
          'transition-all duration-150 ease-[var(--ease-soft)]',
          error && 'border-orange focus:border-orange focus:ring-orange/40',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-err` : undefined}
        {...rest}
      />
      {error && (
        <span id={`${inputId}-err`} className="text-[13px] text-orange">
          {error}
        </span>
      )}
    </label>
  );
});
