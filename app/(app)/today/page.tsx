import { EmptyState } from '@/components/ui/EmptyState';

export default function TodayPage() {
  return (
    <>
      <h1 className="font-display uppercase text-[27px] tracking-wide mb-6">Сегодня</h1>
      <EmptyState
        title="Триггеров нет"
        hint="База под контролем — так держать."
      />
    </>
  );
}
