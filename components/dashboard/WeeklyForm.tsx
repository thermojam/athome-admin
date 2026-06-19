'use client';

import {useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {upsertWeeklyStat} from '@/lib/weekly/actions';
import {Button} from '@/components/ui/Button';
import {formatWeekLabel} from '@/lib/weekly/week';
import type {WeeklyStat} from '@/lib/db/schema';

type Props = {
    weekStart: string;
    initial: WeeklyStat | null;
};

const NUMERIC_FIELDS: Array<{name: keyof WeeklyStat; label: string}> = [
    {name: 'leadsReception', label: 'Ресепшн'},
    {name: 'leadsLifts', label: 'Лифты'},
    {name: 'leadsAvito', label: 'Авито'},
    {name: 'leadsReferral', label: 'Сарафан'},
    {name: 'leadsBase', label: 'База'},
    {name: 'leadsChat', label: 'Чат'},
    {name: 'trials', label: 'Пробные'},
    {name: 'newRegulars', label: 'Новые постоянные'},
];

export function WeeklyForm({weekStart, initial}: Props) {
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [pending, startTransition] = useTransition();
    const router = useRouter();
    const isUpdate = initial !== null;

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await upsertWeeklyStat(fd);
            if (result.ok) {
                setFieldErrors({});
                router.refresh();
            } else {
                setFieldErrors(result.fieldErrors ?? {});
            }
        });
    }

    function val(name: keyof WeeklyStat): string | number {
        if (!initial) return '';
        const v = initial[name];
        if (v == null) return '';
        return v as string | number;
    }

    return (
        <form onSubmit={onSubmit} className="glass rounded-lg p-4 space-y-4">
            <header>
                <h2 className="text-tx text-lg font-medium">Неделя {formatWeekLabel(weekStart)}</h2>
                <p className="text-tx-2 text-xs">{weekStart}</p>
            </header>

            <input type="hidden" name="weekStart" value={weekStart} />

            <div>
                <h3 className="text-tx-2 text-xs uppercase tracking-wide mb-2">Лиды по источникам</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {NUMERIC_FIELDS.slice(0, 6).map((f) => (
                        <NumField key={f.name} name={f.name} label={f.label} defaultValue={val(f.name)} error={fieldErrors[f.name]} />
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-tx-2 text-xs uppercase tracking-wide mb-2">Тренировки</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {NUMERIC_FIELDS.slice(6).map((f) => (
                        <NumField key={f.name} name={f.name} label={f.label} defaultValue={val(f.name)} error={fieldErrors[f.name]} />
                    ))}
                    <NumField name="loadPercent" label="Загрузка %" defaultValue={val('loadPercent')} error={fieldErrors.loadPercent} placeholder="0–100" />
                </div>
            </div>

            <div>
                <label className="block text-tx-2 text-xs uppercase tracking-wide mb-2">Заметка</label>
                <textarea
                    name="note"
                    defaultValue={(initial?.note ?? '') as string}
                    rows={2}
                    className="w-full bg-bg-2 border border-line rounded-md p-2 text-tx text-sm"
                />
            </div>

            <Button type="submit" variant="primary" size="md" disabled={pending}>
                {isUpdate ? 'Обновить' : 'Сохранить'}
            </Button>
        </form>
    );
}

function NumField({
    name, label, defaultValue, error, placeholder,
}: {
    name: string;
    label: string;
    defaultValue: string | number;
    error?: string;
    placeholder?: string;
}) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-tx-2 text-xs">{label}</span>
            <input
                type="number"
                inputMode="numeric"
                min={0}
                name={name}
                defaultValue={defaultValue}
                placeholder={placeholder ?? '0'}
                className="bg-bg-2 border border-line rounded-md px-3 py-2 text-tx"
            />
            {error && <span className="text-pink text-xs">{error}</span>}
        </label>
    );
}
