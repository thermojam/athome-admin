'use client';

import {useState, useOptimistic, useTransition} from 'react';
import Link from 'next/link';
import {Check, ChevronRight} from 'lucide-react';
import {TRIGGER_GROUP_VISUALS, TRIGGER_KIND_VISUALS} from '@/components/brand/semantic-icons';
import {Button} from '@/components/ui/Button';
import {IconBadge} from '@/components/ui/IconBadge';
import {Modal} from '@/components/ui/Modal';
import {StatusNotice} from '@/components/ui/StatusNotice';
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
    daysSince: number;
};

export type BoardGroup = {
    key: 'silent' | 'high' | 'medium' | 'low';
    title: string;
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
    const [copyPending, startCopyTransition] = useTransition();
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
        setSelected((prev) => {
            const next = new Set(prev);
            next.delete(clientId);
            return next;
        });
        startTransition(async () => {
            removeOptimistically(clientId);
            const res = await recordTouch(clientId, 'message');
            if (!res.ok) showToast(res.error);
        });
    }

    function handleCopy() {
        if (copyPending) return;
        startCopyTransition(async () => {
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
        });
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
            <div className="glass mb-4 flex items-center justify-between gap-3 rounded-2xl p-3 md:p-4">
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
                    loading={copyPending}
                    onClick={handleCopy}
                >
                    Скопировать для Claude{selected.size > 0 ? ` (${selected.size})` : ''}
                </Button>
            </div>

            <div className="flex flex-col gap-6">
                {optimisticGroups.map((g) => {
                    const GroupIcon = TRIGGER_GROUP_VISUALS[g.key].icon;
                    const groupTone = TRIGGER_GROUP_VISUALS[g.key].tone;

                    return (
                    <section key={g.key}>
                        <h2 className="mb-4 flex items-center gap-3">
                            <IconBadge icon={GroupIcon} tone={groupTone}/>
                            <span className="font-display uppercase text-[18px]">{g.title}</span>
                            <span className="font-mono text-[12px] text-tx-3">{g.entries.length}</span>
                        </h2>
                        <div className="glass glass-strong overflow-hidden">
                            {g.entries.map((e) => {
                                const visual = TRIGGER_KIND_VISUALS[e.triggerKind];

                                return (
                                <div
                                    key={e.clientId}
                                    className="surface-row first:border-t-0 px-4 py-4 md:px-5"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.has(e.clientId)}
                                        onChange={() => toggle(e.clientId)}
                                        className="h-4 w-4 rounded border-line bg-bg-3 accent-cyan shrink-0"
                                        aria-label={`Выбрать ${e.name}`}
                                    />
                                    <IconBadge icon={visual.icon} tone={visual.tone} className="shrink-0"/>
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
                                        className="shrink-0 inline-flex items-center gap-1.5 text-[12px] text-green hover:text-tx px-2 py-1 rounded-[var(--radius-sm)] hover:bg-bg-3 disabled:opacity-50"
                                        aria-label={`Отметить сообщением: ${e.name}`}
                                    >
                                        <Check size={15} aria-hidden="true"/>
                                        <span>Отметить</span>
                                    </button>
                                    <ChevronRight size={16} className="text-tx-3 shrink-0"/>
                                </div>
                            );
                            })}
                        </div>
                    </section>
                    );
                })}
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
                <div className="fixed bottom-24 md:bottom-6 right-6 z-50">
                    <StatusNotice tone="success">
                        {toast}
                    </StatusNotice>
                </div>
            )}
        </>
    );
}
