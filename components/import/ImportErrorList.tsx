import type {RowError} from '@/lib/csv/validate';

export function ImportErrorList({errors}: {errors: RowError[]}) {
    if (errors.length === 0) return null;
    return (
        <div className="border border-rose-300 rounded-lg p-3 bg-rose-50">
            <p className="font-medium mb-2">Ошибки в файле ({errors.length}):</p>
            <ul className="text-sm space-y-1">
                {errors.slice(0, 50).map((e, i) => (
                    <li key={i}>
                        <span className="font-mono text-zinc-500">Строка {e.lineNo}</span> · <span className="font-medium">{e.field}</span>: {e.message}
                    </li>
                ))}
                {errors.length > 50 && <li className="text-zinc-500">...и ещё {errors.length - 50}.</li>}
            </ul>
        </div>
    );
}
