import Link from 'next/link';

export function ImportReport({added, updated}: {added: number; updated: number}) {
    return (
        <div className="border border-emerald-300 rounded-lg p-4 bg-emerald-50">
            <p className="font-medium mb-2">Готово.</p>
            <p>Добавлено: <strong>{added}</strong> · Обновлено: <strong>{updated}</strong></p>
            <Link href="/clients" className="inline-block mt-3 px-4 py-2 rounded-md bg-cyan-600 text-white">
                Перейти к клиентам
            </Link>
        </div>
    );
}
