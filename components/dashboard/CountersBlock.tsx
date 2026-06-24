import {
    Activity,
    CalendarCheck2,
    Plane,
    Snowflake,
    UserMinus,
    UserPlus,
    type LucideIcon,
} from 'lucide-react';
import {TRIGGER_GROUP_VISUALS, type SemanticTone} from '@/components/brand/semantic-icons';
import {Card} from '@/components/ui/Card';
import {IconBadge} from '@/components/ui/IconBadge';
import type {NowCounters} from '@/lib/weekly/counters';
import type {ClientStatus} from '@/lib/db/schema';
import type {GroupKey} from '@/lib/today/group';

const STATUS_TILES: Array<{key: ClientStatus; label: string; icon: LucideIcon}> = [
    {key: 'active', label: 'Активные', icon: Activity},
    {key: 'prebook', label: 'Предзапись', icon: CalendarCheck2},
    {key: 'cooling', label: 'Остывают', icon: Snowflake},
    {key: 'vacation', label: 'В отпуске', icon: Plane},
    {key: 'lead', label: 'Лиды', icon: UserPlus},
    {key: 'left', label: 'Ушли', icon: UserMinus},
];

const PRIORITY_TILES: Array<{key: GroupKey; label: string}> = [
    {key: 'silent', label: 'Тихие'},
    {key: 'high', label: 'Срочно'},
    {key: 'medium', label: 'Скоро'},
    {key: 'low', label: 'Низкий'},
];

function Tile({value, label, icon: Icon, tone = 'neutral'}: {
    value: number;
    label: string;
    icon: LucideIcon;
    tone?: SemanticTone;
}) {
    return (
        <Card className="h-full p-4 md:p-5">
            <IconBadge icon={Icon} tone={tone}/>
            <div className="mt-5 font-mono text-3xl text-tx">{value}</div>
            <div className="mt-1 text-[13px] text-tx-2">{label}</div>
        </Card>
    );
}

export function CountersBlock({counters}: {counters: NowCounters}) {
    return (
        <section className="space-y-6">
            <Card className="p-4 md:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-[13px] text-tx-2">Всего клиентов</p>
                        <p className="mt-2 font-mono text-2xl text-tx">{counters.totalClients}</p>
                    </div>
                    <div>
                        <p className="text-[13px] text-tx-2">Новых лидов за 7 дней</p>
                        <p className="mt-2 font-mono text-2xl text-tx">{counters.leadsLast7Days}</p>
                    </div>
                </div>
            </Card>

            <div>
                <h2 className="mb-3 text-tx-2 text-xs uppercase tracking-wide">По статусу</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                    {STATUS_TILES.map((status) => (
                        <Tile
                            key={status.key}
                            value={counters.statuses[status.key]}
                            label={status.label}
                            icon={status.icon}
                        />
                    ))}
                </div>
            </div>

            <div>
                <h2 className="mb-3 text-tx-2 text-xs uppercase tracking-wide">По приоритету триггеров</h2>
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {PRIORITY_TILES.map((p) => (
                        <Tile
                            key={p.key}
                            value={counters.triggersByPriority[p.key]}
                            label={p.label}
                            icon={TRIGGER_GROUP_VISUALS[p.key].icon}
                            tone={TRIGGER_GROUP_VISUALS[p.key].tone}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
