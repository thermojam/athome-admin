import Link from 'next/link';
import {Button} from '@/components/ui/Button';
import {StatusNotice} from '@/components/ui/StatusNotice';

export function ImportReport({added, updated}: {added: number; updated: number}) {
    return (
        <div className="glass glass-strong space-y-4 rounded-[var(--radius-xl)] p-6">
            <StatusNotice tone="success" title="Импорт завершён">
                Добавлено: <strong>{added}</strong> · Обновлено: <strong>{updated}</strong>
            </StatusNotice>
            <Link href="/clients" className="inline-block">
                <Button variant="primary" size="lg">Перейти к клиентам</Button>
            </Link>
        </div>
    );
}
