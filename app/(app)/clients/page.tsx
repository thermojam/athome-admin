import { EmptyState } from '@/components/ui/EmptyState';

export default function ClientsPage() {
  return (
    <>
      <h1 className="font-display uppercase text-[27px] tracking-wide mb-6">База</h1>
      <EmptyState
        title="База пустая"
        hint="Скоро здесь появятся клиенты — пока добавлять некуда (это будет на следующем этапе)."
      />
    </>
  );
}
