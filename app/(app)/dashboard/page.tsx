import {EmptyState} from '@/components/ui/EmptyState';

export default function DashboardPage() {
    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-6">Панель</h1>
            <EmptyState
                title="Первая пятница ещё впереди"
                hint="Здесь появятся счётчики и недельная сводка."
            />
        </>
    );
}
