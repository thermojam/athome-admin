'use server';

import {z} from 'zod';
import {count} from 'drizzle-orm';
import {db} from '@/lib/db';
import {trainers, DEFAULT_TRAINER_SETTINGS} from '@/lib/db/schema';
import {hashPassword} from './password';
import {signIn} from './config';

const RegisterSchema = z.object({
    name: z.string().trim().min(1, 'Имя обязательно').max(80),
    email: z.string().trim().toLowerCase().email('Похоже на не-email'),
    password: z.string().min(8, 'Минимум 8 символов').max(128),
});

export type RegisterResult =
    | { ok: true }
    | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function registerFirstTrainer(formData: FormData): Promise<RegisterResult> {
    const parsed = RegisterSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    });

    if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
            fieldErrors[issue.path[0] as string] = issue.message;
        }
        return {ok: false, error: 'Проверь поля и попробуй ещё раз', fieldErrors};
    }

    const [{value: existing}] = await db
        .select({value: count()})
        .from(trainers);
    if (existing > 0) {
        return {ok: false, error: 'Регистрация закрыта — тренер уже заведён. Заходи через /login.'};
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await db.insert(trainers).values({
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
        settings: DEFAULT_TRAINER_SETTINGS,
    });

    await signIn('credentials', {
        email: parsed.data.email,
        password: parsed.data.password,
        redirectTo: '/today',
    });

    return {ok: true};
}

export async function trainersExist(): Promise<boolean> {
    const [{value}] = await db.select({value: count()}).from(trainers);
    return value > 0;
}
