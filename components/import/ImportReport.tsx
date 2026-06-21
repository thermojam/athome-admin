import Link from 'next/link';
import {Button} from '@/components/ui/Button';

export function ImportReport({added, updated}: {added: number; updated: number}) {
    return (
        <div className="rounded-lg p-4 bg-bg-2 border border-line">
            <p className="font-medium mb-2 text-green">Готово.</p>
            <p className="text-tx">Добавлено: <strong>{added}</strong> · Обновлено: <strong>{updated}</strong></p>
            <Link href="/clients" className="inline-block mt-3">
                <Button variant="primary" size="md">Перейти к клиентам</Button>
            </Link>
        </div>
    );
}
