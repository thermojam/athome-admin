import {CalendarCheck, Users, BarChart3, Settings} from 'lucide-react';
import {NavLink} from './NavLink';

export function MobileTabBar() {
    return (
        <nav className="fixed inset-x-3 bottom-3 z-40 md:hidden glass" aria-label="Основная навигация">
            <div className="grid grid-cols-4 gap-1 p-2">
                <NavLink
                    href="/today"
                    icon={<CalendarCheck size={20}/>}
                    className="h-auto flex-col justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] leading-none"
                >
                    Сегодня
                </NavLink>
                <NavLink
                    href="/clients"
                    icon={<Users size={20}/>}
                    className="h-auto flex-col justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] leading-none"
                >
                    База
                </NavLink>
                <NavLink
                    href="/dashboard"
                    icon={<BarChart3 size={20}/>}
                    className="h-auto flex-col justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] leading-none"
                >
                    Панель
                </NavLink>
                <NavLink
                    href="/settings"
                    icon={<Settings size={20}/>}
                    className="h-auto flex-col justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] leading-none"
                >
                    Настройки
                </NavLink>
            </div>
        </nav>
    );
}
