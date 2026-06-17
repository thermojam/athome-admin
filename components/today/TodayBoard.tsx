'use client';

import {useState, useOptimistic, useTransition} from 'react';
import Link from 'next/link';
import {ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/Button';
import {Modal} from '@/components/ui/Modal';
import {recordTouch} from '@/lib/touches/actions';
import {buildExportForSelection} from '@/lib/export/actions';
import {TRIGGER_LABELS, type TriggerKind, type TriggerPriority} from '@/lib/triggers/compute';
import {profileLabel} from '@/lib/clients/labels';
import type {ClientProfile} from '@/lib/db/schema';

export type BoardEntry = {
    clientId: string;
    name: string;
    profile: ClientProfile | null;
    triggerKind: TriggerKind;
    priority: TriggerPriority;
    emoji: string;
    daysSince: number;
};

export type BoardGroup = {
    key: 'silent' | 'high' | 'medium' | 'low';
    title: string;
    emoji: string;
    entries: BoardEntry[];
};

type ModalState = {
    open: boolean;
    missing: {id: string; name: string}[];
    partial: string | null;
};

const EMPTY_MODAL: ModalState = {open: false, missing: [], partial: null};

export function TodayBoard({groups}: {groups: BoardGroup[]}) {
    const [optimisticGroups, removeOptimistically] = useOptimistic<BoardGroup[], string>(
        groups,
        (state, clientId) => state
            .map((g) => ({...g, entries: g.entries.filter((e) => e.clientId !== clientId)}))
            .filter((g) => g.entries.length > 0),
    );
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [pending, startTransition] = useTransition();
    const [modal, setModal] = useState<ModalState>(EMPTY_MODAL);
    const [toast, setToast] = useState<string | null>(null);

    const allIds = optimisticGroups.flatMap((g) => g.entries.map((e) => e.clientId));
    const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

    function toggle(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleAll() {
        if (allSelected) setSelected(new Set());
        else setSelected(new Set(allIds));
    }

    function showToast(msg: string) {
        setToast(msg);
        window.setTimeout(() => setToast(null), 3000);
    }

    function quickTouch(clientId: string) {
        startTransition(async () => {
            removeOptimistically(clientId);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(clientId);
                return next;
            });
            const res = await recordTouch(clientId, 'message');
            if (!res.ok) showToast(res.error);
        });
    }

    async function handleCopy() {
        const ids = [...selected];
        const {text, missing} = await buildExportForSelection(ids);
        if (missing.length > 0) {
            setModal({open: true, missing, partial: text || null});
            return;
        }
        if (text === '') {
            showToast('Нечего копировать.');
            return;
        }
        await navigator.clipboard.writeText(text);
        setSelected(new Set());
        showToast('В буфере. Вставляй в Claude.');
    }

    async function copyPartial() {
        if (!modal.partial) {
            setModal(EMPTY_MODAL);
            return;
        }
        await navigator.clipboard.writeText(modal.partial);
        setSelected(new Set());
        setModal(EMPTY_MODAL);
        showToast('Скопировано без клиентов без факта.');
    }

    return (
        <>
            <div className="flex items-center justify-between mb-4 gap-3">
                <label className="inline-flex items-center gap-2 text-tx-2 text-[13px] cursor-pointer">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-line bg-bg-3 accent-cyan"
                    />
                    <span>Выбрать все</span>
                </label>
                <Button
                    variant="primary"
                    size="md"
                    disabled={selected.size === 0 || pending}
                    onClick={handleCopy}
                >
                    Скопировать для Claude{selected.size > 0 ? ` (${selected.size})` : ''}
                </Button>
            </div>

            <div className="flex flex-col gap-6">
                {optimisticGroups.map((g) => (
                    <section key={g.key}>
                        <h2 className="font-display uppercase text-[15px] tracking-wide text-tx-2 mb-3 flex items-center gap-2">
                            <span aria-hidden="true">{g.emoji}</span>
                            <span>{g.title}</span>
                            <span className="text-tx-3 font-mono text-[12px]">· {g.entries.length}</span>
                        </h2>
                        <div className="glass overflow-hidden">
                            {g.entries.map((e) => (
                                <div
                                    key={e.clientId}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-bg-3 transition-colors border-t hairline first:border-t-0"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.has(e.clientId)}
                                        onChange={() => toggle(e.clientId)}
                                        className="h-4 w-4 rounded border-line bg-bg-3 accent-cyan shrink-0"
                                        aria-label={`Выбрать ${e.name}`}
                                    />
                                    <span className="text-[20px] leading-none w-6 text-center" aria-hidden="true">{e.emoji}</span>
                                    <Link href={`/clients/${e.clientId}`} className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-tx text-[15px] font-medium truncate">{e.name}</span>
                                            {e.profile && (
                                                <span className="text-tx-3 text-[12px] hidden md:inline">{profileLabel(e.profile)}</span>
                                            )}
                                        </div>
                                        <div className="text-tx-2 text-[12px] font-mono mt-0.5">
                                            {TRIGGER_LABELS[e.triggerKind]} · {Number.isFinite(e.daysSince) ? `${e.daysSince}д` : '∞'} без касания
                                        </div>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => quickTouch(e.clientId)}
                                        disabled={pending}
                                        className="shrink-0 text-[12px] text-green hover:text-tx px-2 py-1 rounded-[var(--radius-sm)] hover:bg-bg-3 disabled:opacity-50"
                                        aria-label={`Отметить сообщением: ${e.name}`}
                                    >
                                        ✓ Отметил
                                    </button>
                                    <ChevronRight size={16} className="text-tx-3 shrink-0"/>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <Modal
                open={modal.open}
                onClose={() => setModal(EMPTY_MODAL)}
                title="Без личного факта"
            >
                <p className="text-tx-2 text-[14px] mb-4">
                    У этих клиентов нет личного факта — без него сообщение не соберётся. Допиши факт в карточке или скопируй без них.
                </p>
                <ul className="flex flex-col gap-1 mb-6">
                    {modal.missing.map((m) => (
                        <li key={m.id}>
                            <Link href={`/clients/${m.id}`} className="text-cyan hover:underline text-[14px]">
                                {m.name}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" size="md" onClick={() => setModal(EMPTY_MODAL)}>
                        Допишу факт
                    </Button>
                    {modal.partial && (
                        <Button variant="primary" size="md" onClick={copyPartial}>
                            Скопировать без них
                        </Button>
                    )}
                </div>
            </Modal>

            {toast && (
                <div
                    role="status"
                    className="fixed bottom-24 md:bottom-6 right-6 z-50 glass px-4 py-3 text-[13px] text-tx"
                >
                    {toast}
                </div>
            )}
        </>
    );
}
