import type { ReactNode } from 'react';

type Props = {
  title: string;
  hint?: string;
  action?: ReactNode;
};

export function EmptyState({ title, hint, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 gap-3">
      <h2 className="font-display uppercase text-[22px] tracking-wide text-tx">
        {title}
      </h2>
      {hint && <p className="text-tx-2 max-w-md">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
