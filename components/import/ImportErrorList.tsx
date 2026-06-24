import type {RowError} from '@/lib/csv/validate';
import {StatusNotice} from '@/components/ui/StatusNotice';

export function ImportErrorList({errors}: {errors: RowError[]}) {
    if (errors.length === 0) return null;
    return (
        <StatusNotice tone="error" title={`Ошибки в файле (${errors.length})`} className="items-start">
            <ul className="space-y-1 text-sm">
                {errors.slice(0, 50).map((e, i) => (
                    <li key={i}>
                        <span className="font-mono text-tx-3">Строка {e.lineNo}</span> · <span className="font-medium text-tx">{e.field}</span>: {e.message}
                    </li>
                ))}
                {errors.length > 50 && <li className="text-tx-3">...и ещё {errors.length - 50}.</li>}
            </ul>
        </StatusNotice>
    );
}
