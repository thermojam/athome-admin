import {z} from 'zod';

function coercePositiveInt(raw: unknown): number|undefined {
    if (raw == null) return undefined;
    const s = String(raw).trim();
    if (!/^\d+$/.test(s)) return undefined;
    return parseInt(s, 10);
}

const thresholdDays = z.preprocess(
    coercePositiveInt,
    z.number().int().min(1, 'Минимум 1 день').max(365, 'Максимум 365 дней'),
);

const RawTrainerSettingsFormSchema = z.object({
    promptTemplate: z.string().trim().min(1, 'Промпт не должен быть пустым').max(5000, 'Максимум 5000 символов'),
    leadStaleDays: thresholdDays,
    activeFreshDays: thresholdDays,
    activeStaleDays: thresholdDays,
    cooledStaleDays: thresholdDays,
    silentDays: thresholdDays,
}).refine(
    (data) => data.activeFreshDays < data.activeStaleDays,
    {
        path: ['activeStaleDays'],
        message: 'Должно быть больше среднего порога',
    },
);

export const TrainerSettingsFormSchema = RawTrainerSettingsFormSchema.transform((data) => ({
    promptTemplate: data.promptTemplate,
    thresholds: {
        leadStaleDays: data.leadStaleDays,
        activeFreshDays: data.activeFreshDays,
        activeStaleDays: data.activeStaleDays,
        cooledStaleDays: data.cooledStaleDays,
        silentDays: data.silentDays,
    },
}));

export const PasswordChangeSchema = z
    .object({
        currentPassword: z.string().min(1, 'Введи текущий пароль'),
        newPassword: z.string().min(8, 'Минимум 8 символов').max(128, 'Максимум 128 символов'),
        confirmPassword: z.string().min(1, 'Повтори новый пароль'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        path: ['confirmPassword'],
        message: 'Пароли не совпадают',
    });

export type SettingsFormInput = z.infer<typeof TrainerSettingsFormSchema>;
export type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>;
