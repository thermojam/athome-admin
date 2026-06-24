import {runSanityCases} from '@/lib/weekly/sanity-cases';

export default function DashboardSanityPage() {
    const results = runSanityCases();
    const passed = results.filter((r) => r.ok).length;

    return (
        <div className="p-6 max-w-4xl">
            <h1 className="text-2xl font-semibold mb-2">Dashboard sanity</h1>
            <p className="mb-4 text-tx-2">{passed}/{results.length} зелёных.</p>
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b border-line text-left">
                        <th className="py-2 pr-3 w-12">#</th>
                        <th className="py-2 pr-3">Кейс</th>
                        <th className="py-2 pr-3 w-20">Статус</th>
                        <th className="py-2 pr-3">Детали</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((r, i) => (
                        <tr key={r.id} className="border-b border-line-soft align-top">
                            <td className="py-2 pr-3 text-tx-3">{i + 1}</td>
                            <td className="py-2 pr-3 text-tx">{r.label}</td>
                            <td className="py-2 pr-3">
                                <span className={r.ok ? 'text-green' : 'text-orange'}>
                                    {r.ok ? 'Пройдено' : 'Ошибка'}
                                </span>
                            </td>
                            <td className="py-2 pr-3 font-mono text-xs text-tx-2">{r.details}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
