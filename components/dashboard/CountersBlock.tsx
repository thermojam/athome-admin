import type {NowCounters} from '@/lib/weekly/counters';
import type {ClientStatus} from '@/lib/db/schema';

const STATUS_LABELS: Record<ClientStatus, string> = {
    active: 'Активные',
    prebook: 'Предзапись',
    cooling: 'Остывают',
    vacation: 'В отпуске',
    lead: 'Лиды',
    left: 'Ушли',
};

const STATUS_ORDER: ClientStatus[] = ['active', 'prebook', 'cooling', 'vacation', 'lead', 'left'];

const PRIORITY_TILES: Array<{key: 'silent' | 'high' | 'medium' | 'low'; label: string}> = [
    {key: 'silent', label: 'Тихие'},
    {key: 'high', label: 'Срочно'},
    {key: 'medium', label: 'Скоро'},
    {key: 'low', label: 'Низкий'},
];

function Tile({value, label, accent}: {value: number; label: string; accent?: boolean}) {
    return (
        <div className={`glass rounded-lg p-4 flex flex-col gap-1 ${accent ? 'ring-1 ring-cyan/40' : ''}`}>
            <div className="text-3xl font-semibold text-tx">{value}</div>
            <div className="text-xs text-tx-2">{label}</div>
        </div>
    );
}

export function CountersBlock({counters}: {counters: NowCounters}) {
    return (
        <section className="space-y-3">
            <p className="text-tx-2 text-sm">
                Всего клиентов: <span className="text-tx font-medium">{counters.totalClients}</span>
                {' · '}
                Новых лидов за 7 дней: <span className="text-tx font-medium">{counters.leadsLast7Days}</span>
            </p>

            <div>
                <h2 className="text-tx-2 text-xs uppercase tracking-wide mb-2">По статусу</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {STATUS_ORDER.map((s) => (
                        <Tile key={s} value={counters.statuses[s]} label={STATUS_LABELS[s]} />
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-tx-2 text-xs uppercase tracking-wide mb-2">По приоритету триггеров</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {PRIORITY_TILES.map((p) => (
                        <Tile
                            key={p.key}
                            value={counters.triggersByPriority[p.key]}
                            label={p.label}
                            accent={p.key === 'high' || p.key === 'silent'}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
