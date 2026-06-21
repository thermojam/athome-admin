import type {CsvRow} from '@/lib/csv/validate';

const COLS: Array<[keyof CsvRow, string]> = [
    ['name', 'Имя'],
    ['contact', 'Контакт'],
    ['status', 'Статус'],
    ['profile', 'Профиль'],
    ['source', 'Источник'],
    ['lastSessionDate', 'Посл. трен.'],
    ['lastTouchDate', 'Посл. касание'],
];

export function ImportPreviewTable({rows}: {rows: CsvRow[]}) {
    if (rows.length === 0) return <p className="text-tx-2 text-sm">Нет валидных строк для превью.</p>;
    return (
        <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-bg-2 border-b border-line text-left text-tx-2">
                        {COLS.map(([, label]) => (
                            <th key={label} className="py-2 px-3 font-medium">{label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="border-b border-line-soft last:border-0">
                            {COLS.map(([key, label]) => (
                                <td key={label} className="py-2 px-3 font-mono text-xs text-tx">
                                    {String(r[key] ?? '')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
