'use client';

import {useRouter, useSearchParams, usePathname} from 'next/navigation';
import {useTransition} from 'react';
import {Input} from '@/components/ui/Input';
import {CLIENT_STATUSES, CLIENT_PROFILES, type ClientStatus, type ClientProfile} from '@/lib/db/schema';
import {STATUS_LABELS, PROFILE_LABELS} from '@/lib/clients/labels';

export function ClientFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();
    const [pending, start] = useTransition();

    const search = params.get('q') ?? '';
    const statuses = new Set((params.get('status') ?? '').split(',').filter(Boolean));
    const profiles = new Set((params.get('profile') ?? '').split(',').filter(Boolean));
    const includeDeleted = params.get('deleted') === '1';

    function update(next: URLSearchParams) {
        start(() => router.replace(`${pathname}?${next.toString()}`));
    }

    function setSearch(v: string) {
        const next = new URLSearchParams(params.toString());
        if (v.trim() === '') next.delete('q');
        else next.set('q', v.trim());
        update(next);
    }

    function toggleStatus(s: ClientStatus) {
        const next = new URLSearchParams(params.toString());
        const current = new Set(statuses);
        if (current.has(s)) current.delete(s);
        else current.add(s);
        if (current.size === 0) next.delete('status');
        else next.set('status', Array.from(current).join(','));
        update(next);
    }

    function toggleProfile(p: ClientProfile) {
        const next = new URLSearchParams(params.toString());
        const current = new Set(profiles);
        if (current.has(p)) current.delete(p);
        else current.add(p);
        if (current.size === 0) next.delete('profile');
        else next.set('profile', Array.from(current).join(','));
        update(next);
    }

    function toggleDeleted() {
        const next = new URLSearchParams(params.toString());
        if (includeDeleted) next.delete('deleted');
        else next.set('deleted', '1');
        update(next);
    }

    return (
        <div className={`flex flex-col gap-3 ${pending ? 'opacity-60' : ''}`}>
            <Input
                name="q"
                placeholder="Поиск по имени или контакту"
                defaultValue={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
            />
            <div className="flex flex-wrap gap-2">
                {CLIENT_STATUSES.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => toggleStatus(s)}
                        className={`px-3 h-8 rounded-[var(--radius-sm)] text-[13px] border border-line transition-colors ${
                            statuses.has(s) ? 'bg-cyan/10 border-cyan/40 text-cyan' : 'bg-bg-3 text-tx-2 hover:text-tx'
                        }`}
                    >
                        {STATUS_LABELS[s]}
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap gap-2">
                {CLIENT_PROFILES.map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => toggleProfile(p)}
                        className={`px-3 h-8 rounded-[var(--radius-sm)] text-[13px] border border-line transition-colors ${
                            profiles.has(p) ? 'bg-violet/10 border-violet/40 text-violet' : 'bg-bg-3 text-tx-2 hover:text-tx'
                        }`}
                    >
                        {PROFILE_LABELS[p]}
                    </button>
                ))}
            </div>
            <label className="flex items-center gap-2 text-[13px] text-tx-2">
                <input type="checkbox" checked={includeDeleted} onChange={toggleDeleted} className="w-4 h-4 accent-[var(--color-cyan)]"/>
                Показывать удалённых
            </label>
        </div>
    );
}
