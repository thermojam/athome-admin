import {redirect} from 'next/navigation';
import {Card} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {registerFirstTrainer, trainersExist} from '@/lib/auth/register';

export default async function RegisterPage() {
    if (await trainersExist()) redirect('/login');

    async function action(formData: FormData) {
        'use server';
        const result = await registerFirstTrainer(formData);
        if (!result.ok) {
            throw new Error(result.error);
        }
    }

    return (
        <Card>
            <h1 className="font-display uppercase text-[24px] tracking-wide mb-2">
                Завести тренера
            </h1>
            <p className="text-tx-2 text-[13px] mb-5">
                Один раз. Дальше — только вход.
            </p>
            <form action={action} className="flex flex-col gap-4">
                <Input name="name" label="Имя" required autoFocus/>
                <Input name="email" type="email" label="Email" required/>
                <Input name="password" type="password" label="Пароль (8+ символов)" required minLength={8}/>
                <Button type="submit" variant="primary" size="lg" className="mt-2">
                    Завести и войти
                </Button>
            </form>
        </Card>
    );
}
