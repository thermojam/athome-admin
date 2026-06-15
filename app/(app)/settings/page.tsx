import {EmptyState} from '@/components/ui/EmptyState';

export default function SettingsPage() {
    return (
        <>
            <h1 className="font-display uppercase text-[27px] tracking-wide mb-6">Настройки</h1>
            <EmptyState
                title="Настройки появятся ниже"
                hint="Промпт-шаблон, пороги триггеров и смена пароля — в одном из следующих этапов."
            />
        </>
    );
}
