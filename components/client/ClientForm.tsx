'use client';

import {useActionState} from 'react';
import {Input} from '@/components/ui/Input';
import {Select} from '@/components/ui/Select';
import {Textarea} from '@/components/ui/Textarea';
import {Button} from '@/components/ui/Button';
import {CLIENT_PROFILES, CLIENT_STATUSES, CLIENT_SOURCES, type Client} from '@/lib/db/schema';
import {PROFILE_LABELS, STATUS_LABELS, SOURCE_LABELS} from '@/lib/clients/labels';
import type {ActionResult} from '@/lib/clients/actions';

type Props = {
    action: (state: ActionResult | null, formData: FormData) => Promise<ActionResult>;
    initial?: Client;
    submitLabel: string;
};

export function ClientForm({action, initial, submitLabel}: Props) {
    const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);
    const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};

    return (
        <form action={formAction} className="flex flex-col gap-4">
            <Input
                name="name"
                label="Имя"
                required
                defaultValue={initial?.name ?? ''}
                error={fieldErrors.name}
                autoFocus={!initial}
            />
            <Input
                name="contact"
                label="Контакт (TG-ник, телефон)"
                defaultValue={initial?.contact ?? ''}
                error={fieldErrors.contact}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select name="status" label="Статус" defaultValue={initial?.status ?? 'lead'} error={fieldErrors.status}>
                    {CLIENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                </Select>
                <Select name="profile" label="Профиль" defaultValue={initial?.profile ?? ''} error={fieldErrors.profile}>
                    <option value="">— не выбран —</option>
                    {CLIENT_PROFILES.map((p) => (
                        <option key={p} value={p}>{PROFILE_LABELS[p]}</option>
                    ))}
                </Select>
            </div>
            <Select name="source" label="Источник" defaultValue={initial?.source ?? ''} error={fieldErrors.source}>
                <option value="">— не выбран —</option>
                {CLIENT_SOURCES.map((s) => (
                    <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                ))}
            </Select>
            <Textarea
                name="personalFact"
                label="Личный факт (нужен для экспорта в Claude)"
                defaultValue={initial?.personalFact ?? ''}
                error={fieldErrors.personalFact}
                rows={2}
            />
            <Input
                name="goal"
                label="Цель"
                defaultValue={initial?.goal ?? ''}
                error={fieldErrors.goal}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                    name="sessionsPerWeek"
                    type="number"
                    min={0}
                    max={7}
                    label="Тренировок/неделю"
                    defaultValue={initial?.sessionsPerWeek?.toString() ?? ''}
                    error={fieldErrors.sessionsPerWeek}
                />
                <Input
                    name="lastSessionDate"
                    type="date"
                    label="Последняя тренировка"
                    defaultValue={initial?.lastSessionDate ?? ''}
                    error={fieldErrors.lastSessionDate}
                />
                <label className="flex items-center gap-2 mt-6">
                    <input
                        type="checkbox"
                        name="septemberBooking"
                        defaultChecked={initial?.septemberBooking ?? false}
                        className="w-4 h-4 accent-[var(--color-cyan)]"
                    />
                    <span className="text-[15px] text-tx">Бронь на сентябрь</span>
                </label>
            </div>
            <Textarea
                name="note"
                label="Заметка"
                defaultValue={initial?.note ?? ''}
                error={fieldErrors.note}
                rows={3}
            />
            {state && !state.ok && !Object.keys(fieldErrors).length && (
                <p className="text-[13px] text-orange">{state.error}</p>
            )}
            <Button type="submit" variant="primary" size="lg" disabled={pending} className="mt-2">
                {pending ? 'Сохраняю…' : submitLabel}
            </Button>
        </form>
    );
}
