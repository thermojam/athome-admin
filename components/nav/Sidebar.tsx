import Link from 'next/link';
import {CalendarCheck, Users, BarChart3, Settings, LogOut} from 'lucide-react';
import {NavLink} from './NavLink';
import {signOut, auth} from '@/lib/auth/config';
import {BrandLogo} from '@/components/brand/BrandLogo';
import {Button} from '@/components/ui/Button';

export async function Sidebar() {
    const session = await auth();

    async function logout() {
        'use server';
        await signOut({redirectTo: '/login'});
    }

    return (
        <aside className="fixed inset-y-4 left-4 hidden w-[248px] flex-col p-4 md:flex glass glass-strong">
            <Link
                href="/today"
                aria-label="Открыть Сегодня"
                className="mb-7 flex h-20 items-center justify-center rounded-2xl"
            >
                <BrandLogo size={72}/>
            </Link>
            <nav className="flex flex-1 flex-col gap-2">
                <NavLink href="/today" icon={<CalendarCheck size={18}/>}>Сегодня</NavLink>
                <NavLink href="/clients" icon={<Users size={18}/>}>База</NavLink>
                <NavLink href="/dashboard" icon={<BarChart3 size={18}/>}>Панель</NavLink>
                <NavLink href="/settings" icon={<Settings size={18}/>}>Настройки</NavLink>
            </nav>
            <form action={logout} className="border-t hairline pt-3">
                <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
                    <LogOut size={16} aria-hidden="true"/>
                    Выйти{session?.user?.name ? ` (${session.user.name})` : ''}
                </Button>
            </form>
        </aside>
    );
}
