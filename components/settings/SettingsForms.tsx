'use client';

import {useState, useTransition, type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import type {TrainerSettings} from '@/lib/db/schema';
import {changeTrainerPassword, updateTrainerSettings} from '@/lib/settings/actions';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {Textarea} from '@/components/ui/Textarea';

type Props = {
    settings: TrainerSettings;
};

type ThresholdName = keyof TrainerSettings['thresholds'];
type FormErrors = Record<string, string>;

const THRESHOLD_FIELDS: Array<{name: ThresholdName; label: string; hint: string}> = [
    {name: 'leadStaleDays', label: 'Лид без касания', hint: 'обычно 3'},
    {name: 'activeFreshDays', label: 'Активный: средний', hint: 'обычно 10'},
    {name: 'activeStaleDays', label: 'Активный: срочный', hint: 'обычно 21'},
    {name: 'cooledStaleDays', label: 'Остывший', hint: 'обычно 30'},
    {name: 'silentDays', label: 'Тихий', hint: 'обычно 45'},
];

export function SettingsForms({settings}: Props) {
    const [settingsErrors, setSettingsErrors] = useState<FormErrors>({});
    const [passwordErrors, setPasswordErrors] = useState<FormErrors>({});
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [passwordSaved, setPasswordSaved] = useState(false);
    const [settingsPending, startSettingsTransition] = useTransition();
    const [passwordPending, startPasswordTransition] = useTransition();
    const router = useRouter();

    function onSettingsSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startSettingsTransition(async () => {
            const result = await updateTrainerSettings(formData);
            if (result.ok) {
                setSettingsErrors({});
                setSettingsSaved(true);
                router.refresh();
                return;
            }
            setSettingsSaved(false);
            setSettingsErrors(result.fieldErrors ?? {});
        });
    }

    function onPasswordSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        startPasswordTransition(async () => {
            const result = await changeTrainerPassword(formData);
            if (result.ok) {
                form.reset();
                setPasswordErrors({});
                setPasswordSaved(true);
                router.refresh();
                return;
            }
            setPasswordSaved(false);
            setPasswordErrors(result.fieldErrors ?? {});
        });
    }

    return (
        <div className="space-y-5">
            <form onSubmit={onSettingsSubmit} className="glass rounded-lg p-4 md:p-5 space-y-5">
                <header>
                    <h2 className="text-tx text-lg font-medium">Промпт для Claude</h2>
                    <p className="text-tx-2 text-sm">Добавляется перед выбранными строками из «Сегодня».</p>
                </header>

                <Textarea
                    name="promptTemplate"
                    label="Шаблон"
                    rows={7}
                    defaultValue={settings.promptTemplate}
                    error={settingsErrors.promptTemplate}
                />

                <div>
                    <h2 className="text-tx text-lg font-medium mb-1">Пороги триггеров</h2>
                    <p className="text-tx-2 text-sm mb-3">Количество дней без касания.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {THRESHOLD_FIELDS.map((field) => (
                            <Input
                                key={field.name}
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={365}
                                name={field.name}
                                label={field.label}
                                defaultValue={settings.thresholds[field.name]}
                                placeholder={field.hint}
                                error={settingsErrors[field.name]}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" variant="primary" disabled={settingsPending}>
                        {settingsPending ? 'Сохраняю' : 'Сохранить настройки'}
                    </Button>
                    {settingsSaved && <span className="text-sm text-cyan" aria-live="polite">Сохранено</span>}
                </div>
            </form>

            <form onSubmit={onPasswordSubmit} className="glass rounded-lg p-4 md:p-5 space-y-4">
                <header>
                    <h2 className="text-tx text-lg font-medium">Смена пароля</h2>
                    <p className="text-tx-2 text-sm">После смены текущая сессия останется активной.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                        name="currentPassword"
                        type="password"
                        label="Текущий пароль"
                        autoComplete="current-password"
                        error={passwordErrors.currentPassword}
                    />
                    <Input
                        name="newPassword"
                        type="password"
                        label="Новый пароль"
                        autoComplete="new-password"
                        minLength={8}
                        error={passwordErrors.newPassword}
                    />
                    <Input
                        name="confirmPassword"
                        type="password"
                        label="Повтор"
                        autoComplete="new-password"
                        minLength={8}
                        error={passwordErrors.confirmPassword}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" variant="secondary" disabled={passwordPending}>
                        {passwordPending ? 'Меняю' : 'Сменить пароль'}
                    </Button>
                    {passwordSaved && <span className="text-sm text-cyan" aria-live="polite">Пароль изменён</span>}
                </div>
            </form>
        </div>
    );
}
