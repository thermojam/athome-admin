'use client';

import {useState, useTransition, type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {upsertWeeklyStat} from '@/lib/weekly/actions';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {Textarea} from '@/components/ui/Textarea';
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

    function onSubmit(e: FormEvent<HTMLFormElement>) {
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
        <Card variant="strong" className="p-4 md:p-5">
            <form onSubmit={onSubmit} className="space-y-5">
                <header>
                    <h2 className="text-tx text-lg font-medium">Неделя {formatWeekLabel(weekStart)}</h2>
                    <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.12em] text-tx-3">{weekStart}</p>
                </header>

                <input type="hidden" name="weekStart" value={weekStart} />

                <div>
                    <h3 className="mb-3 text-tx-2 text-xs uppercase tracking-wide">Лиды по источникам</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {NUMERIC_FIELDS.slice(0, 6).map((f) => (
                            <NumField
                                key={f.name}
                                name={f.name}
                                label={f.label}
                                defaultValue={val(f.name)}
                                error={fieldErrors[f.name]}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="mb-3 text-tx-2 text-xs uppercase tracking-wide">Тренировки</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {NUMERIC_FIELDS.slice(6).map((f) => (
                            <NumField
                                key={f.name}
                                name={f.name}
                                label={f.label}
                                defaultValue={val(f.name)}
                                error={fieldErrors[f.name]}
                            />
                        ))}
                        <NumField
                            name="loadPercent"
                            label="Загрузка %"
                            defaultValue={val('loadPercent')}
                            error={fieldErrors.loadPercent}
                            placeholder="0–100"
                        />
                    </div>
                </div>

                <Textarea
                    name="note"
                    label="Заметка"
                    defaultValue={(initial?.note ?? '') as string}
                    rows={3}
                />

                <Button type="submit" variant="primary" size="md" loading={pending}>
                    {isUpdate ? 'Обновить' : 'Сохранить'}
                </Button>
            </form>
        </Card>
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
        <Input
            type="number"
            inputMode="numeric"
            min={0}
            name={name}
            label={label}
            defaultValue={defaultValue}
            placeholder={placeholder ?? '0'}
            error={error}
            className="font-mono"
        />
    );
}
