import {redirect} from 'next/navigation';
import {signIn, auth} from '@/lib/auth/config';
import {Card} from '@/components/ui/Card';
import {Input} from '@/components/ui/Input';
import {Button} from '@/components/ui/Button';
import {BrandLogo} from '@/components/brand/BrandLogo';
import {StatusNotice} from '@/components/ui/StatusNotice';
import {trainersExist} from '@/lib/auth/register';

export default async function LoginPage({
                                            searchParams,
                                        }: {
    searchParams: Promise<{ error?: string }>;
}) {
    const session = await auth();
    if (session?.user) redirect('/today');

    const noTrainer = !(await trainersExist());
    if (noTrainer) redirect('/register');

    const {error} = await searchParams;

    async function login(formData: FormData) {
        'use server';
        await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirectTo: '/today',
        });
    }

    return (
        <Card variant="strong" className="p-6 md:p-8">
            <div className="mb-7 flex justify-center">
                <BrandLogo size={76}/>
            </div>
            <p className="section-kicker mb-3 text-center">Тренер у дома</p>
            <h1 className="font-display text-center uppercase text-[32px] leading-none">
                Вход
            </h1>
            {error && (
                <StatusNotice tone="error" className="mt-5">
                    Не подошло. Проверь и попробуй ещё раз.
                </StatusNotice>
            )}
            <form action={login} className="flex flex-col gap-4">
                <Input name="email" type="email" label="Email" required autoFocus/>
                <Input name="password" type="password" label="Пароль" required/>
                <Button type="submit" variant="primary" size="lg" className="mt-2">
                    Войти
                </Button>
            </form>
        </Card>
    );
}
