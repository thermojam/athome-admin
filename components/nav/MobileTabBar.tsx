import { CalendarCheck, Users, BarChart3, Settings } from 'lucide-react';
import { NavLink } from './NavLink';

export function MobileTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg-2/95 backdrop-blur border-t hairline">
      <div className="grid grid-cols-4 gap-1 p-2">
        <NavLink href="/today" icon={<CalendarCheck size={20} />}>Сегодня</NavLink>
        <NavLink href="/clients" icon={<Users size={20} />}>База</NavLink>
        <NavLink href="/dashboard" icon={<BarChart3 size={20} />}>Панель</NavLink>
        <NavLink href="/settings" icon={<Settings size={20} />}>Настройки</NavLink>
      </div>
    </nav>
  );
}
