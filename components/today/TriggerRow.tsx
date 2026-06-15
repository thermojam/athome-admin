import Link from 'next/link';
import {ChevronRight} from 'lucide-react';
import type {TriggerEntry} from '@/lib/today/group';
import {TRIGGER_LABELS} from '@/lib/triggers/compute';
import {profileLabel} from '@/lib/clients/labels';

export function TriggerRow({entry}: {entry: TriggerEntry}) {
    const {client, trigger} = entry;
    return (
        <Link
            href={`/clients/${client.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-bg-3 transition-colors border-t hairline"
        >
            <span className="text-[20px] leading-none w-6 text-center" aria-hidden="true">{trigger.emoji}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-tx text-[15px] font-medium truncate">{client.name}</span>
                    {client.profile && (
                        <span className="text-tx-3 text-[12px] hidden md:inline">{profileLabel(client.profile)}</span>
                    )}
                </div>
                <div className="text-tx-2 text-[12px] font-mono mt-0.5">
                    {TRIGGER_LABELS[trigger.kind]} · {Number.isFinite(trigger.daysSince) ? `${trigger.daysSince}д` : '∞'} без касания
                </div>
            </div>
            <ChevronRight size={16} className="text-tx-3 shrink-0"/>
        </Link>
    );
}
