import Link from 'next/link';
import type {Client, ClientProfile, ClientStatus} from '@/lib/db/schema';
import {Badge} from '@/components/ui/Badge';
import {Card} from '@/components/ui/Card';
import {PROFILE_LABELS, statusLabel, sourceLabel} from '@/lib/clients/labels';

const profileTone: Record<ClientProfile, 'green' | 'pink' | 'cyan'> = {
    health: 'green',
    form: 'pink',
    energy: 'cyan',
};

const statusTone: Partial<Record<ClientStatus, 'orange' | 'violet' | 'neutral'>> = {
    lead: 'orange',
    prebook: 'violet',
};

export function ClientsList({clients}: {clients: Client[]}) {
    if (clients.length === 0) {
        return (
            <p className="text-tx-2 py-12 text-center">
                Никого не нашлось. Сбрось фильтры или добавь клиента кнопкой «+ Клиент».
            </p>
        );
    }

    return (
        <>
            {/* Desktop таблица */}
            <div className="mt-6 hidden overflow-hidden glass glass-strong md:block">
                <table className="w-full text-[14px]">
                    <thead>
                    <tr className="text-left text-tx-2 text-[12px] font-mono uppercase tracking-wider">
                        <th className="py-2 px-3 font-normal">Имя</th>
                        <th className="py-2 px-3 font-normal">Статус</th>
                        <th className="py-2 px-3 font-normal">Профиль</th>
                        <th className="py-2 px-3 font-normal">Источник</th>
                        <th className="py-2 px-3 font-normal">Контакт</th>
                    </tr>
                    </thead>
                    <tbody>
                    {clients.map((c) => (
                        <tr key={c.id} className="border-t hairline hover:bg-bg-3 transition-colors">
                            <td className="py-3 px-3">
                                <Link href={`/clients/${c.id}`} className="text-tx hover:text-cyan">{c.name}</Link>
                                {c.deletedAt && <span className="ml-2 text-tx-3 text-[12px]">(удалён)</span>}
                            </td>
                            <td className="py-3 px-3">
                                <Badge tone={statusTone[c.status] ?? 'neutral'}>{statusLabel(c.status)}</Badge>
                            </td>
                            <td className="py-3 px-3">
                                {c.profile && (
                                    <Badge tone={profileTone[c.profile]} dot>
                                        {PROFILE_LABELS[c.profile]}
                                    </Badge>
                                )}
                            </td>
                            <td className="py-3 px-3 text-tx-2">{sourceLabel(c.source)}</td>
                            <td className="py-3 px-3 text-tx-2 font-mono text-[13px]">{c.contact ?? '—'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile карточки */}
            <ul className="md:hidden flex flex-col gap-3 mt-4">
                {clients.map((c) => (
                    <li key={c.id}>
                        <Card className="p-4">
                            <Link href={`/clients/${c.id}`} className="block">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className="text-tx text-[16px] font-medium">{c.name}</span>
                                    <Badge tone={statusTone[c.status] ?? 'neutral'}>{statusLabel(c.status)}</Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-tx-2 text-[13px]">
                                    {c.profile && (
                                        <Badge tone={profileTone[c.profile]} dot>
                                            {PROFILE_LABELS[c.profile]}
                                        </Badge>
                                    )}
                                    {c.contact && <span className="font-mono">{c.contact}</span>}
                                </div>
                                {c.deletedAt && <p className="text-tx-3 text-[12px] mt-2">удалён</p>}
                            </Link>
                        </Card>
                    </li>
                ))}
            </ul>
        </>
    );
}
