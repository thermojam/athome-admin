import type {TriggerGroup} from '@/lib/today/group';
import {TriggerRow} from './TriggerRow';

export function TodayList({groups}: {groups: TriggerGroup[]}) {
    return (
        <div className="flex flex-col gap-6">
            {groups.map((g) => (
                <section key={g.key}>
                    <h2 className="font-display uppercase text-[15px] tracking-wide text-tx-2 mb-3 flex items-center gap-2">
                        <span aria-hidden="true">{g.emoji}</span>
                        <span>{g.title}</span>
                        <span className="text-tx-3 font-mono text-[12px]">· {g.entries.length}</span>
                    </h2>
                    <div className="glass overflow-hidden">
                        {g.entries.map((e) => (
                            <TriggerRow key={e.client.id} entry={e}/>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
