import { redirect } from 'next/navigation';
import { signIn, auth } from '@/lib/auth/config';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { trainersExist } from '@/lib/auth/register';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect('/today');

  const noTrainer = !(await trainersExist());
  if (noTrainer) redirect('/register');

  const { error } = await searchParams;

  async function login(formData: FormData) {
    'use server';
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/today',
    });
  }

  return (
    <Card>
      <h1 className="font-display uppercase text-[24px] tracking-wide mb-5">Вход</h1>
      <form action={login} className="flex flex-col gap-4">
        <Input name="email" type="email" label="Email" required autoFocus />
        <Input name="password" type="password" label="Пароль" required />
        {error && (
          <p className="text-[13px] text-orange">
            Не подошло. Проверь и попробуй ещё раз.
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="mt-2">
          Войти
        </Button>
      </form>
    </Card>
  );
}
