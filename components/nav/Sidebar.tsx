import { CalendarCheck, Users, BarChart3, Settings } from 'lucide-react';
import { NavLink } from './NavLink';
import { signOut, auth } from '@/lib/auth/config';
import { Button } from '@/components/ui/Button';

export async function Sidebar() {
  const session = await auth();

  async function logout() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col p-3 border-r hairline min-h-screen">
      <div className="font-display uppercase text-[20px] tracking-wide px-3 py-4 mb-2">
        Штаб
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        <NavLink href="/today" icon={<CalendarCheck size={18} />}>Сегодня</NavLink>
        <NavLink href="/clients" icon={<Users size={18} />}>База</NavLink>
        <NavLink href="/dashboard" icon={<BarChart3 size={18} />}>Панель</NavLink>
        <NavLink href="/settings" icon={<Settings size={18} />}>Настройки</NavLink>
      </nav>
      <form action={logout} className="mt-2">
        <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
          Выйти{session?.user?.name ? ` (${session.user.name})` : ''}
        </Button>
      </form>
    </aside>
  );
}
