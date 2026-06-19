import type {RowError} from '@/lib/csv/validate';

export function ImportErrorList({errors}: {errors: RowError[]}) {
    if (errors.length === 0) return null;
    return (
        <div className="rounded-lg p-3 bg-bg-2 border border-line">
            <p className="font-medium mb-2 text-pink">Ошибки в файле ({errors.length}):</p>
            <ul className="text-sm space-y-1 text-tx">
                {errors.slice(0, 50).map((e, i) => (
                    <li key={i}>
                        <span className="font-mono text-tx-3">Строка {e.lineNo}</span> · <span className="font-medium text-pink">{e.field}</span>: {e.message}
                    </li>
                ))}
                {errors.length > 50 && <li className="text-tx-3">...и ещё {errors.length - 50}.</li>}
            </ul>
        </div>
    );
}
