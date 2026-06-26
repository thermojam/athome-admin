import {redirect} from 'next/navigation';
import {Card} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {BrandLogo} from '@/components/brand/BrandLogo';
import {StatusNotice} from '@/components/ui/StatusNotice';
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
        <Card variant="strong" className="p-6 md:p-8">
            <div className="mb-7 flex justify-center">
                <BrandLogo size={76}/>
            </div>
            <p className="section-kicker mb-3 text-center">Тренер у дома</p>
            <h1 className="font-display text-center uppercase text-[32px] leading-none">
                Завести тренера
            </h1>
            <StatusNotice tone="info" className="mt-5">
                Один раз. Дальше — только вход.
            </StatusNotice>
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
